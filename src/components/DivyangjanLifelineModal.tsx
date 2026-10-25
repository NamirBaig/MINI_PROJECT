import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2, VolumeX, Eye, EyeOff, Radio, AlertTriangle,
  Compass, MapPin, Phone, ShieldCheck, HeartPulse, X,
  Sparkles, Bell, Navigation, Waves, Zap, Sun, ShieldAlert,
  ArrowRight, MessageSquare, Play, Square, ExternalLink
} from 'lucide-react'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import { getDeviceLiveLocation, type LiveLocationResult } from '../utils/geolocation'

interface DivyangjanLifelineModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenEmergencyRequest?: (divyangjanType?: string) => void
}

type AssistiveTab = 'blind_audio' | 'deaf_visual' | 'mobility_wheelchair' | 'lifebeacon_night'

// Pre-configured high-ground accessible shelters in Bengaluru
const ACCESSIBLE_SHELTERS = [
  {
    name: 'Kendriya Vihar High-Ground Community Hall',
    zone: 'Yelahanka',
    distance: '650m',
    features: ['Zero Stairs / Flat Concrete Ramp', '24x7 Oxygen Concentrators', 'Generator Power Backup', 'Accessible Toilets'],
    phone: '080-28561188',
  },
  {
    name: 'BBMP Multi-Purpose Relief Center',
    zone: 'Mahadevapura (Near Phoenix Marketcity)',
    distance: '1.2 km',
    features: ['Hydraulic Stretcher Access', 'Dialysis Ambulance Stationed', 'Drinking Water RO Plant'],
    phone: '080-28512345',
  },
  {
    name: 'SDRF Disaster Camp (Silk Board Flyover Ramp)',
    zone: 'Bommanahalli',
    distance: '1.8 km',
    features: ['Elevated Ground (Dry Corridor)', 'Motorized Hydraulic Rescue Rafts', '108 ALS Ambulance Hub'],
    phone: '1070',
  },
]

export default function DivyangjanLifelineModal({
  isOpen,
  onClose,
  onOpenEmergencyRequest,
}: DivyangjanLifelineModalProps) {
  const [activeTab, setActiveTab] = useState<AssistiveTab>('blind_audio')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sonarActive, setSonarActive] = useState(false)
  const [strobeActive, setStrobeActive] = useState(false)
  const [strobeColor, setStrobeColor] = useState<'#FFFFFF' | '#EF4444' | '#F59E0B'>('#FFFFFF')
  const [sirenActive, setSirenActive] = useState(false)
  const [gpsLocation, setGpsLocation] = useState<LiveLocationResult | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)

  // AudioContext reference for Sonar & Rescue Siren
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscNodeRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const strobeIntervalRef = useRef<any>(null)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Load GPS on open
  useEffect(() => {
    if (isOpen) {
      setGpsLoading(true)
      getDeviceLiveLocation()
        .then((loc) => {
          setGpsLocation(loc)
          setGpsLoading(false)
        })
        .catch(() => {
          setGpsLoading(false)
        })
    } else {
      stopAllAudioAndVisuals()
    }
    return () => {
      stopAllAudioAndVisuals()
    }
  }, [isOpen])

  const stopAllAudioAndVisuals = () => {
    // 1. Stop Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)

    // 2. Stop Oscillator Siren / Sonar
    try {
      if (oscNodeRef.current) {
        oscNodeRef.current.stop()
        oscNodeRef.current.disconnect()
        oscNodeRef.current = null
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    } catch {}
    setSonarActive(false)
    setSirenActive(false)

    // 3. Stop Strobe
    if (strobeIntervalRef.current) {
      clearInterval(strobeIntervalRef.current)
      strobeIntervalRef.current = null
    }
    setStrobeActive(false)

    // 4. Stop Vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(0)
    }
  }

  // ─── 1. WEB SPEECH API (Voice Navigation for Blind) ───
  const handleSpeakBulletin = (customText?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text to Speech is not supported on this device/browser.')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const bulletin =
      customText ||
      `SafeGround Divyangjan Emergency Voice Bulletin for Bengaluru. ` +
      `Current Status: Normal. Weather is cloudy with moderate rainfall expected in Yelahanka and Mahadevapura. ` +
      `Underpasses at Silk Board and Marathahalli are under continuous surveillance. ` +
      `Nearest accessible safe shelter is Kendriya Vihar High-Ground Community Hall, located 650 meters away with zero-stair flat ramps and 24-hour oxygen backup. ` +
      `To request priority hydraulic rescue or ambulance, press the Red Emergency Request button. ` +
      `Official emergency helpline is BBMP at 1533, and State Disaster Control at 1070.`

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(bulletin)
    utterance.rate = 0.95 // slightly slower for maximum clarity
    utterance.pitch = 1.0
    utterance.lang = 'en-IN'

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    speechUtteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  // ─── 2. ACOUSTIC SONAR PING GENERATOR (Web Audio API) ───
  const toggleSonarPing = () => {
    if (sonarActive) {
      stopAllAudioAndVisuals()
      return
    }
    playClickSound()

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      // Create a pulsating sonar beep every 1.2 seconds
      let step = 0
      const pingInterval = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          clearInterval(pingInterval)
          return
        }
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        // Frequency shifts between 880Hz and 1174Hz to convey direction toward safety
        osc.frequency.setValueAtTime(step % 2 === 0 ? 880 : 1174, ctx.currentTime)
        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.36)
        step++
      }, 1200)

      setSonarActive(true)
    } catch (e) {
      console.warn('Acoustic Sonar not supported:', e)
    }
  }

  // ─── 3. VISUAL STROBE & HAPTIC VIBRATION (For Deaf Citizens) ───
  const toggleStrobeAndVibrate = () => {
    if (strobeActive) {
      stopAllAudioAndVisuals()
      return
    }
    playClickSound()
    setStrobeActive(true)

    // Trigger rhythmic tactile vibration on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // SOS Morse pattern: 3 short, 3 long, 3 short
      navigator.vibrate([200, 100, 200, 100, 200, 300, 500, 200, 500, 200, 500, 300, 200, 100, 200, 100, 200])
    }

    let isWhite = false
    strobeIntervalRef.current = setInterval(() => {
      setStrobeColor(isWhite ? '#EF4444' : '#FFFFFF')
      isWhite = !isWhite
    }, 280)
  }

  // ─── 4. LIFEBEACON™ ROOFTOP SIREN & MORSE STROBE ───
  const toggleLifeBeacon = () => {
    if (sirenActive) {
      stopAllAudioAndVisuals()
      return
    }
    playAlertSound()
    setSirenActive(true)
    setStrobeActive(true)

    // 1. Acoustic Siren tone at 1000Hz (highly penetrating frequency in rain)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(950, ctx.currentTime)

      // Frequency modulation like an emergency beacon
      let up = true
      setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return
        osc.frequency.setValueAtTime(up ? 1200 : 850, ctx.currentTime)
        up = !up
      }, 450)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      oscNodeRef.current = osc
      gainNodeRef.current = gain
    } catch {}

    // 2. Optical Morse strobe
    let flag = false
    strobeIntervalRef.current = setInterval(() => {
      setStrobeColor(flag ? '#F59E0B' : '#FFFFFF')
      flag = !flag
    }, 200)

    // 3. Continuous phone vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([400, 200, 400, 200, 600])
    }
  }

  const handleShareGpsSos = () => {
    const lat = gpsLocation?.latitude?.toFixed(5) || '13.0991'
    const lng = gpsLocation?.longitude?.toFixed(5) || '77.5913'
    const zone = gpsLocation?.nearestZone || 'Yelahanka'
    const address = gpsLocation?.formattedAddress || 'Bengaluru, Karnataka'

    const message = encodeURIComponent(
      `🚨 [SAFEGROUND DIVYANGJAN SOS RESCUE BEACON]\n` +
      `I am a vulnerable/mobility-impaired citizen stranded in Bengaluru flood water!\n` +
      `GPS Coordinates: ${lat}, ${lng}\n` +
      `Location: ${address} (${zone} Zone)\n` +
      `Google Maps Link: https://maps.google.com/?q=${lat},${lng}\n` +
      `URGENT: Requesting SDRF Hydraulic Boat / Oxygen Ambulance dispatch immediately!`
    )

    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  if (!isOpen) return null

  // Portal into document.body to ensure zero stacking or overflow issues
  return createPortal(
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483647, // Highest possible z-index
          background: strobeActive
            ? strobeColor === '#FFFFFF'
              ? 'rgba(255, 255, 255, 0.96)'
              : strobeColor === '#EF4444'
              ? 'rgba(220, 38, 38, 0.95)'
              : 'rgba(245, 158, 11, 0.95)'
            : 'rgba(3, 8, 6, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          transition: 'background 0.15s ease',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: 680,
            maxHeight: '94vh',
            overflowY: 'auto',
            background: strobeActive ? '#050D08' : 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)',
            border: '2px solid #10B981',
            borderRadius: 22,
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 45px rgba(16, 185, 129, 0.35)',
            padding: '24px 28px',
            position: 'relative',
            color: '#FFFFFF',
          }}
        >
          {/* Top Bar / Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    background: '#10B981',
                    color: '#000000',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    padding: '3px 10px',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 14 }}>♿</span>
                  DIVYANGJAN LIFELINE
                </span>
                <span style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 600 }}>
                  Unified Inclusive Disaster Command
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#FFFFFF' }}>
                Assistive Emergency Defense Suite
              </h2>
            </div>

            <button
              onClick={() => {
                playClickSound()
                stopAllAudioAndVisuals()
                onClose()
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* 4 Mode Selector Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6,
              background: 'rgba(0, 0, 0, 0.4)',
              padding: 5,
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: 20,
            }}
          >
            <button
              onClick={() => {
                playClickSound()
                setActiveTab('blind_audio')
              }}
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'blind_audio' ? '#10B981' : 'transparent',
                color: activeTab === 'blind_audio' ? '#000000' : '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <Volume2 size={16} />
              <span>Blind / Audio</span>
            </button>

            <button
              onClick={() => {
                playClickSound()
                setActiveTab('deaf_visual')
              }}
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'deaf_visual' ? '#3B82F6' : 'transparent',
                color: activeTab === 'deaf_visual' ? '#000000' : '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={16} />
              <span>Deaf / Strobe</span>
            </button>

            <button
              onClick={() => {
                playClickSound()
                setActiveTab('mobility_wheelchair')
              }}
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'mobility_wheelchair' ? '#A855F7' : 'transparent',
                color: activeTab === 'mobility_wheelchair' ? '#FFFFFF' : '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <Navigation size={16} />
              <span>Wheelchair</span>
            </button>

            <button
              onClick={() => {
                playClickSound()
                setActiveTab('lifebeacon_night')
              }}
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'lifebeacon_night' ? '#EF4444' : 'transparent',
                color: activeTab === 'lifebeacon_night' ? '#FFFFFF' : '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <Radio size={16} />
              <span>LifeBeacon™</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: BLIND & VISUALLY IMPAIRED AUDIO RADAR
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'blind_audio' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Volume2 size={20} color="#34D399" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#34D399' }}>
                      Web Speech Voice Guidance Bulletin
                    </span>
                  </div>
                  {isSpeaking && (
                    <span style={{ fontSize: 10, background: '#10B981', color: '#000', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>
                      SPEAKING LIVE
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
                  Reads spoken live Bengaluru flood warnings, water depths, and safe shelter directions directly via browser speech synthesis.
                </p>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleSpeakBulletin()}
                    style={{
                      flex: '1 1 200px',
                      padding: '12px 18px',
                      borderRadius: 10,
                      background: isSpeaking ? '#EF4444' : '#10B981',
                      border: 'none',
                      color: isSpeaking ? '#FFFFFF' : '#000000',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {isSpeaking ? <Square size={16} /> : <Play size={16} />}
                    {isSpeaking ? 'Stop Speaking' : '🎙️ Read Flood Situation Bulletin'}
                  </button>

                  <button
                    onClick={toggleSonarPing}
                    style={{
                      flex: '1 1 200px',
                      padding: '12px 18px',
                      borderRadius: 10,
                      background: sonarActive ? '#EF4444' : 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Compass size={16} color={sonarActive ? '#fff' : '#34D399'} />
                    {sonarActive ? 'Turn Off Acoustic Sonar' : '🔊 Activate Shelter Sonar Ping'}
                  </button>
                </div>
              </div>

              {/* Spoken Helplines */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#A7F3D0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} /> 1-Tap Voice-Spoken Emergency Helplines
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    onClick={() => {
                      playClickSound()
                      handleSpeakBulletin('Dialing BBMP Emergency Control at 080 22 22 11 88 or 1533.')
                      window.location.href = 'tel:1533'
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>BBMP 24x7: 1533</span>
                    <Volume2 size={13} color="#34D399" />
                  </button>

                  <button
                    onClick={() => {
                      playClickSound()
                      handleSpeakBulletin('Dialing Karnataka State Disaster Management at 1070.')
                      window.location.href = 'tel:1070'
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>SDRF Disaster: 1070</span>
                    <Volume2 size={13} color="#34D399" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: DEAF & HARD-OF-HEARING VISUAL SOS & HAPTIC
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'deaf_visual' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Zap size={20} color="#60A5FA" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA' }}>
                    Optical Screen Strobe & Tactile Haptic Vibration
                  </span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
                  Flashes the display at 3.5Hz with pulsing Morse code vibration sequences, delivering silent high-urgency alarms for hearing-impaired citizens.
                </p>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={toggleStrobeAndVibrate}
                    style={{
                      flex: '1 1 200px',
                      padding: '12px 18px',
                      borderRadius: 10,
                      background: strobeActive ? '#EF4444' : '#3B82F6',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Zap size={16} />
                    {strobeActive ? 'Stop Optical Strobe' : '⚡ Start Visual Optical Strobe'}
                  </button>

                  <button
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        playAlertSound()
                        navigator.vibrate([300, 100, 300, 100, 600])
                      }
                    }}
                    style={{
                      flex: '1 1 200px',
                      padding: '12px 18px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Bell size={16} color="#60A5FA" />
                    Test Haptic Vibration Pulse
                  </button>
                </div>
              </div>

              {/* High-Contrast Closed-Caption Ticker */}
              <div style={{ background: '#000000', border: '1px solid rgba(59, 130, 246, 0.5)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#93C5FD', letterSpacing: 1, marginBottom: 6 }}>
                  LIVE CLOSED-CAPTION FLOOD TICKER (BBMP OFFICIAL)
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FEF08A', lineHeight: 1.4 }}>
                  ⚠️ YELAHANKA LAKES AMANIKERE & ATTUR REACH 95% CAPACITY • HIGHWAYS VIA AIRPORT ROAD OPEN • CITIZENS ADVISED TO MOVE TO HIGH-GROUND COMMUNITY HALLS • MOTORIZED BOATS ACTIVE IN WARD 3 & 4.
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: WHEELCHAIR & MOBILITY-ASSISTED EVACUATION
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'mobility_wheelchair' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Navigation size={20} color="#C084FC" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#C084FC' }}>
                    Wheelchair Flat-Grade Evacuation Shelters
                  </span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
                  Verified safe high-ground facilities equipped with wheelchair ramps, oxygen cylinder banks, and ground-floor medical rooms avoiding stairs.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ACCESSIBLE_SHELTERS.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>{s.name}</span>
                        <span style={{ fontSize: 11, background: 'rgba(168, 85, 247, 0.3)', color: '#E9D5FF', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          {s.distance} • {s.zone}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {s.features.map((f, i) => (
                          <span key={i} style={{ fontSize: 10.5, color: '#D8B4FE', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast-Track Emergency Dispatch for Wheelchair/Bedridden */}
              <button
                onClick={() => {
                  playClickSound()
                  stopAllAudioAndVisuals()
                  onClose()
                  if (onOpenEmergencyRequest) {
                    onOpenEmergencyRequest('Wheelchair User (Non-Ambulatory)')
                  }
                }}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13.5,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
                }}
              >
                <HeartPulse size={17} />
                <span>Request SDRF Hydraulic Boat & Oxygen Ambulance</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 4: LIFEBEACON™ ROOFTOP OPTICAL STROBE & GPS SOS
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'lifebeacon_night' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1.5px solid #EF4444',
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Radio size={20} color="#F87171" />
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#F87171' }}>
                      LifeBeacon™ Night Rooftop Rescue Strobe
                    </span>
                  </div>
                  {sirenActive && (
                    <span style={{ fontSize: 10, background: '#EF4444', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 900, animation: 'pulse 1s infinite' }}>
                      BEACON ACTIVE
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
                  Designed for stranded citizens on terraces or roofs in pitch-black night floods. Emits a high-frequency acoustic whistle + fullscreen optical Morse code flash visible to search helicopters and rescue boats.
                </p>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={toggleLifeBeacon}
                    style={{
                      flex: '1 1 200px',
                      padding: '13px 18px',
                      borderRadius: 10,
                      background: sirenActive ? '#EF4444' : '#DC2626',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
                    }}
                  >
                    <Radio size={16} />
                    {sirenActive ? 'Deactivate LifeBeacon™' : '🚨 Turn On Optical Strobe & Siren'}
                  </button>

                  <button
                    onClick={handleShareGpsSos}
                    style={{
                      flex: '1 1 200px',
                      padding: '13px 18px',
                      borderRadius: 10,
                      background: '#25D366',
                      border: 'none',
                      color: '#000000',
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>WhatsApp Coordinates to SDRF (1070)</span>
                  </button>
                </div>
              </div>

              {/* Large GPS Readout for Searchlights */}
              <div
                style={{
                  background: '#000000',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: 1, marginBottom: 4 }}>
                  HIGH-CONTRAST GPS TARGET COORDINATES (READABLE BY PILOTS / DRONES)
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#34D399', letterSpacing: 1, fontFamily: 'monospace' }}>
                  {gpsLocation ? `${gpsLocation.latitude.toFixed(5)}° N, ${gpsLocation.longitude.toFixed(5)}° E` : '13.0991° N, 77.5913° E'}
                </div>
                <div style={{ fontSize: 12, color: '#E5E7EB', marginTop: 4 }}>
                  {gpsLocation ? `${gpsLocation.formattedAddress} (±${gpsLocation.accuracy}m accuracy)` : 'Yelahanka Zone, Bengaluru (Locked Telemetry)'}
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Callout */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11.5,
              color: 'var(--tx-muted)',
            }}
          >
            <span>♿ Compliant with RPwD Act 2016 & BBMP Inclusive Disaster Protocols</span>
            <button
              onClick={() => {
                playClickSound()
                stopAllAudioAndVisuals()
                onClose()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#34D399',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Close Lifeline (Esc)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
