import { useEffect, useMemo } from 'react'
import { genEquation, eqKey } from '../lib/levels'
import { say } from '../audio/voice'
import { NumberPad } from '../components/NumberPad'
import { Speaker } from '../components/ui'
import { pick } from '../lib/random'
import { AnswerBox, Op, Prompt } from './kit'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

/** 5-o'yin: sirli katak — tenglamadagi yetishmayotgan son. */
export default function Mystery({ api }: { api: GameApi }) {
  const { eq, hole } = useMemo(() => {
    const eq = genEquation(Math.max(2, api.level), { cap: api.cap, weak: api.weak, maxResult: api.level <= 3 ? 10 : 20 })
    const hole = pick(api.level <= 2 ? (['b', 'r'] as const) : (['a', 'b', 'r'] as const))
    return { eq, hole }
  }, [api.level, api.cap, api.weak])
  const correct = hole === 'a' ? eq.a : hole === 'b' ? eq.b : eq.result
  const a = useAnswer(api, correct, eqKey(eq))
  const speak = () => say(['ins_mystery'])
  useEffect(() => { speak() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const slot = (which: 'a' | 'b' | 'r', n: number) => (hole === which ? <AnswerBox value={a.value} state={a.state} correct={correct} placeholder="□" /> : <span>{n}</span>)
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-6xl">🎁</div>
      <Prompt>
        {slot('a', eq.a)} <Op>{eq.op === '+' ? '+' : '−'}</Op> {slot('b', eq.b)} <Op>=</Op> {slot('r', eq.result)}
        <Speaker onClick={speak} />
      </Prompt>
      {api.help && (
        <div className="text-3xl tracking-wider bg-white/70 rounded-2xl px-4 py-2">
          {'🔵'.repeat(eq.a)}{eq.op === '+' ? ' + ' + '🟢'.repeat(eq.b) : ''}
        </div>
      )}
      <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
    </div>
  )
}
