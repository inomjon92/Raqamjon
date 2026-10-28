import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { gradeInfo, type Grade, type Op } from './levels'

export const CAPS = [10, 20, 30, 50, 100, 1000, 10000] as const
export type Cap = (typeof CAPS)[number]

export interface Settings {
  cap: Cap
  ops: Op[]
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
export interface Redemption { id: string; reward: string; name: string; emoji: string; price: number; date: string; given: boolean }
export interface Reward { id: string; name: string; emoji: string; price: number }
export interface CustomWord { w: string; s: string[]; e: string; l: number }
export interface CustomProblem { id: string; q: string; a: number }
/** Admin (ota-ona) sozlamalari: butun qurilma uchun, onlayn panel bilan sinxronlanadi. */
export interface AdminConfig {
  pinHash: string | null
  hidden: string[]
  rewards: Reward[]
  words: CustomWord[]
  problems: CustomProblem[]
  updatedAt: number
  appliedGifts: string[]
}
export interface CloudLink { code: string; token: string; pass?: string; lastSync: number }

export const DEFAULT_ADMIN: AdminConfig = {
  pinHash: null, hidden: [], words: [], problems: [], updatedAt: 0, appliedGifts: [],
  rewards: [
    { id: 'r1', name: 'Muzqaymoq', emoji: '🍦', price: 100 },
    { id: 'r2', name: 'Multfilm ko‘rish (30 daqiqa)', emoji: '📺', price: 150 },
    { id: 'r3', name: 'Parkka sayr', emoji: '🎠', price: 300 },
  ],
}

export interface ArchiveEntry { grade: number; round: number; date: string; stars: number; stickers: string[]; trophy: string }

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
  grade: Grade
  rounds: Record<string, number>
  archive: ArchiveEntry[]
  redeemed: Redemption[]
  settings: Settings
  /** Ma'lumotlar versiyasi (migratsiya uchun). */
  v?: number
}

export const DEFAULT_SETTINGS: Settings = {
  cap: 30, ops: ['+', '-'], voice: true, volume: 1, sfx: true, dailyLimitMin: 20, reduceMotion: false, flashSpeedMs: 1500, flashCount: 3,
}

export const AVATARS = ['🦊', '🐼', '🐯', '🐰', '🐸', '🦁', '🐨', '🐵', '🦄', '🐧', '🐶', '🐱', '🐻', '🐮', '🐷', '🐹', '🦉', '🐙', '🦖', '🐳', '🦋', '🐞', '👧', '👦']
export const AVATAR_BG = ['bg-orange-100', 'bg-sky-100', 'bg-amber-100', 'bg-pink-100', 'bg-lime-100', 'bg-yellow-100', 'bg-slate-100', 'bg-orange-100', 'bg-fuchsia-100', 'bg-cyan-100', 'bg-amber-100', 'bg-rose-100', 'bg-orange-100', 'bg-pink-100', 'bg-rose-100', 'bg-yellow-100', 'bg-amber-100', 'bg-violet-100', 'bg-green-100', 'bg-blue-100', 'bg-sky-100', 'bg-red-100', 'bg-pink-100', 'bg-sky-100']

/** Har bosqichda yangi stikerlar to'plami. */
export const STICKER_SETS = [
  { name: 'Bog‘ va sayohat', items: [
    '🍎', '🍌', '🍓', '🍊', '🍇', '🍒', '🍉', '🍍', '🍐', '🍋',
    '🦋', '🐞', '🐝', '🐌', '🐛', '🐟', '🐢', '🐬', '🦒', '🐘',
    '🚗', '🚕', '🚌', '🚂', '🚀', '✈️', '🚁', '⛵', '🚲', '🛴',
    '🌈', '⭐', '🌙', '☀️', '🌻', '🌵', '🍄', '🎈', '🎁', '🏆'] },
  { name: 'Hayvonot olami', items: [
    '🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐰', '🐹', '🐭', '🐱',
    '🐶', '🐺', '🦝', '🦓', '🦌', '🐫', '🦘', '🦥', '🦦', '🦔',
    '🐧', '🦜', '🦩', '🦚', '🦢', '🦉', '🐦', '🐤', '🦆', '🦅',
    '🐳', '🐋', '🦈', '🐙', '🦑', '🦀', '🦞', '🐠', '🐡', '🦭'] },
  { name: 'Ertak va koinot', items: [
    '🦄', '🐉', '🧚', '🧜', '🧞', '🧙', '🦸', '🤖', '👽', '👑',
    '🪐', '🌍', '🌠', '☄️', '🛸', '🛰️', '🌌', '🔭', '🌋', '🏰',
    '🎠', '🎡', '🎢', '🎪', '🎨', '🎭', '🎻', '🥁', '🎺', '🎸',
    '💎', '🔮', '🪄', '🧸', '🪁', '🎯', '🧩', '🏅', '🥇', '🎖️'] },
] as const
export const stickerSet = (round: number) => STICKER_SETS[(Math.max(1, round) - 1) % STICKER_SETS.length]
export const STICKERS = STICKER_SETS[0].items
export const TROPHIES = ['🏆', '🥇', '👑', '💎', '🌟', '🚀']

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
    grade: 1, rounds: {}, archive: [], redeemed: [], v: 2,
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
  setGrade(grade: Grade): void
  newRound(nextGrade: boolean): ArchiveEntry | null
  admin: AdminConfig
  cloud: CloudLink | null
  setAdmin(fn: (a: AdminConfig) => void, touch?: boolean): void
  patchKid(id: string, fn: (p: Profile) => void): void
  redeem(r: Reward): boolean
  setCloud(c: CloudLink | null): void
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
      admin: DEFAULT_ADMIN,
      cloud: null,
      setAdmin: (fn, touch = true) => set((s) => {
        const a = structuredClone(s.admin)
        fn(a)
        if (touch) a.updatedAt = Date.now()
        return { admin: a }
      }),
      patchKid: (id, fn) => set((s) => ({ profiles: s.profiles.map((p) => { if (p.id !== id) return p; const c = structuredClone(p); fn(c); return c }) })),
      redeem: (r) => {
        const p = get().profiles.find((x) => x.id === get().activeId)
        if (!p || p.coins < r.price) return false
        set((s) => upd(s, (q) => {
          q.coins -= r.price
          q.redeemed.push({ id: Math.random().toString(36).slice(2, 10), reward: r.id, name: r.name, emoji: r.emoji, price: r.price, date: today(), given: false })
        }))
        return true
      },
      setCloud: (c) => set({ cloud: c }),
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
          const arr = (p.progress[progressKey(p, game)] ??= [0, 0, 0, 0, 0])
          const prev = arr[level - 1]
          res.firstClear = prev === 0 && stars > 0
          if (stars > prev) arr[level - 1] = stars
          p.coins += res.coins
          if (stars === 3 && prev < 3) {
            const left = stickerSet(roundOf(p)).items.filter((x) => !p.stickers.includes(x))
            if (left.length) {
              res.sticker = left[Math.floor(Math.random() * left.length)]
              p.stickers.push(res.sticker)
            }
          }
          if (level === 5 && stars > 0 && !p.diplomas.includes(progressKey(p, game))) {
            p.diplomas.push(progressKey(p, game))
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
      importAll: (data) => set({ profiles: data.profiles.map(migrate), activeId: data.profiles[0]?.id ?? null }),
      setGrade: (grade) => set((s) => upd(s, (p) => {
        const g = gradeInfo(grade)
        p.grade = grade
        p.settings.cap = g.cap as Cap
        p.settings.ops = [...g.ops]
      })),
      newRound: (nextGrade) => {
        let entry: ArchiveEntry | null = null
        set((s) => upd(s, (p) => {
          const round = roundOf(p)
          const prefix = `g${p.grade}:`
          const stars = Object.entries(p.progress).filter(([k]) => k.startsWith(prefix)).reduce((a, [, v]) => a + v.reduce((x, y) => x + y, 0), 0)
          entry = { grade: p.grade, round, date: today(), stars, stickers: [...p.stickers], trophy: TROPHIES[p.archive.length % TROPHIES.length] }
          p.archive.push(entry)
          for (const k of Object.keys(p.progress)) if (k.startsWith(prefix)) delete p.progress[k]
          p.stickers = []
          p.coins += 50
          if (nextGrade && p.grade < 4) {
            p.grade = (p.grade + 1) as Grade
            const g = gradeInfo(p.grade)
            p.settings.cap = g.cap as Cap
            p.settings.ops = [...g.ops]
          } else p.rounds[p.grade] = round + 1
        }))
        return entry
      },
    }),
    {
      name: 'raqamjon-v1',
      merge: (persisted, current) => {
        const p = persisted as Partial<State>
        return {
          ...current,
          ...p,
          profiles: (p.profiles ?? []).map(migrate),
          admin: { ...DEFAULT_ADMIN, ...p.admin },
          cloud: p.cloud ?? null,
        }
      },
    },
  ),
)

/** Eski versiyadagi ma'lumotlarni yangi tuzilishga o'tkazish. */
function migrate(x: Profile): Profile {
  const p: Profile = { ...newProfile(x.name, x.avatar), ...x, settings: { ...DEFAULT_SETTINGS, ...x.settings } }
  const ops = p.settings.ops as unknown
  if (!Array.isArray(ops)) p.settings.ops = ops === '+' ? ['+'] : ops === '-' ? ['-'] : ['+', '-']
  // v2: 1-sinf chegarasi 20 dan 30 ga ko'tarildi
  if ((p.v ?? 1) < 2) { if (p.grade === 1 && p.settings.cap === 20) p.settings.cap = 30; p.v = 2 }
  p.progress = Object.fromEntries(Object.entries(p.progress).map(([k, v]) => [k.startsWith('g') && k.includes(':') ? k : `g1:${k}`, v]))
  return p
}

export const roundOf = (p: Profile) => p.rounds[p.grade] ?? 1
export const progressKey = (p: Profile, game: string) => `g${p.grade}:${game}`
export const progressOf = (p: Profile, game: string) => p.progress[progressKey(p, game)] ?? [0, 0, 0, 0, 0]

export const useProfile = () => useStore((s) => s.profiles.find((p) => p.id === s.activeId) ?? null)

export const weakKeys = (p: Profile | null) =>
  p ? Object.entries(p.mistakes).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k) : []
