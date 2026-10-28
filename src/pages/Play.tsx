import { useCallback, useMemo, useRef, useState } from 'react'
import { gameById } from '../games'
import type { GameApi } from '../games/types'
import { useProfile, useStore, weakKeys, type LevelResult } from '../lib/store'
import { say, stop, praise, encourage } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { burst } from '../lib/celebrate'
import { clamp } from '../lib/random'
import { Btn, Mascot, Stars, TopBar, Speaker } from '../components/ui'
import { LEVEL_NAMES, LEVEL_ICONS } from '../lib/levels'
import { go } from '../lib/router'

export default function Play({ id, level }: { id: string; level: number }) {
  const def = gameById(id)
  const profile = useProfile()
  const recordAttempt = useStore((s) => s.recordAttempt)
  const finishLevel = useStore((s) => s.finishLevel)
  const total = def?.tasks ?? 10
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [marks, setMarks] = useState<boolean[]>([])
  const [offset, setOffset] = useState(0)
  const [help, setHelp] = useState(false)
  const [result, setResult] = useState<LevelResult | null>(null)
  const streak = useRef({ ok: 0, bad: 0 })
  const cap = profile?.settings.cap ?? 20
  const weak = useMemo(() => weakKeys(profile), [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = useCallback((success: boolean, key?: string | null) => {
    recordAttempt(id, key ?? null, success)
    const s = streak.current
    if (success) { s.ok++; s.bad = 0 } else { s.bad++; s.ok = 0 }
    if (s.ok >= 5) { setOffset((o) => clamp(o + 1, -1, 1)); s.ok = 0; setHelp(false) }
    if (s.bad >= 2) { setOffset((o) => clamp(o - 1, -1, 1)); s.bad = 0; setHelp(true) }
    if (success) setHelp(false)
    setMarks((m) => {
      const next = [...m, success]
      if (next.length >= total) {
        const correct = next.filter(Boolean).length
        const res = finishLevel(id, level, correct, total)
        setResult(res)
        setTimeout(() => {
          if (res.stars > 0) { sfx.win(); burst(false); say([res.stars === 3 ? 'three_stars' : 'level_done', ...(res.sticker ? ['new_sticker'] : [])]) }
          else say(['level_fail'])
        }, 200)
      } else setIndex(next.length)
      return next
    })
  }, [id, level, total, recordAttempt, finishLevel])

  const api: GameApi = useMemo(() => ({
    level: clamp(level + offset, 1, 5),
    cap,
    weak,
    help,
    index,
    feedback(ok: boolean) {
      if (ok) { sfx.correct(); burst(true); praise() } else { sfx.wrong(); encourage() }
    },
    done,
  }), [level, offset, cap, weak, help, index, done])

  if (!def || !profile) { go('#/'); return null }

  if (!started) {
    return (
      <div>
        <TopBar title={def.title} back={`#/game/${id}`} />
        <div className="flex flex-col items-center gap-5 mt-6 text-center">
          <div className="text-8xl">{def.emoji}</div>
          <div className="flex items-start gap-3 max-w-lg">
            <Mascot />
            <div className="bg-white rounded-3xl rounded-tl-none p-4 text-xl font-bold text-grape-dark shadow-popsm text-left">
              {INSTRUCTIONS[def.ins] ?? ''}
            </div>
          </div>
          <div className="text-xl font-bold text-gray-500">{LEVEL_ICONS[level - 1]} {level}-daraja · {LEVEL_NAMES[level - 1]}</div>
          <div className="flex gap-3">
            <Speaker clip={[def.ins]} />
            <Btn size="lg" color="bg-mint text-white" onClick={() => { stop(); setStarted(true) }}>▶ Boshlash</Btn>
          </div>
          <AutoSay clip={def.ins} />
        </div>
      </div>
    )
  }

  if (result) {
    const correct = marks.filter(Boolean).length
    return (
      <div className="flex flex-col items-center gap-5 text-center mt-4">
        <Mascot size="text-8xl" hop />
        <h1 className="text-4xl font-extrabold text-grape-dark">{result.stars > 0 ? 'Barakalla!' : 'Yaxshi harakat!'}</h1>
        <Stars n={result.stars} size="text-6xl" />
        <div className="text-2xl font-bold text-gray-600">{total} tadan {correct} ta to‘g‘ri</div>
        <div className="flex flex-wrap gap-3 justify-center">
          <span className="bg-white rounded-2xl px-4 py-2 shadow-popsm text-2xl font-bold">🪙 +{result.coins + correct}</span>
          {result.sticker && <span className="bg-sun-light rounded-2xl px-4 py-2 shadow-popsm text-2xl font-bold animate-bounceIn">Yangi stiker: <span className="text-4xl">{result.sticker}</span></span>}
          {id === 'caterpillar' && result.stars > 0 && <span className="bg-sky2-light rounded-2xl px-4 py-2 shadow-popsm text-2xl font-bold animate-bounceIn">🐛 ➜ 🦋</span>}
        </div>
        {result.diploma && <a href={`#/diploma/${id}`} className="text-xl font-bold text-grape underline">🏅 Diplomni ko‘rish</a>}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Btn color="bg-white text-grape-dark" onClick={() => go(`#/game/${id}`)}>🗂 Darajalar</Btn>
          <Btn color="bg-sun text-white" onClick={() => { window.location.reload() }}>🔁 Yana</Btn>
          {result.stars > 0 && level < 5 && <Btn color="bg-mint text-white" onClick={() => go(`#/play/${id}/${level + 1}`)}>Keyingi ➜</Btn>}
        </div>
      </div>
    )
  }

  const Game = def.Component
  return (
    <div>
      <TopBar
        title={<span className="flex items-center gap-2"><span>{def.emoji}</span><span className="truncate">{def.title}</span></span>}
        back={`#/game/${id}`}
        right={<span className="text-lg font-bold text-gray-500 whitespace-nowrap">{LEVEL_ICONS[level - 1]} {level}</span>}
      />
      <div className="flex gap-1.5 justify-center mb-3" aria-label="Natijalar">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-3 flex-1 max-w-8 rounded-full ${i < marks.length ? (marks[i] ? 'bg-mint' : 'bg-sun') : i === index ? 'bg-grape' : 'bg-gray-200'}`} />
        ))}
      </div>
      <Game key={`${level}-${index}`} api={api} />
    </div>
  )
}

function AutoSay({ clip }: { clip: string }) {
  const once = useRef(false)
  if (!once.current) { once.current = true; setTimeout(() => say([clip]), 300) }
  return null
}

export const INSTRUCTIONS: Record<string, string> = {
  ins_daily: 'Bugungi sarguzasht! O‘nta har xil misolni yech.',
  ins_fruits: 'Mevalarni sana va jami nechta ekanini top. Rasmni bossang, men sanab beraman!',
  ins_steps: 'Avval birinchi guruhni, keyin ikkinchisini sana. Oxirida hammasini qo‘sh.',
  ins_fly: 'Ortiqcha rasmlarni bosib, uchirib yubor. Nechta qoldi?',
  ins_caterpillar: 'Misolni yech — qurtcha o‘sadi va oxirida kapalakka aylanadi!',
  ins_mystery: 'Sirli katakdagi sonni top.',
  ins_hexagon: 'Har bir uyacha pastdagi ikki uyachaning yig‘indisi. Bo‘sh uyachalarni to‘ldir.',
  ins_wheel: 'G‘ildirakni aylantir va markazdagi amalni bajar.',
  ins_train: 'Poyezd vagonlariga to‘g‘ri sonlarni yoz. Hammasi to‘g‘ri bo‘lsa, poyezd yuradi!',
  ins_garden: 'Uchta javobdan to‘g‘risini tanla.',
  ins_balloons: 'To‘g‘ri javob yozilgan pufakni yor!',
  ins_scale: 'Tarozini tenglashtir. To‘g‘ri toshni tanla.',
  ins_shop: 'Narsalarni sotib ol. Kerakli tangalarni to‘la.',
  ins_memory: 'Kartochkalarni och. Misol va uning javobini juftlab top.',
  ins_compare: 'Timsoh doim kattaroq tomonga og‘zini ochadi. To‘g‘ri belgini tanla: katta, teng yoki kichik.',
}
