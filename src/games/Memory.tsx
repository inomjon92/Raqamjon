import { useEffect, useMemo, useRef, useState } from 'react'
import { genEquation, opSymbol , fitPx } from '../lib/levels'
import { say } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { Speaker } from '../components/ui'
import { shuffle } from '../lib/random'
import type { GameApi } from './types'

interface CardT { id: number; pair: number; text: string; kind: 'eq' | 'ans' }

/** 13-o'yin: xotira — misol va javob juftini topish. */
export default function Memory({ api }: { api: GameApi }) {
  const cards = useMemo(() => {
    const pairs = api.level <= 2 ? 3 : api.level <= 4 ? 4 : 6
    const used = new Set<number>()
    const list: CardT[] = []
    for (let i = 0, guard = 0; list.length < pairs * 2 && guard < 500; guard++) {
      const e = genEquation(api.level, { ops: api.ops, cap: api.cap })
      if (used.has(e.result)) continue
      used.add(e.result)
      list.push({ id: i * 2, pair: i, text: `${e.a} ${opSymbol(e.op)} ${e.b}`, kind: 'eq' }, { id: i * 2 + 1, pair: i, text: String(e.result), kind: 'ans' })
      i++
    }
    return shuffle(list)
  }, [api.level, api.cap, api.ops])
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const misses = useRef(0)
  const pairs = cards.length / 2
  useEffect(() => { say(['ins_memory']) }, [])

  const flip = (c: CardT) => {
    if (open.length === 2 || open.includes(c.id) || matched.includes(c.pair)) return
    sfx.tap()
    const next = [...open, c.id]
    setOpen(next)
    if (next.length === 2) {
      const [x, y] = next.map((id) => cards.find((k) => k.id === id)!)
      if (x.pair === y.pair) {
        api.feedback(true)
        const m = [...matched, x.pair]
        setTimeout(() => { setMatched(m); setOpen([]) }, 500)
        if (m.length === pairs) setTimeout(() => api.done(misses.current <= pairs), 1500)
      } else {
        misses.current++
        setTimeout(() => setOpen([]), 1000)
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Speaker clip={['ins_memory']} />
      <div className={`grid gap-3 ${cards.length > 8 ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4'} w-full max-w-xl`}>
        {cards.map((c) => {
          const shown = open.includes(c.id) || matched.includes(c.pair)
          return (
            <button key={c.id} onClick={() => flip(c)}
              style={{ fontSize: shown ? fitPx(c.text, 32, 5) : 32 }} className={`aspect-[4/3] rounded-3xl font-extrabold shadow-pop transition-all duration-300 ${matched.includes(c.pair) ? 'bg-mint-light text-mint scale-95' : shown ? (c.kind === 'eq' ? 'bg-white text-grape-dark' : 'bg-sun-light text-coral') : 'bg-grape text-white'}`}>
              {shown ? c.text : '❔'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
