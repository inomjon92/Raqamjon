import { useEffect, useMemo } from 'react'
import { genEquation, eqKey } from '../lib/levels'
import { say } from '../audio/voice'
import { NumberPad } from '../components/NumberPad'
import { CUTE, PictureGroup, boxColor, randomEmoji, useCells, useCounter } from './kit'
import type { GameApi } from './types'

/** 2-o'yin: avval har bir guruhni sanab yozish, keyin yig'indini topish. */
export default function Steps({ api }: { api: GameApi }) {
  const eq = useMemo(() => genEquation(api.level, { ops: ['+'], cap: api.cap, weak: api.weak, maxResult: api.level <= 2 ? 10 : 20 }), [api.level, api.cap, api.weak])
  const [e1, e2] = useMemo(() => { const x = randomEmoji(CUTE); let y = randomEmoji(CUTE); while (y === x) y = randomEmoji(CUTE); return [x, y] }, [])
  const c = useCells(api, [eq.a, eq.b, eq.result], eqKey(eq))
  const l = useCounter(0)
  const r = useCounter(0)
  useEffect(() => { say(['ins_steps']) }, [])

  const box = (i: number, extra = '') => (
    <button onClick={() => c.select(i)} className={`h-16 sm:h-20 min-w-[96px] rounded-2xl border-4 text-4xl font-extrabold grid place-items-center ${boxColor(c.states[i], c.active === i)} ${c.active === i && c.values[i] === null ? 'ring-4 ring-sun' : ''} ${extra}`}>
      {c.values[i] ?? (c.active === i ? c.input : '') ?? ''}
    </button>
  )

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full justify-center">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
          <div className="flex-1 sm:flex-none flex flex-col items-center gap-2 bg-white/70 rounded-3xl p-2 sm:min-w-[160px]">
            <PictureGroup emoji={e1} count={eq.a} counted={l.counted} onCount={l.count} size="text-3xl sm:text-5xl" numbers={api.help} />
            {box(0)}
          </div>
          <span className="text-4xl font-black text-coral">+</span>
          <div className="flex-1 sm:flex-none flex flex-col items-center gap-2 bg-white/70 rounded-3xl p-2 sm:min-w-[160px]">
            <PictureGroup emoji={e2} count={eq.b} counted={r.counted} onCount={r.count} size="text-3xl sm:text-5xl" numbers={api.help} />
            {box(1)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-5xl font-black text-coral">=</span>
          {box(2, 'w-28')}
        </div>
      </div>
      <NumberPad value={c.input} onChange={c.setInput} onSubmit={c.submit} disabled={c.allDone} />
    </div>
  )
}
