import { useState } from 'react'
import { AVATARS, useStore } from '../lib/store'
import { GRADES, type Grade } from '../lib/levels'
import { Avatar, Btn, Card, Mascot } from '../components/ui'
import { go } from '../lib/router'
import { say } from '../audio/voice'
import { sfx } from '../audio/sfx'

/** Yangi bola: ism → avatar → sinf. Bir nechta bola bo'lsa — kim o'ynashini tanlash. */
export default function Profiles({ first = false, onPicked }: { first?: boolean; onPicked?: () => void }) {
  const { profiles, setActive, add, setGrade } = useStore()
  const [adding, setAdding] = useState(first || profiles.length === 0)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)

  const finish = (grade: Grade) => {
    add(name.trim(), avatar ?? AVATARS[0])
    setGrade(grade)
    say(['welcome'])
    onPicked?.()
    go('#/')
  }

  if (adding) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center gap-5 mt-4">
        <Mascot size="text-8xl" className="animate-wiggle" />
        <div className="flex gap-2">{[0, 1, 2].map((i) => <span key={i} className={`h-3 w-10 rounded-full ${i <= step ? 'bg-grape' : 'bg-gray-200'}`} />)}</div>
        {step === 0 && (
          <>
            <h1 className="text-3xl font-extrabold text-grape-dark text-center">Salom! Men Bilimdon boyo‘g‘liman 🦉<br />Isming nima?</h1>
            <Card className="w-full flex flex-col gap-4">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} placeholder="Masalan, Aziza" autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { setStep(1); say(['choose_avatar']) } }}
                className="w-full text-2xl font-bold rounded-2xl border-4 border-grape-light px-4 py-3 outline-none focus:border-grape" />
              <Btn size="lg" color="bg-mint text-white" disabled={!name.trim()} onClick={() => { setStep(1); say(['choose_avatar']) }}>Davom etish ➜</Btn>
              {profiles.length > 0 && <Btn color="bg-white text-grape-dark" onClick={() => setAdding(false)}>Bekor qilish</Btn>}
            </Card>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-extrabold text-grape-dark text-center">{name}, o‘zingga rasm tanla!</h1>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 w-full">
              {AVATARS.map((a) => (
                <button key={a} onClick={() => { sfx.pop(); setAvatar(a) }} className={`rounded-full transition ${avatar === a ? 'ring-4 ring-grape scale-110' : ''}`}>
                  <Avatar p={{ avatar: a }} size="w-full aspect-square text-5xl" />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Btn color="bg-white text-grape-dark" onClick={() => setStep(0)}>⬅</Btn>
              <Btn size="lg" color="bg-mint text-white" disabled={!avatar} onClick={() => { setStep(2); say(['choose_grade']) }}>Davom etish ➜</Btn>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3"><Avatar p={{ avatar: avatar ?? AVATARS[0] }} size="w-16 h-16 text-5xl" /><h1 className="text-3xl font-extrabold text-grape-dark">Nechanchi sinfdasan?</h1></div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {GRADES.map((g) => (
                <button key={g.grade} onClick={() => { sfx.tap(); finish(g.grade as Grade) }}
                  className="bg-white rounded-3xl shadow-pop p-4 flex flex-col items-center text-center active:translate-y-1 active:shadow-none border-4 border-transparent hover:border-grape-light">
                  <span className="text-5xl">{g.emoji}</span>
                  <span className="text-2xl font-extrabold text-grape-dark">{g.grade}-sinf</span>
                  <span className="font-bold text-coral">{g.age} yosh</span>
                  <span className="text-sm font-bold text-gray-500 mt-1">{g.about}</span>
                </button>
              ))}
            </div>
            <Btn color="bg-white text-grape-dark" onClick={() => setStep(1)}>⬅ Orqaga</Btn>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center gap-5 mt-4">
      <Mascot size="text-7xl" />
      <h1 className="text-3xl font-extrabold text-grape-dark">Kim o‘ynaydi?</h1>
      <div className="grid grid-cols-2 gap-4 w-full">
        {profiles.map((p) => (
          <button key={p.id} onClick={() => { sfx.tap(); setActive(p.id); onPicked?.(); go('#/') }} className="bg-white rounded-3xl shadow-pop p-4 flex flex-col items-center active:translate-y-1 active:shadow-none">
            <Avatar p={p} size="w-20 h-20 text-6xl" />
            <span className="text-xl font-extrabold text-grape-dark mt-1">{p.name}</span>
            <span className="text-sm font-bold text-gray-500">{p.grade}-sinf</span>
          </button>
        ))}
        {profiles.length < 4 && (
          <button onClick={() => { setAdding(true); setStep(0); setName(''); setAvatar(null) }} className="rounded-3xl border-4 border-dashed border-grape p-4 flex flex-col items-center justify-center text-grape font-extrabold text-xl">
            <span className="text-5xl">➕</span> Yangi bola
          </button>
        )}
      </div>
    </div>
  )
}
