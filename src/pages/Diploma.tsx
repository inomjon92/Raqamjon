import { gameById } from '../games'
import { useProfile } from '../lib/store'
import { Btn, TopBar } from '../components/ui'
import { MODULES } from '../abacus/course'

export default function Diploma({ id }: { id: string }) {
  const p = useProfile()!
  const game = gameById(id)
  const mod = MODULES.find((m) => `abacus-${m.id}` === id)
  const what = game ? `«${game.title}» o‘yinining barcha 5 darajasini` : mod ? `Mental arifmetika: «${mod.title}» modulini` : 'Raqamjon o‘yinini'
  const date = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
  return (
    <div>
      <div className="print:hidden"><TopBar title="🏅 Diplom" back={game ? `#/game/${id}` : '#/'} right={<Btn size="sm" onClick={() => window.print()}>🖨️ Chop etish</Btn>} /></div>
      <div className="bg-white mx-auto max-w-3xl aspect-[1.414] border-[14px] border-double border-sun rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-3 sm:gap-5 shadow-pop print:shadow-none">
        <div className="text-5xl sm:text-7xl">🏆</div>
        <div className="text-3xl sm:text-5xl font-extrabold text-grape tracking-wide">DIPLOM</div>
        <div className="text-lg sm:text-2xl text-gray-600">Ushbu diplom bilan</div>
        <div className="text-4xl sm:text-6xl font-extrabold text-coral">{p.avatar} {p.name}</div>
        <div className="text-lg sm:text-2xl text-gray-700 max-w-xl">{what} muvaffaqiyatli tugatgani uchun taqdirlanadi!</div>
        <div className="flex justify-between w-full mt-2 sm:mt-6 text-sm sm:text-lg text-gray-500">
          <span>{date}</span><span>🦉 Bilimdon</span>
        </div>
      </div>
    </div>
  )
}
