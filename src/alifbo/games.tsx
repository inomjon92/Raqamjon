import { useEffect, useMemo, useState } from 'react'
import { say } from '../audio/voice'
import { Speaker } from '../components/ui'
import { pick, rnd, shuffle } from '../lib/random'
import type { GameApi } from '../games/types'
import { boxColor } from '../games/kit'
import { choiceClass, useChoice, useSequence } from './useChoice'
import {
  OPPOSITES, SENTENCES, TEXTS, WORDS, isVowel, letters, otherLetters, pickSentence, pickWord, sentenceWords, wordKey,
} from './lib'

const BIG = 'text-5xl sm:text-6xl font-extrabold text-grape-dark'
const OPT = 'rounded-3xl font-extrabold shadow-pop active:translate-y-1 active:shadow-none border-4 px-4'

function Picture({ emoji }: { emoji: string }) {
  return <div className="text-8xl sm:text-9xl leading-none animate-bounceIn">{emoji}</div>
}

/** So'z qaysi harf bilan boshlanadi? */
export function FirstLetter({ api }: { api: GameApi }) {
  const word = useMemo(() => pickWord(api.level), [api.level])
  const first = letters(word.w)[0]
  const opts = useMemo(() => shuffle([first, ...otherLetters(first, api.level >= 3 ? 3 : 2)]), [first, api.level])
  const c = useChoice(api, first, word.w, [wordKey(word.w)])
  useEffect(() => { say(['al_first', wordKey(word.w)]) }, [word])
  return (
    <div className="flex flex-col items-center gap-5">
      <Picture emoji={word.e} />
      <div className="flex items-center gap-3">
        <span className={`${BIG} tracking-wider`}>
          <span className={`inline-grid place-items-center min-w-[1.4em] rounded-2xl border-4 ${boxColor(c.state)}`}>{c.locked ? first : '?'}</span>
          {c.locked || api.help ? word.w.slice(first.length) : ''}
        </span>
        <Speaker onClick={() => say([wordKey(word.w)])} />
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {opts.map((o) => (
          <button key={o} disabled={c.locked} onClick={() => c.submit(o)} className={`${OPT} w-24 h-24 text-5xl ${choiceClass(o, first, c)}`}>{o}</button>
        ))}
      </div>
    </div>
  )
}

/** So'zni o'qib, rasmini topish. */
export function ReadPicture({ api }: { api: GameApi }) {
  const word = useMemo(() => pickWord(api.level), [api.level])
  const opts = useMemo(() => {
    const others = shuffle(WORDS.filter((w) => w.e !== word.e)).slice(0, api.level >= 3 ? 3 : 2)
    return shuffle([word, ...others])
  }, [word, api.level])
  const c = useChoice(api, word.e, word.w, [wordKey(word.w)])
  useEffect(() => { say(['al_picture']) }, [])
  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`bg-white rounded-3xl shadow-pop px-6 py-4 ${BIG} tracking-wide`}>
        {api.help ? word.s.join('-') : word.w}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {opts.map((o) => (
          <button key={o.e} disabled={c.locked} onClick={() => c.submit(o.e)} className={`${OPT} w-28 h-28 text-6xl ${choiceClass(o.e, word.e, c)}`}>{o.e}</button>
        ))}
      </div>
    </div>
  )
}

/** Bo'g'inlardan so'z yasash. */
export function Syllables({ api }: { api: GameApi }) {
  const word = useMemo(() => pickWord(Math.max(2, api.level), { minSyll: api.level >= 3 ? 3 : 2 }), [api.level])
  const chips = useMemo(() => {
    const extra = api.level >= 4 ? [pick(WORDS.filter((w) => w.w !== word.w && w.s.length > 1)).s[0].toLowerCase()] : []
    return shuffle([...word.s, ...extra.filter((x) => !word.s.includes(x))])
  }, [word, api.level])
  const s = useSequence(api, word.s, word.w, [wordKey(word.w)])
  useEffect(() => { say(['al_syll']) }, [])
  const shown = s.state === 'reveal' ? word.s : s.placed.map((i) => chips[i])
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3"><Picture emoji={word.e} /><Speaker onClick={() => say([wordKey(word.w)])} /></div>
      <div className={`flex gap-2 min-h-[5rem] ${s.state === 'wrong' ? 'animate-shake' : ''}`}>
        {word.s.map((_, i) => (
          <span key={i} className={`grid place-items-center min-w-[4.5rem] h-20 px-2 rounded-2xl border-4 border-dashed text-4xl font-extrabold ${shown[i] ? (s.state === 'reveal' ? 'border-sun bg-sun-light text-sun' : 'border-mint bg-mint-light text-grape-dark') : 'border-grape-light text-gray-300'}`}>
            {shown[i] ?? (api.help && i === 0 ? <span className="opacity-40">{word.s[0]}</span> : '')}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {chips.map((ch, i) => (
          <button key={i} disabled={s.locked || s.placed.includes(i)} onClick={() => s.tap(i, ch)}
            className={`${OPT} h-20 min-w-[5rem] text-4xl ${s.placed.includes(i) ? 'opacity-20' : 'bg-sun-light text-grape-dark border-sun'}`}>{ch}</button>
        ))}
      </div>
    </div>
  )
}

/** Tushib qolgan harfni topish. */
export function MissingLetter({ api }: { api: GameApi }) {
  const word = useMemo(() => pickWord(Math.max(2, api.level)), [api.level])
  const lt = useMemo(() => letters(word.w), [word])
  const hole = useMemo(() => (api.level <= 1 ? 0 : rnd(api.level >= 3 ? 1 : 0, lt.length - 1)), [lt, api.level])
  const correct = hole === 0 ? lt[0] : lt[hole].toLowerCase()
  const opts = useMemo(() => {
    const others = otherLetters(correct, api.level >= 3 ? 3 : 2).map((L) => (hole === 0 ? L : L.toLowerCase()))
    return shuffle([correct, ...others])
  }, [correct, hole, api.level])
  const c = useChoice(api, correct, word.w, [wordKey(word.w)])
  useEffect(() => { say(['al_missing', wordKey(word.w)]) }, [word])
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3"><Picture emoji={word.e} /><Speaker onClick={() => say([wordKey(word.w)])} /></div>
      <div className={`flex flex-wrap justify-center gap-1 ${BIG}`}>
        {lt.map((ch, i) => i === hole
          ? <span key={i} className={`inline-grid place-items-center min-w-[1.4em] h-[1.3em] rounded-2xl border-4 ${boxColor(c.state)}`}>{c.locked ? ch : '?'}</span>
          : <span key={i}>{ch}</span>)}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {opts.map((o) => (
          <button key={o} disabled={c.locked} onClick={() => c.submit(o)} className={`${OPT} w-24 h-24 text-5xl ${choiceClass(o, correct, c)}`}>{o}</button>
        ))}
      </div>
    </div>
  )
}

/** So'zdagi barcha unlilarni bosish. */
export function Vowels({ api }: { api: GameApi }) {
  const word = useMemo(() => pickWord(Math.max(2, api.level)), [api.level])
  const lt = useMemo(() => letters(word.w), [word])
  const need = lt.map((ch, i) => (isVowel(ch) ? i : -1)).filter((i) => i >= 0)
  const [hit, setHit] = useState<number[]>([])
  const [bad, setBad] = useState<number[]>([])
  const [over, setOver] = useState<'ok' | 'reveal' | null>(null)
  useEffect(() => { say(['al_vowels']) }, [])
  const tap = (i: number) => {
    if (over || hit.includes(i) || bad.includes(i)) return
    if (isVowel(lt[i])) {
      const h = [...hit, i]
      setHit(h)
      if (h.length === need.length) {
        setOver('ok'); api.feedback(true)
        setTimeout(() => say([wordKey(word.w)]), 700)
        setTimeout(() => api.done(bad.length === 0, word.w), 2000)
      }
    } else {
      const b = [...bad, i]
      setBad(b); api.feedback(false)
      if (b.length >= 2) {
        setOver('reveal'); setHit(need)
        setTimeout(() => api.done(false, word.w), 2800)
      }
    }
  }
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3"><Picture emoji={word.e} /><Speaker onClick={() => say([wordKey(word.w)])} /></div>
      <div className="text-lg font-bold text-gray-500">Unlilar: a, e, i, o, u, oʻ — {hit.length}/{need.length}</div>
      <div className="flex flex-wrap justify-center gap-2">
        {lt.map((ch, i) => (
          <button key={i} onClick={() => tap(i)} disabled={!!over}
            className={`${OPT} min-w-[4.5rem] h-20 text-5xl ${hit.includes(i) ? (over === 'reveal' ? 'bg-sun-light border-sun text-sun' : 'bg-mint text-white border-mint') : bad.includes(i) ? 'bg-coral-light border-coral text-coral animate-shake' : api.help && isVowel(ch) ? 'bg-white text-grape-dark border-sun' : 'bg-white text-grape-dark border-grape-light'}`}>{ch}</button>
        ))}
      </div>
    </div>
  )
}

/** So'zlardan gap tuzish. */
export function Sentence({ api }: { api: GameApi }) {
  const idx = useMemo(() => pickSentence(api.level), [api.level])
  const target = useMemo(() => sentenceWords(SENTENCES[idx]), [idx])
  const chips = useMemo(() => {
    let c = shuffle(target)
    for (let k = 0; k < 5 && c.join() === target.join(); k++) c = shuffle(target)
    return c
  }, [target])
  const s = useSequence(api, target, `s${idx}`, [`al_s${idx}`])
  useEffect(() => { say(['al_sentence']) }, [])
  const shown = s.state === 'reveal' ? target : s.placed.map((i) => chips[i])
  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`w-full max-w-xl min-h-[6rem] bg-white rounded-3xl shadow-pop p-4 flex flex-wrap gap-2 items-center justify-center text-3xl sm:text-4xl font-extrabold ${s.state === 'wrong' ? 'animate-shake' : ''} ${s.state === 'reveal' ? 'text-sun' : 'text-grape-dark'}`}>
        {shown.length ? <>{shown.join(' ')}{shown.length === target.length ? '.' : ''}</> : <span className="text-gray-300">{api.help ? target[0] + ' …' : '…'}</span>}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {chips.map((w, i) => (
          <button key={i} disabled={s.locked || s.placed.includes(i)} onClick={() => s.tap(i, w)}
            className={`${OPT} h-16 text-2xl sm:text-3xl ${s.placed.includes(i) ? 'opacity-20' : 'bg-sky2-light text-grape-dark border-sky2'}`}>{w}</button>
        ))}
      </div>
    </div>
  )
}

/** Matnni o'qib, savolga javob berish. */
export function ReadText({ api }: { api: GameApi }) {
  const [ti, qi] = useMemo(() => { const t = rnd(0, TEXTS.length - 1); return [t, rnd(0, TEXTS[t].q.length - 1)] }, [])
  const text = TEXTS[ti]
  const [question, answers] = text.q[qi]
  const correct = answers[0]
  const opts = useMemo(() => shuffle(answers), [answers])
  const c = useChoice(api, correct, `t${ti}q${qi}`)
  useEffect(() => { say(api.level <= 2 ? ['al_text', `al_t${ti}`, `al_t${ti}q${qi}`] : ['al_text', `al_t${ti}q${qi}`]) }, [ti, qi, api.level])
  return (
    <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-pop p-4 sm:p-5 text-xl sm:text-2xl font-bold text-gray-700 leading-relaxed w-full">
        📖 {text.t}
        <div className="mt-2"><Speaker onClick={() => say([`al_t${ti}`])} /></div>
      </div>
      <div className="flex items-center gap-2 text-2xl sm:text-3xl font-extrabold text-grape-dark text-center">
        ❓ {question} <Speaker onClick={() => say([`al_t${ti}q${qi}`])} />
      </div>
      <div className="grid gap-3 w-full sm:grid-cols-3">
        {opts.map((o) => (
          <button key={o} disabled={c.locked} onClick={() => c.submit(o)} className={`${OPT} min-h-[4.5rem] text-2xl py-2 ${choiceClass(o, correct, c)}`}>{o}</button>
        ))}
      </div>
    </div>
  )
}

/** Qarama-qarshi ma'noli so'zni topish. */
export function Opposite({ api }: { api: GameApi }) {
  const [pi, dir] = useMemo(() => [rnd(0, OPPOSITES.length - 1), rnd(0, 1)], [])
  const word = OPPOSITES[pi][dir]
  const correct = OPPOSITES[pi][1 - dir]
  const opts = useMemo(() => {
    const others = shuffle(OPPOSITES.filter((_, i) => i !== pi)).slice(0, api.level >= 3 ? 3 : 2).map((p) => p[rnd(0, 1)])
    return shuffle([correct, ...others])
  }, [pi, correct, api.level])
  const c = useChoice(api, correct, `o${pi}`, [correct])
  useEffect(() => { say(['al_opposite']) }, [])
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <div className={`bg-white rounded-3xl shadow-pop px-6 py-4 ${BIG}`}>{word}</div>
        <span className="text-5xl">↔️</span>
        <div className={`rounded-3xl px-6 py-4 border-4 ${BIG} ${boxColor(c.state)}`}>{c.locked ? correct : '?'}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {opts.map((o) => (
          <button key={o} disabled={c.locked} onClick={() => c.submit(o)} className={`${OPT} min-h-[5rem] text-3xl ${choiceClass(o, correct, c)}`}>{o}</button>
        ))}
      </div>
    </div>
  )
}

