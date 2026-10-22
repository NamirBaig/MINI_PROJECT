import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playClickSound } from '../utils/audioFeedback'

interface AnimatedWeatherBadgeProps {
  condition: string
  temp?: number
  variant?: 'pill' | 'inline' | 'icon-only' | 'hero' | 'card'
  size?: number
  showConditionText?: boolean
  className?: string
  interactive?: boolean
}

type WeatherMode = 'live' | 'sunny' | 'rainy' | 'thunderstorm' | 'cloudy'

/**
 * Atmospheric In-Box Background Animation Canvas
 * Renders rain streaks, lightning strobes, solar flare beams, or drifting mist
 * INSIDE the exact bounds of the weather box/card.
 */
export function AnimatedWeatherBoxCanvas({ condition }: { condition: string }) {
  const norm = (condition || '').toLowerCase()
  const isThunder = norm.includes('thunder') || norm.includes('storm')
  const isRainy = !isThunder && (norm.includes('rain') || norm.includes('drizzle') || norm.includes('shower'))
  const isCloudy = !isThunder && !isRainy && (norm.includes('cloud') || norm.includes('fog') || norm.includes('overcast'))
  const isSunny = !isThunder && !isRainy && !isCloudy

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: 'inherit',
        zIndex: 0,
      }}
    >
      {/* ─── 1. RAIN ANIMATION IN BOX ───────────────────────── */}
      {isRainy && (
        <>
          {/* Subtle hydro blue ambient tint */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.16) 0%, rgba(3, 105, 161, 0.08) 100%)',
            }}
          />

          {/* Staggered falling rain streaks traversing the full box */}
          {[12, 28, 44, 60, 76, 92].map((x, i) => (
            <motion.div
              key={i}
              initial={{ y: '-30%', opacity: 0 }}
              animate={{ y: ['-30%', '140%'], opacity: [0, 0.85, 0] }}
              transition={{
                duration: 0.65 + (i % 3) * 0.15,
                repeat: Infinity,
                delay: (i * 0.12) % 0.65,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: 0,
                width: '1.5px',
                height: '14px',
                background: 'linear-gradient(180deg, transparent 0%, #38BDF8 80%, #BAE6FD 100%)',
                transform: 'rotate(12deg)',
              }}
            />
          ))}

          {/* Bottom water puddle reflection mist */}
          <motion.div
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #38BDF8, transparent)',
            }}
          />
        </>
      )}

      {/* ─── 2. THUNDERSTORM ANIMATION IN BOX ──────────────── */}
      {isThunder && (
        <>
          {/* Ambient storm background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.18) 0%, rgba(15, 23, 42, 0.25) 100%)',
            }}
          />

          {/* Lightning Flash that strobe-illuminates the entire box interior */}
          <motion.div
            animate={{
              opacity: [0, 0.75, 0.15, 0.95, 0],
              backgroundColor: [
                'rgba(0,0,0,0)',
                'rgba(250, 204, 21, 0.32)',
                'rgba(147, 51, 234, 0.22)',
                'rgba(254, 240, 138, 0.45)',
                'rgba(0,0,0,0)',
              ],
            }}
            transition={{
              duration: 3,
              times: [0, 0.05, 0.1, 0.18, 1],
              repeat: Infinity,
              repeatDelay: 1.6,
            }}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* Rapid slashing rain streaks */}
          {[15, 34, 52, 70, 88].map((x, i) => (
            <motion.div
              key={i}
              initial={{ y: '-30%', opacity: 0 }}
              animate={{ y: ['-30%', '160%'], opacity: [0, 0.95, 0] }}
              transition={{
                duration: 0.45 + (i % 2) * 0.1,
                repeat: Infinity,
                delay: (i * 0.09) % 0.45,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: 0,
                width: '2px',
                height: '18px',
                background: 'linear-gradient(180deg, transparent 0%, #60A5FA 70%, #FFFFFF 100%)',
                transform: 'rotate(20deg)',
              }}
            />
          ))}
        </>
      )}

      {/* ─── 3. SUNNY / CLEAR SKY ANIMATION IN BOX ─────────── */}
      {isSunny && (
        <>
          {/* Warm Solar Core Wash pulsing in corner */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.65, 0.35],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: '-15px',
              top: '-15px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(251, 191, 36, 0.12) 50%, transparent 70%)',
            }}
          />

          {/* Sweeping solar shimmer beam traversing across the box */}
          <motion.div
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '45px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.22) 50%, transparent 100%)',
              transform: 'skewX(-25deg)',
            }}
          />
        </>
      )}

      {/* ─── 4. CLOUDY / OVERCAST MIST IN BOX ──────────────── */}
      {isCloudy && (
        <>
          {/* Drifting Cloud Layer 1 */}
          <motion.div
            animate={{ x: ['-20%', '20%', '-20%'] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 35% 50%, rgba(148, 163, 184, 0.18) 0%, transparent 65%)',
            }}
          />
          {/* Drifting Cloud Layer 2 */}
          <motion.div
            animate={{ x: ['20%', '-20%', '20%'] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 75% 50%, rgba(203, 213, 225, 0.12) 0%, transparent 60%)',
            }}
          />
        </>
      )}
    </div>
  )
}

/**
 * Animated Weather Icon (Vector SVG + Physics)
 */
export function AnimatedWeatherIcon({ condition, size = 20 }: { condition: string; size?: number }) {
  const norm = (condition || '').toLowerCase()

  // 1. Thunderstorm
  if (norm.includes('thunder') || norm.includes('storm')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', flexShrink: 0 }}>
        <defs>
          <linearGradient id="stormCloud" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="boltGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>

        <motion.path
          d="M 5 13 A 4 4 0 0 1 8.5 7.5 A 5 5 0 0 1 17.5 8.5 A 3.5 3.5 0 0 1 19 13 A 3 3 0 0 1 16 15 L 6 15 A 3 3 0 0 1 5 13 Z"
          fill="url(#stormCloud)"
          animate={{ x: [-0.6, 0.6, -0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.polygon
          points="12,12 9.5,17 12,17 10.5,21.5 15,16 12.5,16"
          fill="url(#boltGrad)"
          filter="drop-shadow(0 0 4px rgba(250, 204, 21, 0.8))"
          animate={{
            opacity: [0, 1, 0.2, 1, 0],
            scale: [0.95, 1.08, 0.98, 1.1, 0.95],
          }}
          transition={{
            duration: 2.2,
            times: [0, 0.08, 0.16, 0.24, 1],
            repeat: Infinity,
            repeatDelay: 0.8,
          }}
        />

        <motion.line
          x1="7" y1="16" x2="6" y2="19"
          stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round"
          animate={{ y: [0, 3], opacity: [0, 1, 0] }}
          transition={{ duration: 0.65, repeat: Infinity, ease: 'linear' }}
        />
        <motion.line
          x1="16" y1="16" x2="15" y2="19"
          stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round"
          animate={{ y: [0, 3], opacity: [0, 1, 0] }}
          transition={{ duration: 0.65, delay: 0.3, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
    )
  }

  // 2. Rainy / Rain Showers
  if (norm.includes('rain') || norm.includes('drizzle') || norm.includes('shower')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', flexShrink: 0 }}>
        <defs>
          <linearGradient id="rainCloud" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        <motion.path
          d="M 5 12 A 4 4 0 0 1 8.5 6.5 A 5 5 0 0 1 17.5 7.5 A 3.5 3.5 0 0 1 19 12 A 3 3 0 0 1 16 14 L 6 14 A 3 3 0 0 1 5 12 Z"
          fill="url(#rainCloud)"
          animate={{ y: [-0.6, 0.6, -0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.line
          x1="8" y1="15" x2="7" y2="19"
          stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round"
          animate={{ y: [0, 3], opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
        />
        <motion.line
          x1="12" y1="15.5" x2="11" y2="19.5"
          stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round"
          animate={{ y: [0, 3], opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, delay: 0.22, repeat: Infinity, ease: 'linear' }}
        />
        <motion.line
          x1="16" y1="15" x2="15" y2="19"
          stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round"
          animate={{ y: [0, 3], opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, delay: 0.44, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
    )
  }

  // 3. Cloudy / Partly Cloudy / Foggy
  if (norm.includes('cloud') || norm.includes('fog') || norm.includes('overcast')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', flexShrink: 0 }}>
        <defs>
          <linearGradient id="sunBehind" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="cloudPartly" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
        </defs>

        <motion.circle
          cx="8" cy="8" r="4"
          fill="url(#sunBehind)"
          animate={{ scale: [1, 1.1, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.path
          d="M 6 14 A 3.8 3.8 0 0 1 9.5 9 A 4.8 4.8 0 0 1 18 10 A 3.2 3.2 0 0 1 19.5 14 A 2.8 2.8 0 0 1 17 16.5 L 7 16.5 A 2.8 2.8 0 0 1 6 14 Z"
          fill="url(#cloudPartly)"
          animate={{ x: [-1.2, 1.2, -1.2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    )
  }

  // 4. Sunny / Clear Sky
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id="sunCore" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '12px 12px' }}
      >
        <line x1="12" y1="2" x2="12" y2="4.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="19.5" x2="12" y2="22" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="2" y1="12" x2="4.5" y2="12" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="19.5" y1="12" x2="22" y2="12" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="4.9" y1="4.9" x2="6.7" y2="6.7" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="17.3" y1="17.3" x2="19.1" y2="19.1" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="4.9" y1="19.1" x2="6.7" y2="17.3" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="17.3" y1="6.7" x2="19.1" y2="4.9" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      </motion.g>

      <motion.circle
        cx="12" cy="12" r="5"
        fill="url(#sunCore)"
        filter="drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))"
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

/**
 * Animated Weather Badge
 * The small weather reading box with full in-box atmospheric animations.
 * Can be clicked to cycle through Sunny, Rainy, Thunderstorm, and Cloudy preview modes!
 */
export default function AnimatedWeatherBadge({
  condition,
  temp,
  variant = 'pill',
  size = 16,
  showConditionText = false,
  className = '',
  interactive = true,
}: AnimatedWeatherBadgeProps) {
  const [demoMode, setDemoMode] = useState<WeatherMode>('live')

  const cycleWeather = () => {
    if (!interactive) return
    playClickSound()
    const modes: WeatherMode[] = ['live', 'sunny', 'rainy', 'thunderstorm', 'cloudy']
    const nextIdx = (modes.indexOf(demoMode) + 1) % modes.length
    setDemoMode(modes[nextIdx])
  }

  // Determine active display properties based on demo mode or live props
  let activeCondition = condition
  let activeTemp = temp

  if (demoMode === 'sunny') {
    activeCondition = 'Clear Sky'
    activeTemp = 32
  } else if (demoMode === 'rainy') {
    activeCondition = 'Rainy Showers'
    activeTemp = 23
  } else if (demoMode === 'thunderstorm') {
    activeCondition = 'Thunderstorm'
    activeTemp = 21
  } else if (demoMode === 'cloudy') {
    activeCondition = 'Partly Cloudy'
    activeTemp = 27
  }

  const norm = (activeCondition || '').toLowerCase()
  const isThunder = norm.includes('thunder') || norm.includes('storm')
  const isRainy = !isThunder && (norm.includes('rain') || norm.includes('drizzle') || norm.includes('shower'))
  const isSunny = !isThunder && !isRainy && (norm.includes('clear') || norm.includes('sun'))

  // Custom border & glow per condition
  const borderColor = isThunder
    ? 'rgba(234, 179, 8, 0.5)'
    : isRainy
    ? 'rgba(56, 189, 248, 0.45)'
    : isSunny
    ? 'rgba(245, 158, 11, 0.45)'
    : 'rgba(255, 255, 255, 0.12)'

  const boxGlow = isThunder
    ? '0 0 16px rgba(234, 179, 8, 0.22)'
    : isRainy
    ? '0 0 16px rgba(56, 189, 248, 0.18)'
    : isSunny
    ? '0 0 16px rgba(245, 158, 11, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.3)'

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.04, y: -1 } : {}}
      whileTap={interactive ? { scale: 0.96 } : {}}
      onClick={cycleWeather}
      className={className}
      title={interactive ? `Weather Mode: ${activeCondition} (Click to switch animation)` : undefined}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(10, 18, 14, 0.75)',
        border: `1px solid ${borderColor}`,
        padding: '5px 12px',
        borderRadius: 9999,
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        boxShadow: boxGlow,
        cursor: interactive ? 'pointer' : 'default',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflow: 'hidden',
        userSelect: 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* ─── IN-BOX BACKGROUND ANIMATION CANVAS ─── */}
      <AnimatedWeatherBoxCanvas condition={activeCondition} />

      {/* ─── IN-BOX CONTENT (Above the animated canvas) ─── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
        <AnimatedWeatherIcon condition={activeCondition} size={size} />

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>Bengaluru:</span>
          {activeTemp !== undefined && (
            <b style={{ color: '#FFFFFF', fontWeight: 800 }}>{activeTemp}°C</b>
          )}
          {showConditionText && (
            <span
              style={{
                color: isThunder
                  ? '#FBBF24'
                  : isRainy
                  ? '#38BDF8'
                  : isSunny
                  ? '#F59E0B'
                  : 'var(--pri-neon)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              ({activeCondition})
            </span>
          )}
        </span>

        {/* Small Mode indicator badge when cycling */}
        {demoMode !== 'live' && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 6,
              background: isThunder
                ? 'rgba(234, 179, 8, 0.25)'
                : isRainy
                ? 'rgba(56, 189, 248, 0.25)'
                : isSunny
                ? 'rgba(245, 158, 11, 0.25)'
                : 'rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              letterSpacing: 0.3,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            TEST: {demoMode.toUpperCase()}
          </span>
        )}
      </div>
    </motion.div>
  )
}

