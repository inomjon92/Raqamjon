import { useEffect, useMemo, useState } from 'react'
import { genEquation, mk, isValidForLevel, maxForLevel, eqKey } from '../lib/levels'
import { say } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { Speaker } from '../components/ui'
import { rnd, pick, shuffle } from '../lib/random'
import { PictureGroup, CUTE, randomEmoji } from './kit'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

type Side = { value: number; label: string }
const SIGNS = ['>', '=', '<'] as const
const signOf = (l: number, r: number) => (l > r ? 0 : l === r ? 1 : 2)

function side(level: number, cap: number, kind: 'num' | 'expr'): Side {
  if (kind === 'num') { const v = rnd(0, maxForLevel(Math.max(2, level), cap)); return { value: v, label: String(v) } }
  for (;;) {
    const e = genEquation(Math.min(level, 5), { cap })
    if (isValidForLevel(mk(e.a, e.op, e.b), level, cap)) return { value: e.result, label: `${e.a} ${e.op === '+' ? '+' : '−'} ${e.b}` }
  }
}

function Croc({ sign }: { sign: number | null }) {
  // Timsoh og'zi kattaroq tomonga ochiladi
  const flip = sign === 2
  return (
    <span className="inline-block text-6xl sm:text-7xl transition-transform" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      {sign === 1 ? '🟰' : '🐊'}
    </span>
  )
}

/** 15-o'yin: ochko'z timsoh — katta, kichik, teng. 5-darajada uchta sonni tartiblash. */
export default function Compare({ api }: { api: GameApi }) {
  if (api.level >= 5) return <Order api={api} />
  return <Pair api={api} />
}

function Pair({ api }: { api: GameApi }) {
  const { l, r, pictures, emoji } = useMemo(() => {
    const lvl = api.level
    let l: Side, r: Side
    if (lvl <= 2) { l = side(2, 10, 'num'); r = Math.random() < 0.2 ? { ...l } : side(2, 10, 'num') }
    else if (lvl === 3) { l = side(lvl, api.cap, 'num'); r = side(lvl, api.cap, 'expr'); if (Math.random() < 0.5) [l, r] = [r, l] }
    else { l = side(lvl, api.cap, 'expr'); r = side(lvl, api.cap, 'expr') }
    return { l, r, pictures: lvl === 1, emoji: randomEmoji(CUTE) }
  }, [api.level, api.cap])
  const correct = signOf(l.value, r.value)
  const a = useAnswer(api, correct, `${l.label}?${r.label}`.replace(/ /g, ''))
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => { say([pictures ? 'which_more' : 'ins_compare']) }, [pictures])
  void eqKey

  const choose = (i: number) => { if (a.locked) return; setPicked(i); a.submit(i); if (i !== correct) setTimeout(() => setPicked(null), 600) }
  const shown = a.state === 'ok' || a.state === 'reveal' ? correct : picked

  return (
    <div className="flex flex-col items-center gap-5">
      <Speaker clip={[pictures ? 'which_more' : 'ins_compare']} />
      <div className="flex items-center justify-center gap-2 sm:gap-6 w-full">
        <div className="flex-1 flex justify-center bg-white/70 rounded-3xl p-3 min-h-[120px] items-center">
          {pictures ? <PictureGroup emoji={emoji} count={l.value} size="text-3xl sm:text-4xl" /> : <span className="text-4xl sm:text-6xl font-extrabold text-grape-dark whitespace-nowrap">{l.label}</span>}
        </div>
        <div className="w-20 sm:w-28 h-20 sm:h-28 grid place-items-center rounded-full bg-white border-4 border-grape-light text-6xl font-black text-coral">
          {shown === null ? '?' : SIGNS[shown]}
        </div>
        <div className="flex-1 flex justify-center bg-white/70 rounded-3xl p-3 min-h-[120px] items-center">
          {pictures ? <PictureGroup emoji={emoji} count={r.value} size="text-3xl sm:text-4xl" /> : <span className="text-4xl sm:text-6xl font-extrabold text-grape-dark whitespace-nowrap">{r.label}</span>}
        </div>
      </div>
      <Croc sign={shown} />
      <div className="flex gap-4">
        {SIGNS.map((s, i) => (
          <button key={s} disabled={a.locked} onClick={() => { sfx.tap(); choose(i) }}
            className="w-24 h-24 rounded-3xl bg-white text-6xl font-black text-grape-dark shadow-pop border-4 border-grape-light active:translate-y-1 active:shadow-none">
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function Order({ api }: { api: GameApi }) {
  const nums = useMemo(() => {
    const s = new Set<number>()
    while (s.size < 3) s.add(rnd(0, api.cap))
    return shuffle([...s])
  }, [api.cap])
  const sorted = [...nums].sort((x, y) => x - y)
  const [taken, setTaken] = useState<number[]>([])
  const [mistakes, setMistakes] = useState(0)
  useEffect(() => { say(['order_small_big']) }, [])
  void pick

  const tap = (n: number) => {
    if (taken.includes(n) || taken.length === 3) return
    if (n === sorted[taken.length]) {
      sfx.tap()
      const t = [...taken, n]
      setTaken(t)
      if (t.length === 3) { api.feedback(true); setTimeout(() => api.done(mistakes === 0), 1300) }
    } else {
      api.feedback(false)
      setMistakes((m) => m + 1)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Speaker clip={['order_small_big']} />
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-4 border-dashed border-grape grid place-items-center text-5xl font-extrabold text-mint bg-white/70">
            {taken[i] ?? ''}
          </div>
        ))}
      </div>
      <div className="text-3xl text-grape-dark font-bold">kichik ➜ katta</div>
      <div className="flex gap-4">
        {nums.map((n) => (
          <button key={n} disabled={taken.includes(n)} onClick={() => tap(n)} className="w-24 h-24 rounded-full bg-sun text-white text-5xl font-extrabold shadow-pop disabled:opacity-20 active:translate-y-1 active:shadow-none">
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
