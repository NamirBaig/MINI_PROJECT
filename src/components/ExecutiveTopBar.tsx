import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Radio, LogOut,
  Activity, Clock
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { playClickSound } from '../utils/audioFeedback'
import type { WeatherData } from '../hooks/useWeather'
import { AnimatedWeatherIcon } from './AnimatedWeatherBadge'

interface ExecutiveTopBarProps {
  user: any
  onSignOut: () => void
  weather: WeatherData
}

export default function ExecutiveTopBar({ user, onSignOut, weather }: ExecutiveTopBarProps) {
  const { currentRole } = useAuth()
  const isAuthority = currentRole !== 'citizen'
  const [timeStr, setTimeStr] = useState<string>('')

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
        {/* User Identity & Clearance Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            padding: '4px 10px',
            color: '#FFFFFF',
            fontSize: '11px',
          }}
        >
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: isAuthority ? '#34D399' : '#10B981',
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
            color: isAuthority ? '#34D399' : '#A7F3D0',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}>
            {isAuthority ? 'DISASTER COMMAND' : 'RESIDENT'}
          </span>
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
