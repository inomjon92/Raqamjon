import { useEffect, useState } from 'react'
import type { Subject } from '../games/types'
import { gamesFor, requiredGames } from '../games'
import { progressOf, roundOf, stickerSet, useProfile, useStore, type Profile } from '../lib/store'
import { gradeInfo } from '../lib/levels'
import { Avatar, Btn, CoinBadge, Mascot } from '../components/ui'
import { say } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { burst } from '../lib/celebrate'

let greeted = false

/** Joriy sinf va bosqichning bajarilganlik ulushi. */
export function gradeProgress(p: Profile) {
  const req = requiredGames(p.settings.ops, p.grade)
  const total = req.length * 5
  const done = req.reduce((a, g) => a + progressOf(p, g.id).filter((s) => s > 0).length, 0)
  return { done, total, complete: total > 0 && done >= total }
}

export default function Home() {
  const p = useProfile()!
  const newRound = useStore((s) => s.newRound)
  const [celebrated, setCelebrated] = useState(false)
  const [subject, setSubjectState] = useState<Subject>(() => { try { return (localStorage.getItem('raqamjon-subject') as Subject) || 'math' } catch { return 'math' } })
  const setSubject = (s: Subject) => { setSubjectState(s); sfx.tap(); if (s === 'alifbo') say(['ins_alifbo']); try { localStorage.setItem('raqamjon-subject', s) } catch { /* yo'q */ } }
  const gp = gradeProgress(p)
  const g = gradeInfo(p.grade)
  const round = roundOf(p)
  useEffect(() => { if (!greeted) { greeted = true; setTimeout(() => say([gp.complete ? 'grade_done' : 'choose_game']), 400) } }, [gp.complete])
  useEffect(() => { if (gp.complete && !celebrated) { setCelebrated(true); setTimeout(() => { sfx.win(); burst(false) }, 300) } }, [gp.complete, celebrated])
  const lessonsDone = Object.keys(p.lessons).length
  const finishRound = (next: boolean) => {
    const e = newRound(next)
    if (e) { sfx.win(); burst(false); say(['trophy', 'new_round']) }
  }

  return (
    <div>
      <header className="flex items-center gap-2 sm:gap-3 mb-4">
        <a href="#/profiles" className="flex items-center gap-2 bg-white rounded-full pl-1 pr-4 py-1 shadow-popsm min-w-0">
          <Avatar p={p} size="w-12 h-12 text-4xl" />
          <span className="min-w-0">
            <span className="block font-extrabold text-xl text-grape-dark truncate leading-tight">{p.name}</span>
            <span className="block text-xs font-bold text-gray-500 leading-tight">{g.grade}-sinf · {round}-bosqich</span>
          </span>
        </a>
        <div className="flex-1" />
        <span className="bg-white rounded-full px-3 py-1.5 shadow-popsm font-bold text-lg" title="Ketma-ket kunlar">🔥 {p.streak}</span>
        <CoinBadge />
      </header>

      {gp.complete ? (
        <div className="rounded-3xl p-5 mb-5 bg-gradient-to-br from-amber-300 to-orange-400 shadow-pop text-center text-white">
          <div className="text-6xl mb-1">🏆</div>
          <div className="text-2xl font-extrabold drop-shadow">Tabriklayman! {g.grade}-sinfning barcha bo‘limlari yechildi!</div>
          <p className="font-bold mt-1 drop-shadow">Yulduz va stikerlaring kubok bilan arxivga o‘tadi, keyin yangi savollar va yangi stikerlar ({stickerSet(round + 1).name}) boshlanadi.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <Btn color="bg-white text-grape-dark" onClick={() => finishRound(false)}>🔁 Yangi savollar bilan davom etish</Btn>
            {p.grade < 4 && <Btn color="bg-grape text-white" onClick={() => finishRound(true)}>🎓 {p.grade + 1}-sinfga o‘tish</Btn>}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-5">
          <Mascot size="text-7xl" className="animate-wiggle" />
          <div className="flex-1 bg-white rounded-3xl rounded-bl-none px-4 py-3 shadow-popsm">
            <div className="text-lg sm:text-xl font-bold text-grape-dark">Salom, {p.name}! Bugun nima o‘ynaymiz?</div>
            <div className="mt-2 h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-mint rounded-full" style={{ width: `${(gp.done / gp.total) * 100}%` }} /></div>
            <div className="text-xs font-bold text-gray-500 mt-1">{g.grade}-sinf: {gp.done}/{gp.total} daraja o‘tildi</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4 bg-white/60 rounded-full p-1.5 shadow-popsm" role="tablist">
        {([['math', '🔢 Matematika'], ['alifbo', '🔤 Alifbo']] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={subject === k} onClick={() => setSubject(k)}
            className={`rounded-full py-2.5 text-lg sm:text-xl font-extrabold transition ${subject === k ? 'bg-grape text-white shadow-popsm' : 'text-grape-dark'}`}>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {subject === 'alifbo' && (
          <a href="#/letters" onClick={() => sfx.tap()} className="col-span-2 sm:col-span-1 rounded-3xl p-3 sm:p-4 bg-gradient-to-br from-yellow-300 to-amber-500 shadow-pop active:translate-y-1 active:shadow-none flex flex-col items-center text-center min-h-[150px] justify-center">
            <span className="text-5xl font-black text-white drop-shadow tracking-widest">Aa Bb</span>
            <span className="mt-1 text-lg sm:text-xl font-extrabold text-white drop-shadow leading-tight">Harflar jadvali</span>
            <span className="mt-1 text-sm font-bold bg-white/80 rounded-full px-2">29 harf · tingla</span>
          </a>
        )}
        {gamesFor(p.settings.ops, p.grade, subject).map((gm) => {
          const stars = progressOf(p, gm.id).reduce((a, b) => a + b, 0)
          return (
            <a key={gm.id} href={gm.id === 'daily' ? '#/play/daily/' + dailyLevel(p) : `#/game/${gm.id}`} onClick={() => sfx.tap()}
              className={`relative rounded-3xl p-3 sm:p-4 bg-gradient-to-br ${gm.color} shadow-pop active:translate-y-1 active:shadow-none flex flex-col items-center text-center min-h-[150px] justify-center ${gm.id === 'daily' ? 'col-span-2 sm:col-span-1' : ''}`}>
              <span className="text-6xl drop-shadow">{gm.emoji}</span>
              <span className="mt-1 text-lg sm:text-xl font-extrabold text-white drop-shadow leading-tight">{gm.title}</span>
              {gm.id !== 'daily' && <span className="mt-1 text-sm font-bold bg-white/80 rounded-full px-2">⭐ {stars}/15</span>}
            </a>
          )
        })}
        {subject === 'math' && <a href="#/abacus" onClick={() => sfx.tap()} className="col-span-2 rounded-3xl p-4 bg-gradient-to-br from-purple-500 to-indigo-600 shadow-pop active:translate-y-1 active:shadow-none flex items-center gap-4 min-h-[150px]">
          <span className="text-7xl">🧮</span>
          <span className="text-left">
            <span className="block text-2xl font-extrabold text-white">Mental arifmetika</span>
            <span className="block text-white/90 font-bold">Abakus maktabi · {lessonsDone}/32 dars</span>
          </span>
        </a>}
      </div>

      <nav className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
        <a href="#/stickers" className="bg-white rounded-3xl shadow-popsm p-3 text-center font-extrabold sm:text-lg text-grape-dark">📒 Stikerlar<br className="sm:hidden" /> ({p.stickers.length})</a>
        <a href="#/archive" className="bg-white rounded-3xl shadow-popsm p-3 text-center font-extrabold sm:text-lg text-grape-dark">🏆 Sovrinlar<br className="sm:hidden" /> ({p.archive.length})</a>
        <a href="#/shop" className="bg-white rounded-3xl shadow-popsm p-3 text-center font-extrabold sm:text-lg text-grape-dark">🛍️ Do‘kon</a>
      </nav>
      <div className="text-center mt-6">
        <a href="#/parent" className="text-gray-500 font-bold underline">👪 Ota-onalar uchun</a>
      </div>
    </div>
  )
}

/** Kunlik sarguzasht darajasi: bola o'tgan darajalarning o'rtachasi. */
function dailyLevel(p: Profile) {
  const reached = requiredGames(p.settings.ops, p.grade, 'math').map((g) => progressOf(p, g.id).filter((s) => s > 0).length).filter((n) => n > 0)
  if (!reached.length) return 1
  return Math.max(1, Math.min(5, Math.round(reached.reduce((a, b) => a + b, 0) / reached.length)))
}
