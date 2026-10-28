import { useEffect, useMemo, useState } from 'react'
import { genEquation, eqKey, distractors, opSymbol } from '../lib/levels'
import { say } from '../audio/voice'
import { Speaker } from '../components/ui'
import { rnd, shuffle } from '../lib/random'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

/** 11-o'yin: tarozi — o'ng pallaga to'g'ri toshni qo'yib, tenglashtirish. */
export default function Scale({ api }: { api: GameApi }) {
  const { eq, right, correct, opts } = useMemo(() => {
    const eq = genEquation(api.level, { ops: api.ops, cap: api.cap, weak: api.weak })
    const right = api.level >= 4 && eq.result > 2 ? rnd(1, eq.result - 1) : 0
    const correct = eq.result - right
    return { eq, right, correct, opts: shuffle([correct, ...distractors(correct, api.level >= 3 ? 3 : 2, api.cap)]) }
  }, [api.level, api.cap, api.ops, api.weak])
  const [chosen, setChosen] = useState<number | null>(null)
  const a = useAnswer(api, correct, eqKey(eq))
  useEffect(() => { say(['ins_scale']) }, [])

  const rightSum = right + (chosen ?? 0)
  const tilt = Math.max(-12, Math.min(12, (eq.result - rightSum) * -3))
  const choose = (o: number) => {
    if (a.locked) return
    setChosen(o)
    setTimeout(() => { a.submit(o); if (o !== correct) setTimeout(() => setChosen(null), 600) }, 700)
  }
  const pan = (content: React.ReactNode) => (
    <div className="flex flex-col items-center w-32 sm:w-40">
      <div className="min-h-[64px] flex items-end justify-center gap-1 flex-wrap">{content}</div>
      <div className="w-full h-3 rounded-b-full bg-sun" />
    </div>
  )
  const stone = (label: string | number, color = 'bg-gray-500') => (
    <span className={`${color} text-white font-extrabold text-2xl sm:text-3xl rounded-t-[40%] rounded-b-xl px-3 py-2 shadow`}>{label}</span>
  )

  return (
    <div className="flex flex-col items-center gap-4">
      <Speaker clip={['ins_scale']} />
      <div className="relative w-full max-w-md flex flex-col items-center">
        <div className="w-full flex justify-between transition-transform duration-700" style={{ transform: `rotate(${tilt}deg)` }}>
          {pan(<>{stone(eq.a, 'bg-grape')}<span className="text-2xl font-black self-center">{opSymbol(eq.op)}</span>{stone(eq.b, 'bg-grape')}</>)}
          {pan(<>{right > 0 && stone(right, 'bg-sky2')}{right > 0 && <span className="text-2xl font-black self-center">+</span>}{chosen !== null ? stone(chosen, 'bg-mint') : <span className="text-4xl opacity-40 self-center">❓</span>}</>)}
        </div>
        <div className="w-3 h-28 bg-gray-600 rounded-full -mt-1" />
        <div className="w-28 h-4 bg-gray-700 rounded-full" />
      </div>
      <div className="flex gap-3">
        {opts.map((o) => (
          <button key={o} disabled={a.locked} onClick={() => choose(o)} className="w-20 h-20 sm:w-24 sm:h-24 rounded-t-[45%] rounded-b-2xl bg-gray-500 text-white text-4xl font-extrabold shadow-pop active:translate-y-1 active:shadow-none disabled:opacity-50">
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
