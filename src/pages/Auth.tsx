import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type Tab = 'login' | 'signup'

const taglineWords = ['Prepare', 'before', 'the', 'crisis.']

export default function Auth() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle, loginAsGuest, isConfigured } = useAuth()

  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (tab === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error)
          setLoading(false)
        } else {
          navigate('/dashboard', { replace: true })
        }
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name.')
          setLoading(false)
          return
        }
        const { error } = await signUp(email, password, fullName)
        if (error) {
          setError(error)
          setLoading(false)
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed')
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error)
        setGoogleLoading(false)
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      setError('Google Sign-In failed')
      setGoogleLoading(false)
    }
  }

  const handleGuestAccess = () => {
    loginAsGuest()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      background: 'var(--bg)',
    }}>
      {/* ─── Left Hero / Brand Section ──────────────────────── */}
      <div style={{
        background: 'linear-gradient(145deg, #17372D 0%, #1a4236 60%, #204c3e 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '50px 44px',
        color: '#ffffff',
      }}>
        {/* Animated Aurora Glows */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '-10%',
            left: '10%',
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(157,191,169,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <motion.div
          animate={{
            x: [0, -40, 20, 0],
            y: [0, 30, -20, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '-10%',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(213,154,42,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <ShieldCheck size={24} color="#9DBFA9" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1.5, color: '#ffffff' }}>
              SAFEGROUND
            </span>
          </div>

          {/* Word by word tagline reveal */}
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 46px)', lineHeight: 1.15, fontWeight: 700, margin: '0 0 16px', color: '#ffffff' }}>
            {taglineWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.4 }}
                style={{ display: 'inline-block', marginRight: '0.28em' }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: '34ch', lineHeight: 1.6, margin: '0 0 36px' }}
          >
            Live Bengaluru disaster intelligence, BBMP zone maps, and resilience simulations built for citizens.
          </motion.p>

          {/* Feature Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { title: 'Live Bengaluru Weather & Flood Risk', desc: 'Real-time rainfall tracking vs 7mm/h drain limit' },
              { title: 'What-If Disaster Simulation', desc: 'Calibrated with Sep 2022 megaflood telemetry' },
              { title: 'Personal Preparedness Hub', desc: 'Cloud-synced emergency checklists and safe routes' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.12 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <CheckCircle2 size={18} color="#9DBFA9" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 2, paddingTop: 30, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          Bengaluru Climate & Disaster Resilience Platform · SafeGround
        </div>
      </div>

      {/* ─── Right Form Section ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        background: 'var(--bg)',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Form Header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: 'var(--tx)' }}>
              {tab === 'login' ? 'Sign in to SafeGround' : 'Create an Account'}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--tx-muted)' }}>
              {tab === 'login'
                ? 'Access your saved preparedness plans and simulation history'
                : 'Join the disaster resilience network for Greater Bengaluru'}
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--surf)',
            borderRadius: 8,
            padding: 4,
            marginBottom: 24,
            border: '1px solid var(--ln)',
          }}>
            {(['login', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: tab === t ? 'var(--bg)' : 'transparent',
                  color: tab === t ? 'var(--tx)' : 'var(--tx-muted)',
                  fontWeight: tab === t ? 600 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: tab === t ? 'var(--card-shadow)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ─── Premium Google Button ─────────────────────── */}
          <motion.button
            whileHover={{ y: -1, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
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
              borderRadius: 8,
              border: '1.5px solid var(--ln)',
              background: '#ffffff',
              color: '#1f2937',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
            <span>{tab === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </motion.button>

          {/* Quick Citizen / Demo Access */}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGuestAccess}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid rgba(23, 55, 45, 0.2)',
              background: 'rgba(23, 55, 45, 0.05)',
              color: 'var(--pri)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            <Sparkles size={14} />
            <span>Explore as Bengaluru Resident (Instant Guest Access)</span>
          </motion.button>

          {/* Or Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--ln)' }} />
            <span style={{ fontSize: 12, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              or with email
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--ln)' }} />
          </div>

          {/* Error Message */}
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
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--dan-bg)',
                  border: '1px solid rgba(200,92,69,0.3)',
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

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <div>
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Priya Ramanathan"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>
            )}

            <div>
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="resident@bengaluru.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
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

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                fontSize: 15,
                marginTop: 6,
              }}
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch tab link */}
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--tx-muted)' }}>
            {tab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--pri)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--pri)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
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
