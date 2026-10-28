import { gamesFor, requiredGames } from '../games'
import { progressOf, roundOf, today, useStore, type AdminConfig, type Profile } from './store'

/** Onlayn admin panel (Supabase). Kalit ochiq (publishable) — ma'lumotlarga faqat oila tokeni bilan kirish mumkin. */
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://gcwnxkchxhgpacspafwb.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_fAje3Cz7rxH4YmI0AUvGDg_ZuDYHBwS'

export async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  let r: Response
  try {
    r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
  } catch {
    throw new Error('Internetga ulanib bo‘lmadi. Aloqani tekshiring.')
  }
  const text = await r.text()
  if (!r.ok) {
    let msg = 'Server bilan bog‘lanib bo‘lmadi'
    try { msg = JSON.parse(text).message || msg } catch { /* matn emas */ }
    throw new Error(msg)
  }
  return (text ? JSON.parse(text) : null) as T
}

/** Onlayn panelda ko'rinadigan bola natijalari (to'liq ma'lumot emas, qisqa xulosa). */
export interface KidSummary {
  grade: number; round: number; coins: number; streak: number; lastPlayed: string
  stars: number; done: number; total: number
  solved: number; correct: number; todayMin: number; week: number[]
  lessons: number; stickers: number; trophies: number
  weak: string[]
  games: { id: string; title: string; emoji: string; stars: number; solved: number; correct: number; subject: string }[]
  rewards: { id: string; name: string; emoji: string; date: string; given: boolean }[]
}

export interface CloudKid { id: string; name: string; avatar: string; grade: number; summary: KidSummary; updated_at: string }
export interface CloudConfig extends Partial<Pick<AdminConfig, 'hidden' | 'rewards' | 'words' | 'problems' | 'updatedAt'>> {
  gifts?: { id: string; kid: string; coins: number; note?: string }[]
  given?: string[]
}
export interface Family { code: string; config: CloudConfig; kids: CloudKid[] }

export function summarize(p: Profile, hidden: string[] = []): KidSummary {
  const req = requiredGames(p.settings.ops, p.grade, undefined, hidden)
  const all = [...gamesFor(p.settings.ops, p.grade, 'math', hidden), ...gamesFor(p.settings.ops, p.grade, 'alifbo', hidden)].filter((g) => g.id !== 'daily')
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return p.days[k]?.solved ?? 0
  })
  const tot = Object.values(p.games).reduce((a, g) => ({ s: a.s + g.solved, c: a.c + g.correct }), { s: 0, c: 0 })
  return {
    grade: p.grade, round: roundOf(p), coins: p.coins, streak: p.streak, lastPlayed: p.lastPlayed,
    stars: all.reduce((a, g) => a + progressOf(p, g.id).reduce((x, y) => x + y, 0), 0),
    done: req.reduce((a, g) => a + progressOf(p, g.id).filter((s) => s > 0).length, 0), total: req.length * 5,
    solved: tot.s, correct: tot.c, todayMin: Math.round((p.days[today()]?.seconds ?? 0) / 60), week,
    lessons: Object.keys(p.lessons).length, stickers: p.stickers.length, trophies: p.archive.length,
    weak: Object.entries(p.mistakes).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
    games: all.map((g) => ({ id: g.id, title: g.title, emoji: g.emoji, subject: g.subject ?? 'math', stars: progressOf(p, g.id).reduce((x, y) => x + y, 0), solved: p.games[g.id]?.solved ?? 0, correct: p.games[g.id]?.correct ?? 0 })),
    rewards: p.redeemed.slice(-20).map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, date: r.date, given: r.given })),
  }
}

/** Natijalarni yuborish va onlayn paneldagi o'zgarishlarni olish. */
export async function syncNow(): Promise<Family | null> {
  const st = useStore.getState()
  if (!st.cloud) return null
  const kids = st.profiles.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, grade: p.grade, summary: summarize(p, st.admin.hidden) }))
  const fam = await rpc<Family>('sync_push', { p_token: st.cloud.token, p_kids: kids })
  applyRemote(fam.config)
  await import('./account').then((m) => m.joinFamily())
  // Lokal sozlamalar yangiroq bo'lsa — serverga yuboramiz.
  const a = useStore.getState().admin
  if (a.updatedAt > (fam.config.updatedAt ?? 0)) await pushConfig()
  useStore.getState().setCloud({ ...st.cloud, lastSync: Date.now() })
  return fam
}

function applyRemote(c: CloudConfig) {
  const st = useStore.getState()
  if ((c.updatedAt ?? 0) > st.admin.updatedAt) {
    st.setAdmin((a) => {
      a.hidden = c.hidden ?? a.hidden
      a.rewards = c.rewards ?? a.rewards
      a.words = c.words ?? a.words
      a.problems = c.problems ?? a.problems
      a.updatedAt = c.updatedAt ?? a.updatedAt
    }, false)
  }
  const applied = new Set(st.admin.appliedGifts)
  for (const g of c.gifts ?? []) {
    if (applied.has(g.id) || !st.profiles.some((p) => p.id === g.kid)) continue
    st.patchKid(g.kid, (p) => { p.coins = Math.max(0, p.coins + g.coins) })
    st.setAdmin((a) => { a.appliedGifts.push(g.id) }, false)
  }
  const given = new Set(c.given ?? [])
  if (given.size) for (const p of st.profiles) {
    if (p.redeemed.some((r) => !r.given && given.has(r.id))) st.patchKid(p.id, (q) => { q.redeemed.forEach((r) => { if (given.has(r.id)) r.given = true }) })
  }
}

/** Qurilmadagi admin sozlamalarini serverga yozish (onlayn panelda ham ko'rinadi). */
export async function pushConfig() {
  const st = useStore.getState()
  if (!st.cloud) return
  const fam = await rpc<Family>('family_get', { p_token: st.cloud.token })
  const a = st.admin
  await rpc('config_set', { p_token: st.cloud.token, p_config: { ...fam.config, hidden: a.hidden, rewards: a.rewards, words: a.words, problems: a.problems, updatedAt: a.updatedAt } })
}
