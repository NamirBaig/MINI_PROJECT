import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, LayoutDashboard, Map, Zap, Thermometer,
  CheckSquare, Package, LogOut, ChevronRight, Droplets,
  Wind, AlertTriangle, Bot, X, Sparkles, Send, HelpCircle
} from 'lucide-react'
import type { WeatherData } from '../hooks/useWeather'

interface NavbarProps {
  user: any
  onSignOut: () => void
  weather: WeatherData
  currentPage?: string
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/risk-map', label: 'Risk Map', icon: Map },
  { path: '/simulation', label: 'Simulation', icon: Zap },
  { path: '/climate', label: 'Climate Trends', icon: Thermometer },
  { path: '/preparedness', label: 'Preparedness', icon: CheckSquare },
  { path: '/resources', label: 'Resources', icon: Package },
]

const ADVISOR_PROMPTS = [
  { q: 'Explain current flood risk in Bengaluru', a: 'Bengaluru storm drains currently have an estimated capacity limit of 7mm/h. With recent precipitation, low-lying lake buffers near Bellandur, Varthur, and Outer Ring Road underpasses are on high alert.' },
  { q: 'What is my 72-hour family action plan?', a: '1. Store 3L potable water per person/day (min 3 days supply).\n2. Pack battery backup, copies of IDs in waterproof zip pouch.\n3. Know non-waterlogged exits toward elevated ground (e.g. National College / Yelahanka Stadium).' },
  { q: 'Why did Sep 2022 megaflood happen?', a: 'Bengaluru recorded 131mm of rainfall in 24 hours. Historical lake chain cascades were blocked by urban encroachments, resulting in Bellandur & Varthur spillover directly flooding the Mahadevapura IT corridor.' },
  { q: 'Who do I call in an emergency?', a: '• BBMP Disaster Helpline: 080-22221188 / 1533\n• State Emergency Response: 112\n• Karnataka SDRF: 1070\n• BWSSB Water Line: 1916' },
]

export default function Navbar({ user, onSignOut, weather }: NavbarProps) {
  const location = useLocation()
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [advisorMessages, setAdvisorMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Hello! I am your SafeGround Bengaluru Emergency Response Advisor. Choose a prompt below or ask for real-time guidance.' }
  ])

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Resident'
  const email = user?.email || 'citizen@safeground.blr'
  const initials = displayName.slice(0, 2).toUpperCase()

  const floodColor = weather.floodRiskToday > 60 ? '#C85C45' : weather.floodRiskToday > 35 ? '#D59A2A' : '#4c8c5e'

  const handleAskAdvisor = (prompt: { q: string; a: string }) => {
    setAdvisorMessages(prev => [
      ...prev,
      { sender: 'user', text: prompt.q },
      { sender: 'bot', text: prompt.a }
    ])
  }

  return (
    <>
      {/* ─── Desktop Unified Sidebar ────────────────────────── */}
      <aside
        style={{
          width: '240px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(180deg, #17372D 0%, #132d25 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
          zIndex: 40,
        }}
      >
        {/* Brand / Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldCheck size={20} color="#9DBFA9" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.2, color: '#ffffff', lineHeight: 1.1 }}>
                SAFEGROUND
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginTop: 2 }}>
                BENGALURU RESILIENCE
              </div>
            </div>
          </Link>
        </div>

        {/* Live Weather Indicator Pill */}
        <div style={{ padding: '14px 16px 8px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Bengaluru Live
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 8px #4ade80',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>Active</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff' }}>
                {weather.currentTemp}°C
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                <div>Rain: {weather.rainfall1h}mm/h</div>
                <div style={{ color: floodColor, fontWeight: 600 }}>
                  Flood: {weather.floodRiskToday}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <Link to={path} key={path} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    background: isActive ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <Icon size={17} color={isActive ? '#9DBFA9' : 'rgba(255,255,255,0.6)'} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {isActive && <ChevronRight size={14} color="#9DBFA9" />}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Response Advisor Trigger */}
        <div style={{ padding: '0 12px 14px' }}>
          <motion.button
            whileHover={{ scale: 1.02, background: 'rgba(157, 191, 169, 0.22)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAdvisorOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid rgba(157, 191, 169, 0.3)',
              background: 'rgba(157, 191, 169, 0.12)',
              color: '#9DBFA9',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Bot size={18} />
            <span>Response Advisor</span>
            <Sparkles size={13} style={{ marginLeft: 'auto', opacity: 0.8 }} />
          </motion.button>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9DBFA9 0%, #7ca892 100%)',
            color: '#17372D',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, color: '#f87171' }}
            whileTap={{ scale: 0.9 }}
            onClick={onSignOut}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </aside>

      {/* ─── Response Advisor Slide-Over Drawer ──────────────── */}
      <AnimatePresence>
        {advisorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdvisorOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(3px)',
                zIndex: 90,
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(440px, 100%)',
                background: 'var(--bg)',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid var(--ln)',
              }}
            >
              {/* Drawer Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--ln)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--surf)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--pri)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={18} color="#9DBFA9" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Response Advisor</h3>
                    <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Emergency Decision Intelligence</div>
                  </div>
                </div>
                <button
                  onClick={() => setAdvisorOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {advisorMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: msg.sender === 'user' ? 'var(--pri)' : 'var(--surf)',
                      color: msg.sender === 'user' ? '#ffffff' : 'var(--tx)',
                      fontSize: 14,
                      lineHeight: 1.5,
                      border: msg.sender === 'user' ? 'none' : '1px solid var(--ln)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {msg.text}
                  </motion.div>
                ))}
              </div>

              {/* Prompt Suggestions */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ln)', background: 'var(--surf)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-muted)', marginBottom: 10 }}>
                  SUGGESTED SCENARIOS:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ADVISOR_PROMPTS.map((p, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ x: 2, background: 'var(--bg)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAskAdvisor(p)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--ln)',
                        background: 'var(--surf)',
                        fontSize: 13,
                        color: 'var(--tx)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      💡 {p.q}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
