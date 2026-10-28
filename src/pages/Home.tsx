import { useEffect } from 'react'
import { GAMES } from '../games'
import { useProfile } from '../lib/store'
import { CoinBadge, Mascot } from '../components/ui'
import { say } from '../audio/voice'
import { sfx } from '../audio/sfx'

let greeted = false

export default function Home() {
  const p = useProfile()!
  useEffect(() => { if (!greeted) { greeted = true; setTimeout(() => say(['choose_game']), 400) } }, [])
  const lessonsDone = Object.keys(p.lessons).length

  return (
    <div>
      <header className="flex items-center gap-2 sm:gap-3 mb-4">
        <a href="#/profiles" className="flex items-center gap-2 bg-white rounded-full pl-1 pr-4 py-1 shadow-popsm min-w-0">
          <span className="text-4xl">{p.avatar}</span>
          <span className="font-extrabold text-xl text-grape-dark truncate">{p.name}</span>
        </a>
        <div className="flex-1" />
        <span className="bg-white rounded-full px-3 py-1.5 shadow-popsm font-bold text-lg" title="Ketma-ket kunlar">🔥 {p.streak}</span>
        <CoinBadge />
      </header>

      <div className="flex items-center gap-3 mb-5">
        <Mascot size="text-7xl" className="animate-wiggle" />
        <div className="bg-white rounded-3xl rounded-bl-none px-4 py-3 shadow-popsm text-lg sm:text-xl font-bold text-grape-dark">
          Salom, {p.name}! Bugun nima o‘ynaymiz?
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {GAMES.map((g) => {
          const stars = (p.progress[g.id] ?? []).reduce((a, b) => a + b, 0)
          return (
            <a key={g.id} href={g.id === 'daily' ? '#/play/daily/' + dailyLevel(p.progress) : `#/game/${g.id}`} onClick={() => sfx.tap()}
              className={`relative rounded-3xl p-3 sm:p-4 bg-gradient-to-br ${g.color} shadow-pop active:translate-y-1 active:shadow-none flex flex-col items-center text-center min-h-[150px] justify-center ${g.id === 'daily' ? 'col-span-2 sm:col-span-1' : ''}`}>
              <span className="text-6xl drop-shadow">{g.emoji}</span>
              <span className="mt-1 text-lg sm:text-xl font-extrabold text-white drop-shadow leading-tight">{g.title}</span>
              {g.id !== 'daily' && <span className="mt-1 text-sm font-bold bg-white/80 rounded-full px-2">⭐ {stars}/15</span>}
            </a>
          )
        })}
        <a href="#/abacus" onClick={() => sfx.tap()} className="col-span-2 rounded-3xl p-4 bg-gradient-to-br from-purple-500 to-indigo-600 shadow-pop active:translate-y-1 active:shadow-none flex items-center gap-4 min-h-[150px]">
          <span className="text-7xl">🧮</span>
          <span className="text-left">
            <span className="block text-2xl font-extrabold text-white">Mental arifmetika</span>
            <span className="block text-white/90 font-bold">Abakus maktabi · {lessonsDone}/32 dars</span>
          </span>
        </a>
      </div>

      <nav className="grid grid-cols-2 gap-3 mt-5">
        <a href="#/stickers" className="bg-white rounded-3xl shadow-popsm p-3 text-center font-extrabold text-lg text-grape-dark">📒 Stikerlar ({p.stickers.length})</a>
        <a href="#/shop" className="bg-white rounded-3xl shadow-popsm p-3 text-center font-extrabold text-lg text-grape-dark">🛍️ Do‘kon</a>
      </nav>
      <div className="text-center mt-6">
        <a href="#/parent" className="text-gray-500 font-bold underline">👪 Ota-onalar uchun</a>
      </div>
    </div>
  )
}

/** Kunlik sarguzasht darajasi: bola o'tgan darajalarning o'rtachasi. */
function dailyLevel(progress: Record<string, number[]>) {
  const reached = Object.entries(progress).filter(([k]) => k !== 'daily').map(([, a]) => a.filter((s) => s > 0).length)
  if (!reached.length) return 1
  return Math.max(1, Math.min(5, Math.round(reached.reduce((a, b) => a + b, 0) / reached.length)))
}
