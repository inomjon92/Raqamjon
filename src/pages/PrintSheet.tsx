import { useMemo, useState } from 'react'
import { genEquation, type Equation, mk } from '../lib/levels'
import { useProfile, weakKeys } from '../lib/store'
import { Btn, TopBar } from '../components/ui'
import { pick } from '../lib/random'

/** Ota-ona uchun A4 ish varag'i (bolaning qiyin misollari + daraja bo'yicha). */
export default function PrintSheet() {
  const p = useProfile()!
  const [level, setLevel] = useState(3)
  const [seed, setSeed] = useState(0)
  const rows = useMemo(() => {
    const weak: Equation[] = weakKeys(p).map((k) => k.match(/^(\d+)([+-])(\d+)$/)).filter(Boolean).map((m) => mk(+m![1], m![2] as '+' | '-', +m![3]))
    const list: { e: Equation; hole: 'a' | 'b' | 'r' }[] = []
    for (const e of weak) list.push({ e, hole: 'r' })
    while (list.length < 30) list.push({ e: genEquation(level, { cap: p.settings.cap }), hole: level >= 3 ? pick(['a', 'b', 'r'] as const) : 'r' })
    return list.slice(0, 30)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, seed, p.id])
  const cell = (n: number, isHole: boolean) => isHole ? <span className="inline-block w-12 h-10 border-2 border-sky-500 rounded-md align-middle" /> : <span>{n}</span>

  return (
    <div>
      <div className="print:hidden">
        <TopBar title="🖨️ Ish varag‘i" back="#/parent" right={<Btn size="sm" onClick={() => window.print()}>Chop etish</Btn>} />
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-bold">Daraja:</span>
          {[1, 2, 3, 4, 5].map((l) => <Btn key={l} size="sm" color={level === l ? 'bg-grape text-white' : 'bg-white'} onClick={() => setLevel(l)}>{l}</Btn>)}
          <Btn size="sm" color="bg-sun text-white" onClick={() => setSeed(seed + 1)}>🔄 Yangilash</Btn>
        </div>
      </div>
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-pop print:shadow-none print:p-0 max-w-3xl mx-auto">
        <div className="flex justify-between text-lg mb-6"><span>Ism: <b>{p.name}</b></span><span>Sana: ____________</span></div>
        <h2 className="text-2xl font-extrabold text-center mb-6">🦉 Raqamjon — mashq varag‘i</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5 text-3xl font-bold">
          {rows.map(({ e, hole }, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap">
              {cell(e.a, hole === 'a')} <span>{e.op === '+' ? '+' : '−'}</span> {cell(e.b, hole === 'b')} <span>=</span> {cell(e.result, hole === 'r')}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
