import { useCallback, useRef, useState } from 'react'
import { say } from '../audio/voice'
import type { GameApi } from '../games/types'
import type { AnswerState } from '../games/useAnswer'

/**
 * Variantli (matnli) topshiriqlar uchun: 2 ta urinish, keyin to'g'ri javob ko'rsatiladi
 * va `reveal` ovozlari o'qiladi.
 */
export function useChoice(api: GameApi, correct: string, key: string | null, reveal: string[] = []) {
  const [state, setState] = useState<AnswerState>('ask')
  const [wrong, setWrong] = useState<string[]>([])
  const wrongs = useRef(0)
  const locked = useRef(false)

  const submit = useCallback((v: string) => {
    if (locked.current) return
    if (v === correct) {
      locked.current = true
      setState('ok')
      api.feedback(true)
      if (reveal.length) setTimeout(() => say(reveal), 700)
      setTimeout(() => api.done(wrongs.current === 0, key), reveal.length ? 2200 : 1300)
    } else {
      wrongs.current++
      setWrong((w) => [...w, v])
      api.feedback(false)
      if (wrongs.current >= 2) {
        locked.current = true
        setState('reveal')
        setTimeout(() => say(['answer_is', ...reveal]), 900)
        setTimeout(() => api.done(false, key), 3400)
      } else {
        setState('wrong')
        setTimeout(() => setState((s) => (s === 'wrong' ? 'ask' : s)), 500)
      }
    }
  }, [api, correct, key, reveal])

  return { state, wrong, submit, locked: state === 'ok' || state === 'reveal' }
}

/** Variant tugmasining rangi. */
export function choiceClass(opt: string, correct: string, c: { state: AnswerState; wrong: string[] }) {
  if ((c.state === 'ok' || c.state === 'reveal') && opt === correct) return 'bg-mint text-white border-mint animate-bounceIn'
  if (c.wrong.includes(opt)) return 'bg-coral-light text-coral border-coral opacity-60'
  return 'bg-white text-grape-dark border-grape-light'
}

/**
 * Ketma-ket terish (bo'g'in, gap): har bir noto'g'ri bosish xato, 2 xatodan keyin
 * to'g'ri javob ko'rsatiladi.
 */
export function useSequence(api: GameApi, target: string[], key: string | null, reveal: string[] = []) {
  const [placed, setPlaced] = useState<number[]>([])
  const [state, setState] = useState<AnswerState>('ask')
  const wrongs = useRef(0)
  const locked = useRef(false)

  const tap = (chipIdx: number, chip: string) => {
    if (locked.current || placed.includes(chipIdx)) return
    if (chip === target[placed.length]) {
      const next = [...placed, chipIdx]
      setPlaced(next)
      if (next.length === target.length) {
        locked.current = true
        setState('ok')
        api.feedback(true)
        if (reveal.length) setTimeout(() => say(reveal), 700)
        setTimeout(() => api.done(wrongs.current === 0, key), reveal.length ? 2600 : 1300)
      }
    } else {
      wrongs.current++
      api.feedback(false)
      if (wrongs.current >= 2) {
        locked.current = true
        setState('reveal')
        setTimeout(() => say(['answer_is', ...reveal]), 900)
        setTimeout(() => api.done(false, key), 3600)
      } else {
        setState('wrong')
        setTimeout(() => setState((s) => (s === 'wrong' ? 'ask' : s)), 500)
      }
    }
  }
  return { placed, state, tap, locked: state === 'ok' || state === 'reveal' }
}
