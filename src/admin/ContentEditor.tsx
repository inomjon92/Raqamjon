import { useState } from 'react'
import { GAMES } from '../games'
import { Btn, Card } from '../components/ui'
import type { CustomProblem, CustomWord, Reward } from '../lib/store'

export interface Content { hidden: string[]; rewards: Reward[]; words: CustomWord[]; problems: CustomProblem[] }

const uid = () => Math.random().toString(36).slice(2, 10)
const input = 'rounded-xl border-2 px-3 py-2 font-bold min-w-0'

/** "5 + 3" kabi misolni hisoblash (faqat + − × : ÷ va sonlar). */
export function solve(q: string): number | null {
  const t = q.replace(/\s/g, '').replace(/[x*]/gi, '×').replace(/[:/]/g, '÷').replace(/−/g, '-')
  if (!/^\d+([+\-×÷]\d+)+$/.test(t)) return null
  const nums = t.split(/[+\-×÷]/).map(Number)
  const ops = t.replace(/\d+/g, '').split('')
  // Avval × va ÷, keyin + va −.
  const n = [nums[0]]; const o: string[] = []
  ops.forEach((op, i) => {
    const b = nums[i + 1]
    if (op === '×') n[n.length - 1] *= b
    else if (op === '÷') n[n.length - 1] = b === 0 ? NaN : n[n.length - 1] / b
    else { o.push(op); n.push(b) }
  })
  let r = n[0]
  o.forEach((op, i) => { r = op === '+' ? r + n[i + 1] : r - n[i + 1] })
  return Number.isInteger(r) && r >= 0 ? r : null
}

/** Savollar, so'zlar, o'yinlar va sovg'alarni boshqarish (mahalliy va onlayn panel uchun umumiy). */
export function ContentEditor({ value, onChange, section }: { value: Content; onChange(v: Content): void; section: 'games' | 'questions' | 'rewards' }) {
  const set = (patch: Partial<Content>) => onChange({ ...value, ...patch })
  if (section === 'games') return <GamesSection value={value} set={set} />
  if (section === 'rewards') return <RewardsSection value={value} set={set} />
  return <QuestionsSection value={value} set={set} />
}

type SectionProps = { value: Content; set(p: Partial<Content>): void }

function GamesSection({ value, set }: SectionProps) {
  return (
    <Card>
      <h3 className="font-extrabold text-lg mb-1">O‘yinlarni yoqish / o‘chirish</h3>
      <p className="text-sm text-gray-500 mb-3">O‘chirilgan o‘yinlar bolaga ko‘rinmaydi va sinfni tugatishga hisoblanmaydi.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {GAMES.map((g) => {
          const on = !value.hidden.includes(g.id)
          return (
            <label key={g.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 cursor-pointer ${on ? 'bg-mint-light' : 'bg-gray-100 opacity-70'}`}>
              <input type="checkbox" className="w-5 h-5 accent-grape" checked={on}
                onChange={() => set({ hidden: on ? [...value.hidden, g.id] : value.hidden.filter((x) => x !== g.id) })} />
              <span className="text-2xl">{g.emoji}</span>
              <span className="font-bold flex-1">{g.title}</span>
              <span className="text-xs font-bold text-gray-500">{g.subject === 'alifbo' ? 'Alifbo' : 'Matematika'}</span>
            </label>
          )
        })}
      </div>
    </Card>
  )
}

function QuestionsSection({ value, set }: SectionProps) {
  const [q, setQ] = useState('')
  const [w, setW] = useState('')
  const [e, setE] = useState('')
  const [syl, setSyl] = useState('')
  const ans = solve(q)
  const addProblem = () => { if (ans === null) return; set({ problems: [...value.problems, { id: uid(), q: q.trim().replace(/\s*([+\-×÷:*x/])\s*/gi, ' $1 ').replace(/ [*x] /gi, ' × ').replace(/ [:/] /g, ' : '), a: ans }] }); setQ('') }
  const parts = syl.trim() ? syl.trim().split(/[-\s]+/) : [w.trim()]
  const okWord = w.trim() && e.trim() && parts.join('').toLowerCase() === w.trim().toLowerCase()
  const addWord = () => {
    if (!okWord) return
    set({ words: [...value.words, { w: w.trim(), e: e.trim(), s: parts, l: Math.min(4, Math.max(1, parts.length)) }] })
    setW(''); setE(''); setSyl('')
  }
  return (
    <div className="grid gap-4">
      <Card>
        <h3 className="font-extrabold text-lg mb-1">📝 O‘z misollaringiz</h3>
        <p className="text-sm text-gray-500 mb-3">“Ota-ona savollari” o‘yinida chiqadi. Masalan: <b>7 + 8</b>, <b>36 : 4</b>, <b>5 × 6 − 3</b>. Javob avtomatik hisoblanadi.</p>
        <div className="flex gap-2">
          <input value={q} onChange={(ev) => setQ(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && addProblem()} placeholder="12 + 7" className={`${input} flex-1`} />
          <Btn size="sm" color={ans === null ? 'bg-gray-200 text-gray-500' : 'bg-mint text-white'} onClick={addProblem}>➕ {ans !== null ? `= ${ans}` : ''}</Btn>
        </div>
        {q && ans === null && <p className="text-sm text-coral font-bold mt-1">Misol noto‘g‘ri yoki javob butun musbat son emas.</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          {value.problems.map((p) => (
            <span key={p.id} className="bg-sky2-light rounded-xl pl-3 pr-1 py-1 font-bold flex items-center gap-1">{p.q} = {p.a}
              <button aria-label="O‘chirish" className="px-2 text-coral" onClick={() => set({ problems: value.problems.filter((x) => x.id !== p.id) })}>✕</button></span>
          ))}
          {!value.problems.length && <span className="text-gray-400">Hozircha yo‘q</span>}
        </div>
      </Card>
      <Card>
        <h3 className="font-extrabold text-lg mb-1">🔤 Alifbo uchun yangi so‘zlar</h3>
        <p className="text-sm text-gray-500 mb-3">So‘z, uning rasmi (emoji) va bo‘g‘inlari (chiziqcha bilan: <b>an-jir</b>). So‘zlar Alifbo o‘yinlarida chiqadi.</p>
        <div className="grid grid-cols-[1fr_5rem] sm:grid-cols-[1fr_5rem_1fr_auto] gap-2">
          <input value={w} onChange={(ev) => setW(ev.target.value)} placeholder="Anjir" className={input} />
          <input value={e} onChange={(ev) => setE(ev.target.value)} placeholder="🍑" className={`${input} text-center`} />
          <input value={syl} onChange={(ev) => setSyl(ev.target.value)} placeholder="An-jir" className={input} />
          <Btn size="sm" color={okWord ? 'bg-mint text-white' : 'bg-gray-200 text-gray-500'} onClick={addWord}>➕ Qo‘shish</Btn>
        </div>
        {w && syl && !okWord && <p className="text-sm text-coral font-bold mt-1">Bo‘g‘inlar birlashganda so‘z chiqishi kerak.</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          {value.words.map((x, i) => (
            <span key={x.w + i} className="bg-sun-light rounded-xl pl-3 pr-1 py-1 font-bold flex items-center gap-1">{x.e} {x.s.join('-')}
              <button aria-label="O‘chirish" className="px-2 text-coral" onClick={() => set({ words: value.words.filter((_, j) => j !== i) })}>✕</button></span>
          ))}
          {!value.words.length && <span className="text-gray-400">Hozircha yo‘q</span>}
        </div>
      </Card>
    </div>
  )
}

function RewardsSection({ value, set }: SectionProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎁')
  const [price, setPrice] = useState('100')
  const add = () => {
    if (!name.trim() || !(+price > 0)) return
    set({ rewards: [...value.rewards, { id: uid(), name: name.trim(), emoji: emoji.trim() || '🎁', price: Math.round(+price) }] })
    setName('')
  }
  return (
    <Card>
      <h3 className="font-extrabold text-lg mb-1">🎁 Haqiqiy sovg‘alar</h3>
      <p className="text-sm text-gray-500 mb-3">Bola do‘konda tangaga “sotib oladi”, siz esa sovg‘ani berib, “Berildi” deb belgilaysiz.</p>
      <div className="grid grid-cols-[4rem_1fr] sm:grid-cols-[4rem_1fr_7rem_auto] gap-2">
        <input value={emoji} onChange={(ev) => setEmoji(ev.target.value)} className={`${input} text-center`} />
        <input value={name} onChange={(ev) => setName(ev.target.value)} placeholder="Velosiped sayri" className={input} />
        <input value={price} onChange={(ev) => setPrice(ev.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Narx" className={input} />
        <Btn size="sm" color="bg-mint text-white" onClick={add}>➕ Qo‘shish</Btn>
      </div>
      <div className="grid gap-2 mt-3">
        {value.rewards.map((r) => (
          <div key={r.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-3 py-2">
            <span className="text-3xl">{r.emoji}</span>
            <span className="flex-1 font-bold">{r.name}</span>
            <input value={r.price} inputMode="numeric" aria-label="Narx" onChange={(ev) => set({ rewards: value.rewards.map((x) => (x.id === r.id ? { ...x, price: +ev.target.value.replace(/\D/g, '') || 0 } : x)) })}
              className="w-20 rounded-xl border-2 px-2 py-1 font-bold text-right" />
            <span>🪙</span>
            <button aria-label="O‘chirish" className="text-coral text-xl px-2" onClick={() => set({ rewards: value.rewards.filter((x) => x.id !== r.id) })}>🗑</button>
          </div>
        ))}
        {!value.rewards.length && <span className="text-gray-400">Sovg‘alar yo‘q</span>}
      </div>
    </Card>
  )
}
