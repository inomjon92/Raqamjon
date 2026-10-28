import { useEffect, useMemo, useState } from 'react'
import { eqKey, mk } from '../lib/levels'
import { sayEquation } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { NumberPad } from '../components/NumberPad'
import { Speaker } from '../components/ui'
import { rnd } from '../lib/random'
import { AnswerBox, CUTE, FRUITS, Op, Prompt, randomEmoji } from './kit'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

/** 16-o'yin: qatorlar — ko'paytirishni rasmda ko'rish (3 qator × 4 ta = 12). */
export default function Groups({ api }: { api: GameApi }) {
  const eq = useMemo(() => {
    const hi = [3, 4, 5, 6, 6][api.level - 1]
    return mk(rnd(2, hi), '×', rnd(2, hi + (api.level >= 4 ? 2 : 0)))
  }, [api.level])
  const emoji = useMemo(() => randomEmoji([...FRUITS, ...CUTE]), [])
  const hidden = api.level >= 4 && !api.help
  const [shown, setShown] = useState<number[]>([])
  const a = useAnswer(api, eq.result, eqKey(eq))
  useEffect(() => { sayEquation(eq.a, '×', eq.b) }, [eq])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white/70 rounded-3xl p-3 flex flex-col gap-1 sm:gap-2">
        {Array.from({ length: eq.a }, (_, r) => {
          const open = !hidden || shown.includes(r) || a.locked
          return (
            <button key={r} onClick={() => { if (!open) { sfx.pop(); setShown([...shown, r]) } }} className={`flex items-center gap-1 sm:gap-2 rounded-2xl px-2 ${open ? '' : 'bg-grape-light'}`}>
              <span className="w-7 text-sm font-bold text-gray-400">{r + 1}.</span>
              {Array.from({ length: eq.b }, (_, c) => (
                <span key={c} className={`text-3xl sm:text-4xl leading-tight ${open ? '' : 'opacity-40'}`}>{open ? emoji : '❔'}</span>
              ))}
            </button>
          )
        })}
      </div>
      <div className="text-lg font-bold text-gray-500">{eq.a} ta qator, har birida {eq.b} tadan</div>
      <Prompt>
        {eq.a} <Op>×</Op> {eq.b} <Op>=</Op>
        <AnswerBox value={a.value} state={a.state} correct={eq.result} />
        <Speaker onClick={() => sayEquation(eq.a, '×', eq.b)} />
      </Prompt>
      <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
    </div>
  )
}
