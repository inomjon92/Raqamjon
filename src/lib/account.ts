import { rpc, summarize } from './cloud'
import { useStore, type Profile } from './store'

/** Bolaning login/parolli onlayn hisobi: bir nechta qurilmadan kirib, natijalarni saqlab borish. */

/** Serverga yuboriladigan nusxa (hisob tokenisiz). */
const snapshot = (p: Profile) => { const { account: _a, ...rest } = p; void _a; return { ...rest, savedAt: p.savedAt ?? Date.now() } }

export async function registerAccount(p: Profile, login: string, password: string) {
  const r = await rpc<{ login: string; token: string }>('account_register', { p_login: login, p_password: password, p_profile: snapshot(p) })
  // Yangi bola bo'lsa — qo'shiladi, mavjud bo'lsa — hisob biriktiriladi.
  const cur = useStore.getState().profiles.find((x) => x.id === p.id) ?? p
  useStore.getState().putProfile({ ...cur, account: r }, !useStore.getState().profiles.some((x) => x.id === p.id))
  await joinFamily()
}

export async function loginAccount(login: string, password: string) {
  const r = await rpc<{ login: string; token: string; profile: Profile }>('account_login', { p_login: login, p_password: password })
  useStore.getState().putProfile({ ...r.profile, account: { login: r.login, token: r.token } }, true)
  await joinFamily()
  return r.profile
}

/** Oila paneliga ulangan qurilmada bola hisoblarini oilaga bog'laydi. */
export async function joinFamily() {
  const st = useStore.getState()
  if (!st.cloud) return
  for (const p of st.profiles) if (p.account) await rpc('account_join_family', { p_family_token: st.cloud.token, p_account_token: p.account.token }).catch(() => {})
}

/** Ilova ochilganda: boshqa qurilmada o'ynalgan bo'lsa, yangiroq natijalarni olib kelish. */
export async function pullAccounts() {
  for (const p of useStore.getState().profiles) {
    if (!p.account) continue
    try {
      const r = await rpc<{ profile: Profile; savedAt: number }>('account_load', { p_token: p.account.token })
      if (r.savedAt > (p.savedAt ?? 0)) useStore.getState().putProfile({ ...r.profile, account: p.account })
    } catch { /* internet yo'q — keyinroq */ }
  }
}

const sent = new Map<string, number>()
/** O'zgargan hisoblarni serverga yozish. */
export async function pushAccounts() {
  const st = useStore.getState()
  for (const p of st.profiles) {
    if (!p.account || !p.savedAt || sent.get(p.id) === p.savedAt) continue
    try {
      const r = await rpc<{ saved: boolean; profile?: Profile; savedAt?: number }>('account_save', { p_token: p.account.token, p_profile: snapshot(p), p_summary: summarize(p, st.admin.hidden) })
      sent.set(p.id, p.savedAt)
      if (!r.saved && r.profile && (r.savedAt ?? 0) > p.savedAt) useStore.getState().putProfile({ ...r.profile, account: p.account })
    } catch { /* internet yo'q — keyinroq */ }
  }
}
