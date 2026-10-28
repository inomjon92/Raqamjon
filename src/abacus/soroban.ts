import { rnd } from '../lib/random'

export type Technique = 'direct' | 'five' | 'ten'
const digit = (v: number, i: number) => Math.floor(v / 10 ** i) % 10

/** Abakusda `v` ga `delta` qo'shish (yoki ayirish) qaysi usullarni talab qiladi. */
export function techniques(v: number, delta: number): Set<Technique> {
  const out = new Set<Technique>()
  const k = Math.abs(delta)
  const add = delta > 0
  let carry = 0
  for (let i = 0; i < 3; i++) {
    const d = digit(v, i)
    const kd = digit(k, i) + carry
    carry = 0
    if (kd === 0) continue
    if (add) {
      if (d + kd >= 10) { out.add('ten'); carry = 1; continue }
      const ok = !(d >= 5 && kd >= 5) && (d % 5) + (kd % 5) <= 4
      out.add(ok ? 'direct' : 'five')
    } else {
      if (d < kd) { out.add('ten'); carry = 1; continue }
      const ok = (kd < 5 || d >= 5) && kd % 5 <= d % 5 && !(kd < 5 && d >= 5 && d % 5 < kd)
      out.add(ok ? 'direct' : 'five')
    }
  }
  return out
}

export interface ChainSpec {
  terms: number // amallar soni (boshlang'ich sondan keyin)
  digits?: 1 | 2
  allow: Technique[]
  require?: Technique
  ops?: 'add' | 'sub' | 'mix'
  max?: number
}

export interface Chain { start: number; steps: number[]; result: number }

export function makeChain(spec: ChainSpec): Chain {
  const max = spec.max ?? (spec.digits === 2 ? 99 : 9)
  for (let attempt = 0; attempt < 5000; attempt++) {
    let v = spec.digits === 2 ? rnd(10, 60) : rnd(spec.require === 'ten' && spec.ops === 'sub' ? 10 : 0, Math.min(max, 9))
    if (spec.require === 'ten' && spec.ops === 'sub') v = rnd(10, 18)
    const start = v
    const steps: number[] = []
    let used = false
    let bad = false
    for (let t = 0; t < spec.terms; t++) {
      let found = false
      for (let tries = 0; tries < 60; tries++) {
        const mag = spec.digits === 2 ? (Math.random() < 0.5 ? rnd(1, 9) * 10 + rnd(0, 9) : rnd(1, 9)) : rnd(1, 9)
        const sign = spec.ops === 'add' ? 1 : spec.ops === 'sub' ? -1 : Math.random() < 0.5 ? 1 : -1
        const d = mag * sign
        const nv = v + d
        if (nv < 0 || nv > max) continue
        const tech = techniques(v, d)
        if ([...tech].some((x) => !spec.allow.includes(x))) continue
        if (spec.require && tech.has(spec.require)) used = true
        steps.push(d)
        v = nv
        found = true
        break
      }
      if (!found) { bad = true; break }
    }
    if (bad) continue
    if (spec.require && !used) continue
    return { start, steps, result: v }
  }
  return { start: 1, steps: [1], result: 2 }
}
