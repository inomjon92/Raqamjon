import { MODULES } from '../abacus/course'
import { useProfile, useStore } from '../lib/store'
import { Btn, Mascot, Stars, TopBar } from '../components/ui'
import { useEffect, useState } from 'react'
import { say } from '../audio/voice'
import { Abacus } from '../abacus/Abacus'
import { sfx } from '../audio/sfx'

export function lessonOpen(lessons: Record<string, { stars: number }>, idx: number, ids: string[]) {
  return idx === 0 || (lessons[ids[idx - 1]]?.stars ?? 0) > 0
}

export function medalOf(lessons: Record<string, { stars: number }>, mod: (typeof MODULES)[number]) {
  const s = mod.lessons.map((l) => lessons[l.id]?.stars ?? 0)
  if (s.some((x) => x === 0)) return null
  const avg = s.reduce((a, b) => a + b, 0) / s.length
  return avg >= 2.75 ? '🥇' : avg >= 2 ? '🥈' : '🥉'
}

export default function AbacusHome() {
  const p = useProfile()!
  const patch = useStore((s) => s.patch)
  const [mode, setMode] = useState<'self' | 'parent'>(() => (sessionStorage.getItem('abacus-mode') as 'self' | 'parent') ?? 'self')
  const [play, setPlay] = useState(0)
  useEffect(() => { say(['ins_abacus']) }, [])
  const ids = MODULES.flatMap((m) => m.lessons.map((l) => l.id))
  const setM = (m: 'self' | 'parent') => { setMode(m); try { sessionStorage.setItem('abacus-mode', m) } catch { /* ignore */ } }

  return (
    <div>
      <TopBar title="🧮 Mental arifmetika" />
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
        <Abacus rods={2} value={play} onChange={setPlay} />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start"><Mascot size="text-5xl" /><span className="text-xl font-bold text-grape-dark">Cho‘tlarni bosib ko‘r! Hozir: <span className="text-coral text-3xl">{play}</span></span></div>
          <div className="mt-3 bg-white rounded-2xl p-1 inline-flex shadow-popsm">
            <button onClick={() => { sfx.tap(); setM('self') }} className={`px-4 py-2 rounded-xl font-bold ${mode === 'self' ? 'bg-grape text-white' : ''}`}>🧒 O‘zim o‘rganaman</button>
            <button onClick={() => { sfx.tap(); setM('parent') }} className={`px-4 py-2 rounded-xl font-bold ${mode === 'parent' ? 'bg-grape text-white' : ''}`}>👪 Ota-ona bilan</button>
          </div>
          <div className="mt-3"><a href="#/lesson/free-flash" className="font-bold text-grape underline">⚡ Erkin flesh-anzan mashqi</a>{p.flashBest > 0 && <span className="text-gray-500 font-bold"> · rekord {p.flashBest} ms</span>}</div>
        </div>
      </div>

      <div className="grid gap-4">
        {MODULES.map((m) => {
          const medal = medalOf(p.lessons, m)
          return (
            <div key={m.id} className="bg-white rounded-3xl shadow-pop p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-extrabold text-grape-dark">{m.id}. {m.title}</div>
                  <div className="text-sm text-gray-500 font-bold">{m.goal}</div>
                </div>
                {medal && <a href={`#/diploma/abacus-${m.id}`} className="text-4xl" title="Medal">{medal}</a>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {m.lessons.map((l) => {
                  const idx = ids.indexOf(l.id)
                  const open = lessonOpen(p.lessons, idx, ids)
                  const st = p.lessons[l.id]
                  return (
                    <a key={l.id} href={open ? `#/lesson/${l.id}` : undefined} onClick={() => (open ? sfx.tap() : sfx.wrong())}
                      className={`rounded-2xl p-3 flex flex-col gap-1 ${open ? 'bg-grape-light active:translate-y-0.5' : 'bg-gray-100 opacity-60'}`}>
                      <span className="text-sm font-bold text-gray-500">{open ? `${m.id}.${l.id.split('-')[1]}-dars` : '🔒'} {st?.by === 'parent' ? '👪' : ''}</span>
                      <span className="font-extrabold text-grape-dark leading-tight">{l.title}</span>
                      <Stars n={st?.stars ?? 0} size="text-base" />
                    </a>
                  )
                })}
              </div>
              {mode === 'parent' && (
                <details className="mt-3 bg-sun-light rounded-2xl p-3">
                  <summary className="font-extrabold cursor-pointer">👪 Ota-ona uchun qo‘llanma</summary>
                  <div className="mt-2 grid gap-2 text-gray-700">
                    <p><b>Qanday tushuntirish:</b> {m.guide.explain}</p>
                    <p><b>Uyda o‘ynash:</b> {m.guide.home}</p>
                    <p><b>Tez-tez uchraydigan xato:</b> {m.guide.mistakes}</p>
                  </div>
                </details>
              )}
            </div>
          )
        })}
      </div>
      {Object.keys(p.lessons).length > 0 && (
        <div className="text-center mt-6"><Btn size="sm" color="bg-gray-100 text-gray-600" onClick={() => { if (confirm('Kurs natijalarini nolga tushirasizmi?')) patch((q) => { q.lessons = {} }) }}>Kursni qaytadan boshlash</Btn></div>
      )}
    </div>
  )
}
