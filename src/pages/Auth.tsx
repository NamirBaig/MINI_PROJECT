import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Mail, Lock, User, Eye, EyeOff, AlertCircle,
  ArrowRight, Sparkles, CheckCircle2, Radio, HardHat, Building2,
  ChevronRight, Compass, Phone, MapPin
} from 'lucide-react'
import { useAuth, type UserRole } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound } from '../utils/audioFeedback'

type Tab = 'login' | 'signup'

const taglineWords = ['Prepare', 'before', 'the', 'crisis.']
const BENGALURU_ZONES = [
  'Yelahanka', 'Mahadevapura', 'Bommanahalli', 'East',
  'West', 'South', 'RR Nagar', 'Dasarahalli'
]

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'
  const initialTab = (searchParams.get('tab') === 'signup') ? 'signup' : 'login'

  const { signIn, signUp, signInWithGoogle, loginAsRole } = useAuth()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [zone, setZone] = useState('Yelahanka')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleRoleSelect = (role: UserRole) => {
    playSuccessSound()
    loginAsRole(role)
    const titles: Record<UserRole, string> = {
      citizen: 'Priya Ramanathan (Resident)',
      ksndmc: 'Dr. K. S. Murthy (KSNDMC Officer)',
      bbmp: 'Er. Ramesh Gowda (BBMP Relief Lead)',
      hospital: 'Dr. Shalini Hegde (Hospital Coordinator)',
    }
    toast.success('Authenticated Successfully', `Active session: ${titles[role]}`)
    navigate(redirectPath, { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    playClickSound()
    setError(null)
    setLoading(true)

    try {
      if (tab === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error)
          setLoading(false)
        } else {
          playSuccessSound()
          toast.success('Welcome Back!', `Signed in successfully`)
          navigate(redirectPath, { replace: true })
        }
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name.')
          setLoading(false)
          return
        }
        const { error } = await signUp(email, password, fullName, phone, zone)
        if (error) {
          setError(error)
          setLoading(false)
        } else {
          playSuccessSound()
          toast.success('Account Created', `Welcome to SafeGround, ${fullName}`)
          navigate(redirectPath, { replace: true })
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed')
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    playClickSound()
    setError(null)
    setGoogleLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error)
        setGoogleLoading(false)
      } else {
        playSuccessSound()
        toast.success('Google Verified', 'Signed in as Bengaluru Resident')
        navigate(redirectPath, { replace: true })
      }
    } catch (err: any) {
      setError('Google Sign-In failed')
      setGoogleLoading(false)
    }
  }

  const handleAutoFill = (u: string, p: string, roleName: string) => {
    playClickSound()
    setTab('login')
    setEmail(u)
    setPassword(p)
    toast.info(`Filled ${roleName} Credentials`, `User: ${u} | Pass: ${p}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
      background: 'var(--bg)',
    }}>
      {/* ─── Left Hero & Brand Showcase ─────────────────────── */}
      <div style={{
        background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 60%, #030604 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '50px 48px',
        color: '#ffffff',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Animated Cyber Glows */}
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '-10%',
            left: '5%',
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <ShieldCheck size={24} color="#030604" strokeWidth={2.5} />
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1.5, color: '#ffffff', display: 'block' }}>
                SAFEGROUND
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pri-neon)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Bengaluru Command Hub
              </span>
            </div>
          </div>

          {/* Staggered Tagline */}
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', lineHeight: 1.15, fontWeight: 800, margin: '0 0 16px', color: '#ffffff' }}>
            {taglineWords.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                style={{
                  display: 'inline-block',
                  marginRight: 10,
                  color: i === 3 ? 'var(--pri-neon)' : '#ffffff',
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.7)', maxWidth: 460, margin: '0 0 36px', lineHeight: 1.6 }}>
            Enterprise disaster intelligence for Greater Bengaluru. Live KSNDMC telemetric sensor grids, IISc hydrological models, and real-time response logistics.
          </p>

          {/* Quick 1-Click Role Logins */}
          <div style={{ marginTop: 20 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: 'var(--pri-neon)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Sparkles size={14} /> Quick 1-Click Evaluator Roles:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Role 1: Citizen */}
              <motion.button
                whileHover={{ scale: 1.015, x: 4, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('citizen')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34D399',
                  flexShrink: 0,
                }}>
                  <User size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Priya Ramanathan (Resident)</div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Citizen Preparedness & Family Evacuation Bag</div>
                </div>
                <ChevronRight size={16} color="#34D399" />
              </motion.button>

              {/* Role 2: KSNDMC Telemetry Officer */}
              <motion.button
                whileHover={{ scale: 1.015, x: 4, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('ksndmc')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60A5FA',
                  flexShrink: 0,
                }}>
                  <Radio size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Dr. K. S. Murthy (KSNDMC Officer)</div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Telemetry Grid & Yelahanka TRG Stations</div>
                </div>
                <ChevronRight size={16} color="#60A5FA" />
              </motion.button>

              {/* Role 3: BBMP Disaster Lead */}
              <motion.button
                whileHover={{ scale: 1.015, x: 4, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('bbmp')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FBBF24',
                  flexShrink: 0,
                }}>
                  <HardHat size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Er. Ramesh Gowda (BBMP Lead)</div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Stormwater Drain Works & Resource Logistics</div>
                </div>
                <ChevronRight size={16} color="#FBBF24" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 2, paddingTop: 30, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          Bengaluru Climate & Disaster Resilience Platform · SafeGround v2.4
        </div>
      </div>

      {/* ─── Right Form Section ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 36px',
        background: 'var(--surf)',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Form Header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: 'var(--tx)' }}>
              {tab === 'login' ? 'Sign in to SafeGround' : 'Create an Account'}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--tx-muted)' }}>
              {tab === 'login'
                ? 'Access your telemetry cockpit, preparedness plans, and flood risk maps'
                : 'Join the disaster resilience network for Greater Bengaluru'}
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--surf2)',
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
            border: '1px solid var(--border-glass)',
          }}>
            {(['login', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  playClickSound()
                  setTab(t)
                  setError(null)
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: tab === t ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'transparent',
                  color: tab === t ? '#030604' : 'var(--tx-dim)',
                  fontWeight: tab === t ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: tab === t ? '0 0 15px rgba(16, 185, 129, 0.35)' : 'none',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google Auth Button */}
          <motion.button
            whileHover={{ y: -1, boxShadow: '0 4px 18px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '12px 18px',
              borderRadius: 10,
              border: '1px solid var(--border-glass-bright)',
              background: '#ffffff',
              color: '#1f2937',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 20,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {googleLoading ? (
              <div style={{
                width: 18,
                height: 18,
                border: '2px solid #e5e7eb',
                borderTopColor: '#4285F4',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{tab === 'login' ? 'Continue with Google' : 'Sign up with Google'}</span>
          </motion.button>

          {/* Or Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
            <span style={{ fontSize: 12, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              or with email
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'var(--dan-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: 'var(--dan)',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tab === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--tx-dim)' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Priya Ramanathan"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 10,
                      background: 'var(--surf2)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--tx)',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {tab === 'signup' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--tx-dim)' }}>
                    Phone Number (Emergency Contact)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                    <input
                      type="tel"
                      placeholder="+91 98450 12345"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: 10,
                        background: 'var(--surf2)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--tx)',
                        fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--tx-dim)' }}>
                    Primary Ward / Zone
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                    <select
                      value={zone}
                      onChange={e => setZone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: 10,
                        background: 'var(--surf2)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--tx)',
                        fontSize: 14,
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      {BENGALURU_ZONES.map(z => (
                        <option key={z} value={z} style={{ background: '#111814', color: '#fff' }}>
                          {z} Zone
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--tx-dim)' }}>
                {tab === 'login' ? 'Email or Username (e.g. bbmp / ksndmc)' : 'Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder={tab === 'login' ? "bbmp, ksndmc, hospital, or resident@email.com" : "resident@bengaluru.in"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: 10,
                    background: 'var(--surf2)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--tx)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--tx-dim)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    borderRadius: 10,
                    background: 'var(--surf2)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--tx)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--tx-muted)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {tab === 'login' && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 12,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} /> Official Authority Fixed Credentials (1-Click Fill):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleAutoFill('bbmp', 'bbmp1234', 'BBMP Relief Lead')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#F87171',
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>BBMP Lead</div>
                    <div style={{ fontSize: 9.5, color: 'var(--tx-muted)', fontWeight: 400 }}>bbmp / bbmp1234</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFill('ksndmc', 'ksndmc1234', 'KSNDMC Officer')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#60A5FA',
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>KSNDMC Officer</div>
                    <div style={{ fontSize: 9.5, color: 'var(--tx-muted)', fontWeight: 400 }}>ksndmc / ksndmc1234</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFill('hospital', 'hospital1234', 'Hospital Coordinator')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#34D399',
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>Hospital Lead</div>
                    <div style={{ fontSize: 9.5, color: 'var(--tx-muted)', fontWeight: 400 }}>hospital / hospital1234</div>
                  </button>
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-shiny"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '13px',
                fontSize: 15,
                marginTop: 6,
              }}
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>{tab === 'login' ? 'Sign In to Cockpit' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch tab link */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--tx-muted)' }}>
            {tab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setTab('signup')
                    setError(null)
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--pri-neon)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setTab('login')
                    setError(null)
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--pri-neon)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
