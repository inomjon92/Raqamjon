import { SHOP_ITEMS, useProfile, useStore } from '../lib/store'
import { Btn, CoinBadge, Mascot, TopBar } from '../components/ui'
import { say } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { burst } from '../lib/celebrate'

export default function ShopPage() {
  const p = useProfile()!
  const buy = useStore((s) => s.buy)
  const patch = useStore((s) => s.patch)
  return (
    <div>
      <TopBar title="🛍️ Bilimdonning do‘koni" right={<CoinBadge />} />
      <div className="flex flex-col items-center mb-5">
        <Mascot size="text-9xl" />
        <p className="text-gray-600 font-bold mt-2 text-center">To‘g‘ri javoblar uchun tanga yig‘ va Bilimdonni bezat!</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SHOP_ITEMS.map((it) => {
          const owned = p.owned.includes(it.id)
          const wearing = p.wearing === it.id
          return (
            <div key={it.id} className={`bg-white rounded-3xl shadow-pop p-3 flex flex-col items-center gap-2 ${wearing ? 'ring-4 ring-mint' : ''}`}>
              <span className="text-6xl">{it.emoji}</span>
              <span className="font-extrabold text-grape-dark text-center">{it.name}</span>
              {owned ? (
                <Btn size="sm" color={wearing ? 'bg-gray-200 text-gray-700' : 'bg-mint text-white'} onClick={() => patch((q) => { q.wearing = wearing ? null : it.id })}>
                  {wearing ? 'Yechish' : 'Kiyish'}
                </Btn>
              ) : (
                <Btn size="sm" color="bg-sun text-white" onClick={() => {
                  if (buy(it.id, it.price)) { sfx.coin(); burst(true); say(['shop_bought']) } else { sfx.wrong(); say(['not_enough']) }
                }}>🪙 {it.price}</Btn>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
