import { rnd, pick, shuffle } from './random'

export type Op = '+' | '-'
export interface Equation { a: number; op: Op; b: number; result: number }

export const LEVEL_NAMES = ['Urug‘', 'Nihol', 'Gul', 'Daraxt', 'Bog‘'] as const
export const LEVEL_ICONS = ['🌰', '🌱', '🌷', '🌳', '🏡'] as const

/** Daraja bo'yicha sonlar chegarasi. */
export function maxForLevel(level: number, cap = 20): number {
  return Math.min(cap, [5, 10, 10, 20, 20][level - 1] ?? 20)
}

export const eqKey = (e: Pick<Equation, 'a' | 'op' | 'b'>) => `${e.a}${e.op}${e.b}`

function crossesTen(e: Equation) {
  if (e.op === '+') return (e.a % 10) + (e.b % 10) >= 10
  return (e.a % 10) < (e.b % 10)
}

export function isValidForLevel(e: Equation, level: number, cap = 20): boolean {
  const max = maxForLevel(level, cap)
  if (e.result < 0 || e.result > max || e.a > max || e.b > max) return false
  if (level === 1 && e.op !== '+') return false
  if (level === 4 && crossesTen(e)) return false
  return true
}

/**
 * Daraja qoidalariga mos tasodifiy misol. `weak` — bola ko'p xato qilgan misollar,
 * 30% hollarda ular qaytariladi.
 */
export function genEquation(level: number, opts: { ops?: Op[]; cap?: number; weak?: string[]; maxResult?: number; minResult?: number } = {}): Equation {
  const cap = opts.cap ?? 20
  const ops: Op[] = opts.ops ?? (level === 1 ? ['+'] : ['+', '-'])
  if (opts.weak?.length && Math.random() < 0.3) {
    for (const key of opts.weak) {
      const m = key.match(/^(\d+)([+-])(\d+)$/)
      if (!m) continue
      const e = mk(+m[1], m[2] as Op, +m[3])
      if (ops.includes(e.op) && isValidForLevel(e, level, cap) && fits(e, opts)) return e
    }
  }
  const max = Math.min(maxForLevel(level, cap), opts.maxResult ?? 99)
  for (let i = 0; i < 400; i++) {
    const op = pick(ops)
    let e: Equation
    if (op === '+') {
      const r = rnd(level === 1 ? 2 : 2, max)
      const a = rnd(1, r - 1)
      e = mk(a, '+', r - a)
    } else {
      const a = rnd(2, max)
      const b = rnd(1, a - 1 || 1)
      e = mk(a, '-', b)
    }
    if (level === 5 && Math.random() < 0.7 && !crossesTen(e)) continue
    if (isValidForLevel(e, level, cap) && fits(e, opts)) return e
  }
  return mk(1, '+', 1)
}

function fits(e: Equation, o: { maxResult?: number; minResult?: number }) {
  return (o.maxResult === undefined || (e.result <= o.maxResult && e.a <= o.maxResult)) && (o.minResult === undefined || e.result >= o.minResult)
}

export const mk = (a: number, op: Op, b: number): Equation => ({ a, op, b, result: op === '+' ? a + b : a - b })

/** To'g'ri javobga yaqin, takrorlanmaydigan noto'g'ri variantlar. */
export function distractors(correct: number, count: number, max = 20): number[] {
  const out = new Set<number>()
  const deltas = [...shuffle([1, -1, 2, -2]), ...shuffle([3, -3]), 10, -10, 4, 5]
  for (const d of deltas) {
    const v = correct + d
    if (v >= 0 && v <= Math.max(max, correct + 3) && v !== correct) out.add(v)
    if (out.size >= count) break
  }
  return [...out].slice(0, count)
}
