// ============================================================
// SafeGround Tactile Audio Engine (Web Audio API)
// Calibrated for a gentle, pleasing, premium organic feel
// Cross-device compatible (macOS/Windows Laptop, iOS, Android)
// ============================================================

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  return audioCtx
}

// Auto-unlock Web Audio on user gesture across all desktop & mobile browsers.
if (typeof window !== 'undefined') {
  const unlock = () => {
    try {
      const ctx = getAudioContext()
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
    } catch (e) {}
  }
  window.addEventListener('pointerdown', unlock, { passive: true, capture: true })
  window.addEventListener('mousedown', unlock, { passive: true, capture: true })
  window.addEventListener('click', unlock, { passive: true, capture: true })
  window.addEventListener('touchstart', unlock, { passive: true, capture: true })
  window.addEventListener('keydown', unlock, { passive: true, capture: true })
}

export function isSoundEnabled(): boolean {
  return true
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('safeground_sound_fx', 'true')
}

/**
 * Execute audio scheduling with guaranteed active AudioContext.
 * On laptops, if AudioContext is suspended, this awaits ctx.resume()
 * so oscillators schedule against the live hardware clock instead of dying on a frozen clock.
 */
async function withAudio(
  callback: (ctx: AudioContext, now: number) => void,
  force = false
): Promise<void> {
  if (!force && !isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    if (ctx.state === 'running') {
      callback(ctx, ctx.currentTime)
    }
  } catch (err) {
    // Graceful fallback if audio device is unavailable
  }
}

/** 
 * Pleasing Soft Tactile Click
 * Soft organic bubble/micro-tap (pure warm sine wave, subtle low volume).
 * Completely non-piercing, pleasant to hear repeatedly.
 */
export function playClickSound(force = false): void {
  withAudio((ctx, now) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    // Gentle warm slide from 520Hz down to 380Hz
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.035)

    // Soft 2ms attack to prevent speaker pop, smooth exponential decay
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.08, now + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.035)
  }, force)
}

/** 
 * Pleasing Soft Confirmation Chime
 * Subtle, warm marimba-style two-tone chime (C5 -> E5).
 * Gentle and polite volume (~0.07).
 */
export function playSuccessSound(force = false): void {
  withAudio((ctx, now) => {
    // Tone 1: Warm C5 (523 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, now)
    gain1.gain.setValueAtTime(0.001, now)
    gain1.gain.linearRampToValueAtTime(0.07, now + 0.004)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.07)

    // Tone 2: Warm E5 (659 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(659.25, now + 0.05)
    gain2.gain.setValueAtTime(0.001, now + 0.05)
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.054)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.05)
    osc2.stop(now + 0.13)
  }, force)
}

/** 
 * Subtle Warning Alert (Gentle alert pip at polite volume)
 */
export function playAlertSound(force = false): void {
  withAudio((ctx, now) => {
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(620, now)
    gain1.gain.setValueAtTime(0.001, now)
    gain1.gain.linearRampToValueAtTime(0.07, now + 0.004)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.06)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(740, now + 0.07)
    gain2.gain.setValueAtTime(0.001, now + 0.07)
    gain2.gain.linearRampToValueAtTime(0.07, now + 0.074)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.07)
    osc2.stop(now + 0.14)
  }, force)
}

/** 
 * Emergency Siren (Softened for comfort)
 */
export function playSirenSound(force = false): void {
  withAudio((ctx, now) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(500, now)
    osc.frequency.linearRampToValueAtTime(800, now + 0.15)
    osc.frequency.linearRampToValueAtTime(520, now + 0.3)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.32)
  }, force)
}

/**
 * Diagnostic test trigger
 */
export function testAudioFeedback(): boolean {
  try {
    setSoundEnabled(true)
    playClickSound(true)
    setTimeout(() => playSuccessSound(true), 100)
    return true
  } catch (e) {
    return false
  }
}

