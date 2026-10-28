let ctx: AudioContext | null = null
function ac() {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

let volume = 0.6
export const setSfxVolume = (v: number) => { volume = v }

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.25) {
  if (volume <= 0) return
  const c = ac()
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, c.currentTime + start)
  g.gain.setValueAtTime(0, c.currentTime + start)
  g.gain.linearRampToValueAtTime(gain * volume, c.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur)
  o.connect(g).connect(c.destination)
  o.start(c.currentTime + start)
  o.stop(c.currentTime + start + dur + 0.05)
}

export const sfx = {
  correct() { tone(660, 0, 0.15, 'triangle'); tone(880, 0.1, 0.18, 'triangle'); tone(1320, 0.2, 0.25, 'triangle', 0.18) },
  wrong() { tone(330, 0, 0.18, 'sine', 0.18); tone(262, 0.14, 0.25, 'sine', 0.15) },
  tap() { tone(520, 0, 0.06, 'triangle', 0.12) },
  pop() { tone(900, 0, 0.05, 'square', 0.08); tone(1400, 0.03, 0.06, 'triangle', 0.1) },
  coin() { tone(988, 0, 0.08, 'square', 0.08); tone(1319, 0.07, 0.18, 'square', 0.08) },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.2)) },
  bead() { tone(1200, 0, 0.04, 'square', 0.06) },
  whoosh() { tone(400, 0, 0.12, 'sawtooth', 0.04); tone(700, 0.05, 0.12, 'sawtooth', 0.03) },
}
