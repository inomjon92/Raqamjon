import { useRef, useState } from 'react'
import { GAMES } from '../games'
import { AVATARS, CAPS, progressOf, today, useProfile, useStore, type Settings } from '../lib/store'
import { ALL_OPS, GRADES, type Grade, type Op } from '../lib/levels'
import { Btn, Card, TopBar } from '../components/ui'
import { ParentGate } from '../components/ParentGate'
import { go } from '../lib/router'

type Tab = 'stats' | 'settings' | 'kids' | 'data'

export default function Parent() {
  const [tab, setTab] = useState<Tab>('stats')
  const p = useProfile()
  return (
    <ParentGate>
      <TopBar title="👪 Ota-onalar paneli" />
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {([['stats', '📊 Natijalar'], ['settings', '⚙️ Sozlamalar'], ['kids', '👧 Bolalar'], ['data', '💾 Ma‘lumotlar']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 py-2 rounded-2xl font-bold ${tab === t ? 'bg-grape text-white' : 'bg-white text-grape-dark shadow-popsm'}`}>{label}</button>
        ))}
      </div>
      <a href="#/admin" className="flex items-center gap-3 bg-gradient-to-r from-grape to-indigo-500 text-white rounded-3xl p-4 mb-4 shadow-pop">
        <span className="text-4xl">🛡️</span>
        <span className="flex-1"><span className="block text-xl font-extrabold">Admin panel</span><span className="block text-sm font-bold opacity-90">PIN bilan: barcha bolalar, savollar, sovg‘alar, onlayn panel</span></span>
        <span className="text-2xl">➜</span>
      </a>
      {!p ? <p>Avval bola profilini yarating.</p> : tab === 'stats' ? <Stats /> : tab === 'settings' ? <SettingsTab /> : tab === 'kids' ? <Kids /> : <Data />}
    </ParentGate>
  )
}

function Stats() {
  const p = useProfile()!
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { k, label: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][d.getDay()], ...(p.days[k] ?? { solved: 0, correct: 0, seconds: 0 }) }
  })
  const t = p.days[today()] ?? { solved: 0, correct: 0, seconds: 0 }
  const all = Object.values(p.games).reduce((a, g) => ({ solved: a.solved + g.solved, correct: a.correct + g.correct }), { solved: 0, correct: 0 })
  const maxSolved = Math.max(10, ...days.map((d) => d.solved))
  const weak = Object.entries(p.mistakes).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const pct = (c: number, s: number) => (s ? Math.round((c / s) * 100) : 0)

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Bugun misollar', t.solved],
          ['Bugun vaqt', `${Math.round(t.seconds / 60)} daq`],
          ['Umumiy aniqlik', `${pct(all.correct, all.solved)}%`],
          ['Ketma-ket kunlar', `🔥 ${p.streak}`],
        ].map(([l, v]) => (
          <Card key={l as string} className="!p-4"><div className="text-sm font-bold text-gray-500">{l}</div><div className="text-3xl font-extrabold text-grape-dark">{v}</div></Card>
        ))}
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-3">Oxirgi 7 kun: yechilgan misollar</h3>
        <div className="flex items-end gap-2 h-40">
          {days.map((d) => (
            <div key={d.k} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-xs font-bold text-gray-500">{d.solved || ''}</span>
              <div className="w-full rounded-t-lg bg-grape-light relative" style={{ height: `${(d.solved / maxSolved) * 100}%` }}>
                <div className="absolute bottom-0 inset-x-0 rounded-t-lg bg-grape" style={{ height: `${pct(d.correct, d.solved)}%` }} />
              </div>
              <span className="text-xs font-bold">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">To‘q rang — to‘g‘ri javoblar ulushi.</p>
      </Card>
      <Card>
        <h3 className="font-extrabold text-lg mb-3">O‘yinlar bo‘yicha</h3>
        <div className="grid gap-2">
          {GAMES.map((g) => {
            const s = p.games[g.id]
            const stars = progressOf(p, g.id).reduce((a, b) => a + b, 0)
            return (
              <div key={g.id} className="flex items-center gap-3 text-sm sm:text-base">
                <span className="text-2xl w-8">{g.emoji}</span>
                <span className="flex-1 font-bold truncate">{g.title}</span>
                <span className="w-16 text-right">⭐ {stars}</span>
                <span className="w-20 text-right text-gray-600">{s ? `${s.solved} ta` : '—'}</span>
                <span className="w-14 text-right font-bold">{s ? `${pct(s.correct, s.solved)}%` : ''}</span>
              </div>
            )
          })}
        </div>
      </Card>
      <Card>
        <h3 className="font-extrabold text-lg mb-2">Qiyin misollar</h3>
        {weak.length === 0 ? <p className="text-gray-500">Hozircha yo‘q — zo‘r!</p> : (
          <div className="flex flex-wrap gap-2">
            {weak.map(([k, n]) => <span key={k} className="bg-coral-light rounded-xl px-3 py-1 font-bold">{k.replace('-', ' − ').replace('+', ' + ').replace('?', ' ? ')} <span className="text-coral">×{n}</span></span>)}
          </div>
        )}
        <Btn className="mt-4" color="bg-sky2 text-white" onClick={() => go('#/print')}>🖨️ Ish varag‘ini chop etish</Btn>
      </Card>
      <Card>
        <h3 className="font-extrabold text-lg mb-2">Mental arifmetika</h3>
        <p>Tugatilgan darslar: <b>{Object.keys(p.lessons).length}/32</b> · Flesh-anzan rekordi: <b>{p.flashBest ? `${p.flashBest} ms` : '—'}</b></p>
      </Card>
    </div>
  )
}

function SettingsTab() {
  const p = useProfile()!
  const patch = useStore((s) => s.patch)
  const setGrade = useStore((s) => s.setGrade)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => patch((q) => { q.settings[k] = v })
  const s = p.settings
  const row = 'flex items-center justify-between gap-3 py-3 border-b last:border-0'
  return (
    <Card>
      <div className={`${row} flex-col !items-start`}><span className="font-bold">Sinf</span>
        <div className="flex flex-wrap gap-2">{GRADES.map((g) => <Btn key={g.grade} size="sm" color={p.grade === g.grade ? 'bg-grape text-white' : 'bg-gray-100'} onClick={() => setGrade(g.grade as Grade)}>{g.grade}-sinf ({g.age} yosh)</Btn>)}</div>
        <span className="text-sm text-gray-500">Sinf tanlansa, sonlar chegarasi va amallar shu sinfga moslanadi. Pastda ularni alohida o‘zgartirish mumkin.</span>
      </div>
      <div className={`${row} flex-col !items-start`}><span className="font-bold">Sonlar chegarasi</span>
        <div className="flex flex-wrap gap-2">{CAPS.map((c) => <Btn key={c} size="sm" color={s.cap === c ? 'bg-grape text-white' : 'bg-gray-100'} onClick={() => set('cap', c)}>{c} gacha</Btn>)}</div>
        <span className="text-sm text-gray-500">Darajalar bilan sonlar kattalashadi, 5-daraja — tanlangan chegaragacha. Rasmli o‘yinlarda sonlar 20 dan oshmaydi.</span>
      </div>
      <div className={`${row} flex-col !items-start`}><span className="font-bold">Amallar</span>
        <div className="flex flex-wrap gap-2">{([['+', '➕ Qo‘shish'], ['-', '➖ Ayirish'], ['×', '✖️ Ko‘paytirish'], ['÷', '➗ Bo‘lish']] as [Op, string][]).map(([o, l]) => {
          const on = s.ops.includes(o)
          return <Btn key={o} size="sm" color={on ? 'bg-grape text-white' : 'bg-gray-100'} onClick={() => { const next = on ? s.ops.filter((x) => x !== o) : [...s.ops, o]; if (next.length) set('ops', ALL_OPS.filter((x) => next.includes(x))) }}>{l}</Btn>
        })}</div>
      </div>
      <div className={row}><span className="font-bold">Ovozli ko‘rsatmalar</span><Toggle on={s.voice} set={(v) => set('voice', v)} /></div>
      <div className={row}><span className="font-bold">Ovoz balandligi</span><input type="range" min={0} max={1} step={0.1} value={s.volume} onChange={(e) => set('volume', +e.target.value)} /></div>
      <div className={row}><span className="font-bold">Effekt tovushlari</span><Toggle on={s.sfx} set={(v) => set('sfx', v)} /></div>
      <div className={row}><span className="font-bold">Animatsiyalarni kamaytirish</span><Toggle on={s.reduceMotion} set={(v) => set('reduceMotion', v)} /></div>
      <div className={row}><span className="font-bold">Kunlik vaqt (daqiqa)</span>
        <select value={s.dailyLimitMin} onChange={(e) => set('dailyLimitMin', +e.target.value)} className="text-lg font-bold rounded-xl border-2 px-2 py-1">
          {[0, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m === 0 ? 'Cheklovsiz' : m}</option>)}
        </select>
      </div>
      <div className={row}><span className="font-bold">Flesh-anzan tezligi</span>
        <select value={s.flashSpeedMs} onChange={(e) => set('flashSpeedMs', +e.target.value)} className="text-lg font-bold rounded-xl border-2 px-2 py-1">
          {[3000, 2000, 1500, 1000, 700, 500].map((m) => <option key={m} value={m}>{m / 1000} soniya</option>)}
        </select>
      </div>
      <div className={row}><span className="font-bold">Flesh-anzan: sonlar soni</span>
        <select value={s.flashCount} onChange={(e) => set('flashCount', +e.target.value)} className="text-lg font-bold rounded-xl border-2 px-2 py-1">
          {[3, 4, 5, 6, 7, 8, 10].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <p className="text-xs text-gray-500 mt-3">Sozlamalar faqat {p.avatar} {p.name} uchun.</p>
    </Card>
  )
}

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => set(!on)} className={`w-16 h-9 rounded-full p-1 transition ${on ? 'bg-mint' : 'bg-gray-300'}`}>
      <span className={`block w-7 h-7 rounded-full bg-white shadow transition ${on ? 'translate-x-7' : ''}`} />
    </button>
  )
}

function Kids() {
  const { profiles, activeId, setActive, remove, rename } = useStore()
  const [edit, setEdit] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  return (
    <div className="grid gap-3">
      {profiles.map((p) => (
        <Card key={p.id} className="!p-4">
          {edit === p.id ? (
            <div className="grid gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} className="text-xl font-bold rounded-xl border-2 px-3 py-2" />
              <div className="flex flex-wrap gap-1">{AVATARS.map((a) => <button key={a} onClick={() => setAvatar(a)} className={`text-3xl rounded-xl p-1 ${avatar === a ? 'bg-grape-light' : ''}`}>{a}</button>)}</div>
              <div className="flex gap-2"><Btn size="sm" color="bg-mint text-white" onClick={() => { rename(p.id, name.trim() || p.name, avatar); setEdit(null) }}>Saqlash</Btn><Btn size="sm" color="bg-gray-100" onClick={() => setEdit(null)}>Bekor</Btn></div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-4xl">{p.avatar}</span>
              <span className="flex-1 font-extrabold text-xl">{p.name} {p.id === activeId && <span className="text-sm text-mint">(hozirgi)</span>}</span>
              {p.id !== activeId && <Btn size="sm" color="bg-grape text-white" onClick={() => setActive(p.id)}>Tanlash</Btn>}
              <Btn size="sm" color="bg-gray-100" onClick={() => { setEdit(p.id); setName(p.name); setAvatar(p.avatar) }}>✏️</Btn>
              <Btn size="sm" color="bg-coral-light" onClick={() => { if (confirm(`${p.name} profilini o‘chirasizmi? Barcha natijalar yo‘qoladi.`)) remove(p.id) }}>🗑</Btn>
            </div>
          )}
        </Card>
      ))}
      {profiles.length < 4 && <Btn color="bg-white text-grape-dark" onClick={() => go('#/profiles')}>➕ Yangi bola qo‘shish</Btn>}
    </div>
  )
}

function Data() {
  const importAll = useStore((s) => s.importAll)
  const file = useRef<HTMLInputElement>(null)
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: 'raqamjon', version: 1, profiles: useStore.getState().profiles }, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `raqamjon-${today()}.json`
    a.click()
  }
  return (
    <Card className="grid gap-3">
      <p className="text-gray-600">Barcha natijalar shu qurilmada saqlanadi. Boshqa telefon yoki kompyuterga o‘tkazish uchun zaxira faylini yuklab oling va u yerda tiklang.</p>
      <Btn color="bg-grape text-white" onClick={exportData}>⬇️ Zaxira faylini yuklab olish</Btn>
      <Btn color="bg-white text-grape-dark" onClick={() => file.current?.click()}>⬆️ Fayldan tiklash</Btn>
      <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        try {
          const j = JSON.parse(await f.text())
          if (j.app !== 'raqamjon' || !Array.isArray(j.profiles)) throw new Error()
          if (confirm('Hozirgi ma‘lumotlar fayldagilar bilan almashtiriladi. Davom etasizmi?')) { importAll(j); alert('Tiklandi!') }
        } catch { alert('Fayl noto‘g‘ri.') }
      }} />
    </Card>
  )
}
