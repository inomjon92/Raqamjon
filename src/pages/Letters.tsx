import { useEffect, useState } from 'react'
import { LETTERS, WORDS, letterKey } from '../alifbo/lib'
import { say } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { TopBar } from '../components/ui'

const emojiOf = (w: string) => WORDS.find((x) => x.w === w)?.e ?? '⭐'

/** Alifbo jadvali: harfni bossang, harf va so'zni aytadi. */
export default function Letters() {
  const [active, setActive] = useState<number | null>(null)
  useEffect(() => { say(['al_letters']) }, [])
  const tap = (i: number) => { sfx.tap(); setActive(i); say([letterKey(LETTERS[i].L)]) }
  return (
    <div>
      <TopBar title="🔤 Harflar jadvali" />
      {active !== null && (
        <div className="flex items-center justify-center gap-4 bg-white rounded-3xl shadow-pop p-4 mb-4 animate-bounceIn">
          <span className="text-7xl font-black text-grape-dark">{LETTERS[active].L}{LETTERS[active].L.length === 1 ? LETTERS[active].L.toLowerCase() : ''}</span>
          <span className="text-7xl">{emojiOf(LETTERS[active].w)}</span>
          <span className="text-3xl font-extrabold text-gray-600">{LETTERS[active].w}</span>
        </div>
      )}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
        {LETTERS.map((x, i) => (
          <button key={x.L} onClick={() => tap(i)}
            className={`rounded-2xl shadow-popsm active:translate-y-1 active:shadow-none p-2 flex flex-col items-center ${active === i ? 'bg-sun-light ring-4 ring-sun' : 'bg-white'}`}>
            <span className="text-3xl sm:text-4xl font-black text-grape-dark">{x.L}</span>
            <span className="text-2xl">{emojiOf(x.w)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
