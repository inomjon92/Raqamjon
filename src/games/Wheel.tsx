import { useEffect, useMemo, useState } from 'react'
import { genEquation, eqKey, isValidForLevel, mk, maxForLevel, opSymbol } from '../lib/levels'
import { say, sayEquation } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { NumberPad } from '../components/NumberPad'
import { Btn, Speaker } from '../components/ui'
import { rnd, shuffle } from '../lib/random'
import { AnswerBox, Op, Prompt } from './kit'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

const COLORS = ['#7c5cff', '#38bdf8', '#22c55e', '#ffb020', '#ff8a4c', '#f472b6', '#14b8a6', '#a3e635']

/** 7-o'yin: sehrli g'ildirak — markazdagi amalni tushgan songa qo'llash. */
export default function Wheel({ api }: { api: GameApi }) {
  const { eq, nums, target } = useMemo(() => {
    const eq = genEquation(api.level, { ops: api.ops, cap: api.cap, weak: api.weak })
    const others = new Set<number>()
    for (let i = 0; i < 300 && others.size < 7; i++) {
      const n = rnd(0, maxForLevel(api.level, api.cap))
      if (n !== eq.a && isValidForLevel(mk(n, eq.op, eq.b), api.level, api.cap)) others.add(n)
    }
    while (others.size < 7) others.add(eq.a + others.size + 1)
    const nums = shuffle([eq.a, ...others])
    return { eq, nums, target: nums.indexOf(eq.a) }
  }, [api.level, api.cap, api.ops, api.weak])
  const [rot, setRot] = useState(0)
  const [spun, setSpun] = useState(false)
  const a = useAnswer(api, eq.result, eqKey(eq))
  useEffect(() => { say(['spin']) }, [])

  const spin = () => {
    if (spun) return
    sfx.whoosh()
    setRot(360 * 5 - target * 45)
    setTimeout(() => { setSpun(true); sfx.pop(); sayEquation(eq.a, eq.op, eq.b) }, 2300)
  }
  const sign = opSymbol(eq.op)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10 text-4xl drop-shadow">🔻</div>
        <svg viewBox="-100 -100 200 200" className="w-full h-full drop-shadow-lg" style={{ transform: `rotate(${rot}deg)`, transition: 'transform 2.2s cubic-bezier(.17,.67,.21,1)' }}>
          {nums.map((n, i) => {
            const a0 = ((i * 45 - 22.5 - 90) * Math.PI) / 180
            const a1 = ((i * 45 + 22.5 - 90) * Math.PI) / 180
            const am = ((i * 45 - 90) * Math.PI) / 180
            return (
              <g key={i}>
                <path d={`M0 0 L${95 * Math.cos(a0)} ${95 * Math.sin(a0)} A95 95 0 0 1 ${95 * Math.cos(a1)} ${95 * Math.sin(a1)} Z`} fill={COLORS[i]} stroke="#fff" strokeWidth="3" />
                <text x={66 * Math.cos(am)} y={66 * Math.sin(am)} transform={`rotate(${i * 45} ${66 * Math.cos(am)} ${66 * Math.sin(am)})`} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(26, 64 / String(n).length)} fontWeight="800" fill="#fff">{n}</text>
              </g>
            )
          })}
        </svg>
        <button onClick={spin} className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-white shadow-pop text-3xl font-black text-grape-dark border-4 border-grape-light">
          {sign}{eq.b}
        </button>
      </div>
      {!spun ? (
        <Btn size="lg" color="bg-sun text-white" onClick={spin}>🎡 Aylantir!</Btn>
      ) : (
        <>
          <Prompt>
            {eq.a} <Op>{sign}</Op> {eq.b} <Op>=</Op>
            <AnswerBox value={a.value} state={a.state} correct={eq.result} />
            <Speaker onClick={() => sayEquation(eq.a, eq.op, eq.b)} />
          </Prompt>
          <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
        </>
      )}
    </div>
  )
}
