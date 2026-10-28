import { useEffect } from 'react'
import { sfx } from '../audio/sfx'

interface Props {
  value: string
  onChange(v: string): void
  onSubmit(): void
  maxLen?: number
  disabled?: boolean
}

/** Bolalar uchun katta raqam paneli. Kompyuterda klaviatura ham ishlaydi. */
export function NumberPad({ value, onChange, onSubmit, maxLen = 3, disabled }: Props) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (disabled) return
      if (/^\d$/.test(e.key)) { sfx.tap(); onChange((value + e.key).slice(-maxLen).replace(/^0(\d)/, '$1')) }
      else if (e.key === 'Backspace') onChange(value.slice(0, -1))
      else if (e.key === 'Enter' && value !== '') onSubmit()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [value, onChange, onSubmit, maxLen, disabled])

  const press = (d: string) => {
    if (disabled) return
    sfx.tap()
    const next = value.length >= maxLen ? d : value + d
    onChange(next.replace(/^0(\d)/, '$1'))
  }
  const key = 'h-16 sm:h-[72px] rounded-2xl text-3xl font-extrabold shadow-popsm active:translate-y-1 active:shadow-none select-none disabled:opacity-40'
  return (
    <div className="grid grid-cols-6 sm:grid-cols-6 gap-2 w-full max-w-[560px] mx-auto">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
        <button key={d} disabled={disabled} onClick={() => press(d)} className={`${key} bg-white text-grape-dark`}>
          {d}
        </button>
      ))}
      <button disabled={disabled} aria-label="O‘chirish" onClick={() => { sfx.tap(); onChange(value.slice(0, -1)) }} className={`${key} bg-coral-light`}>
        ⌫
      </button>
      <button disabled={disabled || value === ''} aria-label="Tekshirish" onClick={onSubmit} className={`${key} bg-mint text-white`}>
        ✓
      </button>
    </div>
  )
}
