import { useEffect, useState } from 'react'
import { Btn, Card } from '../components/ui'
import { rpc, type CloudConfig, type CloudKid, type Family } from '../lib/cloud'
import { ContentEditor, type Content } from './ContentEditor'
import { DEFAULT_ADMIN } from '../lib/store'

const KEY = 'raqamjon-cloud-admin'
const pct = (c: number, s: number) => (s ? Math.round((c / s) * 100) : 0)
const field = 'rounded-xl border-2 px-3 py-2 font-bold w-full'
const uid = () => Math.random().toString(36).slice(2, 10)
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000)
  return m < 60 ? `${m} daqiqa oldin` : m < 1440 ? `${Math.round(m / 60)} soat oldin` : `${Math.round(m / 1440)} kun oldin`
}

/** Onlayn admin panel: istalgan qurilmadan oila kodi va parol bilan kiriladi. */
export default function Cloud() {
  const [auth, setAuth] = useState<{ code: string; token: string } | null>(() => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null') } catch { return null } })
  const [owner, setOwner] = useState<string | null>(null)
  const login = (a: { code: string; token: string }) => { setAuth(a); try { sessionStorage.setItem(KEY, JSON.stringify(a)) } catch { /* yo'q */ } }
  const logout = () => { setAuth(null); setOwner(null); try { sessionStorage.removeItem(KEY) } catch { /* yo'q */ } }
  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <a href="#/" className="text-3xl" aria-label="Ilovaga qaytish">🦉</a>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-grape-dark flex-1">Raqamjon · Onlayn admin panel</h1>
        {(auth || owner) && <Btn size="sm" color="bg-white text-grape-dark" onClick={logout}>Chiqish</Btn>}
      </header>
      {owner ? <OwnerView password={owner} /> : auth ? <FamilyView token={auth.token} onExpired={logout} /> : <Login onLogin={login} onOwner={setOwner} />}
    </div>
  )
}

function Login({ onLogin, onOwner }: { onLogin(a: { code: string; token: string }): void; onOwner(p: string): void }) {
  const [code, setCode] = useState('')
  const [pass, setPass] = useState('')
  const [ownerPass, setOwnerPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [created, setCreated] = useState<{ code: string; token: string } | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const go = async (fn: () => Promise<void>) => { setBusy(true); setMsg(''); try { await fn() } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) } }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="grid gap-3 content-start">
        <h2 className="font-extrabold text-xl">👪 Ota-ona sifatida kirish</h2>
        <p className="text-sm text-gray-500">Oila kodi (masalan <b>RJ-7K3M9Q</b>) hisob yaratilganda beriladi. Bu yerda ilovadagi 4 xonali PIN emas, hisob <b>paroli</b> kiritiladi.</p>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="RJ-XXXXXX" className={field} />
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && code && pass && go(async () => onLogin(await rpc('family_login', { p_code: code, p_password: pass })))} placeholder="Parol" className={field} />
        <Btn disabled={busy || !code || !pass} onClick={() => go(async () => onLogin(await rpc('family_login', { p_code: code, p_password: pass })))}>Kirish</Btn>
      </Card>
      <Card className="grid gap-3 content-start">
        <h2 className="font-extrabold text-xl">🛡️ Bosh admin</h2>
        <p className="text-sm text-gray-500">Barcha oilalar va bolalar statistikasi. Birinchi kirishda kiritilgan parol bosh admin paroli bo‘lib qoladi (kamida 8 belgi).</p>
        <input type="password" value={ownerPass} onChange={(e) => setOwnerPass(e.target.value)} placeholder="Bosh admin paroli" className={field} />
        <Btn color="bg-sun text-white" disabled={busy || !ownerPass} onClick={() => go(async () => { await rpc('owner_overview', { p_password: ownerPass }); onOwner(ownerPass) })}>Kirish</Btn>
      </Card>
      <Card className="grid gap-3 content-start sm:col-span-2 !bg-mint-light">
        <h2 className="font-extrabold text-xl">✨ Hisobingiz yo‘qmi? Yangi oila hisobini yarating</h2>
        {created ? (
          <div className="grid gap-3 text-center">
            <p className="font-bold">Oila kodingiz (yozib qo‘ying):</p>
            <div className="text-4xl font-black tracking-widest text-grape-dark select-all">{created.code}</div>
            <p className="text-sm text-gray-600">Bolaning telefonida: Ota-onalar → 🛡️ Admin panel → ☁️ Onlayn → “Mavjud hisobga ulash” — shu kod va parolni kiriting. Shunda bola natijalari shu yerda ko‘rinadi.</p>
            <Btn onClick={() => onLogin(created)}>Panelga kirish ➜</Btn>
          </div>
        ) : (
          <div className="grid sm:grid-cols-[1fr_auto] gap-2">
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Yangi parol o‘ylab toping (kamida 6 belgi)" className={field} />
            <Btn color="bg-mint text-white" disabled={busy || newPass.length < 6} onClick={() => go(async () => setCreated(await rpc('family_create', { p_password: newPass })))}>Hisob yaratish</Btn>
          </div>
        )}
      </Card>
      {msg && <p className="sm:col-span-2 text-center font-bold text-coral">{msg}</p>}
    </div>
  )
}

type Tab = 'kids' | 'games' | 'questions' | 'rewards'

function FamilyView({ token, onExpired }: { token: string; onExpired(): void }) {
  const [fam, setFam] = useState<Family | null>(null)
  const [tab, setTab] = useState<Tab>('kids')
  const [msg, setMsg] = useState('')
  const load = () => rpc<Family>('family_get', { p_token: token }).then(setFam).catch((e: Error) => { setMsg(e.message); if (/muddati/.test(e.message)) onExpired() })
  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const save = async (cfg: CloudConfig) => {
    setFam((f) => (f ? { ...f, config: cfg } : f))
    try { await rpc('config_set', { p_token: token, p_config: cfg }); setMsg('Saqlandi ✓ Bolaning qurilmasi keyingi ochilishda yangilanadi.') } catch (e) { setMsg((e as Error).message) }
  }
  if (!fam) return <p className="text-center font-bold">{msg || 'Yuklanmoqda…'}</p>
  const cfg = fam.config
  const content: Content = { hidden: cfg.hidden ?? [], rewards: cfg.rewards ?? DEFAULT_ADMIN.rewards, words: cfg.words ?? [], problems: cfg.problems ?? [] }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-white rounded-2xl px-3 py-2 font-black tracking-widest shadow-popsm">{fam.code}</span>
        {([['kids', '👧 Bolalar'], ['games', '🎮 O‘yinlar'], ['questions', '📝 Savollar'], ['rewards', '🎁 Sovg‘alar']] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-2xl font-bold ${tab === t ? 'bg-grape text-white' : 'bg-white text-grape-dark shadow-popsm'}`}>{l}</button>
        ))}
        <button onClick={() => void load()} className="ml-auto px-3 py-2 rounded-2xl bg-white shadow-popsm font-bold">🔄</button>
      </div>
      {msg && <p className="font-bold text-center">{msg}</p>}
      {tab === 'kids' ? (
        <div className="grid gap-3 md:grid-cols-2">
          {fam.kids.map((k) => <KidPanel key={k.id} k={k} cfg={cfg} save={save} />)}
          {!fam.kids.length && <Card>Hali bolalar yo‘q. Ilovada Admin panel → ☁️ Onlayn bo‘limida qurilmani ulang.</Card>}
        </div>
      ) : (
        <ContentEditor section={tab} value={content} onChange={(v) => void save({ ...cfg, ...v, updatedAt: Date.now() })} />
      )}
    </div>
  )
}

function KidPanel({ k, cfg, save }: { k: CloudKid; cfg: CloudConfig; save(c: CloudConfig): void }) {
  const s = k.summary
  const [coins, setCoins] = useState('')
  const given = new Set(cfg.given ?? [])
  const pendingGifts = (cfg.gifts ?? []).filter((g) => g.kid === k.id)
  const maxW = Math.max(10, ...(s.week ?? [0]))
  return (
    <Card className="!p-4 grid gap-3">
      <div className="flex items-center gap-3">
        <span className="text-5xl">{k.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-xl truncate">{k.name}</div>
          <div className="text-sm font-bold text-gray-500">{s.grade}-sinf · {s.round}-bosqich · {ago(k.updated_at)}</div>
        </div>
      </div>
      <div>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-mint" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} /></div>
        <div className="text-xs font-bold text-gray-500 mt-1">Sinf bo‘yicha: {s.done}/{s.total} daraja</div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[['⭐', s.stars], ['🪙', s.coins], ['🎯', `${pct(s.correct, s.solved)}%`], ['🔥', s.streak], ['✏️', s.solved], ['⏱', `${s.todayMin}m`], ['🧮', `${s.lessons}/32`], ['🏆', s.trophies]].map(([i, v]) => (
          <div key={i as string} className="bg-gray-50 rounded-xl py-1"><div>{i}</div><div className="font-extrabold">{v}</div></div>
        ))}
      </div>
      <div>
        <div className="text-sm font-bold text-gray-500 mb-1">Oxirgi 7 kun (yechilgan misollar)</div>
        <div className="flex items-end gap-1 h-16">{(s.week ?? []).map((n, i) => <div key={i} className="flex-1 bg-grape rounded-t" style={{ height: `${Math.max(4, (n / maxW) * 100)}%`, opacity: n ? 1 : 0.2 }} title={String(n)} />)}</div>
      </div>
      <details>
        <summary className="font-bold cursor-pointer">O‘yinlar bo‘yicha</summary>
        <div className="grid gap-1 mt-2 text-sm">
          {(s.games ?? []).map((g) => <div key={g.id} className="flex gap-2"><span className="w-6">{g.emoji}</span><span className="flex-1 truncate">{g.title}</span><span>⭐{g.stars}</span><span className="w-16 text-right">{g.solved ? `${pct(g.correct, g.solved)}%` : '—'}</span></div>)}
        </div>
      </details>
      {s.weak?.length > 0 && <div className="flex flex-wrap gap-1 text-sm"><span className="font-bold">Qiyin:</span>{s.weak.map((w) => <span key={w} className="bg-coral-light rounded-lg px-2">{w}</span>)}</div>}
      {s.rewards?.some((r) => !r.given) && (
        <div className="grid gap-1">
          <div className="font-bold">🎁 Kutilayotgan sovg‘alar</div>
          {s.rewards.filter((r) => !r.given).map((r) => (
            <div key={r.id} className="flex items-center gap-2 bg-sun-light rounded-xl px-2 py-1">
              <span className="text-2xl">{r.emoji}</span><span className="flex-1 font-bold">{r.name} <span className="font-normal text-gray-500">{r.date}</span></span>
              {given.has(r.id) ? <span className="text-sm font-bold text-mint">✓ belgilandi</span> : <Btn size="sm" color="bg-mint text-white" onClick={() => save({ ...cfg, given: [...(cfg.given ?? []), r.id] })}>Berildi</Btn>}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-center">
        <input value={coins} onChange={(e) => setCoins(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Tanga" className="w-24 rounded-xl border-2 px-2 py-1 font-bold" />
        <Btn size="sm" color="bg-sun text-white" disabled={!+coins} onClick={() => { save({ ...cfg, gifts: [...(cfg.gifts ?? []), { id: uid(), kid: k.id, coins: +coins }] }); setCoins('') }}>🪙 Tanga sovg‘a qilish</Btn>
      </div>
      {pendingGifts.length > 0 && <div className="text-xs text-gray-500">Yuborilgan tangalar: {pendingGifts.map((g) => `+${g.coins}`).join(', ')} (bola qurilmasi ochilganda qo‘shiladi)</div>}
    </Card>
  )
}

interface Overview { families: number; kids: number; active7: number; list: (Omit<CloudKid, 'id'> & { family: string })[] }

function OwnerView({ password }: { password: string }) {
  const [d, setD] = useState<Overview | null>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => { rpc<Overview>('owner_overview', { p_password: password }).then(setD).catch((e: Error) => setMsg(e.message)) }, [password])
  if (!d) return <p className="text-center font-bold">{msg || 'Yuklanmoqda…'}</p>
  const solved = d.list.reduce((a, k) => a + (k.summary.solved ?? 0), 0)
  const byGrade = [1, 2, 3, 4].map((g) => d.list.filter((k) => k.grade === g).length)
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['Oilalar', d.families], ['Bolalar', d.kids], ['7 kunda faol', d.active7], ['Yechilgan misollar', solved]].map(([l, v]) => (
          <Card key={l as string} className="!p-4"><div className="text-sm font-bold text-gray-500">{l}</div><div className="text-3xl font-extrabold text-grape-dark">{v}</div></Card>
        ))}
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-2">Sinflar bo‘yicha</h3>
        <div className="flex gap-3">{byGrade.map((n, i) => <div key={i} className="flex-1 bg-gray-50 rounded-xl p-2 text-center"><div className="font-bold">{i + 1}-sinf</div><div className="text-2xl font-extrabold">{n}</div></div>)}</div>
      </Card>
      <Card className="overflow-x-auto">
        <h3 className="font-extrabold text-lg mb-2">Barcha bolalar</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th className="py-1">Bola</th><th>Oila</th><th>Sinf</th><th>⭐</th><th>✏️</th><th>🎯</th><th>Oxirgi</th></tr></thead>
          <tbody>{d.list.map((k, i) => (
            <tr key={i} className="border-t"><td className="py-1 font-bold whitespace-nowrap">{k.avatar} {k.name}</td><td>{k.family}</td><td>{k.grade}</td><td>{k.summary.stars}</td><td>{k.summary.solved}</td><td>{pct(k.summary.correct, k.summary.solved)}%</td><td className="whitespace-nowrap">{ago(k.updated_at)}</td></tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  )
}
