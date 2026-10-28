import { useEffect, useMemo } from 'react'
import { genEquation, eqKey, distractors, opSymbol , fitPx } from '../lib/levels'
import { sayEquation } from '../audio/voice'
import { Speaker } from '../components/ui'
import { shuffle, pick } from '../lib/random'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

const HOSTS = ['🦋', '🐞', '🐝', '🐌', '🌻', '🐛', '🐸', '🐦', '🍄', '🧚', '🐿️', '🦔']

/** 9-o'yin: operatsiyalar bog'i — 3 ta javobdan to'g'risini tanlash. */
export default function Garden({ api }: { api: GameApi }) {
  const eq = useMemo(() => genEquation(api.level, { ops: api.ops, cap: api.cap, weak: api.weak }), [api.level, api.cap, api.ops, api.weak])
  const opts = useMemo(() => shuffle([eq.result, ...distractors(eq.result, 2, api.cap)]), [eq, api.cap])
  const host = useMemo(() => pick(HOSTS), [])
  const a = useAnswer(api, eq.result, eqKey(eq))
  useEffect(() => { sayEquation(eq.a, eq.op, eq.b) }, [eq])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="text-7xl sm:text-9xl animate-wiggle inline-block">{host}</span>
        <div className="bg-white rounded-[2rem] border-4 border-mint px-4 py-3 font-extrabold text-grape-dark whitespace-nowrap shadow-pop" style={{ fontSize: fitPx(`${eq.a}${eq.b}`, 44, 4) }}>
          {eq.a} {opSymbol(eq.op)} {eq.b}
        </div>
      </div>
      <Speaker onClick={() => sayEquation(eq.a, eq.op, eq.b)} />
      <div className="flex gap-3 sm:gap-5">
        {opts.map((o) => {
          const isOk = (a.state === 'ok' || a.state === 'reveal') && o === eq.result
          return (
            <button key={o} disabled={a.locked} onClick={() => a.submit(o)}
              style={{ fontSize: fitPx(o, 46) }} className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl font-extrabold shadow-pop active:translate-y-1 active:shadow-none border-4 ${isOk ? 'bg-mint text-white border-mint animate-bounceIn' : 'bg-white text-grape-dark border-grape-light'}`}>
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}
