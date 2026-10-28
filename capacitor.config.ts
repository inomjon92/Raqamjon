import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'uz.raqamjon.app',
  appName: 'Raqamjon',
  webDir: 'dist',
  backgroundColor: '#fff8ec',
  android: { allowMixedContent: false },
  // Ilova har doim saytning eng yangi versiyasini ochadi (qayta o'rnatish shart emas).
  // Internet bo'lmasa — APK ichidagi nusxa ochiladi.
  server: { url: 'https://raqamjon.vercel.app', errorPath: 'index.html', androidScheme: 'https' },
}

export default config
