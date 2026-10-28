import { describe, expect, it } from 'vitest'
import clips from '../../audio/clips.json'
import { LETTERS, SENTENCES, TEXTS, WORDS, letterKey, letters, pickSentence, sentenceWords, wordKey, wordsFor } from '../../alifbo/lib'
import { gamesFor, requiredGames } from '../../games'

const C = clips as Record<string, string>

describe('alifbo', () => {
  it('harflarga ajratadi (Oʻ, Gʻ, Sh, Ch, Ng)', () => {
    expect(letters('Oʻrdak')).toEqual(['Oʻ', 'r', 'd', 'a', 'k'])
    expect(letters('Qoʻngʻiroq')).toEqual(['Q', 'oʻ', 'n', 'gʻ', 'i', 'r', 'o', 'q'])
    expect(letters('Shokolad')[0]).toBe('Sh')
    expect(letters('Choynak')[0]).toBe('Ch')
  })
  it('har bir soʻz, harf, gap va matn uchun ovoz bor', () => {
    for (const w of WORDS) expect(C[wordKey(w.w)], w.w).toBeTruthy()
    for (const l of LETTERS) expect(C[letterKey(l.L)], l.L).toBeTruthy()
    SENTENCES.forEach((_, i) => expect(C[`al_s${i}`]).toBeTruthy())
    TEXTS.forEach((t, i) => { expect(C[`al_t${i}`]).toBeTruthy(); t.q.forEach((_, k) => expect(C[`al_t${i}q${k}`]).toBeTruthy()) })
  })
  it('soʻz boʻgʻinlari soʻzni tashkil qiladi', () => {
    for (const w of WORDS) expect(w.s.join('').toLowerCase()).toBe(w.w.toLowerCase())
  })
  it('darajaga mos soʻz va gaplar', () => {
    expect(wordsFor(1).every((w) => w.l === 1)).toBe(true)
    for (let i = 0; i < 30; i++) expect(sentenceWords(SENTENCES[pickSentence(1)]).length).toBeLessThanOrEqual(3)
  })
  it('sinfga mos oʻyinlar', () => {
    const g1 = gamesFor(['+', '-'], 1, 'alifbo').map((g) => g.id)
    expect(g1).toContain('al_first')
    expect(g1).not.toContain('al_text')
    expect(gamesFor(['+', '-'], 2, 'alifbo').map((g) => g.id)).toContain('al_text')
    expect(gamesFor(['+', '-'], 1).every((g) => !g.subject)).toBe(true)
    expect(requiredGames(['+', '-'], 1).some((g) => g.subject === 'alifbo')).toBe(true)
  })
})

import { solve } from '../../admin/ContentEditor'
describe('admin misollari', () => {
  it('misolni hisoblaydi', () => {
    expect(solve('7 + 8')).toBe(15)
    expect(solve('36 : 4')).toBe(9)
    expect(solve('5 x 6 - 3')).toBe(27)
    expect(solve('2 + 3 × 4')).toBe(14)
    expect(solve('7 : 2')).toBeNull()
    expect(solve('3 - 9')).toBeNull()
    expect(solve('salom')).toBeNull()
  })
})
