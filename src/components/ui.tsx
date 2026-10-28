import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { sfx } from '../audio/sfx'
import { useProfile, SHOP_ITEMS } from '../lib/store'
import { say, type ClipKey } from '../audio/voice'

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { color?: string; size?: 'sm' | 'md' | 'lg' }

export function Btn({ color = 'bg-grape text-white', size = 'md', className = '', onClick, children, ...rest }: BtnProps) {
  const sz = size === 'lg' ? 'text-2xl px-7 py-4 min-h-[64px]' : size === 'sm' ? 'text-base px-4 py-2 min-h-[44px]' : 'text-xl px-5 py-3 min-h-[56px]'
  return (
    <button
      {...rest}
      onClick={(e) => { sfx.tap(); onClick?.(e) }}
      className={`${color} ${sz} rounded-2xl font-bold shadow-popsm active:translate-y-1 active:shadow-none transition disabled:opacity-40 disabled:active:translate-y-0 select-none ${className}`}
    >
      {children}
    </button>
  )
}

export function Stars({ n, size = 'text-2xl' }: { n: number; size?: string }) {
  return (
    <span className={`${size} whitespace-nowrap`} aria-label={`${n} yulduz`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? '' : 'opacity-25 grayscale'}>⭐</span>
      ))}
    </span>
  )
}

export function Mascot({ size = 'text-6xl', className = '', hop = false }: { size?: string; className?: string; hop?: boolean }) {
  const p = useProfile()
  const item = SHOP_ITEMS.find((i) => i.id === p?.wearing)
  return (
    <span className={`relative inline-block leading-none ${size} ${hop ? 'animate-hop' : ''} ${className}`} aria-hidden>
      🦉
      {item && <span className="absolute left-1/2 -translate-x-1/2 -top-[0.45em] text-[0.55em]">{item.emoji}</span>}
    </span>
  )
}

export function Speaker({ clip, onClick, className = '' }: { clip?: (ClipKey | string)[]; onClick?: () => void; className?: string }) {
  return (
    <button
      aria-label="Qayta eshitish"
      onClick={() => (onClick ? onClick() : clip && say(clip))}
      className={`w-12 h-12 shrink-0 rounded-full bg-white shadow-popsm text-2xl active:translate-y-1 active:shadow-none ${className}`}
    >
      🔊
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-3xl shadow-pop p-4 sm:p-6 ${className}`}>{children}</div>
}

export function TopBar({ title, back = '#/', right }: { title?: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <a href={back} onClick={() => sfx.tap()} aria-label="Orqaga" className="w-12 h-12 shrink-0 grid place-items-center rounded-2xl bg-white shadow-popsm text-2xl active:translate-y-1 active:shadow-none">
        ⬅️
      </a>
      <div className="flex-1 min-w-0 text-2xl font-extrabold text-grape-dark truncate">{title}</div>
      {right}
    </div>
  )
}

export function CoinBadge() {
  const p = useProfile()
  return (
    <a href="#/shop" className="flex items-center gap-1 bg-white rounded-full px-3 py-1.5 shadow-popsm font-bold text-lg">
      🪙 {p?.coins ?? 0}
    </a>
  )
}
