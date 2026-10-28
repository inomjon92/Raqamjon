import { useEffect, useMemo } from 'react'
import { say } from '../audio/voice'
import { NumberPad } from '../components/NumberPad'
import { Speaker } from '../components/ui'
import { rnd, pick } from '../lib/random'
import { boxColor } from './kit'
import { useCells } from './kit'
import type { GameApi } from './types'

// Pozitsiyalar: 0,1,2 — pastki qator; 3,4 — o'rta; 5 — tepa
function makePuzzle(level: number, cap: number) {
  const maxTop = Math.min(cap, level <= 2 ? 10 : level === 3 ? 15 : 20)
  for (;;) {
    const hi = level <= 2 ? 3 : level === 3 ? 4 : 6
    const b = [rnd(1, hi), rnd(1, hi), rnd(1, hi)]
    const v = [b[0], b[1], b[2], b[0] + b[1], b[1] + b[2], b[0] + 2 * b[1] + b[2]]
    if (v[5] > maxTop) continue
    let empties: number[]
    if (level <= 2) empties = pick([[4, 5], [3, 5]])
    else if (level === 3) empties = [3, 4, 5]
    else empties = pick([[1, 4, 5], [1, 3, 5]])
    return { v, empties }
  }
}

/** 6-o'yin: asalari uyasi — har uyacha pastdagi ikkitasining yig'indisi. */
export default function Hexagon({ api }: { api: GameApi }) {
  const { v, empties } = useMemo(() => makePuzzle(api.level, api.cap), [api.level, api.cap])
  const c = useCells(api, empties.map((i) => v[i]))
  useEffect(() => { say(['ins_hexagon']) }, [])

  const cell = (pos: number) => {
    const ei = empties.indexOf(pos)
    const isEmpty = ei !== -1
    const isActive = isEmpty && c.active === ei && c.values[ei] === null
    const text = isEmpty ? c.values[ei] ?? (isActive ? c.input : '') : String(v[pos])
    const cls = isEmpty ? boxColor(c.states[ei], isActive) : 'bg-sun-light text-grape-dark'
    return (
      <button
        key={pos}
        onClick={() => isEmpty && c.select(ei)}
        className={`relative w-20 h-[88px] sm:w-24 sm:h-[104px] -mx-[1px] ${isActive ? 'scale-105 z-10' : ''} transition`}
        style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
      >
        <span className={`absolute inset-0 ${isActive ? 'bg-sun' : isEmpty ? 'bg-grape' : 'bg-sun'}`} />
        <span className={`absolute inset-[5px] grid place-items-center text-4xl font-extrabold ${cls}`} style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)', border: 'none' }}>
          {text}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2"><span className="text-5xl">🐝</span><Speaker clip={['ins_hexagon']} /></div>
      <div className="flex flex-col items-center -space-y-5 sm:-space-y-6">
        <div className="flex">{cell(5)}</div>
        <div className="flex">{cell(3)}{cell(4)}</div>
        <div className="flex">{cell(0)}{cell(1)}{cell(2)}</div>
      </div>
      {api.help && <div className="text-xl font-bold text-grape-dark bg-white/70 rounded-2xl px-3 py-1">💡 {v[0]} + {v[1]} = {v[3]}</div>}
      <NumberPad value={c.input} onChange={c.setInput} onSubmit={c.submit} disabled={c.allDone} />
    </div>
  )
}
