import { useEffect, useState } from 'react'
import { useRoute } from './lib/router'
import { useProfile, useStore, today } from './lib/store'
import { setVoice, say } from './audio/voice'
import { setSfxVolume } from './audio/sfx'
import Home from './pages/Home'
import Profiles from './pages/Profiles'
import GameLevels from './pages/GameLevels'
import Play from './pages/Play'
import Stickers from './pages/Stickers'
import ShopPage from './pages/ShopPage'
import Parent from './pages/Parent'
import AbacusHome from './pages/AbacusHome'
import Lesson from './pages/Lesson'
import Diploma from './pages/Diploma'
import PrintSheet from './pages/PrintSheet'
import Archive from './pages/Archive'
import Letters from './pages/Letters'
import Admin from './admin/Admin'
import Cloud from './admin/Cloud'
import { setCustomWords } from './alifbo/lib'
import { syncNow } from './lib/cloud'
import { setBoost } from './lib/levels'
import { roundOf } from './lib/store'
import { Btn, Mascot } from './components/ui'
import { ParentGate } from './components/ParentGate'

export default function App() {
  const route = useRoute()
  const profile = useProfile()
  const tick = useStore((s) => s.tick)
  const s = profile?.settings

  useEffect(() => {
    if (!s) return
    setVoice({ enabled: s.voice, volume: s.volume })
    setSfxVolume(s.sfx ? 0.6 * s.volume : 0)
    document.documentElement.classList.toggle('reduce-motion', s.reduceMotion)
  }, [s])

  // O'ynash vaqtini hisoblash (faqat o'yin/dars sahifalarida va oyna ko'rinib turganda)
  const playing = route.name === 'play' || route.name === 'lesson'
  useEffect(() => {
    if (!playing || !profile) return
    const t = setInterval(() => { if (document.visibilityState === 'visible') tick(15) }, 15000)
    return () => clearInterval(t)
  }, [playing, profile?.id, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const secondsToday = profile?.days[today()]?.seconds ?? 0
  const [extended, setExtended] = useState(false)
  const limitHit = !!s && s.dailyLimitMin > 0 && secondsToday >= s.dailyLimitMin * 60 && !extended && playing
  useEffect(() => { if (limitHit) say(['break_time']) }, [limitHit])

  // Bir nechta bola bo'lsa, har safar ilova ochilganda kim o'ynashini so'raymiz
  const [picked, setPicked] = useState(() => { try { return sessionStorage.getItem('picked') === '1' } catch { return true } })
  const markPicked = () => { setPicked(true); try { sessionStorage.setItem('picked', '1') } catch { /* ignore */ } }
  const profilesCount = useStore((st) => st.profiles.length)
  useEffect(() => { if (profile) setBoost(roundOf(profile)) }, [profile])

  // Ota-ona qo'shgan so'zlar va onlayn sinxronlash
  const words = useStore((st) => st.admin.words)
  useEffect(() => { setCustomWords(words) }, [words])
  const linked = useStore((st) => !!st.cloud)
  useEffect(() => {
    if (!linked) return
    const run = () => { if (navigator.onLine) void syncNow().catch(() => {}) }
    run()
    const t = setInterval(run, 5 * 60 * 1000)
    const onHide = () => { if (document.visibilityState === 'hidden') run() }
    document.addEventListener('visibilitychange', onHide)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onHide) }
  }, [linked])

  let page
  if (route.name === 'cloud') page = <Cloud token={route.token} />
  else if (route.name === 'admin' && !profile) page = <Admin tab={route.tab} />
  else if (!profile) page = <Profiles first onPicked={markPicked} />
  else if (!picked && profilesCount > 1 && route.name !== 'parent' && route.name !== 'admin') page = <Profiles onPicked={markPicked} />
  else switch (route.name) {
    case 'profiles': page = <Profiles onPicked={markPicked} />; break
    case 'game': page = <GameLevels id={route.id} />; break
    case 'play': page = <Play key={`${route.id}-${route.level}`} id={route.id} level={route.level} />; break
    case 'stickers': page = <Stickers />; break
    case 'shop': page = <ShopPage />; break
    case 'parent': page = <Parent />; break
    case 'abacus': page = <AbacusHome />; break
    case 'lesson': page = <Lesson key={route.id} id={route.id} />; break
    case 'diploma': page = <Diploma id={route.id} />; break
    case 'archive': page = <Archive />; break
    case 'letters': page = <Letters />; break
    case 'admin': page = <Admin tab={route.tab} />; break
    case 'print': page = <ParentGate back="#/parent"><PrintSheet /></ParentGate>; break
    default: page = <Home />
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10 print:p-0">
      {limitHit ? <BreakScreen onContinue={() => setExtended(true)} /> : page}
      {!limitHit && (!profile || route.name === 'home') && <SiteFooter />}
    </main>
  )
}

const APK_URL = 'https://github.com/inomjon92/Raqamjon/releases/download/apk/raqamjon.apk'
const isApp = () => !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()

/** Bosh sahifa pastida: APK yuklab olish (faqat brauzerda) va aloqa telefoni. */
function SiteFooter() {
  return (
    <footer className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center print:hidden">
      {!isApp() && (
        <a href={APK_URL} className="inline-flex items-center gap-2 bg-mint text-white font-extrabold text-lg rounded-2xl px-5 py-3 shadow-popsm active:translate-y-1 active:shadow-none">
          📲 Android ilovani (APK) yuklab olish
        </a>
      )}
      <a href="tel:+998975212151" className="inline-flex items-center gap-2 bg-white text-grape-dark font-extrabold text-lg rounded-2xl px-5 py-3 shadow-popsm">
        📞 Aloqa: +998 97 521 21 51
      </a>
    </footer>
  )
}

function BreakScreen({ onContinue }: { onContinue: () => void }) {
  const [gate, setGate] = useState(false)
  if (gate) return <ParentGate back="#/"><div className="text-center mt-10"><Btn size="lg" color="bg-mint text-white" onClick={onContinue}>Yana 15 daqiqa davom etish</Btn></div></ParentGate>
  return (
    <div className="flex flex-col items-center text-center gap-5 mt-10">
      <Mascot size="text-9xl" className="animate-wiggle" />
      <h1 className="text-4xl font-extrabold text-grape-dark">Dam olish vaqti! 😴</h1>
      <p className="text-xl font-bold text-gray-600 max-w-md">Bugun juda yaxshi o‘ynading. Ko‘zlaringga dam ber, biroz yugurib kel, ertaga yana o‘ynaymiz!</p>
      <a href="#/stickers" className="text-xl font-bold text-grape underline">📒 Stikerlarimni ko‘rish</a>
      <button onClick={() => setGate(true)} className="text-gray-400 font-bold underline mt-6">👪 Ota-ona: davom ettirish</button>
    </div>
  )
}
