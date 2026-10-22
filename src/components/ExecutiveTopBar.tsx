import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Radio, LogOut,
  Users, ChevronDown, Check, Sparkles, Activity, Clock
} from 'lucide-react'
import { useAuth, type UserRole, ROLE_PRESETS } from '../hooks/useAuth'
import { playClickSound, playSuccessSound } from '../utils/audioFeedback'
import { useToast } from '../context/ToastContext'
import type { WeatherData } from '../hooks/useWeather'
import { AnimatedWeatherIcon } from './AnimatedWeatherBadge'

interface ExecutiveTopBarProps {
  user: any
  onSignOut: () => void
  weather: WeatherData
}

export default function ExecutiveTopBar({ user, onSignOut, weather }: ExecutiveTopBarProps) {
  const { loginAsRole } = useAuth()
  const toast = useToast()
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [timeStr, setTimeStr] = useState<string>('')

  // Precision digital clock synced to Bengaluru time (IST)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const istTime = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      setTimeStr(`${istTime} IST`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSwitchRole = (role: UserRole) => {
    playSuccessSound()
    loginAsRole(role)
    const preset = ROLE_PRESETS[role]
    toast.success('Clearance Switched', `Active session: ${preset.name} (${preset.title})`)
    setRoleMenuOpen(false)
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Resident'
  const roleTitle = user?.user_metadata?.role || 'Verified Resident'
  const badge = user?.user_metadata?.badge || 'ACTIVE'

  return (
    <header
      className="executive-topbar"
      style={{
        height: '42px',
        background: 'rgba(6, 11, 8, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 85,
        fontSize: '11px',
        color: 'var(--tx)',
      }}
    >
      {/* ─── Left: Defense Grid Telemetry Heartbeat ────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Status LED */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 10px #10B981, 0 0 20px rgba(16, 185, 129, 0.5)',
              display: 'inline-block',
              animation: 'pulse 2s infinite ease-in-out',
            }}
          />
          <span style={{ fontWeight: 800, letterSpacing: '0.04em', color: '#10B981' }}>
            STATUS: NORMAL (ALL CLEAR)
          </span>
        </div>

        <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>

        {/* Real-time IST Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'monospace' }}>
          <Clock size={12} color="#34D399" />
          <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{timeStr || '01:00:00 IST'}</span>
        </div>

        <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>

        {/* Simple Weather & Hotspot Summary with Animated Weather Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255, 255, 255, 0.75)' }}>
          <AnimatedWeatherIcon condition={weather?.condition || 'Rainy'} size={15} />
          <span><b>{weather?.currentTemp ?? 28}°C</b> {weather?.condition || 'Rainy'}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
          <span>🌧️ <b>{weather?.rainfall24h ?? 24} mm</b></span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
          <span>📍 <b>3 Underpasses</b> on Watch (Silk Board, Marathahalli, Hebbal)</span>
        </div>
      </div>

      {/* ─── Right: Persona Switcher + Sign Out ────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Fast Persona Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playClickSound()
              setRoleMenuOpen(!roleMenuOpen)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              padding: '4px 9px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            <div style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: badge === 'KSNDMC' ? '#F59E0B' : badge === 'BBMP' ? '#06B6D4' : '#10B981',
              color: '#030604',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: 800,
            }}>
              {displayName.charAt(0)}
            </div>
            <span style={{ fontWeight: 700 }}>{displayName}</span>
            <span style={{
              color: badge === 'KSNDMC' ? '#FBBF24' : badge === 'BBMP' ? '#38BDF8' : '#34D399',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '1px 5px',
              borderRadius: 3,
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}>
              {badge}
            </span>
            <ChevronDown size={12} color="rgba(255,255,255,0.6)" />
          </motion.button>

          {/* Persona Switch Menu Popover */}
          <AnimatePresence>
            {roleMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 270,
                  background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 10,
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(16, 185, 129, 0.15)',
                  padding: 8,
                  zIndex: 100,
                }}
              >
                <div style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--pri-neon)',
                  textTransform: 'uppercase',
                  padding: '4px 8px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <Sparkles size={11} /> 1-Click Persona Switcher:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {(['citizen', 'ksndmc', 'bbmp'] as UserRole[]).map(r => {
                    const preset = ROLE_PRESETS[r]
                    const isCurrent = user?.email === preset.email
                    return (
                      <button
                        key={r}
                        onClick={() => handleSwitchRole(r)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 9px',
                          borderRadius: 6,
                          background: isCurrent ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                          border: isCurrent ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '11px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: isCurrent ? '#34D399' : '#FFFFFF' }}>
                            {preset.name}
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {preset.title}
                          </div>
                        </div>
                        {isCurrent && <Check size={14} color="#34D399" />}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sign Out Button – Instant smooth transition with zero refresh */}
        <motion.button
          whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playClickSound()
            onSignOut()
          }}
          title="Sign Out to Auth Portal (No Refresh Needed)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            borderRadius: 6,
            padding: '4px 9px',
            color: '#F87171',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          <LogOut size={12} />
          <span>Exit</span>
        </motion.button>
      </div>
    </header>
  )
}
