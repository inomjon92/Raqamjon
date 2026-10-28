import { describe, expect, it } from 'vitest'
import { genEquation, isValidForLevel, distractors, opsFor } from '../levels'
import { makeChain, techniques } from '../../abacus/soroban'
import { MODULES } from '../../abacus/course'
import { makeChain as trainChain } from '../../games/Train'
import { numberWord } from '../numbers'
import { numberKeys } from '../../audio/voice'

describe('genEquation', () => {
  for (const level of [1, 2, 3, 4, 5]) {
    for (const cap of [10, 20, 30, 50, 100]) {
      it(`level ${level}, cap ${cap}: 10 000 misol to'g'ri`, () => {
        for (let i = 0; i < 10000; i++) {
          const e = genEquation(level, { cap })
          expect(e.result).toBeGreaterThanOrEqual(0)
          expect(e.result).toBeLessThanOrEqual(cap)
          expect(e.result).toBe(e.op === '+' ? e.a + e.b : e.a - e.b)
          expect(isValidForLevel(e, level, cap)).toBe(true)
          if (level === 1) expect(e.op).toBe('+')
        }
      })
    }
  }
  it('faqat tanlangan amallar', () => {
    for (const ops of [['+'], ['-']] as ('+' | '-')[][]) for (const level of [1, 2, 3, 4, 5]) for (let i = 0; i < 2000; i++) {
      expect(genEquation(level, { cap: 100, ops }).op).toBe(ops[0])
    }
  })
  it('katta chegarada 5-daraja chegaragacha yetadi', () => {
    let max = 0
    for (let i = 0; i < 5000; i++) max = Math.max(max, genEquation(5, { cap: 100 }).result)
    expect(max).toBeGreaterThan(80)
  })
  it('ko‘paytirish va bo‘lish butun va chegarada', () => {
    for (const cap of [20, 100, 1000, 10000]) for (const level of [1, 2, 3, 4, 5]) for (let i = 0; i < 3000; i++) {
      const e = genEquation(level, { cap, ops: ['×', '÷'] })
      expect(Number.isInteger(e.result)).toBe(true)
      expect(e.result).toBeLessThanOrEqual(cap)
      if (e.op === '÷') expect(e.a % e.b).toBe(0)
      if (e.op === '×') expect(e.result).toBe(e.a * e.b)
    }
  })
  it('1-darajada ayirish va bo‘lish yo‘q', () => {
    const ops = opsFor(['+', '-', '×', '÷'], 1)
    expect(ops).toEqual(['+', '×'])
    expect(opsFor(['-'], 1)).toEqual(['-'])
  })
  it('distractors noyob va manfiy emas', () => {
    for (let c = 0; c <= 20; c++) {
      const d = distractors(c, 3)
      expect(new Set(d).size).toBe(3)
      expect(d.every((x) => x >= 0 && x !== c)).toBe(true)
    }
  })
})

describe('soroban', () => {
  it('usullarni to‘g‘ri aniqlaydi', () => {
    expect([...techniques(2, 2)]).toEqual(['direct'])
    expect([...techniques(4, 1)]).toEqual(['five'])
    expect(techniques(7, 4).has('ten')).toBe(true)
    expect([...techniques(5, -1)]).toEqual(['five'])
    expect(techniques(12, -5).has('ten')).toBe(true)
    expect([...techniques(8, -6)]).toEqual(['direct'])
  })
  it('barcha darslar uchun zanjirlar qoidaga mos', () => {
    for (const m of MODULES) for (const l of m.lessons) {
      const ex = l.ex
      if (ex.kind !== 'chain' && ex.kind !== 'mental') continue
      for (let i = 0; i < 300; i++) {
        const c = makeChain(ex.spec)
        let v = c.start
        let used = false
        for (const d of c.steps) {
          const t = techniques(v, d)
          for (const x of t) expect(ex.spec.allow).toContain(x)
          if (ex.spec.require && t.has(ex.spec.require)) used = true
          v += d
          expect(v).toBeGreaterThanOrEqual(0)
        }
        expect(v).toBe(c.result)
        expect(c.steps.length).toBe(ex.spec.terms)
        if (ex.spec.require) expect(used).toBe(true)
      }
    }
  })
})

describe('poyezd', () => {
  it('qiymatlar chegaradan chiqmaydi', () => {
    for (const cap of [10, 20, 50, 100]) for (const ops of [['+'], ['-'], ['+', '-']] as ('+' | '-')[][]) for (const lvl of [1, 2, 3, 4, 5]) for (let i = 0; i < 500; i++) {
      const c = trainChain(lvl, cap, ops)
      for (const v of c.values) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(cap) }
      if (ops.length === 1) [c.start, ...c.values].reduce((a, b) => { expect(Math.sign(b - a)).toBe(ops[0] === '+' ? 1 : -1); return b })
    }
  })
})

it('katta sonlar ovozi', () => {
  expect(numberKeys(45)).toEqual(['n45'])
  expect(numberKeys(345)).toEqual(['n3', 'n100', 'n45'])
  expect(numberKeys(1000)).toEqual(['thousand'])
  expect(numberKeys(2105)).toEqual(['n2', 'thousand', 'n100', 'n5'])
  expect(numberKeys(9999)).toEqual(['n9', 'thousand', 'n9', 'n100', 'n99'])
})

it('sonlar so‘z bilan', () => {
  expect(numberWord(0)).toBe('nol')
  expect(numberWord(14)).toBe('o‘n to‘rt')
  expect(numberWord(40)).toBe('qirq')
  expect(numberWord(99)).toBe('to‘qson to‘qqiz')
})
