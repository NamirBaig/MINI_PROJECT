import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Shield, ArrowRight, Droplets, ThermometerSun, Map, Zap,
  AlertTriangle, Users, TrendingUp, Radio, Activity, ChevronRight,
  BookOpen, Compass, ExternalLink, Sparkles, Building2, User, CheckSquare,
  LogOut, Lock, UserPlus
} from 'lucide-react'
import type { WeatherData } from '../hooks/useWeather'
import { HISTORICAL_DISASTERS, BENGALURU_STATS } from '../data/bengaluru'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound } from '../utils/audioFeedback'
import AnimatedWeatherBadge, { AnimatedWeatherIcon, AnimatedWeatherBoxCanvas } from '../components/AnimatedWeatherBadge'
import AuthGateModal from '../components/AuthGateModal'

interface LandingProps {
  weatherData: WeatherData
}

function AnimatedCounter({ target, suffix = '', duration = 1600, isFloat = false }: { target: number; suffix?: string; duration?: number; isFloat?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || !ref.current) return
    let startTime: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // High-performance cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentVal = target * easeProgress

      if (ref.current) {
        ref.current.textContent = (isFloat ? currentVal.toFixed(1) : Math.floor(currentVal).toLocaleString()) + suffix
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [inView, target, suffix, duration, isFloat])

  return <span ref={ref}>{isFloat ? target.toFixed(1) : target.toLocaleString()}{suffix}</span>
}

export default function Landing({ weatherData }: LandingProps) {
  const navigate = useNavigate()
  const { user, loginAsRole, signOut } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'telemetry' | 'replay' | 'research'>('telemetry')
  const [gateState, setGateState] = useState<{ isOpen: boolean; targetPath: string; featureTitle: string }>({
    isOpen: false,
    targetPath: '/dashboard',
    featureTitle: 'Disaster Telemetry Dashboard',
  })
  const headlineWords = ['PREPARE', 'BEFORE', 'THE', 'CRISIS.']

  const floodColor = weatherData.floodRiskToday > 60 ? '#EF4444' : weatherData.floodRiskToday > 35 ? '#F59E0B' : '#10B981'

  const handleGatedNav = (path: string, featureTitle: string) => {
    playClickSound()
    if (!user) {
      toast.info('Login Required', `Please log in to access ${featureTitle || 'SafeGround'}.`)
      navigate(`/auth?redirect=${encodeURIComponent(path)}`)
    } else {
      navigate(path)
    }
  }

  const handleQuickCitizenLogin = () => {
    playSuccessSound()
    loginAsRole('citizen')
    toast.success('Resident Session Started', 'Logged in as Priya Ramanathan')
    navigate('/dashboard')
  }

  const handleSignOut = async () => {
    playClickSound()
    await signOut()
    toast.info('Signed Out', 'You have been safely signed out.')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--tx)', position: 'relative', overflowX: 'hidden' }} className="bg-grid-pattern">
      {/* ─── Ambient Glow Spheres ───────────────────────────────────────── */}
      <div className="aurora-glow" style={{ top: '-150px', left: '-100px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' }} />
      <div className="aurora-glow" style={{ top: '30%', right: '-150px', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)' }} />
      <div className="aurora-glow" style={{ bottom: '10%', left: '10%', background: 'radial-gradient(circle, rgba(163,230,53,0.08) 0%, transparent 70%)' }} />

      {/* ─── Floating Island Top Navigation ─────────────────────────────── */}
      <header style={{ position: 'sticky', top: 16, zIndex: 90, padding: '0 20px', maxWidth: 1240, margin: '0 auto' }}>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            borderRadius: 9999,
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16,185,129,0.5)',
            }}>
              <Shield size={20} color="#030604" strokeWidth={2.5} />
            </div>
            <div>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.04em', color: '#FFFFFF' }}>SAFEGROUND</span>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--pri-neon)', fontWeight: 700, letterSpacing: '0.12em' }}>BENGALURU RESILIENCE</span>
            </div>
          </Link>

          {/* Desktop Nav Links (Auth Gated) */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button
              onClick={() => handleGatedNav('/dashboard', 'Live Disaster Dashboard')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 0 }}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleGatedNav('/yelahanka', 'Yelahanka Flood Watch Hub')}
              style={{ background: 'none', border: 'none', color: 'var(--pri-neon)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 }}
            >
              <Radio size={14} className="live-dot" /> Yelahanka Live Hub
            </button>
            <button
              onClick={() => handleGatedNav('/risk-map', '8-Zone BBMP Hazard Map')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 0 }}
            >
              Risk Map
            </button>
            <button
              onClick={() => handleGatedNav('/preparedness', 'Family Disaster Preparedness Plan')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 0 }}
            >
              Preparedness
            </button>
            <button
              onClick={() => handleGatedNav('/climate', 'IISc Research & Climate Archive')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 0 }}
            >
              Climate Archive
            </button>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="desktop-nav">
              <AnimatedWeatherBadge
                condition={weatherData.condition}
                temp={weatherData.currentTemp}
                size={16}
                showConditionText={true}
              />
            </div>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleGatedNav('/dashboard', 'Disaster Cockpit')}
                  className="btn-shiny"
                  style={{ padding: '8px 16px', fontSize: 13, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Cockpit ({user.user_metadata?.full_name?.split(' ')[0] || 'Resident'})</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 9999,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#F87171',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <LogOut size={13} />
                  <span className="desktop-nav">Sign Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link to="/auth?tab=login" onClick={() => playClickSound()} style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      padding: '8px 14px',
                      fontSize: 12.5,
                      borderRadius: 9999,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Sign In
                  </motion.button>
                </Link>

                <Link to="/auth?tab=signup" onClick={() => playClickSound()} style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="btn-shiny"
                    style={{ padding: '8px 16px', fontSize: 12.5, borderRadius: 9999 }}
                  >
                    <UserPlus size={13} />
                    <span>Sign Up</span>
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </header>

      {/* ─── Hero Section ───────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1240, margin: '40px auto 80px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: 960, margin: '0 auto 60px' }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="status-pill"
            style={{ marginBottom: 24, boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}
          >
            <span className="live-dot" />
            <span>KSNDMC & BBMP Open Telemetry Integrated • Version 2.4</span>
          </motion.div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(42px, 8vw, 84px)',
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            margin: '0 0 24px',
            color: '#FFFFFF',
          }}>
            {headlineWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'inline-block',
                  marginRight: '0.24em',
                  background: i === 0 ? 'linear-gradient(135deg, #FFFFFF 0%, #34D399 100%)' :
                              i === 1 ? 'linear-gradient(135deg, #FFFFFF 0%, #A3E635 100%)' :
                              i === 3 ? 'linear-gradient(135deg, #34D399 0%, #06B6D4 100%)' : '#FFFFFF',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              fontSize: 'clamp(16px, 2.2vw, 21px)',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.72)',
              maxWidth: 780,
              margin: '0 auto 40px',
              fontWeight: 400,
            }}
          >
            Bengaluru’s premier disaster intelligence platform. Calibrated directly against
            <b style={{ color: '#34D399', fontWeight: 600 }}> IISc Technical Report 123</b> and live
            <b style={{ color: '#A3E635', fontWeight: 600 }}> KSNDMC Varuna Mitra</b> telemetry.
            Simulate flash floods, explore ward sensor matrices, and respond with scientific precision.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-shiny"
              onClick={() => handleGatedNav('/dashboard', 'Live SafeGround Dashboard')}
            >
              <Activity size={18} /> Launch Live Dashboard <ArrowRight size={16} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-glass"
              onClick={() => handleGatedNav('/yelahanka', 'Yelahanka Telemetry Hub')}
            >
              <Radio size={18} color="#34D399" /> Yelahanka Telemetry Hub
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-glass"
              onClick={() => handleGatedNav('/preparedness', 'Family Preparedness Plan')}
            >
              <CheckSquare size={18} color="#34D399" /> Family Preparedness Plan
            </motion.button>
          </motion.div>
        </div>

        {/* ─── Hero Live Telemetry Bento Cockpit ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
            marginTop: 40,
          }}
        >
          {/* Card 1: Live Sensor Cockpit */}
          <div className="bento-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pri-neon)', letterSpacing: '0.1em' }}>
                  BENGALURU LIVE TELEMETRY
                </div>
                <div style={{ fontSize: 13, color: 'var(--tx-muted)', marginTop: 2 }}>
                  Station TRG-BLR-01 • Open-Meteo Gateway
                </div>
              </div>
              <span className="live-dot" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: 58,
                height: 58,
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                flexShrink: 0,
              }}>
                <AnimatedWeatherBoxCanvas condition={weatherData.condition} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatedWeatherIcon condition={weatherData.condition} size={32} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                    {weatherData.currentTemp}°C
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--pri-neon)', fontWeight: 700 }}>
                    {weatherData.condition}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', marginTop: 3 }}>
                  Feels like {weatherData.feelsLike}°C • Open-Meteo Live Feed
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Droplets size={13} color="#34D399" /> 24h Rainfall
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
                  {weatherData.rainfall24h} mm
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={13} color="#06B6D4" /> Soil Saturation
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
                  {weatherData.humidity}%
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--tx-muted)' }}>City Flood Risk Index</span>
                <span style={{ color: floodColor, fontWeight: 700 }}>{weatherData.floodRiskToday}% Risk</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weatherData.floodRiskToday}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: floodColor }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Yelahanka Oct 2024 Forensic Replay */}
          <div className="bento-card" style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.1em' }}>
                  OCT 2024 MEGAFLOOD REPLAY
                </div>
                <div style={{ fontSize: 13, color: 'var(--tx-muted)', marginTop: 2 }}>
                  Kendriya Vihar & Amanikere Cascade Breach
                </div>
              </div>
              <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                157.5mm Peak
              </span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>Submergence Depth:</span>
                <b style={{ color: '#EF4444' }}>1.8 Meters (6.0 ft)</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>Amanikere Discharge:</span>
                <b style={{ color: '#F59E0B' }}>3,240 vs 900 cusecs cap</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>NDRF Rescue Boats:</span>
                <b style={{ color: '#34D399' }}>24 Motorized Crafts</b>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGatedNav('/yelahanka', 'Yelahanka Flood Telemetry')}
              style={{
                width: '100%',
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.35)',
                color: '#FDE68A',
                padding: '10px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              Inspect Telemetric Sensors <ChevronRight size={14} />
            </motion.button>
          </div>

          {/* Card 3: IISc Academic Calibration */}
          <div className="bento-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.1em' }}>
                  IISC TECHNICAL REPORT 123
                </div>
                <div style={{ fontSize: 13, color: 'var(--tx-muted)', marginTop: 2 }}>
                  Prof. T.V. Ramachandra Empirical Hydrology
                </div>
              </div>
              <BookOpen size={18} color="#06B6D4" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Paved Concrete Growth</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#34D399', marginTop: 4 }}>+1,005%</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Runoff Coefficient</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>0.85</div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0 }}>
              85% of total rainfall transforms directly into instantaneous surface runoff due to vegetation loss from 68% down to 3.8%.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── High-Impact Impact Counters ─────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)', background: 'rgba(12,21,16,0.6)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
          {[
            { icon: <Building2 size={24} color="#EF4444" />, target: BENGALURU_STATS.lakes, label: 'Lakes Under Severe Threat', suffix: ' Water Bodies' },
            { icon: <Users size={24} color="#10B981" />, target: 13.2, label: 'Exposed Bengaluru Residents', suffix: 'M Citizens', isFloat: true },
            { icon: <Droplets size={24} color="#06B6D4" />, target: 131, label: '2022 Megaflood Intensity', suffix: ' mm/24h' },
            { icon: <TrendingUp size={24} color="#F59E0B" />, target: 2.4, label: 'Urban Heat Island Rise', suffix: ' °C Rise', isFloat: true },
          ].map(({ icon, target, label, suffix, isFloat }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                  <AnimatedCounter target={target} suffix={suffix} isFloat={isFloat} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--tx-muted)', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── The Core Bento Grid Feature Matrix ─────────────────────────── */}
      <section className="section-optimized" style={{ maxWidth: 1240, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div className="status-pill" style={{ marginBottom: 16 }}>
            <Sparkles size={13} />
            <span>Interactive Engineering Modules</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Scientific Disaster Preparedness System
          </h2>
          <p style={{ color: 'var(--tx-muted)', fontSize: 16, marginTop: 10 }}>
            Engineered to empower citizens, engineers, and government response units
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
          {/* Bento 1: Yelahanka Flood Hub (Spans 7 cols) */}
          <div className="bento-card" style={{ gridColumn: 'span 7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="status-pill" style={{ background: 'rgba(16,185,129,0.15)', borderColor: '#10B981' }}>
                <Radio size={12} />
                <span>LOCAL FLOOD MONITORING</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Ward 01 to 05</span>
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>
              Yelahanka Flood Watch & Simulator
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Monitor live water levels across Yelahanka Amanikere and simulate apartment flood depths at Kendriya Vihar. Real-time alerts for local residents.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGatedNav('/yelahanka', 'Yelahanka Flood Simulator')}
                className="btn-shiny"
                style={{ padding: '10px 20px', fontSize: 13 }}
              >
                Launch Yelahanka Hub <ArrowRight size={14} />
              </motion.button>
            </div>
          </div>

          {/* Bento 2: Citizen Preparedness & Go-Bag (Spans 5 cols) */}
          <div className="bento-card" style={{ gridColumn: 'span 5' }}>
            <div className="status-pill" style={{ background: 'rgba(16,185,129,0.15)', borderColor: '#10B981', color: '#34D399', marginBottom: 20 }}>
              <CheckSquare size={12} />
              <span>PRE-FILLED READINESS</span>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>
              Family Go-Bag & Evacuation Plans
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Choose from pre-filled profiles for apartments, ground floor homes, or daily commuters. Check readiness dynamically against today's live rainfall.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGatedNav('/preparedness', 'Family Preparedness & Go-Bag')}
              className="btn-glass"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Open Preparedness Plan <ChevronRight size={15} />
            </motion.button>
          </div>

          {/* Bento 3: 8-Zone Risk Map (Spans 6 cols) */}
          <div className="bento-card" style={{ gridColumn: 'span 6' }}>
            <div className="status-pill" style={{ background: 'rgba(59,130,246,0.15)', borderColor: '#3B82F6', color: '#93C5FD', marginBottom: 20 }}>
              <Map size={12} />
              <span>GEOSPATIAL INTELLIGENCE</span>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>
              8-Zone BBMP Hazard Heatmap
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Interactive SVG vector map of Bengaluru's 8 administrative zones. Inspect Bellandur, Varthur,
              and Hebbal lake buffer encroachment breaches and known Rajakaluve bottlenecks.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGatedNav('/risk-map', '8-Zone BBMP Hazard Heatmap')}
              className="btn-glass"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Explore BBMP Zones <ChevronRight size={15} />
            </motion.button>
          </div>

          {/* Bento 4: Academic Literature Archive (Spans 6 cols) */}
          <div className="bento-card" style={{ gridColumn: 'span 6' }}>
            <div className="status-pill" style={{ background: 'rgba(163,230,53,0.15)', borderColor: '#A3E635', color: '#D9F99D', marginBottom: 20 }}>
              <BookOpen size={12} />
              <span>PEER-REVIEWED CITATIONS</span>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>
              IISc & CAG Research Library
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Built upon empirical findings from IISc Technical Report 123, CAG Audit Report No. 2 of 2021,
              and KSNDMC disaster telemetric evaluations. Equipped with BibTeX citations for academic defense.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGatedNav('/climate', 'Climate & Research Hub')}
              className="btn-glass"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Open Climate & Research Hub <ChevronRight size={15} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ─── Historical Disaster Log Bento ─────────────────────────────── */}
      <section className="section-optimized" style={{ maxWidth: 1240, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="status-pill" style={{ marginBottom: 12 }}>
              <span>HISTORICAL FORENSICS</span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Recent Disasters in Bengaluru
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => handleGatedNav('/risk-map', 'Geospatial Hazard Risk Map')}
            className="btn-glass"
            style={{ padding: '8px 18px', fontSize: 13 }}
          >
            Explore Risk Map <ArrowRight size={14} />
          </motion.button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {HISTORICAL_DISASTERS.slice(0, 3).map((d) => (
            <div key={d.event} className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>{d.type === 'Flood' ? '🌊' : d.type === 'Cloudbursts' ? '⛈️' : '🔥'}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(239,68,68,0.15)',
                  color: '#F87171',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}>
                  {d.month} {d.year}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px' }}>{d.event}</h3>
              <p style={{ color: 'var(--tx-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                {d.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Casualties</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{d.deaths}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Displaced</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{d.displaced.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Est. Loss</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#34D399' }}>₹{d.estimatedLoss} Cr</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Ready to Prepare Banner ────────────────────────────────────── */}
      <section className="section-optimized" style={{ maxWidth: 1240, margin: '80px auto', padding: '0 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.05) 100%)',
          border: '1px solid rgba(16,185,129,0.35)',
          borderRadius: 28,
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(16,185,129,0.15)',
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#FFFFFF', margin: '0 0 16px' }}>
            Empower Bengaluru with Science & Code
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, maxWidth: 640, margin: '0 auto 36px' }}>
            Step into the live platform to monitor ward rainfall, track flood-prone underpasses, and access localized family disaster preparedness plans.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-shiny"
              onClick={() => handleGatedNav('/dashboard', 'Live SafeGround Platform')}
              style={{ padding: '16px 36px', fontSize: 16 }}
            >
              Launch Live SafeGround Platform <ArrowRight size={18} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ─── Modern Footer ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '40px 24px', background: 'rgba(6,11,8,0.95)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#030604" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>SAFEGROUND BENGALURU</div>
              <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Research Backed • KSNDMC & BBMP Open Telemetry</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--tx-muted)' }}>
            <span onClick={() => handleGatedNav('/dashboard', 'Dashboard')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Dashboard</span>
            <span onClick={() => handleGatedNav('/yelahanka', 'Yelahanka Hub')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Yelahanka Hub</span>
            <span onClick={() => handleGatedNav('/risk-map', 'Risk Map')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Risk Map</span>
            <span onClick={() => handleGatedNav('/preparedness', 'Preparedness')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Preparedness</span>
            <span onClick={() => handleGatedNav('/climate', 'Climate')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Climate</span>
          </div>
        </div>
      </footer>

      {/* ─── Auth Guard Modal for Unauthenticated Navigation ────────────── */}
      <AuthGateModal
        isOpen={gateState.isOpen}
        onClose={() => setGateState(prev => ({ ...prev, isOpen: false }))}
        targetPath={gateState.targetPath}
        featureTitle={gateState.featureTitle}
      />
    </div>
  )
}
