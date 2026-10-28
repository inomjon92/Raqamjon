import { useEffect, useMemo, useState } from 'react'
import { genEquation, eqKey, distractors } from '../lib/levels'
import { sayEquation } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { Speaker } from '../components/ui'
import { shuffle } from '../lib/random'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

const COLORS = ['#ff6b8b', '#38bdf8', '#ffb020', '#22c55e', '#a78bfa']

/** 10-o'yin: to'g'ri javobli pufakni yorish. Pufak qochib ketsa, qaytadan uchadi. */
export default function Balloons({ api }: { api: GameApi }) {
  const eq = useMemo(() => genEquation(api.level, { ops: api.ops, cap: api.cap, weak: api.weak }), [api.level, api.cap, api.ops, api.weak])
  const opts = useMemo(() => shuffle([eq.result, ...distractors(eq.result, 3, api.cap)]), [eq, api.cap])
  const [popped, setPopped] = useState<number[]>([])
  const a = useAnswer(api, eq.result, eqKey(eq))
  useEffect(() => { sayEquation(eq.a, eq.op, eq.b) }, [eq])

  const tap = (o: number) => {
    if (a.locked || popped.includes(o)) return
    sfx.pop()
    setPopped((p) => [...p, o])
    a.submit(o)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 text-5xl sm:text-6xl font-extrabold text-grape-dark">
        {eq.a} <span className="text-coral">{eq.op === '+' ? '+' : '−'}</span> {eq.b} <span className="text-coral">=</span> <span className="text-mint">{a.state === 'ok' || a.state === 'reveal' ? eq.result : '?'}</span>
        <Speaker onClick={() => sayEquation(eq.a, eq.op, eq.b)} />
      </div>
      <div className="relative w-full h-[52vh] min-h-[320px] overflow-hidden rounded-3xl bg-gradient-to-b from-sky2-light to-white">
        {opts.map((o, i) => {
          const isPopped = popped.includes(o)
          const dur = 7 + i * 1.3 + (api.level >= 4 ? -1.5 : 0)
          return (
            <button key={o} onClick={() => tap(o)} aria-label={String(o)}
              className="absolute -bottom-40 w-20 sm:w-24 flex flex-col items-center"
              style={{ left: `${4 + i * 24}%`, animation: `balloonUp ${dur}s linear ${-i * 1.7}s infinite`, animationPlayState: isPopped ? 'paused' : 'running' }}>
              {isPopped ? (
                <span className={`text-6xl ${o === eq.result ? '' : 'opacity-60'}`}>{o === eq.result ? '🎉' : '💨'}</span>
              ) : (
                <>
                  <span className="w-20 h-24 sm:w-24 sm:h-28 rounded-[50%] grid place-items-center text-4xl font-extrabold text-white shadow-lg" style={{ background: COLORS[i % COLORS.length] }}>{o}</span>
                  <span className="w-0.5 h-10 bg-gray-400" />
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
