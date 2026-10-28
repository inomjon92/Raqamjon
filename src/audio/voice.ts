import clips from './clips.json'

export type ClipKey = keyof typeof clips
const TEXT = clips as Record<string, string>

/** Ovoz fayllari ro'yxati (GitHub Actions tomonidan yaratiladi: public/audio/index.json). */
let available: Record<string, string> | null = null
let loading: Promise<void> | null = null
let volume = 1
let enabled = true

export function setVoice(opts: { enabled?: boolean; volume?: number }) {
  if (opts.enabled !== undefined) enabled = opts.enabled
  if (opts.volume !== undefined) volume = opts.volume
  if (!enabled) stop()
}

function loadIndex() {
  if (!loading) {
    loading = fetch('/audio/index.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => { available = j })
      .catch(() => { available = {} })
  }
  return loading
}
if (typeof window !== 'undefined') void loadIndex()

const cache = new Map<string, HTMLAudioElement>()
function audioFor(key: string) {
  let a = cache.get(key)
  if (!a) {
    a = new Audio(`/audio/${key}.mp3?v=${available?.[key] ?? ''}`)
    a.preload = 'auto'
    cache.set(key, a)
  }
  return a
}

let token = 0
let current: HTMLAudioElement | null = null

export function stop() {
  token++
  if (current) { current.pause(); current = null }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

function uzVoice(): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in window)) return undefined
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('uz'))
}

/** Matnni so'z bilan ifodalash (ekranda ko'rsatish yoki brauzer ovozi uchun). */
export const textOf = (keys: (ClipKey | string)[]) => keys.map((k) => TEXT[k] ?? k).join(' ')

/**
 * Kalitlar ketma-ketligini o'qiydi: avval tayyor MP3 fayllar, ular bo'lmasa —
 * qurilmadagi o'zbekcha brauzer ovozi.
 */
export async function say(keys: (ClipKey | string)[]): Promise<void> {
  if (!enabled || keys.length === 0) return
  stop()
  const my = token
  await loadIndex()
  if (my !== token) return
  const haveAll = keys.every((k) => available?.[k])
  if (!haveAll) {
    const v = uzVoice()
    if (!v) return
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(textOf(keys))
      u.voice = v
      u.lang = v.lang
      u.rate = 0.9
      u.volume = volume
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    })
  }
  for (const k of keys) {
    if (my !== token) return
    const a = audioFor(k)
    a.volume = volume
    a.currentTime = 0
    current = a
    await new Promise<void>((resolve) => {
      a.onended = () => resolve()
      a.onerror = () => resolve()
      a.play().catch(() => resolve())
    })
  }
  if (my === token) current = null
}

/** Son uchun ovoz kalitlari: 345 -> "uch yuz qirq besh", 2000 -> "ikki ming". */
export function numberKeys(n: number): string[] {
  if (n <= 100) return [`n${n}`]
  const out: string[] = []
  const th = Math.floor(n / 1000)
  const rest = n % 1000
  if (th > 0) out.push(...(th > 1 ? numberKeys(th) : []), 'thousand')
  const h = Math.floor(rest / 100)
  if (h > 0) out.push(...(h > 1 ? [`n${h}`] : []), 'n100')
  if (rest % 100 > 0) out.push(`n${rest % 100}`)
  return out
}

export const sayNumber = (n: number) => say(numberKeys(n))

const OP_CLIP = { '+': 'plus', '-': 'minus', '×': 'times', '÷': 'divide' } as const

/** "3 qo'shish 2, nechchi bo'ladi?" */
export function sayEquation(a: number, op: keyof typeof OP_CLIP, b: number, ask = true) {
  return say([...numberKeys(a), OP_CLIP[op], ...numberKeys(b), ...(ask ? ['howmuch'] : [])])
}

const PRAISE: ClipKey[] = ['good1', 'good2', 'good3', 'good4', 'good5', 'good6', 'good7']
export const praise = () => say([PRAISE[Math.floor(Math.random() * PRAISE.length)]])
export const encourage = () => say([(['try1', 'try2'] as ClipKey[])[Math.floor(Math.random() * 2)]])

/** Oldindan yuklash (offline uchun). */
export async function preloadAll() {
  await loadIndex()
  if (!available) return
  for (const k of Object.keys(available)) audioFor(k)
}
