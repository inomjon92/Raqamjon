import { useState } from 'react'
import { AVATARS, useStore } from '../lib/store'
import { Btn, Card, Mascot } from '../components/ui'
import { go } from '../lib/router'
import { say } from '../audio/voice'

export default function Profiles({ first = false }: { first?: boolean }) {
  const { profiles, setActive, add } = useStore()
  const [adding, setAdding] = useState(first || profiles.length === 0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])

  if (adding) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center gap-5 mt-4">
        <Mascot size="text-8xl" className="animate-wiggle" />
        <h1 className="text-3xl font-extrabold text-grape-dark text-center">Salom! Men Bilimdon boyo‘g‘liman 🦉</h1>
        <Card className="w-full flex flex-col gap-4">
          <label className="font-bold text-lg text-gray-600">Bolaning ismi
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} placeholder="Masalan, Aziza"
              className="mt-1 w-full text-2xl font-bold rounded-2xl border-4 border-grape-light px-4 py-3 outline-none focus:border-grape" />
          </label>
          <div>
            <div className="font-bold text-lg text-gray-600 mb-2">Rasmni tanla</div>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button key={a} onClick={() => setAvatar(a)} className={`text-4xl rounded-2xl p-1 ${avatar === a ? 'bg-grape-light ring-4 ring-grape' : 'bg-gray-50'}`}>{a}</button>
              ))}
            </div>
          </div>
          <Btn size="lg" color="bg-mint text-white" disabled={!name.trim()} onClick={() => { add(name.trim(), avatar); say(['welcome']); go('#/') }}>
            Boshladik! ➜
          </Btn>
          {profiles.length > 0 && <Btn color="bg-white text-grape-dark" onClick={() => setAdding(false)}>Bekor qilish</Btn>}
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center gap-5 mt-4">
      <Mascot size="text-7xl" />
      <h1 className="text-3xl font-extrabold text-grape-dark">Kim o‘ynaydi?</h1>
      <div className="grid grid-cols-2 gap-4 w-full">
        {profiles.map((p) => (
          <button key={p.id} onClick={() => { setActive(p.id); go('#/') }} className="bg-white rounded-3xl shadow-pop p-4 flex flex-col items-center active:translate-y-1 active:shadow-none">
            <span className="text-6xl">{p.avatar}</span>
            <span className="text-xl font-extrabold text-grape-dark mt-1">{p.name}</span>
          </button>
        ))}
        {profiles.length < 4 && (
          <button onClick={() => setAdding(true)} className="rounded-3xl border-4 border-dashed border-grape p-4 flex flex-col items-center justify-center text-grape font-extrabold text-xl">
            <span className="text-5xl">➕</span> Yangi bola
          </button>
        )}
      </div>
    </div>
  )
}
