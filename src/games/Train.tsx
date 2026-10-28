import { Fragment, useEffect, useMemo, useState } from 'react'
import { say } from '../audio/voice'
import { NumberPad } from '../components/NumberPad'
import { Speaker } from '../components/ui'
import { maxForLevel , fitPx } from '../lib/levels'
import { rnd, pick } from '../lib/random'
import { boxColor, useCells } from './kit'
import type { GameApi } from './types'

export function makeChain(level: number, cap: number, allowed: ('+' | '-')[] = ['+', '-']) {
  const max = maxForLevel(Math.max(2, level), cap)
  const len = level === 1 ? 2 : level === 2 ? 3 : 4
  const step = Math.max(level <= 2 ? 3 : level <= 4 ? 5 : 9, cap > 20 && level >= 3 ? Math.floor(max / 5) : 0)
  for (;;) {
    const start = allowed.length === 1 && allowed[0] === '-' ? rnd(Math.min(max, len * step), max) : rnd(level >= 4 ? 5 : 1, max - 1)
    const ops: number[] = []
    let v = start
    let ok = true
    for (let i = 0; i < len; i++) {
      const d = rnd(1, step) * (allowed.length === 1 ? (allowed[0] === '+' ? 1 : -1) : level === 1 ? 1 : pick([1, -1]))
      if (v + d < 0 || v + d > max) { ok = false; break }
      ops.push(d)
      v += d
    }
    if (ok) {
      const values = ops.reduce<number[]>((acc, d) => [...acc, acc[acc.length - 1] + d], [start])
      return { start, ops, values: values.slice(1) }
    }
  }
}

const trainOps = (ops: string[]) => { const o = ops.filter((x): x is '+' | '-' => x === '+' || x === '-'); return o.length ? o : (['+', '-'] as ('+' | '-')[]) }

/** 8-o'yin: sonlar poyezdi — ketma-ket amallar zanjiri. */
export default function Train({ api }: { api: GameApi }) {
  const chain = useMemo(() => makeChain(api.level, api.cap, trainOps(api.ops)), [api.level, api.cap, api.ops])
  const c = useCells(api, chain.values)
  const [go, setGo] = useState(false)
  useEffect(() => { say(['ins_train']) }, [])
  useEffect(() => { if (c.allDone) { setGo(true); setTimeout(() => say(['train_go']), 300) } }, [c.allDone])

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center gap-2"><Speaker clip={['ins_train']} /></div>
      <div className="w-full overflow-x-auto pb-2">
        <div className={`flex items-end justify-center min-w-max mx-auto gap-0 transition-transform duration-[1500ms] ${go ? 'translate-x-[60vw]' : ''}`}>
          {[chain.start, ...chain.values].map((_, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <div className="flex flex-col items-center px-1 -mb-1">
                  <span className={`text-lg sm:text-2xl font-black ${chain.ops[i - 1] > 0 ? 'text-mint' : 'text-coral'}`}>{chain.ops[i - 1] > 0 ? '+' : '−'}{Math.abs(chain.ops[i - 1])}</span>
                  <span className="text-gray-400 text-xl">━</span>
                </div>
              )}
              <div className="flex flex-col items-center">
                {i === 0 ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-coral text-white grid place-items-center font-extrabold relative" style={{ fontSize: fitPx(chain.start, 32) }}>
                    <span className="absolute -top-9 text-4xl">🚂</span>{chain.start}
                  </div>
                ) : (
                  <button onClick={() => c.select(i - 1)} className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 grid place-items-center font-extrabold ${boxColor(c.states[i - 1], c.active === i - 1)} ${c.active === i - 1 && c.values[i - 1] === null ? 'ring-4 ring-sun' : ''}`} style={{ fontSize: fitPx(chain.values[i - 1], 32) }}>
                    {c.values[i - 1] ?? (c.active === i - 1 ? c.input : '')}
                  </button>
                )}
                <div className="flex gap-3 -mt-1"><span className="w-4 h-4 rounded-full bg-gray-700" /><span className="w-4 h-4 rounded-full bg-gray-700" /></div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      <NumberPad value={c.input} onChange={c.setInput} onSubmit={c.submit} disabled={c.allDone} />
    </div>
  )
}
