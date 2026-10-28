import type { ChainSpec } from './soroban'

export type Exercise =
  | { kind: 'read'; lo: number; hi: number }
  | { kind: 'show'; lo: number; hi: number }
  | { kind: 'mixed'; lo: number; hi: number }
  | { kind: 'chain'; spec: ChainSpec }
  | { kind: 'mental'; spec: ChainSpec }
  | { kind: 'flash'; count: number; speedMs: number; digits: 1 | 2; maxSum?: number }

/** 1-sinf uchun barcha mashqlar 20 gacha. */
export const MENTAL_CAP: Record<number, number> = { 1: 20 }

export function forGrade(ex: Exercise, grade: number): Exercise {
  const cap = MENTAL_CAP[grade]
  if (!cap) return ex
  switch (ex.kind) {
    case 'read': case 'show': case 'mixed': {
      const hi = Math.min(ex.hi, cap)
      return { ...ex, hi, lo: Math.min(ex.lo, Math.max(0, hi - 10)) }
    }
    case 'chain': case 'mental':
      return { ...ex, spec: { ...ex.spec, digits: undefined, max: Math.min(ex.spec.max ?? cap, cap) } }
    case 'flash':
      return { ...ex, digits: 1, maxSum: cap }
  }
}

export interface Lesson { id: string; title: string; clip: string; ex: Exercise; rods: number; visual?: 'small' | 'big' }
export interface Module {
  id: number
  title: string
  emoji: string
  goal: string
  guide: { explain: string; home: string; mistakes: string }
  lessons: Lesson[]
}

const D: ChainSpec['allow'] = ['direct']
const DF: ChainSpec['allow'] = ['direct', 'five']
const ALL: ChainSpec['allow'] = ['direct', 'five', 'ten']

const L = (m: number, n: number, title: string, ex: Exercise, rods = 1, visual?: Lesson['visual']): Lesson => ({ id: `${m}-${n}`, title, clip: `ab_${m}_${n}`, ex, rods, visual })

export const MODULES: Module[] = [
  {
    id: 1, title: 'Abakus bilan tanishuv', emoji: '🧮', goal: '0–9 sonlarni abakusda ko‘rsatish va o‘qish.',
    guide: {
      explain: 'Abakusning o‘rtasida chiziq bor. Pastdagi 4 ta cho‘tning har biri — 1, tepadagi bitta cho‘t — 5. Chiziqqa tegib turgan cho‘tlargina hisobga olinadi. 7 = tepadagi 5 + pastdagi 2 ta.',
      home: 'Barmoqlar o‘yini: bir qo‘lning hammasi — “besh cho‘t”, ikkinchi qo‘lning barmoqlari — “bir cho‘tlar”. Siz son aytasiz, bola barmoqlarda ko‘rsatadi.',
      mistakes: 'Bola 5 ni beshta pastki cho‘t bilan ko‘rsatmoqchi bo‘ladi — pastda faqat 4 ta cho‘t borligini eslating.',
    },
    lessons: [
      L(1, 1, 'Cho‘tlarni o‘qish (0–4)', { kind: 'read', lo: 0, hi: 4 }),
      L(1, 2, 'Cho‘tlarni surish (0–4)', { kind: 'show', lo: 0, hi: 4 }),
      L(1, 3, 'Besh cho‘ti (5–9)', { kind: 'show', lo: 5, hi: 9 }),
      L(1, 4, '0–9 aralash', { kind: 'mixed', lo: 0, hi: 9 }),
    ],
  },
  {
    id: 2, title: 'Oddiy qo‘shish va ayirish', emoji: '➕', goal: 'Do‘stlarsiz, to‘g‘ridan-to‘g‘ri cho‘t surib hisoblash.',
    guide: {
      explain: 'Qo‘shganda cho‘tlar chiziqqa yaqinlashadi, ayirganda uzoqlashadi. Avval sonni qo‘ying, keyin misoldagi amalni cho‘tlar bilan bajaring va javobni o‘qing.',
      home: '“Avtobus” o‘yini: avtobusda 3 yo‘lovchi bor, 2 tasi chiqdi, 1 tasi chiqdi… Bola abakusda kuzatadi.',
      mistakes: 'Javobni sanab emas, abakusdan bir qarashda o‘qishga o‘rgating.',
    },
    lessons: [
      L(2, 1, 'Qo‘shish', { kind: 'chain', spec: { terms: 1, allow: D, ops: 'add' } }),
      L(2, 2, 'Ayirish', { kind: 'chain', spec: { terms: 1, allow: D, ops: 'sub' } }),
      L(2, 3, 'Aralash', { kind: 'chain', spec: { terms: 2, allow: D, ops: 'mix' } }),
      L(2, 4, 'Uch amal', { kind: 'chain', spec: { terms: 3, allow: D, ops: 'mix' } }),
    ],
  },
  {
    id: 3, title: 'Kichik do‘stlar', emoji: '🤝', goal: '5 orqali qo‘shish va ayirish (1+4, 2+3).',
    guide: {
      explain: 'Kichik do‘stlar — yig‘indisi 5 bo‘lgan juftlar: 1 va 4, 2 va 3. Masalan, 4 + 2: pastda 2 ta cho‘t qo‘shib bo‘lmaydi, shuning uchun 5 ni qo‘shamiz va 2 ning do‘sti — 3 ni olib tashlaymiz.',
      home: 'Kichik do‘stlar qo‘shig‘i: “Birning do‘sti — to‘rt, ikkining do‘sti — uch!” Kartochkalar bilan juftlarni toping.',
      mistakes: 'Bola avval olib, keyin qo‘shadi. Qo‘shishda: avval besh, keyin do‘stini olib tashlash.',
    },
    lessons: [
      L(3, 1, 'Do‘stlar bilan tanishuv', { kind: 'chain', spec: { terms: 1, allow: DF, require: 'five', ops: 'add' } }, 1, 'small'),
      L(3, 2, 'Qo‘shishda kichik do‘stlar', { kind: 'chain', spec: { terms: 2, allow: DF, require: 'five', ops: 'add' } }, 1, 'small'),
      L(3, 3, 'Ayirishda kichik do‘stlar', { kind: 'chain', spec: { terms: 1, allow: DF, require: 'five', ops: 'sub' } }, 1, 'small'),
      L(3, 4, 'Aralash misollar', { kind: 'chain', spec: { terms: 3, allow: DF, require: 'five', ops: 'mix' } }, 1, 'small'),
    ],
  },
  {
    id: 4, title: 'Ikki xonali sonlar', emoji: '🔟', goal: '10–99 sonlarni ko‘rsatish, o‘nliklar bilan ishlash.',
    guide: {
      explain: 'O‘ngdagi ustun — birlar, chapdagi — o‘nliklar. 37 = chap ustunda 3, o‘ng ustunda 7. Sonni chapdan o‘ngga qo‘yamiz.',
      home: 'Tayoqchalar: 10 tadan bog‘lab “o‘nlik” qiling. 23 = 2 ta bog‘lam va 3 ta tayoqcha.',
      mistakes: 'Ustunlarni almashtirib yuborish (37 o‘rniga 73). Har doim “o‘nliklar chapda” deb takrorlang.',
    },
    lessons: [
      L(4, 1, 'O‘nliklar ustuni', { kind: 'read', lo: 10, hi: 99 }, 2),
      L(4, 2, 'Ikki xonali sonni qo‘yish', { kind: 'show', lo: 10, hi: 99 }, 2),
      L(4, 3, 'O‘nliklarni qo‘shish va ayirish', { kind: 'chain', spec: { terms: 1, digits: 2, allow: D, ops: 'mix' } }, 2),
      L(4, 4, 'Ikki xonali misollar', { kind: 'chain', spec: { terms: 2, digits: 2, allow: DF, ops: 'mix' } }, 2),
    ],
  },
  {
    id: 5, title: 'Katta do‘stlar', emoji: '🫂', goal: '10 orqali qo‘shish va ayirish (1+9, 3+7 …).',
    guide: {
      explain: 'Katta do‘stlar — yig‘indisi 10 bo‘lgan juftlar. 7 + 4: birlar ustuniga 4 sig‘maydi, shuning uchun o‘nliklarga 1 qo‘shamiz va 4 ning katta do‘sti — 6 ni birlardan olib tashlaymiz.',
      home: '“O‘ngacha to‘ldir” o‘yini: siz 3 deysiz, bola 7 deydi. Tez-tez, ritm bilan.',
      mistakes: 'Kichik va katta do‘stlarni aralashtirish. Avval “sig‘adimi?” deb so‘rashni o‘rgating.',
    },
    lessons: [
      L(5, 1, 'Katta do‘stlar bilan tanishuv', { kind: 'chain', spec: { terms: 1, allow: ALL, require: 'ten', ops: 'add', max: 18 } }, 2, 'big'),
      L(5, 2, 'Qo‘shishda katta do‘stlar', { kind: 'chain', spec: { terms: 2, allow: ALL, require: 'ten', ops: 'add', max: 27 } }, 2, 'big'),
      L(5, 3, 'Ayirishda katta do‘stlar', { kind: 'chain', spec: { terms: 1, allow: ALL, require: 'ten', ops: 'sub', max: 18 } }, 2, 'big'),
      L(5, 4, 'Aralash misollar', { kind: 'chain', spec: { terms: 3, allow: ALL, require: 'ten', ops: 'mix', max: 30 } }, 2, 'big'),
    ],
  },
  {
    id: 6, title: 'Aralash usullar', emoji: '🔀', goal: 'Barcha usullar bilan 3–5 sonli zanjirlar.',
    guide: {
      explain: 'Endi bola o‘zi qaysi usulni ishlatishni tanlaydi: to‘g‘ridan-to‘g‘ri, kichik do‘st yoki katta do‘st. Har bir amaldan oldin “sig‘adimi?” deb o‘ylaydi.',
      home: 'Do‘kon o‘yini: xaridlar ro‘yxatini aytasiz (+5, +3, −2 …), bola abakusda hisoblaydi.',
      mistakes: 'Shoshilish. Tezlikdan ko‘ra aniqlik muhim.',
    },
    lessons: [
      L(6, 1, 'Uch amal', { kind: 'chain', spec: { terms: 3, allow: ALL, ops: 'mix', max: 30 } }, 2),
      L(6, 2, 'To‘rt amal', { kind: 'chain', spec: { terms: 4, allow: ALL, ops: 'mix', max: 40 } }, 2),
      L(6, 3, 'Ayirish zanjirlari', { kind: 'chain', spec: { terms: 4, allow: ALL, ops: 'mix', max: 50, digits: 2 } }, 2),
      L(6, 4, 'Besh amal', { kind: 'chain', spec: { terms: 5, allow: ALL, ops: 'mix', max: 50 } }, 2),
    ],
  },
  {
    id: 7, title: 'Xayoliy abakus', emoji: '💭', goal: 'Abakussiz, ko‘z oldida tasavvur qilib hisoblash.',
    guide: {
      explain: 'Bola abakusni ko‘z oldiga keltiradi va barmoqlarini havoda xuddi cho‘t surayotgandek qimirlatadi. Bu normal va foydali.',
      home: 'Yo‘lda, navbatda: “Xayolingdagi abakusga 4 qo‘y… 3 qo‘sh… nechchi?”',
      mistakes: 'Bola qiynalsa, haqiqiy abakusga qaytib, keyin yana xayoliyga o‘tsin.',
    },
    lessons: [
      L(7, 1, 'Ko‘zni yumib', { kind: 'mental', spec: { terms: 2, allow: D, ops: 'mix' } }),
      L(7, 2, 'Abakussiz', { kind: 'mental', spec: { terms: 2, allow: DF, ops: 'mix' } }),
      L(7, 3, 'To‘rtta son', { kind: 'mental', spec: { terms: 3, allow: ALL, ops: 'mix', max: 20 } }),
      L(7, 4, 'Ikki xonali', { kind: 'mental', spec: { terms: 2, digits: 2, allow: ALL, ops: 'mix', max: 99 } }),
    ],
  },
  {
    id: 8, title: 'Flesh-anzan', emoji: '⚡', goal: 'Tez chiqib-yo‘qoladigan sonlarni xayolan qo‘shish.',
    guide: {
      explain: 'Sonlar ekranda birin-ketin chiqadi. Bola har birini xayoliy abakusga qo‘shib boradi. Tezlikni sozlamalarda o‘zgartirish mumkin.',
      home: 'Kartochkalarni tez ko‘rsatish o‘yini. Har kuni 5 daqiqa yetarli.',
      mistakes: 'Sonni o‘qib ulgurmaslik — tezlikni pasaytiring, ishonch ortgach oshiring.',
    },
    lessons: [
      L(8, 1, 'Uchta son', { kind: 'flash', count: 3, speedMs: 2000, digits: 1 }),
      L(8, 2, 'Tezroq', { kind: 'flash', count: 4, speedMs: 1500, digits: 1 }),
      L(8, 3, 'Beshta son', { kind: 'flash', count: 5, speedMs: 1000, digits: 1 }),
      L(8, 4, 'Ikki xonali sonlar', { kind: 'flash', count: 3, speedMs: 1500, digits: 2 }),
    ],
  },
]

export const ALL_LESSONS = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })))
export const lessonById = (id: string) => ALL_LESSONS.find((l) => l.id === id)
