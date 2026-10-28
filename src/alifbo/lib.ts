import data from './data.json'
import { pick, shuffle } from '../lib/random'

export interface Word { w: string; s: string[]; e: string; l: number }
export interface Text { t: string; q: [string, string[]][] }

export const WORDS = data.words as Word[]
export const LETTERS = data.letters as { L: string; w: string }[]
export const SENTENCES = data.sentences as string[]
export const TEXTS = data.texts as unknown as Text[]
export const OPPOSITES = data.opposites as [string, string][]

/** Unli harflar (o'zbek lotin alifbosi). */
export const VOWELS = ['a', 'e', 'i', 'o', 'u', 'oʻ']

/** So'z ovozi kaliti: "Oʻrdak" -> "w_ordak". */
export const wordKey = (w: string) => 'w_' + w.toLowerCase().replace(/[ʻ‘']/g, '')

/** Harf ovozi kaliti: "X harfi. Xo'roz." */
export const letterKey = (L: string) => 'al_l' + LETTERS.findIndex((x) => x.L.toLowerCase() === L.toLowerCase())

/** So'zni harflarga ajratish: Oʻ, Gʻ, Sh, Ch, Ng bitta harf hisoblanadi. */
export function letters(word: string): string[] {
  const out: string[] = []
  for (let i = 0; i < word.length; i++) {
    const two = word.slice(i, i + 2)
    if (/^[OoGg][ʻ‘']$/.test(two)) { out.push(two[0] + 'ʻ'); i++ }
    else if (/^(sh|ch|ng)$/i.test(two) && !/[ʻ‘']/.test(word[i + 2] ?? '')) { out.push(two); i++ }
    else out.push(word[i])
  }
  return out
}

export const isVowel = (ch: string) => VOWELS.includes(ch.toLowerCase())

/** Daraja bo'yicha so'zlar: 1 — qisqa so'zlar, 5 — eng uzunlari ham. */
export function wordsFor(level: number, opts: { minSyll?: number } = {}) {
  const maxL = [1, 2, 3, 4, 4][level - 1] ?? 4
  const pool = WORDS.filter((w) => w.l <= maxL && w.s.length >= (opts.minSyll ?? 1))
  return pool.length ? pool : WORDS
}

/** Bitta harf o'rniga boshqa harflar (variantlar uchun). */
export function otherLetters(correct: string, count: number) {
  const all = LETTERS.map((x) => x.L).filter((L) => L.toLowerCase() !== correct.toLowerCase())
  return shuffle(all).slice(0, count)
}

export function pickWord(level: number, opts: { minSyll?: number } = {}) {
  return pick(wordsFor(level, opts))
}

/** Gap so'zlari (tinish belgisiz). */
export const sentenceWords = (s: string) => s.replace(/[.!?]$/, '').split(' ')

/** Daraja bo'yicha gap: 1-darajada 3 so'zli, keyin uzunroq. */
export function pickSentence(level: number) {
  const max = [3, 3, 4, 5, 9][level - 1] ?? 9
  const min = level >= 4 ? 4 : 2
  const idx = SENTENCES.map((s, i) => [sentenceWords(s).length, i] as const).filter(([n]) => n <= max && n >= min).map(([, i]) => i)
  return pick(idx.length ? idx : SENTENCES.map((_, i) => i))
}
