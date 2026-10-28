import { gameById } from '../games'
import { useProfile, progressOf, progressKey } from '../lib/store'
import { LEVEL_ICONS, LEVEL_NAMES, maxForLevel } from '../lib/levels'
import { Stars, TopBar, Speaker } from '../components/ui'
import { sfx } from '../audio/sfx'
import { useEffect } from 'react'
import { say } from '../audio/voice'

const EXTRA = ['', '', ', qiyinroq', ', o‘nlikdan o‘tmasdan', ', o‘nlikdan o‘tib']

export default function GameLevels({ id }: { id: string }) {
  const def = gameById(id)
  const p = useProfile()!
  useEffect(() => { say(['choose_level']) }, [])
  if (!def) return null
  const stars = progressOf(p, id)

  return (
    <div>
      <TopBar title={<span>{def.emoji} {def.title}</span>} right={<Speaker clip={[def.ins]} />} />
      <div className="grid gap-3 max-w-xl mx-auto">
        {LEVEL_NAMES.map((name, i) => {
          const open = i === 0 || stars[i - 1] > 0 || stars[i] > 0
          return (
            <a key={i} href={open ? `#/play/${id}/${i + 1}` : undefined} onClick={() => (open ? sfx.tap() : sfx.wrong())} aria-disabled={!open}
              className={`flex items-center gap-4 rounded-3xl p-4 shadow-pop ${open ? `bg-gradient-to-r ${def.color} active:translate-y-1 active:shadow-none` : 'bg-gray-200 opacity-70'}`}>
              <span className="text-5xl">{open ? LEVEL_ICONS[i] : '🔒'}</span>
              <span className="flex-1">
                <span className="block text-2xl font-extrabold text-white drop-shadow">{i + 1}. {name}</span>
                <span className="block text-white/90 font-bold drop-shadow">{maxForLevel(i + 1, p.settings.cap)} gacha{EXTRA[i]}</span>
              </span>
              <Stars n={stars[i]} size="text-2xl sm:text-3xl" />
            </a>
          )
        })}
      </div>
      {p.diplomas.includes(progressKey(p, id)) && <div className="text-center mt-5"><a className="text-xl font-bold text-grape underline" href={`#/diploma/${id}`}>🏅 Diplom</a></div>}
    </div>
  )
}
