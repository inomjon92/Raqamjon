import { useRef, useState } from 'react'
import { AVATARS, AVATAR_LABELS, newProfile, useStore } from '../lib/store'
import { loginAccount, registerAccount } from '../lib/account'
import { GRADES, gradeInfo, type Grade } from '../lib/levels'
import { Avatar, Btn, Card, Mascot, resizePhoto } from '../components/ui'
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
  const [photo, setPhoto] = useState<string | undefined>()
  const fileRef = useRef<HTMLInputElement>(null)
  const [login, setLogin] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [mode, setMode] = useState<'new' | 'login'>('new')

  const [grade, setGradeChoice] = useState<Grade>(1)
  const done = () => { say(['welcome']); onPicked?.(); go('#/') }
  const finish = (g: Grade) => { setGradeChoice(g); setStep(3) }
  /** Profil faqat oxirida yaratiladi (aks holda ilova darhol bosh sahifaga o'tib ketadi). */
  const create = () => { add(name.trim(), avatar ?? AVATARS[0], photo); setGrade(grade); return useStore.getState().profiles.find((x) => x.id === useStore.getState().activeId)! }
  const field = 'w-full text-xl font-bold rounded-2xl border-4 border-grape-light px-4 py-3 outline-none focus:border-grape'
  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(''); try { await fn() } catch (e) { setErr((e as Error).message) } finally { setBusy(false) } }

  if (mode === 'login') return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-5 mt-4">
      <Mascot size="text-8xl" />
      <h1 className="text-3xl font-extrabold text-grape-dark text-center">🔑 Login bilan kirish</h1>
      <Card className="w-full flex flex-col gap-3">
        <p className="text-gray-500 font-bold text-center">Boshqa telefonda qo‘ygan login va parolingni yoz — natijalaring shu yerga keladi.</p>
        <input value={login} onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="Login" autoCapitalize="none" className={field} />
        <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="Parol" className={field} />
        {err && <p className="text-coral font-bold text-center">{err}</p>}
        <Btn size="lg" color="bg-mint text-white" disabled={busy || !login || !pass} onClick={() => run(async () => { await loginAccount(login, pass); done() })}>{busy ? '…' : 'Kirish ➜'}</Btn>
        <Btn color="bg-white text-grape-dark" onClick={() => { setMode('new'); setErr('') }}>⬅ Orqaga</Btn>
      </Card>
    </div>
  )

  if (adding) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center gap-5 mt-4">
        <Mascot size="text-8xl" className="animate-wiggle" />
        <div className="flex gap-2">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-3 w-10 rounded-full ${i <= step ? 'bg-grape' : 'bg-gray-200'}`} />)}</div>
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
            <button className="font-extrabold text-grape underline text-lg" onClick={() => setMode('login')}>🔑 Menda login bor — kirish</button>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-extrabold text-grape-dark text-center">{name}, o‘zingga rasm tanla!</h1>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
              {AVATARS.map((a, i) => (
                <button key={a} onClick={() => { sfx.pop(); setAvatar(a); setPhoto(undefined) }} className={`flex flex-col items-center gap-1 rounded-3xl p-2 transition ${avatar === a && !photo ? 'bg-white ring-4 ring-grape scale-105' : ''}`}>
                  <Avatar p={{ avatar: a }} size="w-24 h-24 text-6xl" />
                  <span className="font-bold text-grape-dark text-sm">{AVATAR_LABELS[i]}</span>
                </button>
              ))}
              <button onClick={() => fileRef.current?.click()} className={`col-span-2 sm:col-span-1 flex flex-col items-center gap-1 rounded-3xl p-2 transition ${photo ? 'bg-white ring-4 ring-grape scale-105' : ''}`}>
                {photo ? <img src={photo} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-white" /> : <span className="w-24 h-24 rounded-full grid place-items-center text-5xl bg-white border-4 border-dashed border-grape-light">📷</span>}
                <span className="font-bold text-grape-dark text-sm">O‘z rasming</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return
                try { const d = await resizePhoto(f); setPhoto(d); setAvatar(avatar ?? AVATARS[0]); sfx.pop() } catch { /* rasm emas */ }
                e.target.value = ''
              }} />
            </div>
            <div className="flex gap-3">
              <Btn color="bg-white text-grape-dark" onClick={() => setStep(0)}>⬅</Btn>
              <Btn size="lg" color="bg-mint text-white" disabled={!avatar} onClick={() => { setStep(2); say(['choose_grade']) }}>Davom etish ➜</Btn>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3"><Avatar p={{ avatar: avatar ?? AVATARS[0], photo }} size="w-16 h-16 text-5xl" /><h1 className="text-3xl font-extrabold text-grape-dark">Nechanchi sinfdasan?</h1></div>
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
        {step === 3 && (
          <>
            <h1 className="text-3xl font-extrabold text-grape-dark text-center">🔑 Login va parol qo‘yamizmi?</h1>
            <Card className="w-full flex flex-col gap-3">
              <p className="text-gray-500 font-bold text-center">Shunda boshqa telefon yoki kompyuterdan kirsang ham yulduz va tangalaring saqlanib qoladi.</p>
              <input value={login} onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))} placeholder="Login (masalan: aziza2019)" autoCapitalize="none" className={field} />
              <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Parol (kamida 4 belgi)" className={field} />
              {err && <p className="text-coral font-bold text-center">{err}</p>}
              <Btn size="lg" color="bg-mint text-white" disabled={busy || login.length < 3 || pass.length < 4} onClick={() => run(async () => {
                const p = newProfile(name.trim(), avatar ?? AVATARS[0])
                const g = gradeInfo(grade)
                Object.assign(p, { photo, grade, savedAt: Date.now() }); p.settings.cap = g.cap as typeof p.settings.cap; p.settings.ops = [...g.ops]
                await registerAccount(p, login, pass)
                done()
              })}>{busy ? '…' : 'Saqlash ➜'}</Btn>
              <Btn color="bg-white text-grape-dark" onClick={() => { create(); done() }}>Keyinroq</Btn>
            </Card>
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
