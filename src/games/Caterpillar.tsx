import { useEffect, useMemo } from 'react'
import { genEquation, eqKey, opSymbol , fitPx } from '../lib/levels'
import { sayEquation } from '../audio/voice'
import { NumberPad } from '../components/NumberPad'
import { Speaker } from '../components/ui'
import { boxColor } from './kit'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

const SEG = ['bg-mint', 'bg-sky2', 'bg-sun', 'bg-coral', 'bg-grape']

/** 4-o'yin: qurtcha — har to'g'ri javobda tanasi o'sadi. */
export default function Caterpillar({ api }: { api: GameApi }) {
  const eq = useMemo(() => genEquation(api.level, { ops: api.ops, cap: api.cap, weak: api.weak }), [api.level, api.cap, api.ops, api.weak])
  const a = useAnswer(api, eq.result, eqKey(eq))
  useEffect(() => { sayEquation(eq.a, eq.op, eq.b) }, [eq])
  const grown = api.index + (a.state === 'ok' ? 1 : 0)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center flex-wrap gap-y-2 w-full py-2">
        {Array.from({ length: grown }, (_, i) => (
          <span key={i} className={`w-9 h-9 sm:w-11 sm:h-11 -ml-2 rounded-full border-4 border-white ${SEG[i % SEG.length]} ${i === grown - 1 && a.state === 'ok' ? 'animate-bounceIn' : ''}`} />
        ))}
      </div>
      <div className="flex items-center">
        <div className="relative shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-mint border-4 border-white shadow-pop grid place-items-center text-5xl z-10">
          <span className="absolute -top-6 left-5 text-3xl">〰️</span>
          😊
        </div>
        <div className="-ml-4 h-24 sm:h-28 px-4 sm:px-6 rounded-full bg-sun-light border-4 border-sun grid place-items-center font-extrabold text-grape-dark whitespace-nowrap" style={{ fontSize: fitPx(`${eq.a}${eq.b}`, 44, 4) }}>
          {eq.a} {opSymbol(eq.op)} {eq.b} =
        </div>
        <div className={`-ml-3 shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 grid place-items-center font-extrabold ${boxColor(a.state)}`} style={{ fontSize: fitPx(Math.max(String(eq.result).length, a.value.length) > 2 ? String(eq.result) : '00', 48) }}>
          {a.state === 'ok' || a.state === 'reveal' ? eq.result : a.value}
        </div>
      </div>
      <Speaker onClick={() => sayEquation(eq.a, eq.op, eq.b)} />
      <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
    </div>
  )
}
