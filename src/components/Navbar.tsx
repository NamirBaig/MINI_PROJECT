import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, LayoutDashboard, Map, Zap, Thermometer,
  CheckSquare, Package, LogOut, ChevronRight,
  Bot, X, Sparkles, Send, Radio
} from 'lucide-react'
import type { WeatherData } from '../hooks/useWeather'
import { useAuth } from '../hooks/useAuth'
import { playClickSound, playSuccessSound } from '../utils/audioFeedback'
import { useToast } from '../context/ToastContext'
import { AnimatedWeatherIcon, AnimatedWeatherBoxCanvas } from './AnimatedWeatherBadge'

interface NavbarProps {
  user: any
  onSignOut: () => void
  weather: WeatherData
  currentPage?: string
}


const ADVISOR_PROMPTS = [
  { q: 'Why did Yelahanka flood recently?', a: 'Heavy localized rain of 157mm in 4 hours overwhelmed local drains. Lake Amanikere reached full capacity, causing water backflow into Kendriya Vihar and nearby low-lying streets.' },
  { q: 'Which roads in Bengaluru get waterlogged first?', a: 'Silk Board junction, Marathahalli bridge underpass, Hebbal flyover ramp, and Outer Ring Road near EcoSpace are the primary spots prone to quick water accumulation.' },
  { q: 'What should I pack in my emergency flood kit?', a: '• 3 days of drinking water & non-perishable food\n• Battery-powered torch & power bank\n• First aid kit, prescription medicines\n• Waterproof bag for important ID and property papers' },
  { q: 'Emergency numbers to call in Bengaluru', a: '• BBMP 24x7 Helpline: 1533 / 080-22221188\n• Emergency Police & Fire: 112\n• Karnataka Disaster Cell: 1070\n• Ambulance Service: 108' },
]

export default function Navbar({ user, onSignOut, weather }: NavbarProps) {
  const location = useLocation()
  const toast = useToast()
  const { currentRole } = useAuth()
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [advisorInput, setAdvisorInput] = useState('')
  const [advisorMessages, setAdvisorMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Namaskara! I am your SafeGround Bengaluru Emergency Response Advisor. Choose a prompt or type below.' }
  ])

  const isCitizen = currentRole === 'citizen'
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/yelahanka', label: 'Yelahanka Flood Hub', icon: Radio, isLive: true },
    { path: '/risk-map', label: 'Risk Map', icon: Map },
    { path: '/climate', label: 'Climate Trends', icon: Thermometer },
    { path: '/preparedness', label: 'Preparedness', icon: CheckSquare },
    { path: '/resources', label: isCitizen ? 'Beds & Supplies' : 'Municipal Logistics', icon: Package },
  ]

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Resident'
  const email = user?.email || 'citizen@safeground.blr'
  const roleTitle = user?.user_metadata?.role || 'Citizen'
  const badgeLabel = user?.user_metadata?.badge || 'ACTIVE'
  const initials = displayName.slice(0, 2).toUpperCase()

  const floodColor = weather.floodRiskToday > 60 ? '#EF4444' : weather.floodRiskToday > 35 ? '#F59E0B' : '#10B981'

  const handleAskAdvisor = (prompt: { q: string; a: string }) => {
    playClickSound()
    setAdvisorMessages(prev => [
      ...prev,
      { sender: 'user', text: prompt.q },
      { sender: 'bot', text: prompt.a }
    ])
  }

  const handleCustomAdvisorSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!advisorInput.trim()) return
    playClickSound()
    const query = advisorInput.trim()
    setAdvisorInput('')

    let reply = `Regarding "${query}": BBMP Disaster Command recommends checking real-time telemetry on the Yelahanka Hub or contacting the 24x7 control room at 080-22221188 / 1533.`
    const qLower = query.toLowerCase()
    if (qLower.includes('phone') || qLower.includes('number') || qLower.includes('help') || qLower.includes('call')) {
      reply = 'Emergency Helplines: BBMP Control Room: 080-22221188 / 1533 | Police & Emergency: 112 | SDRF Karnataka: 1070 | Ambulance: 108'
    } else if (qLower.includes('lake') || qLower.includes('bellandur') || qLower.includes('varthur')) {
      reply = 'Bellandur and Varthur lakes are currently operating at 78% and 82% holding capacity with active monitoring by KSPCB and BBMP lake engineers.'
    } else if (qLower.includes('boat') || qLower.includes('rescue')) {
      reply = 'BBMP and NDRF maintain 28 motorized rescue boats stationed at Yelahanka Air Base and central fire stations for rapid deployment.'
    }

    setAdvisorMessages(prev => [
      ...prev,
      { sender: 'user', text: query },
      { sender: 'bot', text: reply }
    ])
  }

  return (
    <>
      {/* ─── Desktop Unified Sidebar ────────────────────────── */}
      <aside className="glass-panel desktop-sidebar"
        style={{
          width: '260px',
          height: 'calc(100vh - 42px)',
          position: 'sticky',
          top: '42px',
          background: 'linear-gradient(180deg, rgba(12, 21, 16, 0.98) 0%, rgba(5, 10, 7, 0.99) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 35px rgba(0,0,0,0.6)',
          zIndex: 40,
        }}
      >
        {/* Brand / Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link
            to="/"
            onClick={() => playClickSound()}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
              border: '1px solid rgba(16,185,129,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 16px rgba(16,185,129,0.4)',
            }}>
              <ShieldCheck size={22} color="#030604" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1.2, color: '#ffffff', lineHeight: 1.1 }}>
                SAFEGROUND
              </div>
              <div style={{ fontSize: 10, color: 'var(--pri-neon)', letterSpacing: 0.8, marginTop: 3, fontWeight: 700 }}>
                BENGALURU RESILIENCE
              </div>
            </div>
          </Link>
        </div>

        {/* Live Weather Indicator Pill + Audio HUD Toggle */}
        <div style={{ padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 12,
            padding: '10px 12px',
          }}>
            <AnimatedWeatherBoxCanvas condition={weather.condition} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Bengaluru Live
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#34D399',
                    boxShadow: '0 0 8px #34D399',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontSize: 10, color: '#34D399', fontWeight: 700 }}>Telemetry OK</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <AnimatedWeatherIcon condition={weather.condition} size={22} />
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>
                    {weather.currentTemp}°C
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                  <div style={{ color: 'var(--pri-neon)', fontWeight: 600 }}>{weather.condition}</div>
                  <div style={{ color: floodColor, fontWeight: 700 }}>
                    Flood: {weather.floodRiskToday}%
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const { path, label, icon: Icon } = item
            const isLive = (item as any).isLive
            const isActive = location.pathname === path
            return (
              <Link
                to={path}
                key={path}
                onClick={() => playClickSound()}
                style={{ textDecoration: 'none' }}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                    background: isActive ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.06) 100%)' : 'transparent',
                    border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                    boxShadow: isActive ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <Icon size={17} color={isActive ? '#34D399' : 'rgba(255,255,255,0.6)'} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {isLive && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399' }} />
                      LIVE
                    </span>
                  )}
                  {isActive && !isLive && <ChevronRight size={14} color="#34D399" />}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Response Advisor Trigger */}
        <div style={{ padding: '0 12px 12px' }}>
          <motion.button
            whileHover={{ scale: 1.02, background: 'rgba(16, 185, 129, 0.18)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playClickSound()
              setAdvisorOpen(true)
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#34D399',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Bot size={18} />
            <span>Response Advisor</span>
            <Sparkles size={14} style={{ marginLeft: 'auto', opacity: 0.9 }} />
          </motion.button>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
            color: '#030604',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {displayName}
            </div>
            <div style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 700,
              color: '#34D399',
              background: 'rgba(16, 185, 129, 0.18)',
              padding: '1px 6px',
              borderRadius: 4,
              marginTop: 2,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              {roleTitle}
            </div>
          </div>

          {/* Interactive Sign Out Button */}
          <motion.button
            whileHover={{ scale: 1.15, color: '#EF4444', background: 'rgba(239, 68, 68, 0.15)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              playClickSound()
              onSignOut()
            }}
            title="Sign Out to Switch Persona"
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              color: '#F87171',
              cursor: 'pointer',
              padding: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </aside>

      {/* ─── Response Advisor Modal ─────────────────────────── */}
      <AnimatePresence>
        {advisorOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              style={{
                background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 18,
                width: '100%',
                maxWidth: 580,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.2)',
                color: '#ffffff',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '18px 22px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34D399',
                  }}>
                    <Bot size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>SafeGround Emergency Response Advisor</div>
                    <div style={{ fontSize: 11, color: 'var(--pri-neon)' }}>Trained on Bengaluru Hydrology & BBMP Protocols</div>
                  </div>
                </div>
                <button
                  onClick={() => setAdvisorOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {advisorMessages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: m.sender === 'user'
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : 'rgba(255, 255, 255, 0.06)',
                      color: m.sender === 'user' ? '#030604' : '#ffffff',
                      fontWeight: m.sender === 'user' ? 600 : 400,
                      fontSize: 13,
                      lineHeight: 1.5,
                      border: m.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              {/* Preset Prompts */}
              <div style={{ padding: '10px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>Suggested Inquiries:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ADVISOR_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleAskAdvisor(p)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 11,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {p.q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <form onSubmit={handleCustomAdvisorSend} style={{ padding: '14px 22px', display: 'flex', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  type="text"
                  placeholder="Ask advisor anything about flood safety or helplines..."
                  value={advisorInput}
                  onChange={e => setAdvisorInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    fontSize: 13,
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'var(--pri)',
                    color: '#030604',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Send size={14} /> Send
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
