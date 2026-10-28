import { useEffect, useMemo, useState } from 'react'
import { say } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { Btn, Speaker } from '../components/ui'
import { maxForLevel } from '../lib/levels'
import { rnd, pick } from '../lib/random'
import { useAnswer } from './useAnswer'
import type { GameApi } from './types'

const GOODS = ['🍎', '🍌', '🧃', '🍪', '🍦', '🧸', '✏️', '📒', '🎈', '🍭', '🥛', '🍞', '⚽', '🖍️']

/** 12-o'yin: do'kon — narsalar narxini qo'shib, tangalar bilan to'lash. */
export default function Shop({ api }: { api: GameApi }) {
  const { items, total, coins } = useMemo(() => {
    const max = maxForLevel(api.level, api.cap)
    const count = api.level === 1 ? 1 : 2
    for (;;) {
      const prices = Array.from({ length: count }, () => rnd(1, api.level <= 2 ? 5 : 9))
      const total = prices.reduce((a, b) => a + b, 0)
      if (total > max) continue
      const g = [...GOODS].sort(() => Math.random() - 0.5)
      const coins = api.level <= 2 ? [1] : api.level === 3 ? [1, 2, 5] : [1, 2, 5, 10]
      return { items: prices.map((p, i) => ({ emoji: g[i], price: p })), total, coins }
    }
  }, [api.level, api.cap])
  const [tray, setTray] = useState<number[]>([])
  const paid = tray.reduce((a, b) => a + b, 0)
  const a = useAnswer(api, total, null)
  const host = useMemo(() => pick(['🧑‍🍳', '👩‍🌾', '🧕', '👨‍🔧']), [])
  useEffect(() => { say(['ins_shop']) }, [])

  const pay = () => {
    if (paid > total) say(['too_much'])
    a.submit(paid)
    if (paid !== total) setTray([])
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3"><span className="text-6xl">{host}</span><Speaker clip={['ins_shop']} /></div>
      <div className="flex gap-4 flex-wrap justify-center">
        {items.map((it, i) => (
          <div key={i} className="bg-white rounded-3xl shadow-pop px-5 py-3 flex flex-col items-center">
            <span className="text-6xl">{it.emoji}</span>
            <span className="text-2xl font-extrabold text-grape-dark">🪙 {it.price}</span>
          </div>
        ))}
      </div>
      <div className="w-full max-w-md min-h-[84px] bg-sun-light border-4 border-dashed border-sun rounded-3xl p-2 flex flex-wrap gap-1 items-center justify-center">
        {tray.length === 0 && <span className="text-sun font-bold">Tangalarni bu yerga qo‘y</span>}
        {tray.map((c, i) => (
          <button key={i} onClick={() => setTray(tray.filter((_, j) => j !== i))} className="w-12 h-12 rounded-full bg-sun text-white font-black text-xl shadow-popsm border-2 border-yellow-600">{c}</button>
        ))}
      </div>
      {api.level <= 2 && <div className="text-2xl font-bold text-grape-dark">To‘landi: {paid}</div>}
      <div className="flex gap-3">
        {coins.map((c) => (
          <button key={c} disabled={a.locked} onClick={() => { sfx.coin(); setTray([...tray, c]) }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sun text-white text-3xl font-black shadow-pop border-4 border-yellow-600 active:translate-y-1 active:shadow-none">
            {c}
          </button>
        ))}
      </div>
      <Btn size="lg" color="bg-mint text-white" disabled={a.locked || tray.length === 0} onClick={pay}>💳 To‘lash</Btn>
    </div>
  )
}
