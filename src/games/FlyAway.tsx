import { useEffect, useMemo, useState } from 'react'
import { genEquation, eqKey } from '../lib/levels'
import { sayEquation, sayNumber } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { NumberPad } from '../components/NumberPad'
import { Speaker } from '../components/ui'
import { AnswerBox, Op, PictureGroup, Prompt, randomEmoji } from './kit'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

const FLYERS = ['🦋', '🐦', '🐝', '🎈', '🐞', '🕊️', '🪁', '🐤']

/** 3-o'yin: ayirish — ortiqchasini bosib "uchirib yuborish". */
export default function FlyAway({ api }: { api: GameApi }) {
  const eq = useMemo(() => genEquation(Math.max(2, api.level), { ops: ['-'], cap: api.cap, weak: api.weak, maxResult: api.level <= 3 ? 10 : 20 }), [api.level, api.cap, api.weak])
  const emoji = useMemo(() => randomEmoji(FLYERS), [])
  const [crossed, setCrossed] = useState(api.help ? eq.b : 0)
  const a = useAnswer(api, eq.result, eqKey(eq))
  useEffect(() => { sayEquation(eq.a, '-', eq.b) }, [eq])

  const cross = () => {
    if (crossed >= eq.b) return
    sfx.whoosh()
    setCrossed(crossed + 1)
    sayNumber(crossed + 1)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white/70 rounded-3xl p-3 w-full flex justify-center">
        <PictureGroup emoji={emoji} count={eq.a} crossed={crossed} onCross={cross} />
      </div>
      <Prompt>
        {eq.a} <Op>−</Op> {eq.b} <Op>=</Op>
        <AnswerBox value={a.value} state={a.state} correct={eq.result} />
        <Speaker onClick={() => sayEquation(eq.a, '-', eq.b)} />
      </Prompt>
      <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
    </div>
  )
}
