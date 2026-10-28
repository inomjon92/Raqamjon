import confetti from 'canvas-confetti'
import { useStore } from './store'

const reduced = () => {
  const p = useStore.getState().profiles.find((x) => x.id === useStore.getState().activeId)
  return p?.settings.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function burst(small = true) {
  if (reduced()) return
  confetti({ particleCount: small ? 40 : 160, spread: small ? 60 : 110, startVelocity: small ? 30 : 45, origin: { y: small ? 0.6 : 0.5 }, scalar: small ? 0.9 : 1.1, disableForReducedMotion: true })
}
