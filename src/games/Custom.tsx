import { useEffect, useMemo } from 'react'
import { say } from '../audio/voice'
import { NumberPad } from '../components/NumberPad'
import { Speaker } from '../components/ui'
import { useStore } from '../lib/store'
import { fitPx } from '../lib/levels'
import { AnswerBox, Op, Prompt } from './kit'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

/** Ota-ona admin panelida yozgan savollari. */
export default function Custom({ api }: { api: GameApi }) {
  const problems = useStore((s) => s.admin.problems)
  const pr = useMemo(() => problems.length ? problems[Math.floor(Math.random() * problems.length)] : { id: '-', q: '2 + 2', a: 4 }, [problems])
  const a = useAnswer(api, pr.a, 'c:' + pr.q)
  useEffect(() => { say(['ins_custom']) }, [])
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-6xl">📝</div>
      <Prompt>
        <span style={{ fontSize: fitPx(pr.q, 56, 6) }} className="text-center">{pr.q}</span> <Op>=</Op> <AnswerBox value={a.value} state={a.state} correct={pr.a} />
        <Speaker onClick={() => say([pr.q.replace('-', ' minus ').replace('×', ' koʻpaytirish ').replace(':', ' boʻlish ')])} />
      </Prompt>
      <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
    </div>
  )
}
