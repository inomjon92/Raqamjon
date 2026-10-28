import { sfx } from '../audio/sfx'

interface Props {
  rods: number
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  highlight?: boolean
}

const digit = (v: number, i: number) => Math.floor(v / 10 ** i) % 10
const LABELS = ['birlar', 'o‘nliklar', 'yuzliklar']

/**
 * Soroban: har ustunda tepada bitta "besh" cho'ti va pastda to'rtta "bir" cho'ti.
 * Chiziqqa tegib turgan cho'tlar hisobga olinadi. Cho'tni bosish — surish.
 */
export function Abacus({ rods, value, onChange, readOnly, highlight }: Props) {
  const setDigit = (i: number, d: number) => {
    if (readOnly || !onChange) return
    sfx.bead()
    onChange(value - digit(value, i) * 10 ** i + d * 10 ** i)
  }
  const W = 70
  const H = 262
  const beam = 78
  const bead = (cx: number, cy: number, active: boolean, onClick: () => void, key: string) => (
    <g key={key} onClick={onClick} style={{ cursor: readOnly ? 'default' : 'pointer', transition: 'transform .18s' }}>
      <rect x={cx - 28} y={cy - 13} width={56} height={26} rx={13} fill={active ? '#ff8a4c' : '#c9b8ff'} stroke={active ? '#d9622a' : '#a48cf0'} strokeWidth={2} />
      <rect x={cx - 18} y={cy - 9} width={22} height={6} rx={3} fill="#fff" opacity={0.45} />
    </g>
  )

  return (
    <div className={`inline-block rounded-3xl p-2 sm:p-3 bg-amber-800 shadow-pop ${highlight ? 'ring-4 ring-sun' : ''}`}>
      <svg viewBox={`0 0 ${rods * W + 20} ${H}`} className="block" style={{ width: `min(${rods * 110 + 30}px, 90vw)` }} role="img" aria-label={`Abakus: ${value}`}>
        <rect x={0} y={0} width={rods * W + 20} height={H} rx={14} fill="#fde7c4" />
        {Array.from({ length: rods }, (_, r) => {
          const i = rods - 1 - r // chapdagi ustun — eng katta xona
          const cx = 10 + r * W + W / 2
          const d = digit(value, i)
          const five = d >= 5
          const ones = d % 5
          return (
            <g key={r}>
              <rect x={cx - 3} y={8} width={6} height={H - 16} rx={3} fill="#8b5a2b" />
              {bead(cx, five ? beam - 18 : 24, five, () => setDigit(i, five ? d - 5 : d + 5), 'h')}
              {[0, 1, 2, 3].map((k) => {
                const active = k < ones
                const y = active ? beam + 20 + k * 28 : H - 34 - (3 - k) * 28
                return bead(cx, y, active, () => setDigit(i, (five ? 5 : 0) + (active ? k : k + 1)), `e${k}`)
              })}
              {rods > 1 && <text x={cx} y={H - 2} textAnchor="middle" fontSize="10" fill="#8b5a2b" fontWeight="700">{LABELS[i]}</text>}
            </g>
          )
        })}
        <rect x={4} y={beam - 4} width={rods * W + 12} height={8} rx={4} fill="#5b3a1a" />
        {Array.from({ length: rods }, (_, r) => <circle key={r} cx={10 + r * W + W / 2} cy={beam} r={3} fill="#fde7c4" />)}
      </svg>
    </div>
  )
}
