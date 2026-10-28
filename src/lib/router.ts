import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'profiles' }
  | { name: 'game'; id: string }
  | { name: 'play'; id: string; level: number }
  | { name: 'stickers' }
  | { name: 'shop' }
  | { name: 'parent' }
  | { name: 'abacus' }
  | { name: 'lesson'; id: string }
  | { name: 'diploma'; id: string }
  | { name: 'print' }
  | { name: 'archive' }
  | { name: 'letters' }
  | { name: 'admin'; tab?: string }
  | { name: 'cloud'; token?: string }

export function parse(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  switch (p[0]) {
    case 'profiles': return { name: 'profiles' }
    case 'game': return p[1] ? { name: 'game', id: p[1] } : { name: 'home' }
    case 'play': return p[1] ? { name: 'play', id: p[1], level: Math.max(1, Math.min(5, +p[2] || 1)) } : { name: 'home' }
    case 'stickers': return { name: 'stickers' }
    case 'shop': return { name: 'shop' }
    case 'parent': return { name: 'parent' }
    case 'abacus': return { name: 'abacus' }
    case 'lesson': return p[1] ? { name: 'lesson', id: p[1] } : { name: 'abacus' }
    case 'diploma': return { name: 'diploma', id: p[1] ?? '' }
    case 'print': return { name: 'print' }
    case 'archive': return { name: 'archive' }
    case 'letters': return { name: 'letters' }
    case 'admin': return { name: 'admin', tab: p[1] }
    case 'cloud': return { name: 'cloud', token: p[1] }
    default: return { name: 'home' }
  }
}

export const go = (path: string) => { window.location.hash = path }

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const on = () => { setRoute(parse(window.location.hash)); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
