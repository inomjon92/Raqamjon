import { useEffect, useMemo } from 'react'
import { genEquation, eqKey } from '../lib/levels'
import { sayEquation } from '../audio/voice'
import { NumberPad } from '../components/NumberPad'
import { Speaker } from '../components/ui'
import { AnswerBox, FRUITS, Op, PictureGroup, Prompt, randomEmoji, useCounter } from './kit'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

/** 1-o'yin: ikki guruh mevani sanab, qo'shish. */
export default function Fruits({ api }: { api: GameApi }) {
  const eq = useMemo(() => genEquation(api.level, { ops: ['+'], cap: api.cap, weak: api.weak, maxResult: api.level <= 3 ? 10 : 20 }), [api.level, api.cap, api.weak])
  const emoji = useMemo(() => randomEmoji(FRUITS), [])
  const a = useAnswer(api, eq.result, eqKey(eq))
  const left = useCounter(0)
  const right = useCounter(eq.a)
  useEffect(() => { sayEquation(eq.a, '+', eq.b) }, [eq])
  const showNums = api.level <= 2 || api.help

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-3 bg-white/70 rounded-3xl p-3 w-full">
        <PictureGroup emoji={emoji} count={eq.a} counted={left.counted} onCount={left.count} numbers={api.help} />
        <span className="text-5xl font-black text-coral">+</span>
        <PictureGroup emoji={emoji} count={eq.b} counted={right.counted} onCount={(i) => { right.count(i) }} numbers={api.help} />
      </div>
      <Prompt>
        {showNums ? eq.a : '?'} <Op>+</Op> {showNums ? eq.b : '?'} <Op>=</Op>
        <AnswerBox value={a.value} state={a.state} correct={eq.result} />
        <Speaker onClick={() => sayEquation(eq.a, '+', eq.b)} />
      </Prompt>
      <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
    </div>
  )
}
