import { useEffect, useState } from 'react'
import { useStore, type Profile, type AdminConfig } from '../lib/store'
import { GRADES, type Grade } from '../lib/levels'
import { Btn, Card, TopBar } from '../components/ui'
import { NumberPad } from '../components/NumberPad'
import { ParentGate } from '../components/ParentGate'
import { summarize, syncNow, pushConfig, rpc } from '../lib/cloud'
import { ContentEditor, type Content } from './ContentEditor'

/** PIN xeshi (PIN o'zi saqlanmaydi). */
export async function hashPin(pin: string) {
  const data = new TextEncoder().encode('raqamjon:' + pin)
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 0
  for (const b of data) h = (h * 31 + b) | 0
  return 'x' + h
}

type Tab = 'overview' | 'kids' | 'games' | 'questions' | 'rewards' | 'cloud' | 'pin'
const TABS: [Tab, string][] = [
  ['overview', '📋 Umumiy'], ['kids', '👧 Bolalar'], ['games', '🎮 O‘yinlar'], ['questions', '📝 Savollar'],
  ['rewards', '🎁 Sovg‘alar'], ['cloud', '☁️ Onlayn'], ['pin', '🔑 PIN'],
]

export default function Admin({ tab: initial }: { tab?: string }) {
  const [ok, setOk] = useState(() => sessionStorage.getItem('admin-ok') === '1')
  const [tab, setTab] = useState<Tab>(() => (TABS.some(([t]) => t === initial) ? initial as Tab : 'overview'))
  if (!ok) return <PinGate onOk={() => { try { sessionStorage.setItem('admin-ok', '1') } catch { /* yo'q */ } setOk(true) }} />
  return (
    <div>
      <TopBar title="🛡️ Admin panel" back="#/parent" />
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {TABS.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 py-2 rounded-2xl font-bold ${tab === t ? 'bg-grape text-white' : 'bg-white text-grape-dark shadow-popsm'}`}>{label}</button>
        ))}
      </div>
      {tab === 'overview' ? <Overview /> : tab === 'kids' ? <KidsAdmin /> : tab === 'cloud' ? <CloudTab /> : tab === 'pin' ? <PinChange /> : <LocalContent section={tab} />}
    </div>
  )
}

function PinGate({ onOk }: { onOk(): void }) {
  const pinHash = useStore((s) => s.admin.pinHash)
  const setAdmin = useStore((s) => s.setAdmin)
  const [v, setV] = useState('')
  const [first, setFirst] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [forgot, setForgot] = useState(false)
  if (forgot) return (
    <ParentGate back="#/parent">
      <TopBar title="🔑 PINni tiklash" back="#/parent" />
      <Card className="max-w-md mx-auto grid gap-3 text-center">
        <p className="font-bold">PIN o‘chiriladi, keyin yangisini o‘rnatasiz. Natijalar saqlanib qoladi.</p>
        <Btn color="bg-coral text-white" onClick={() => { setAdmin((a) => { a.pinHash = null }, false); setForgot(false); setV('') }}>PINni o‘chirish</Btn>
      </Card>
    </ParentGate>
  )
  const submit = async () => {
    if (v.length < 4) { setErr('PIN 4 ta raqamdan iborat'); return }
    const h = await hashPin(v)
    if (!pinHash) {
      if (first === null) { setFirst(v); setV(''); setErr(''); return }
      if (first !== v) { setErr('PINlar mos kelmadi, qaytadan kiriting'); setFirst(null); setV(''); return }
      setAdmin((a) => { a.pinHash = h }, false)
      onOk()
    } else if (h === pinHash) onOk()
    else { setErr('PIN noto‘g‘ri'); setV('') }
  }
  return (
    <div>
      <TopBar title="🛡️ Admin panel" back="#/parent" />
      <Card className="max-w-md mx-auto text-center flex flex-col gap-4">
        <p className="font-bold text-gray-600">{!pinHash ? (first === null ? 'Admin panel uchun 4 xonali PIN o‘ylab toping:' : 'PINni yana bir marta kiriting:') : 'PIN kodni kiriting:'}</p>
        <div className="text-5xl font-extrabold tracking-[0.5em] text-grape-dark h-14">{'●'.repeat(v.length)}<span className="text-gray-200">{'○'.repeat(Math.max(0, 4 - v.length))}</span></div>
        {err && <p className="text-coral font-bold">{err}</p>}
        <NumberPad value={v} maxLen={4} onChange={setV} onSubmit={submit} />
        {pinHash && <button className="text-sm text-gray-500 underline" onClick={() => setForgot(true)}>PINni unutdingizmi?</button>}
      </Card>
    </div>
  )
}

function PinChange() {
  const setAdmin = useStore((s) => s.setAdmin)
  return (
    <Card className="grid gap-3">
      <p className="font-bold">PINni o‘zgartirish uchun uni o‘chiring — keyingi kirishda yangi PIN so‘raladi.</p>
      <Btn color="bg-coral text-white" onClick={() => { setAdmin((a) => { a.pinHash = null }, false); sessionStorage.removeItem('admin-ok'); location.hash = '#/admin'; location.reload() }}>🔑 Yangi PIN o‘rnatish</Btn>
    </Card>
  )
}

const pct = (c: number, s: number) => (s ? Math.round((c / s) * 100) : 0)

function Overview() {
  const profiles = useStore((s) => s.profiles)
  const hidden = useStore((s) => s.admin.hidden)
  const patchKid = useStore((s) => s.patchKid)
  const pending = profiles.flatMap((p) => p.redeemed.filter((r) => !r.given).map((r) => ({ p, r })))
  return (
    <div className="grid gap-4">
      {pending.length > 0 && (
        <Card className="!bg-sun-light">
          <h3 className="font-extrabold text-lg mb-2">🎁 Berilishi kerak bo‘lgan sovg‘alar</h3>
          <div className="grid gap-2">
            {pending.map(({ p, r }) => (
              <div key={r.id} className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2">
                <span className="text-3xl">{r.emoji}</span>
                <span className="flex-1 font-bold">{r.name} <span className="text-gray-500 font-normal">— {p.avatar} {p.name}, {r.date}</span></span>
                <Btn size="sm" color="bg-mint text-white" onClick={() => patchKid(p.id, (q) => { q.redeemed.forEach((x) => { if (x.id === r.id) x.given = true }) })}>✓ Berildi</Btn>
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {profiles.map((p) => <KidCard key={p.id} p={p} hidden={hidden} />)}
      </div>
      {!profiles.length && <p>Hali bolalar yo‘q.</p>}
    </div>
  )
}

function KidCard({ p, hidden }: { p: Profile; hidden: string[] }) {
  const s = summarize(p, hidden)
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-5xl">{p.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-xl truncate">{p.name}</div>
          <div className="text-sm font-bold text-gray-500">{s.grade}-sinf · {s.round}-bosqich · oxirgi: {s.lastPlayed || '—'}</div>
        </div>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-mint" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} /></div>
      <div className="text-xs font-bold text-gray-500 mt-1">Sinf bo‘yicha: {s.done}/{s.total} daraja</div>
      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        {[['⭐', s.stars], ['🪙', s.coins], ['🎯', `${pct(s.correct, s.solved)}%`], ['🔥', s.streak], ['✏️', s.solved], ['⏱', `${s.todayMin}m`], ['🧮', `${s.lessons}/32`], ['🏆', s.trophies]].map(([i, v]) => (
          <div key={i as string} className="bg-gray-50 rounded-xl py-1"><div className="text-lg">{i}</div><div className="font-extrabold">{v}</div></div>
        ))}
      </div>
    </Card>
  )
}

function KidsAdmin() {
  const profiles = useStore((s) => s.profiles)
  const patchKid = useStore((s) => s.patchKid)
  const remove = useStore((s) => s.remove)
  const [coins, setCoins] = useState<Record<string, string>>({})
  const setGradeFor = (p: Profile, g: Grade) => patchKid(p.id, (q) => {
    const info = GRADES.find((x) => x.grade === g)!
    q.grade = g; q.settings.cap = info.cap as typeof q.settings.cap; q.settings.ops = [...info.ops]
  })
  return (
    <div className="grid gap-3">
      {profiles.map((p) => (
        <Card key={p.id} className="!p-4 grid gap-3">
          <div className="flex items-center gap-3"><span className="text-4xl">{p.avatar}</span><span className="font-extrabold text-xl flex-1">{p.name}</span><span className="font-bold">🪙 {p.coins}</span></div>
          <div className="flex flex-wrap gap-2 items-center"><span className="font-bold w-20">Sinf:</span>
            {GRADES.map((g) => <Btn key={g.grade} size="sm" color={p.grade === g.grade ? 'bg-grape text-white' : 'bg-gray-100'} onClick={() => setGradeFor(p, g.grade as Grade)}>{g.grade}</Btn>)}
          </div>
          <div className="flex flex-wrap gap-2 items-center"><span className="font-bold w-20">Tanga:</span>
            <input value={coins[p.id] ?? ''} inputMode="numeric" placeholder="20" onChange={(e) => setCoins({ ...coins, [p.id]: e.target.value.replace(/\D/g, '') })} className="w-20 rounded-xl border-2 px-2 py-1 font-bold" />
            <Btn size="sm" color="bg-mint text-white" onClick={() => { const n = +(coins[p.id] || 0); if (n) patchKid(p.id, (q) => { q.coins += n }) }}>➕ Sovg‘a</Btn>
            <Btn size="sm" color="bg-gray-100" onClick={() => { const n = +(coins[p.id] || 0); if (n) patchKid(p.id, (q) => { q.coins = Math.max(0, q.coins - n) }) }}>➖ Ayirish</Btn>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" color="bg-gray-100" onClick={() => { if (confirm(`${p.name}: joriy sinf natijalari (yulduzlar) nolga tushirilsinmi?`)) patchKid(p.id, (q) => { for (const k of Object.keys(q.progress)) if (k.startsWith(`g${q.grade}:`)) delete q.progress[k] }) }}>↺ Sinf natijalarini tozalash</Btn>
            <Btn size="sm" color="bg-gray-100" onClick={() => patchKid(p.id, (q) => { q.mistakes = {} })}>🧹 Xatolar ro‘yxatini tozalash</Btn>
            <Btn size="sm" color="bg-coral-light" onClick={() => { if (confirm(`${p.name} profilini o‘chirasizmi?`)) remove(p.id) }}>🗑 O‘chirish</Btn>
          </div>
          {p.redeemed.length > 0 && (
            <details><summary className="font-bold cursor-pointer">Sovg‘alar tarixi ({p.redeemed.length})</summary>
              <div className="grid gap-1 mt-2">{[...p.redeemed].reverse().map((r) => <div key={r.id} className="text-sm">{r.date} · {r.emoji} {r.name} · 🪙{r.price} · {r.given ? '✅ berildi' : '⏳ kutilmoqda'}</div>)}</div>
            </details>
          )}
        </Card>
      ))}
      <Btn color="bg-white text-grape-dark" onClick={() => { location.hash = '#/profiles' }}>➕ Yangi bola qo‘shish</Btn>
    </div>
  )
}

const pickContent = (a: AdminConfig): Content => ({ hidden: a.hidden, rewards: a.rewards, words: a.words, problems: a.problems })

function LocalContent({ section }: { section: 'games' | 'questions' | 'rewards' }) {
  const admin = useStore((s) => s.admin)
  const setAdmin = useStore((s) => s.setAdmin)
  const cloud = useStore((s) => s.cloud)
  return (
    <div className="grid gap-3">
      <ContentEditor section={section} value={pickContent(admin)} onChange={(v) => { setAdmin((a) => { Object.assign(a, v) }); if (cloud) void pushConfig().catch(() => {}) }} />
      <p className="text-xs text-gray-500">O‘zgarishlar darhol saqlanadi{cloud ? ' va onlayn panelga yuboriladi' : ''}.</p>
    </div>
  )
}

/** Eslab qolish oson parol: 3 harf + 4 raqam (o'xshash belgilarsiz). */
function makePassword() {
  const L = 'abdefghkmnprstuvxyz'
  const r = (n: number) => Math.floor(Math.random() * n)
  return Array.from({ length: 3 }, () => L[r(L.length)]).join('') + String(1000 + r(9000))
}

function CloudTab() {
  const cloud = useStore((s) => s.cloud)
  const setCloud = useStore((s) => s.setCloud)
  const [code, setCode] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const run = async (fn: () => Promise<void>) => { setBusy(true); setMsg(''); try { await fn() } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) } }
  useEffect(() => { if (cloud) void run(async () => { await syncNow() }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const field = 'rounded-xl border-2 px-3 py-2 font-bold w-full'
  const panelUrl = cloud ? `${location.origin}/#/cloud/${cloud.token}` : ''

  if (cloud) return (
    <Card className="grid gap-4">
      <div className="text-center text-mint font-extrabold text-xl">✅ Onlayn panel yoqilgan</div>
      <Btn size="lg" color="bg-grape text-white" onClick={() => window.open(panelUrl, '_blank')}>🌐 Onlayn panelni ochish</Btn>
      <div className="bg-gray-50 rounded-2xl p-3 text-center">
        <div className="text-sm font-bold text-gray-500">Kompyuterdan kirish uchun: raqamjon.vercel.app/#/cloud</div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-1">
          <span>Kod: <b className="text-2xl tracking-widest text-grape-dark select-all">{cloud.code}</b></span>
          {cloud.pass && <span>Parol: <b className="text-2xl tracking-widest text-grape-dark select-all">{cloud.pass}</b></span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <Btn size="sm" color="bg-white text-grape-dark" onClick={() => { void navigator.clipboard?.writeText(`Raqamjon onlayn panel: ${location.origin}/#/cloud\nKod: ${cloud.code}${cloud.pass ? `\nParol: ${cloud.pass}` : ''}`); setMsg('Nusxalandi ✓') }}>📋 Kod va parolni nusxalash</Btn>
        <Btn size="sm" color="bg-white text-grape-dark" disabled={busy} onClick={() => run(async () => { await syncNow(); setMsg('Sinxronlandi ✓') })}>🔄 Sinxronlash</Btn>
        <Btn size="sm" color="bg-gray-100" onClick={() => { if (confirm('Bu qurilma onlayn paneldan uziladi. Davom etasizmi?')) setCloud(null) }}>Uzish</Btn>
      </div>
      <p className="text-xs text-gray-500 text-center">Natijalar avtomatik yuboriladi. Ikkinchi telefonni ulash uchun u yerda “Boshqa qurilma hisobiga ulash”ni tanlab, shu kod va parolni kiriting.</p>
      {msg && <p className="font-bold text-center">{msg}</p>}
    </Card>
  )
  return (
    <Card className="grid gap-4 text-center">
      <div className="text-6xl">☁️</div>
      <p className="font-bold text-gray-600">Bitta tugma — va bolalar natijalarini istalgan telefon yoki kompyuterdan ko‘rasiz.</p>
      <Btn size="lg" color="bg-mint text-white" disabled={busy} onClick={() => run(async () => {
        const p = makePassword()
        const r = await rpc<{ code: string; token: string }>('family_create', { p_password: p })
        setCloud({ ...r, pass: p, lastSync: 0 }); await syncNow()
      })}>{busy ? 'Yaratilmoqda…' : '☁️ Onlayn panelni yoqish'}</Btn>
      {msg && <p className="font-bold text-coral">{msg}</p>}
      <details className="text-left">
        <summary className="font-bold cursor-pointer text-gray-600">Boshqa qurilma hisobiga ulash (kod va parol bor bo‘lsa)</summary>
        <div className="grid gap-2 mt-3">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="RJ-XXXXXX" className={field} />
          <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Parol" className={field} />
          <Btn color="bg-grape text-white" disabled={busy || !code || !pass} onClick={() => run(async () => {
            const r = await rpc<{ code: string; token: string }>('family_login', { p_code: code, p_password: pass })
            setCloud({ ...r, pass, lastSync: 0 }); await syncNow()
          })}>🔗 Ulash</Btn>
        </div>
      </details>
    </Card>
  )
}
