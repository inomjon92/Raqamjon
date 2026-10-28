import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CAPS = [10, 20, 30, 50, 100] as const
export type Cap = (typeof CAPS)[number]
export type OpsSetting = 'both' | '+' | '-'

export interface Settings {
  cap: Cap
  ops: OpsSetting
  voice: boolean
  volume: number
  sfx: boolean
  dailyLimitMin: number // 0 = cheklovsiz
  reduceMotion: boolean
  flashSpeedMs: number
  flashCount: number
}

export interface DayStat { solved: number; correct: number; seconds: number }
export interface LessonState { stars: number; by: 'self' | 'parent' }

export interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: number
  coins: number
  stickers: string[]
  owned: string[]
  wearing: string | null
  progress: Record<string, number[]> // o'yin -> 5 daraja yulduzlari
  streak: number
  lastPlayed: string
  days: Record<string, DayStat>
  games: Record<string, { solved: number; correct: number }>
  mistakes: Record<string, number>
  lessons: Record<string, LessonState>
  flashBest: number
  diplomas: string[]
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  cap: 20, ops: 'both', voice: true, volume: 1, sfx: true, dailyLimitMin: 20, reduceMotion: false, flashSpeedMs: 1500, flashCount: 3,
}

export const AVATARS = ['🦊', '🐼', '🐯', '🐰', '🐸', '🦁', '🐨', '🐵', '🦄', '🐧', '🐶', '🐱']

export const STICKERS = [
  '🍎', '🍌', '🍓', '🍊', '🍇', '🍒', '🍉', '🍍', '🍐', '🍋',
  '🦋', '🐞', '🐝', '🐌', '🐛', '🐟', '🐢', '🐬', '🦒', '🐘',
  '🚗', '🚕', '🚌', '🚂', '🚀', '✈️', '🚁', '⛵', '🚲', '🛴',
  '🌈', '⭐', '🌙', '☀️', '🌻', '🌵', '🍄', '🎈', '🎁', '🏆',
]

export const SHOP_ITEMS = [
  { id: 'cap', emoji: '🧢', name: 'Kepka', price: 20 },
  { id: 'bow', emoji: '🎀', name: 'Bantik', price: 25 },
  { id: 'glasses', emoji: '👓', name: 'Ko‘zoynak', price: 30 },
  { id: 'tophat', emoji: '🎩', name: 'Shlyapa', price: 40 },
  { id: 'grad', emoji: '🎓', name: 'Bitiruvchi qalpog‘i', price: 60 },
  { id: 'crown', emoji: '👑', name: 'Toj', price: 100 },
  { id: 'party', emoji: '🥳', name: 'Bayram qalpog‘i', price: 50 },
  { id: 'helmet', emoji: '⛑️', name: 'Qutqaruvchi kaskasi', price: 70 },
  { id: 'star', emoji: '🌟', name: 'Yulduzcha', price: 80 },
] as const

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

export function newProfile(name: string, avatar: string): Profile {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name, avatar, createdAt: Date.now(), coins: 0, stickers: [], owned: [], wearing: null, progress: {},
    streak: 0, lastPlayed: '', days: {}, games: {}, mistakes: {}, lessons: {}, flashBest: 0, diplomas: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

export interface LevelResult { stars: number; coins: number; sticker: string | null; firstClear: boolean; diploma: boolean }

export function starsFor(correct: number, total: number) {
  const r = correct / total
  return r >= 1 ? 3 : r >= 0.9 ? 2 : r >= 0.7 ? 1 : 0
}

interface State {
  profiles: Profile[]
  activeId: string | null
  add(name: string, avatar: string): void
  remove(id: string): void
  rename(id: string, name: string, avatar: string): void
  setActive(id: string): void
  patch(fn: (p: Profile) => void): void
  recordAttempt(game: string, key: string | null, ok: boolean): void
  finishLevel(game: string, level: number, correct: number, total: number): LevelResult
  tick(seconds: number): void
  buy(id: string, price: number): boolean
  importAll(data: { profiles: Profile[] }): void
}

const upd = (s: State, fn: (p: Profile) => void): Partial<State> => ({
  profiles: s.profiles.map((p) => {
    if (p.id !== s.activeId) return p
    const c = structuredClone(p)
    fn(c)
    return c
  }),
})

function touchDay(p: Profile) {
  const t = today()
  if (p.lastPlayed !== t) {
    p.streak = p.lastPlayed && dayDiff(p.lastPlayed, t) === 1 ? p.streak + 1 : 1
    p.lastPlayed = t
  }
  return (p.days[t] ??= { solved: 0, correct: 0, seconds: 0 })
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeId: null,
      add: (name, avatar) => set((s) => {
        const p = newProfile(name, avatar)
        return { profiles: [...s.profiles, p], activeId: p.id }
      }),
      remove: (id) => set((s) => {
        const profiles = s.profiles.filter((p) => p.id !== id)
        return { profiles, activeId: s.activeId === id ? profiles[0]?.id ?? null : s.activeId }
      }),
      rename: (id, name, avatar) => set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, name, avatar } : p)) })),
      setActive: (id) => set({ activeId: id }),
      patch: (fn) => set((s) => upd(s, fn)),
      recordAttempt: (game, key, ok) => set((s) => upd(s, (p) => {
        const d = touchDay(p)
        d.solved++
        if (ok) { d.correct++; p.coins++ }
        const g = (p.games[game] ??= { solved: 0, correct: 0 })
        g.solved++
        if (ok) g.correct++
        if (key) {
          if (!ok) p.mistakes[key] = (p.mistakes[key] ?? 0) + 1
          else if (p.mistakes[key]) {
            p.mistakes[key]--
            if (p.mistakes[key] <= 0) delete p.mistakes[key]
          }
        }
      })),
      finishLevel: (game, level, correct, total) => {
        const stars = starsFor(correct, total)
        const res: LevelResult = { stars, coins: stars * 5, sticker: null, firstClear: false, diploma: false }
        set((s) => upd(s, (p) => {
          const arr = (p.progress[game] ??= [0, 0, 0, 0, 0])
          const prev = arr[level - 1]
          res.firstClear = prev === 0 && stars > 0
          if (stars > prev) arr[level - 1] = stars
          p.coins += res.coins
          if (stars === 3 && prev < 3) {
            const left = STICKERS.filter((x) => !p.stickers.includes(x))
            if (left.length) {
              res.sticker = left[Math.floor(Math.random() * left.length)]
              p.stickers.push(res.sticker)
            }
          }
          if (level === 5 && stars > 0 && !p.diplomas.includes(game)) {
            p.diplomas.push(game)
            res.diploma = true
          }
        }))
        return res
      },
      tick: (seconds) => set((s) => upd(s, (p) => { touchDay(p).seconds += seconds })),
      buy: (id, price) => {
        const p = get().profiles.find((x) => x.id === get().activeId)
        if (!p || p.coins < price || p.owned.includes(id)) return false
        set((s) => upd(s, (q) => { q.coins -= price; q.owned.push(id); q.wearing = id }))
        return true
      },
      importAll: (data) => set({ profiles: data.profiles, activeId: data.profiles[0]?.id ?? null }),
    }),
    {
      name: 'raqamjon-v1',
      merge: (persisted, current) => {
        const p = persisted as Partial<State>
        return {
          ...current,
          ...p,
          profiles: (p.profiles ?? []).map((x) => ({ ...newProfile(x.name, x.avatar), ...x, settings: { ...DEFAULT_SETTINGS, ...x.settings } })),
        }
      },
    },
  ),
)

export const useProfile = () => useStore((s) => s.profiles.find((p) => p.id === s.activeId) ?? null)

export const weakKeys = (p: Profile | null) =>
  p ? Object.entries(p.mistakes).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k) : []
