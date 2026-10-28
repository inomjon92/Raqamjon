import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'

// Yangi versiya chiqsa — avtomatik yangilanadi; har soatda tekshiriladi.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) { if (reg) setInterval(() => { void reg.update() }, 60 * 60 * 1000) },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
