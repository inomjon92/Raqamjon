import { roundOf, stickerSet, useProfile } from '../lib/store'
import { Mascot, TopBar } from '../components/ui'

/** Sovrinlar arxivi: tugatilgan har bir bosqich uchun kubok, yulduzlar va stikerlar. */
export default function Archive() {
  const p = useProfile()!
  const round = roundOf(p)
  return (
    <div>
      <TopBar title="🏆 Sovrinlar arxivi" />
      <div className="bg-white rounded-3xl shadow-pop p-4 mb-5 flex items-center gap-3">
        <Mascot size="text-5xl" />
        <div>
          <div className="font-extrabold text-grape-dark text-lg">Hozir: {p.grade}-sinf, {round}-bosqich</div>
          <div className="text-gray-500 font-bold text-sm">Joriy stikerlar to‘plami: «{stickerSet(round).name}». Sinfning barcha darajalarini o‘tsang, kubok olasan!</div>
        </div>
      </div>
      {p.archive.length === 0 ? (
        <div className="text-center text-gray-500 font-bold mt-10">
          <div className="text-7xl opacity-40 mb-3">🏆</div>
          Hali kubok yo‘q. Birinchi kubok sinfning barcha o‘yinlarini tugatganda beriladi.
        </div>
      ) : (
        <div className="grid gap-4">
          {[...p.archive].reverse().map((e, i) => (
            <div key={i} className="bg-white rounded-3xl shadow-pop p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-6xl">{e.trophy}</span>
                <div className="flex-1">
                  <div className="text-xl font-extrabold text-grape-dark">{e.grade}-sinf · {e.round}-bosqich</div>
                  <div className="text-gray-500 font-bold">{e.date} · ⭐ {e.stars} yulduz · {e.stickers.length} stiker</div>
                </div>
              </div>
              {e.stickers.length > 0 && <div className="flex flex-wrap gap-1 text-3xl">{e.stickers.map((s) => <span key={s}>{s}</span>)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
