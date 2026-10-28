import { useMemo, useState, type ReactNode } from 'react'
import { rnd } from '../lib/random'
import { NumberPad } from './NumberPad'
import { Card, TopBar } from './ui'

/** Ota-ona bo'limiga kirish: bola hali bilmaydigan ko'paytirish misoli. */
export function ParentGate({ children, back = '#/' }: { children: ReactNode; back?: string }) {
  const [ok, setOk] = useState(() => sessionStorage.getItem('parent-ok') === '1')
  const [a, b] = useMemo(() => [rnd(6, 9), rnd(4, 9)], [])
  const [v, setV] = useState('')
  const [err, setErr] = useState(false)
  if (ok) return <>{children}</>
  return (
    <div>
      <TopBar title="👪 Ota-onalar uchun" back={back} />
      <Card className="max-w-md mx-auto text-center flex flex-col gap-4">
        <p className="font-bold text-gray-600">Davom etish uchun misolni yeching:</p>
        <div className={`text-5xl font-extrabold text-grape-dark ${err ? 'animate-shake' : ''}`}>{a} × {b} = <span className="inline-block min-w-[2ch] border-b-4 border-grape">{v || ' '}</span></div>
        <NumberPad value={v} onChange={setV} onSubmit={() => {
          if (+v === a * b) { try { sessionStorage.setItem('parent-ok', '1') } catch { /* ignore */ } setOk(true) } else { setErr(true); setV(''); setTimeout(() => setErr(false), 400) }
        }} />
      </Card>
    </div>
  )
}
