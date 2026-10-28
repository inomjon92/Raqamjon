import { rnd, pick, shuffle } from './random'

export type Op = '+' | '-' | '×' | '÷'
export const ALL_OPS: Op[] = ['+', '-', '×', '÷']
export interface Equation { a: number; op: Op; b: number; result: number }

export const LEVEL_NAMES = ['Urug‘', 'Nihol', 'Gul', 'Daraxt', 'Bog‘'] as const
export const LEVEL_ICONS = ['🌰', '🌱', '🌷', '🌳', '🏡'] as const

/** Ekranda ko'rsatiladigan belgi. */
export const opSymbol = (op: Op) => (op === '-' ? '−' : op)

/** Sinflar: yosh, sonlar chegarasi va amallar (standart qiymatlar). */
export const GRADES = [
  { grade: 1, age: 7, cap: 20, ops: ['+', '-'] as Op[], emoji: '🌱', about: '20 gacha qo‘shish va ayirish' },
  { grade: 2, age: 8, cap: 100, ops: ['+', '-', '×', '÷'] as Op[], emoji: '🌿', about: '100 gacha, ko‘paytirish jadvali' },
  { grade: 3, age: 9, cap: 1000, ops: ['+', '-', '×', '÷'] as Op[], emoji: '🌳', about: '1000 gacha, ko‘paytirish va bo‘lish' },
  { grade: 4, age: 10, cap: 10000, ops: ['+', '-', '×', '÷'] as Op[], emoji: '🏆', about: 'Ko‘p xonali sonlar' },
] as const
export type Grade = 1 | 2 | 3 | 4
export const gradeInfo = (g: number) => GRADES[Math.max(1, Math.min(4, g)) - 1]

/** Daraja bo'yicha qo'shish/ayirish chegarasi. */
export function maxForLevel(level: number, cap = 20): number {
  const l = Math.max(1, Math.min(5, level))
  if (cap <= 20) return Math.min(cap, [5, 10, 10, 20, 20][l - 1])
  return [Math.max(10, cap / 10), Math.max(20, cap / 4), Math.max(20, cap / 2), cap, cap][l - 1]
}

/** 1-darajada faqat qo'shish (va ko'paytirish), keyin hammasi. */
export function opsFor(selected: Op[], level: number): Op[] {
  const ops = selected.length ? selected : ['+' as Op]
  if (level > 1) return ops
  const easy = ops.filter((o) => o === '+' || o === '×')
  return easy.length ? easy : ops
}

// Yangi bosqichda (sinf qayta o'tilganda) misollar kattaroq sonlarga suriladi.
let boost = 0
export const setBoost = (round: number) => { boost = Math.max(0, round - 1) }

export const eqKey = (e: Pick<Equation, 'a' | 'op' | 'b'>) => `${e.a}${e.op}${e.b}`
export const parseKey = (k: string): Equation | null => {
  const m = k.match(/^(\d+)([+\-×÷])(\d+)$/)
  return m ? mk(+m[1], m[2] as Op, +m[3]) : null
}

function crossesTen(e: Equation) {
  if (e.op === '+') return (e.a % 10) + (e.b % 10) >= 10
  if (e.op === '-') return (e.a % 10) < (e.b % 10)
  return false
}

export function isValidForLevel(e: Equation, level: number, cap = 20): boolean {
  if (e.op === '×' || e.op === '÷') return Number.isInteger(e.result) && e.result >= 0 && e.result <= cap && e.a <= cap && e.b > 0
  const max = maxForLevel(level, cap)
  if (e.result < 0 || e.result > max || e.a > max || e.b > max) return false
  if (level === 4 && crossesTen(e)) return false
  return true
}

function genMul(level: number, cap: number): [number, number] {
  const table = cap <= 20 ? 5 : 10
  const bMax = Math.min(table, [3, 5, 7, 10, 10][level - 1])
  if (cap >= 1000 && level >= 4) return [cap >= 10000 && level === 5 ? rnd(100, 999) : rnd(11, 99), rnd(2, 9)]
  const a = rnd(1, table)
  const b = rnd(2, Math.max(2, bMax))
  return Math.random() < 0.5 ? [a, b] : [b, a]
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
      const e = parseKey(key)
      if (e && ops.includes(e.op) && isValidForLevel(e, level, cap) && fits(e, opts)) return e
    }
  }
  const max = Math.min(maxForLevel(level, cap), opts.maxResult ?? Infinity)
  for (let i = 0; i < 400; i++) {
    const op = pick(ops)
    let e: Equation
    if (op === '×' || op === '÷') {
      const [x, y] = genMul(level, Math.min(cap, opts.maxResult ?? cap))
      e = op === '×' ? mk(x, '×', y) : mk(x * y, '÷', y)
    } else if (op === '+') {
      const r = rnd(2, max)
      const a = rnd(1, r - 1)
      e = mk(a, '+', r - a)
    } else {
      const a = rnd(2, max)
      const b = rnd(1, a - 1 || 1)
      e = mk(a, '-', b)
    }
    if (level === 5 && (op === '+' || op === '-') && Math.random() < 0.7 && !crossesTen(e)) continue
    if (boost && (op === '+' || op === '-') && i < 300 && e.result < max * 0.35 && Math.random() < 0.7) continue
    if (isValidForLevel(e, level, cap) && fits(e, opts)) return e
  }
  return mk(1, '+', 1)
}

function fits(e: Equation, o: { maxResult?: number; minResult?: number }) {
  return (o.maxResult === undefined || (e.result <= o.maxResult && e.a <= o.maxResult)) && (o.minResult === undefined || e.result >= o.minResult)
}

export function mk(a: number, op: Op, b: number): Equation {
  const result = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b
  return { a, op, b, result }
}

/** To'g'ri javobga yaqin, takrorlanmaydigan noto'g'ri variantlar. */
export function distractors(correct: number, count: number, max = 20): number[] {
  const out = new Set<number>()
  const big = correct >= 100
  const deltas = [...shuffle([1, -1, 2, -2]), ...shuffle(big ? [10, -10] : [3, -3]), ...(big ? [100, -100] : [10, -10]), 4, 5, -4, -5]
  for (const d of deltas) {
    const v = correct + d
    if (v >= 0 && v <= Math.max(max, correct + 3) && v !== correct) out.add(v)
    if (out.size >= count) break
  }
  return [...out].slice(0, count)
}

/** Ekrandagi son uzunligiga qarab shrift o'lchami (px). */
export const fitPx = (text: string | number, base: number, room = 2) => {
  const len = String(text).replace(/\s/g, '').length
  return len <= room ? base : Math.max(base * 0.42, (base * room) / len * 1.15)
}
