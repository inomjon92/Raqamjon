import { useCallback, useRef, useState, type ReactNode } from 'react'
import { say, sayNumber } from '../audio/voice'
import type { AnswerState } from './useAnswer'
import type { GameApi } from './types'
import { rnd } from '../lib/random'

export const FRUITS = ['🍎', '🍌', '🍓', '🍊', '🍇', '🍒', '🍉', '🍍', '🍐', '🍋', '🥝', '🍑']
export const CUTE = ['🐥', '⭐', '💖', '🚗', '🎈', '🐟', '🌼', '🐝', '🦋', '🐞', '🍄', '🧸', '🐢', '🌸', '☀️', '🍪']

export function boxColor(state: AnswerState, active = true) {
  if (state === 'ok') return 'bg-mint-light border-mint text-mint'
  if (state === 'reveal') return 'bg-sun-light border-sun text-sun'
  if (state === 'wrong') return 'bg-coral-light border-coral text-coral animate-shake'
  return active ? 'bg-white border-grape text-grape-dark' : 'bg-white border-gray-300 text-gray-700'
}

export function AnswerBox({ value, state, correct, className = '', placeholder = '?' }: { value: string; state: AnswerState; correct: number; className?: string; placeholder?: string }) {
  const shown = state === 'ok' || state === 'reveal' ? String(correct) : value
  return (
    <span className={`inline-grid place-items-center min-w-[1.6em] h-[1.4em] px-1 rounded-2xl border-4 ${boxColor(state)} ${className}`}>
      {shown || <span className="opacity-30">{placeholder}</span>}
    </span>
  )
}

/** Rasmlar guruhi: bosilganda sanab, ovoz chiqaradi. */
export function PictureGroup({ emoji, count, counted, onCount, crossed = 0, onCross, numbers = false, size = 'text-4xl sm:text-5xl' }: {
  emoji: string; count: number; counted?: Set<number>; onCount?: (i: number) => void
  crossed?: number; onCross?: (i: number) => void; numbers?: boolean; size?: string
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-[340px]">
      {Array.from({ length: count }, (_, i) => {
        const isCrossed = i >= count - crossed
        const isCounted = counted?.has(i)
        return (
          <button
            key={i}
            onClick={() => (onCross ? onCross(i) : onCount?.(i))}
            className={`relative ${size} leading-none p-1 rounded-xl transition ${isCounted ? 'bg-sun-light scale-110' : ''} ${isCrossed ? 'opacity-30 -translate-y-2 rotate-12' : ''}`}
            aria-label={`${emoji} ${i + 1}`}
          >
            {emoji}
            {isCrossed && <span className="absolute inset-0 grid place-items-center text-coral text-5xl font-black">✕</span>}
            {numbers && <span className="absolute -bottom-1 right-0 text-xs font-bold bg-white rounded-full px-1 shadow">{i + 1}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Rasmlarni bittadan sanash uchun holat. */
export function useCounter(offset = 0) {
  const [counted, setCounted] = useState(new Set<number>())
  const count = useCallback((i: number) => {
    setCounted((s) => {
      if (s.has(i)) return s
      const n = new Set(s)
      n.add(i)
      sayNumber(n.size + offset)
      return n
    })
  }, [offset])
  return { counted, count, reset: () => setCounted(new Set()) }
}

export function Op({ children }: { children: ReactNode }) {
  return <span className="text-coral font-black px-1">{children}</span>
}

export function Prompt({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-center gap-2 text-5xl sm:text-6xl font-extrabold text-grape-dark my-3">{children}</div>
}

/**
 * Bir nechta katakli topshiriqlar (piramida, poyezd, g'ildirak): har katakka 2 urinish,
 * keyin to'g'ri javob avtomatik qo'yiladi.
 */
export function useCells(api: GameApi, answers: number[], key: string | null = null) {
  const [values, setValues] = useState<(string | null)[]>(answers.map(() => null))
  const [states, setStates] = useState<AnswerState[]>(answers.map(() => 'ask'))
  const [active, setActive] = useState(0)
  const [input, setInput] = useState('')
  const wrongs = useRef(0)
  const cellWrongs = useRef(answers.map(() => 0))
  const finished = useRef(false)

  const advance = (vals: (string | null)[]) => {
    const next = vals.findIndex((v) => v === null)
    if (next === -1) {
      finished.current = true
      setTimeout(() => api.done(wrongs.current === 0, key), 1300)
    } else setActive(next)
  }

  const submit = useCallback(() => {
    if (finished.current || input === '') return
    const n = parseInt(input, 10)
    const i = active
    const vals = [...values]
    const st = [...states]
    if (n === answers[i]) {
      vals[i] = String(n)
      st[i] = 'ok'
      api.feedback(true)
      setValues(vals); setStates(st); setInput('')
      advance(vals)
    } else {
      wrongs.current++
      cellWrongs.current[i]++
      api.feedback(false)
      setInput('')
      if (cellWrongs.current[i] >= 2) {
        vals[i] = String(answers[i])
        st[i] = 'reveal'
        setValues(vals); setStates(st)
        setTimeout(() => say(['answer_is', `n${answers[i]}`]), 700)
        setTimeout(() => advance(vals), 1800)
      } else {
        st[i] = 'wrong'
        setStates(st)
        setTimeout(() => setStates((s) => s.map((x, j) => (j === i && x === 'wrong' ? 'ask' : x))), 500)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, active, values, states, answers, api])

  const select = (i: number) => { if (values[i] === null && !finished.current) { setActive(i); setInput('') } }
  return { values, states, active, input, setInput, submit, select, allDone: values.every((v) => v !== null) }
}

export const randomEmoji = (list: string[]) => list[rnd(0, list.length - 1)]
