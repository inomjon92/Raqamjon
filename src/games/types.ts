import type { FC } from 'react'
import type { ClipKey } from '../audio/voice'
import type { Op } from '../lib/levels'

export interface GameApi {
  /** Hozirgi (moslashuvchan) qiyinlik, 1–5. */
  level: number
  /** Ota-ona sozlamasi: sonlar chegarasi (10 yoki 20). */
  cap: number
  /** Ota-ona tanlagan amallar (+, − yoki ikkalasi). */
  ops: Op[]
  /** Bola ko'p xato qilgan misollar. */
  weak: string[]
  /** Ketma-ket xatolardan keyin rasmli yordam ko'rsatish. */
  help: boolean
  /** Topshiriq raqami (0 dan). */
  index: number
  /** Har bir urinishga ovozli/vizual javob. */
  feedback(ok: boolean): void
  /** Topshiriq tugadi. success = birinchi urinishda xatosiz yechildi. */
  done(success: boolean, key?: string | null): void
}

export interface GameDef {
  id: string
  title: string
  emoji: string
  color: string
  ins: ClipKey
  tasks?: number
  fromWorksheet?: boolean
  /** Faqat shu amal yoqilganda ko'rinadi. */
  needs?: Op
  Component: FC<{ api: GameApi }>
}
