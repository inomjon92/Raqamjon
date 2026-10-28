import { roundOf, stickerSet, useProfile } from '../lib/store'
import { TopBar } from '../components/ui'

export default function Stickers() {
  const p = useProfile()!
  const set = stickerSet(roundOf(p))
  const STICKERS = set.items
  return (
    <div>
      <TopBar title={`📒 ${set.name} · ${p.stickers.length}/${STICKERS.length}`} />
      <p className="text-gray-600 font-bold mb-4">Har bir darajani 3 yulduz bilan o‘tsang, yangi stiker olasan!</p>
      <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 sm:gap-3">
        {STICKERS.map((s) => {
          const has = p.stickers.includes(s)
          return (
            <div key={s} className={`aspect-square rounded-2xl grid place-items-center text-4xl sm:text-5xl ${has ? 'bg-white shadow-popsm animate-bounceIn' : 'bg-gray-200/70'}`}>
              {has ? s : <span className="text-2xl text-gray-400">?</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
