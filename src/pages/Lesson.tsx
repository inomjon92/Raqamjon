import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { forGrade, lessonById, MODULES, type Exercise, type Lesson as LessonT } from '../abacus/course'
import { makeChain } from '../abacus/soroban'
import { Abacus } from '../abacus/Abacus'
import { useProfile, useStore } from '../lib/store'
import { Btn, Mascot, Speaker, Stars, TopBar } from '../components/ui'
import { NumberPad } from '../components/NumberPad'
import { say, stop, praise, encourage } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { burst } from '../lib/celebrate'
import { rnd, pick } from '../lib/random'
import { useAnswer } from '../games/useAnswer'
import type { GameApi } from '../games/types'
import { go } from '../lib/router'
import clips from '../audio/clips.json'
import { medalOf } from './AbacusHome'

const TOTAL = 10
const starsOf = (c: number) => (c >= 10 ? 3 : c === 9 ? 2 : c === 8 ? 1 : 0)
const fmt = (d: number) => (d > 0 ? `+${d}` : `−${-d}`)

export default function Lesson({ id }: { id: string }) {
  const p = useProfile()!
  const patch = useStore((s) => s.patch)
  const free = id === 'free-flash'
  const { flashCount, flashSpeedMs } = p.settings
  const lesson: (LessonT & { module?: (typeof MODULES)[number] }) | undefined = useMemo(() => (free
    ? { id, title: 'Erkin flesh-anzan', clip: 'flash_ready', rods: 2, ex: { kind: 'flash', count: flashCount, speedMs: flashSpeedMs, digits: 1 } }
    : lessonById(id)), [free, id, flashCount, flashSpeedMs])
  const mode = (sessionStorage.getItem('abacus-mode') as 'self' | 'parent') ?? 'self'
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [marks, setMarks] = useState<boolean[]>([])
  const [finished, setFinished] = useState<{ stars: number; medal: string | null } | null>(null)

  const done = useCallback((success: boolean) => {
    setMarks((m) => {
      const next = [...m, success]
      if (next.length >= TOTAL) {
        const correct = next.filter(Boolean).length
        const stars = starsOf(correct)
        let medal: string | null = null
        if (!free && lesson) {
          const before = lesson.module ? medalOf(useStore.getState().profiles.find((x) => x.id === p.id)!.lessons, lesson.module) : null
          patch((q) => {
            const prev = q.lessons[lesson.id]?.stars ?? 0
            if (stars > prev || !q.lessons[lesson.id]) q.lessons[lesson.id] = { stars: Math.max(stars, prev), by: mode }
            if (q.lessons[lesson.id].stars === 0) delete q.lessons[lesson.id]
            q.coins += stars * 5
          })
          const after = lesson.module ? medalOf(useStore.getState().profiles.find((x) => x.id === p.id)!.lessons, lesson.module) : null
          if (after && after !== before) medal = after
        }
        setFinished({ stars, medal })
        setTimeout(() => {
          if (stars > 0) { sfx.win(); burst(false); say([medal ? 'new_medal' : stars === 3 ? 'three_stars' : 'level_done']) } else say(['level_fail'])
        }, 200)
      } else setIndex(next.length)
      return next
    })
  }, [free, lesson, mode, p.id, patch])

  const api: GameApi = useMemo(() => ({
    grade: 1, level: 1, cap: 99, ops: ['+', '-'], weak: [], help: false, index,
    feedback(ok) { if (ok) { sfx.correct(); burst(true); praise() } else { sfx.wrong(); encourage() } },
    done: (s) => done(s),
  }), [index, done])

  if (!lesson) { go('#/abacus'); return null }

  if (!started) {
    return (
      <div>
        <TopBar title={`🧮 ${lesson.title}`} back="#/abacus" />
        <div className="flex flex-col items-center gap-5 mt-4 text-center">
          <div className="flex items-start gap-3 max-w-xl">
            <Mascot size="text-6xl" />
            <div className="bg-white rounded-3xl rounded-tl-none p-4 text-xl font-bold text-grape-dark shadow-popsm text-left">{CLIP_TEXT[lesson.clip]}</div>
          </div>
          {lesson.visual && <Friends kind={lesson.visual} />}
          {mode === 'parent' && lesson.module && (
            <div className="bg-sun-light rounded-3xl p-4 max-w-xl text-left">
              <div className="font-extrabold mb-1">👪 Ota-onaga: dars maqsadi</div>
              <p className="text-gray-700">{lesson.module.goal} {lesson.module.guide.explain}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Speaker clip={[lesson.clip]} />
            <Btn size="lg" color="bg-mint text-white" onClick={() => { stop(); setStarted(true) }}>▶ Boshlash</Btn>
          </div>
          <SayOnce clip={lesson.clip} />
        </div>
      </div>
    )
  }

  if (finished) {
    const correct = marks.filter(Boolean).length
    return (
      <div className="flex flex-col items-center gap-5 text-center mt-4">
        <Mascot size="text-8xl" hop />
        <h1 className="text-4xl font-extrabold text-grape-dark">{finished.stars > 0 ? 'Barakalla!' : 'Yaxshi harakat!'}</h1>
        <Stars n={finished.stars} size="text-6xl" />
        <div className="text-2xl font-bold text-gray-600">{TOTAL} tadan {correct} ta to‘g‘ri</div>
        {finished.medal && <div className="text-3xl font-extrabold animate-bounceIn">Yangi medal: <span className="text-6xl">{finished.medal}</span></div>}
        {finished.stars === 0 && !free && <p className="font-bold text-gray-500">Keyingi dars ochilishi uchun kamida 8 ta to‘g‘ri javob kerak.</p>}
        {finished.stars === 0 && mode === 'parent' && !free && (
          <Btn size="sm" color="bg-sun-light text-gray-700" onClick={() => { patch((q) => { q.lessons[lesson.id] = { stars: 1, by: 'parent' } }); go('#/abacus') }}>👪 Ota-ona: dars o‘tildi deb belgilash</Btn>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <Btn color="bg-white text-grape-dark" onClick={() => go('#/abacus')}>🗂 Darslar</Btn>
          <Btn color="bg-sun text-white" onClick={() => window.location.reload()}>🔁 Yana</Btn>
          {finished.stars > 0 && !free && nextId(lesson.id) && <Btn color="bg-mint text-white" onClick={() => go(`#/lesson/${nextId(lesson.id)}`)}>Keyingi dars ➜</Btn>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title={`🧮 ${lesson.title}`} back="#/abacus" />
      <div className="flex gap-1.5 justify-center mb-4">
        {Array.from({ length: TOTAL }, (_, i) => (
          <span key={i} className={`h-3 flex-1 max-w-8 rounded-full ${i < marks.length ? (marks[i] ? 'bg-mint' : 'bg-sun') : i === index ? 'bg-grape' : 'bg-gray-200'}`} />
        ))}
      </div>
      <ExerciseView key={index} ex={forGrade(lesson.ex, p.grade)} rods={lesson.rods} api={api} free={free} />
    </div>
  )
}

function nextId(id: string) {
  const ids = MODULES.flatMap((m) => m.lessons.map((l) => l.id))
  return ids[ids.indexOf(id) + 1]
}

function SayOnce({ clip }: { clip: string }) {
  const once = useRef(false)
  useEffect(() => { if (!once.current) { once.current = true; setTimeout(() => say([clip]), 300) } }, [clip])
  return null
}

function Friends({ kind }: { kind: 'small' | 'big' }) {
  const pairs = kind === 'small' ? [[1, 4], [2, 3]] : [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]]
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {pairs.map(([a, b]) => (
        <span key={a} className="bg-white rounded-2xl px-4 py-2 shadow-popsm text-2xl font-extrabold text-grape-dark">{a} 🤝 {b} = <span className="text-coral">{kind === 'small' ? 5 : 10}</span></span>
      ))}
    </div>
  )
}

function ExerciseView({ ex, rods, api, free }: { ex: Exercise; rods: number; api: GameApi; free: boolean }) {
  const kind = useMemo(() => (ex.kind === 'mixed' ? pick(['read', 'show'] as const) : ex.kind), [ex.kind])
  if (kind === 'read' && 'lo' in ex) return <ReadEx lo={ex.lo} hi={ex.hi} rods={rods} api={api} />
  if (kind === 'show' && 'lo' in ex) return <ShowEx lo={ex.lo} hi={ex.hi} rods={rods} api={api} />
  if (ex.kind === 'chain') return <ChainEx ex={ex} rods={rods} api={api} />
  if (ex.kind === 'mental') return <MentalEx ex={ex} api={api} />
  if (ex.kind === 'flash') return <FlashEx ex={ex} api={api} free={free} />
  return null
}

function ReadEx({ lo, hi, rods, api }: { lo: number; hi: number; rods: number; api: GameApi }) {
  const n = useMemo(() => rnd(lo, hi), [lo, hi])
  const a = useAnswer(api, n)
  useEffect(() => { say(['read_number']) }, [])
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-2xl font-bold text-grape-dark flex items-center gap-2">Abakusda qaysi son? <Speaker clip={['read_number']} /></div>
      <Abacus rods={rods} value={n} readOnly />
      <div className={`text-5xl font-extrabold min-w-[3ch] text-center border-b-4 ${a.state === 'ok' ? 'text-mint border-mint' : a.state === 'reveal' ? 'text-sun border-sun' : 'text-grape-dark border-grape'}`}>{a.state === 'ok' || a.state === 'reveal' ? n : a.value || ' '}</div>
      <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
    </div>
  )
}

function ShowEx({ lo, hi, rods, api }: { lo: number; hi: number; rods: number; api: GameApi }) {
  const n = useMemo(() => rnd(lo, hi), [lo, hi])
  const [v, setV] = useState(0)
  const a = useAnswer(api, n)
  useEffect(() => { say(['set_number', `n${n}`]) }, [n])
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-2xl font-bold text-grape-dark flex items-center gap-2">Abakusda ko‘rsat: <span className="text-6xl text-coral font-extrabold">{n}</span> <Speaker clip={['set_number', `n${n}`]} /></div>
      <Abacus rods={rods} value={a.state === 'reveal' ? n : v} onChange={a.locked ? undefined : setV} highlight={a.state === 'ok'} />
      <div className="flex gap-3">
        <Btn color="bg-gray-100 text-gray-700" disabled={a.locked} onClick={() => setV(0)}>↺ Tozalash</Btn>
        <Btn size="lg" color="bg-mint text-white" disabled={a.locked} onClick={() => { a.submit(v); if (v !== n) setV(0) }}>✓ Tayyor</Btn>
      </div>
    </div>
  )
}

function ChainEx({ ex, rods, api }: { ex: Extract<Exercise, { kind: 'chain' }>; rods: number; api: GameApi }) {
  const chain = useMemo(() => makeChain(ex.spec), [ex.spec])
  const [v, setV] = useState(0)
  const a = useAnswer(api, chain.result)
  useEffect(() => { say(['listen_chain']) }, [])
  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
      <div className="bg-white rounded-3xl shadow-pop px-6 py-4 text-4xl sm:text-5xl font-extrabold text-grape-dark text-right min-w-[140px]">
        <div>{chain.start}</div>
        {chain.steps.map((d, i) => <div key={i} className={d > 0 ? 'text-mint' : 'text-coral'}>{fmt(d)}</div>)}
        <div className="border-t-4 border-grape mt-1 pt-1">{a.state === 'ok' || a.state === 'reveal' ? chain.result : a.value || '?'}</div>
      </div>
      <div className="flex flex-col items-center gap-3 w-full max-w-[560px]">
        <Abacus rods={Math.max(rods, chain.result > 9 || chain.start > 9 ? 2 : 1)} value={v} onChange={setV} />
        <Btn size="sm" color="bg-gray-100 text-gray-700" onClick={() => setV(0)}>↺ Abakusni tozalash</Btn>
        <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
      </div>
    </div>
  )
}

/** Sonlarni birin-ketin ko'rsatish (xayoliy abakus va flesh-anzan uchun). */
function useFlash(items: string[], speedMs: number, onEnd: () => void) {
  const [i, setI] = useState(-1)
  const [running, setRunning] = useState(false)
  const start = () => {
    setRunning(true)
    let k = 0
    setI(0)
    sfx.tap()
    const t = setInterval(() => {
      k++
      if (k >= items.length * 2) { clearInterval(t); setRunning(false); setI(-1); onEnd() }
      else { setI(k % 2 === 0 ? k / 2 : -2); if (k % 2 === 0) sfx.tap() }
    }, speedMs / 2)
  }
  return { current: i >= 0 ? items[i] : i === -2 ? '' : null, running, start }
}

function MentalEx({ ex, api }: { ex: Extract<Exercise, { kind: 'mental' }>; api: GameApi }) {
  const chain = useMemo(() => makeChain(ex.spec), [ex.spec])
  const items = useMemo(() => [String(chain.start), ...chain.steps.map(fmt)], [chain])
  const [asked, setAsked] = useState(false)
  const f = useFlash(items, 2200, () => setAsked(true))
  const a = useAnswer(api, chain.result)
  useEffect(() => { const t = setTimeout(f.start, 700); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold text-gray-500">💭 Xayolingdagi abakusda hisobla</div>
      <div className="w-56 h-40 rounded-3xl bg-white shadow-pop grid place-items-center text-7xl font-extrabold text-grape-dark">
        {f.current ?? (asked ? (a.state === 'ok' || a.state === 'reveal' ? chain.result : a.value || '?') : '')}
      </div>
      {asked && (
        <>
          {!a.locked && <Btn size="sm" color="bg-gray-100 text-gray-700" onClick={() => { setAsked(false); f.start() }}>👀 Yana ko‘rsat</Btn>}
          <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} />
        </>
      )}
    </div>
  )
}

function FlashEx({ ex, api, free }: { ex: Extract<Exercise, { kind: 'flash' }>; api: GameApi; free: boolean }) {
  const nums = useMemo(() => {
    const out: number[] = []
    let sum = 0
    for (let i = 0; i < ex.count; i++) {
      // 1-sinfda yig'indi chegaradan oshmasin
      const room = ex.maxSum ? Math.max(1, Math.min(9, ex.maxSum - sum - (ex.count - i - 1))) : 9
      const n = ex.digits === 2 ? rnd(10, 30) : rnd(1, room)
      out.push(n); sum += n
    }
    return out
  }, [ex.count, ex.digits, ex.maxSum])
  const sum = nums.reduce((x, y) => x + y, 0)
  const [phase, setPhase] = useState<'ready' | 'flash' | 'ask'>('ready')
  const f = useFlash(nums.map(String), ex.speedMs, () => setPhase('ask'))
  const patch = useStore((s) => s.patch)
  const wrapped: GameApi = useMemo(() => ({
    ...api,
    done(success) {
      if (free && success) patch((q) => { if (!q.flashBest || ex.speedMs < q.flashBest) q.flashBest = ex.speedMs })
      api.done(success)
    },
  }), [api, free, patch, ex.speedMs])
  const a = useAnswer(wrapped, sum)
  useEffect(() => { if (api.index === 0) say(['flash_ready']) }, [api.index])
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold text-gray-500">⚡ {ex.count} ta son · {ex.speedMs / 1000} soniya</div>
      <div className="w-64 h-48 rounded-3xl bg-grape text-white shadow-pop grid place-items-center text-8xl font-extrabold">
        {phase === 'ready' ? '🦉' : phase === 'flash' ? f.current : a.state === 'ok' || a.state === 'reveal' ? sum : a.value || '?'}
      </div>
      {phase === 'ready' && <Btn size="lg" color="bg-mint text-white" onClick={() => { setPhase('flash'); setTimeout(f.start, 400) }}>▶ Tayyorman!</Btn>}
      {phase === 'ask' && <NumberPad value={a.value} onChange={a.setValue} onSubmit={() => a.submit()} disabled={a.locked} maxLen={3} />}
      {a.state === 'reveal' && <div className="text-xl font-bold text-gray-600">{nums.join(' + ')} = {sum}</div>}
    </div>
  )
}


const CLIP_TEXT: Record<string, string> = {
  flash_ready: 'Tayyormisan? Sonlar tez chiqadi. Hammasini qo‘shib bor.',
  ...Object.fromEntries(Object.entries(clips).filter(([k]) => k.startsWith('ab_'))),
}
