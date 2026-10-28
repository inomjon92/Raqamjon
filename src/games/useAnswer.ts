import { useCallback, useRef, useState } from 'react'
import { say, numberKeys } from '../audio/voice'
import type { GameApi } from './types'

export type AnswerState = 'ask' | 'ok' | 'wrong' | 'reveal'

/**
 * Bitta javobli topshiriqlar uchun: 2 ta urinish, keyin to'g'ri javob ko'rsatiladi.
 */
export function useAnswer(api: GameApi, correct: number, key: string | null = null) {
  const [state, setState] = useState<AnswerState>('ask')
  const [value, setValue] = useState('')
  const wrongs = useRef(0)
  const locked = useRef(false)

  const submit = useCallback((v: number | string = value) => {
    if (locked.current) return
    const n = typeof v === 'number' ? v : parseInt(v, 10)
    if (Number.isNaN(n)) return
    if (n === correct) {
      locked.current = true
      setState('ok')
      api.feedback(true)
      setTimeout(() => api.done(wrongs.current === 0, key), 1300)
    } else {
      wrongs.current++
      api.feedback(false)
      setValue('')
      if (wrongs.current >= 2) {
        locked.current = true
        setState('reveal')
        setTimeout(() => say(['answer_is', ...numberKeys(correct)]), 900)
        setTimeout(() => api.done(false, key), 3400)
      } else {
        setState('wrong')
        setTimeout(() => setState((s) => (s === 'wrong' ? 'ask' : s)), 500)
      }
    }
  }, [api, correct, key, value])

  return { state, value, setValue, submit, wrongs: wrongs.current, locked: state === 'ok' || state === 'reveal' }
}
