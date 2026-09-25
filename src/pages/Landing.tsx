import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Droplets, ThermometerSun, Map, Zap, Shield, AlertTriangle, Users, TrendingUp } from 'lucide-react'
import type { WeatherData } from '../hooks/useWeather'
import { HISTORICAL_DISASTERS, BENGALURU_STATS } from '../data/bengaluru'

interface LandingProps {
  weatherData: WeatherData
}

// Animated counter that counts up on mount
function CountUp({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        onAnimationComplete={() => {
          if (!ref.current) return
          let start = 0
          const step = target / (duration / 16)
          const timer = setInterval(() => {
            start += step
            if (start >= target) {
              if (ref.current) ref.current.textContent = target.toLocaleString() + suffix
              clearInterval(timer)
            } else {
              if (ref.current) ref.current.textContent = Math.floor(start).toLocaleString() + suffix
            }
          }, 16)
        }}
      >
        {0}
      </motion.span>
    </motion.span>
  )
}

// Particle rain animation
function RainParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => i)
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(i => (
        <motion.div
          key={i}
          animate={{
            y: ['0vh', '110vh'],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            left: `${(i / 20) * 100}%`,
            top: '-5%',
            width: 1.5,
            height: 12 + Math.random() * 12,
            background: 'rgba(157,191,169,0.5)',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  )
}

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

const headline = ['Prepare', 'before', 'the', 'crisis.']

export default function Landing({ weatherData }: LandingProps) {
  const severityColor = (s: string) =>
    s === 'CRITICAL' ? '#8a1f1f' : s === 'HIGH' ? '#b04a34' : s === 'MODERATE' ? '#996b0c' : '#4c8c5e'

  const disasterType = weatherData.floodRiskToday > 50 ? '🌧️ High flood risk today' : '✓ Conditions normal'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #17372D 0%, #1e4a3a 50%, #243d35 100%)',
        overflow: 'hidden',
      }}>
        <RainParticles />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 50%, rgba(157,191,169,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '60px 40px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 48, alignItems: 'center' }}>

            {/* Left: Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 20, padding: '6px 14px', marginBottom: 24,
                  color: 'rgba(255,255,255,0.8)', fontSize: 13,
                }}
              >
                <Shield size={13} />
                Bengaluru Disaster Preparedness Platform
              </motion.div>

              <h1 style={{ color: 'white', fontSize: 'clamp(38px,6vw,64px)', lineHeight: 1.1, marginBottom: 20 }}>
                {headline.map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
                    style={{ display: 'inline-block', marginRight: '0.28em' }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                style={{ color: 'rgba(255,255,255,0.72)', fontSize: 18, maxWidth: '36ch', marginBottom: 36, lineHeight: 1.65 }}
              >
                Know Bengaluru's real hazards. Simulate what happens when Bellandur overflows.
                Plan your response before the next megaflood.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}
              >
                <Link to="/risk-map" style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: '#9DBFA9', color: '#17372D', border: 'none',
                      padding: '13px 24px', borderRadius: 8, cursor: 'pointer',
                      fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Map size={16} /> Explore Bengaluru Risk <ArrowRight size={15} />
                  </motion.button>
                </Link>
                <Link to="/simulation" style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'white',
                      border: '1.5px solid rgba(255,255,255,0.25)',
                      padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
                      fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Zap size={16} /> Run Simulation
                  </motion.button>
                </Link>
              </motion.div>
            </div>

            {/* Right: Live weather card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 16,
                padding: 24,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>BENGALURU, LIVE</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                    {weatherData.isLoading ? 'Loading...' : weatherData.lastUpdated.toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="live-dot" />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Live</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 52, fontWeight: 700, color: 'white', lineHeight: 1 }}>
                  {weatherData.currentTemp}°
                </div>
                <div style={{ paddingBottom: 8, color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  <div>{weatherData.condition}</div>
                  <div>Feels {weatherData.feelsLike}°C</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { icon: <Droplets size={14} />, label: 'Rainfall 24h', value: `${weatherData.rainfall24h} mm` },
                  { icon: <ThermometerSun size={14} />, label: 'Humidity', value: `${weatherData.humidity}%` },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      {icon} {label}
                    </div>
                    <div style={{ color: 'white', fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Risk bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                  <span>Flood Risk Today</span>
                  <span style={{ color: weatherData.floodRiskToday > 60 ? '#f47c6a' : weatherData.floodRiskToday > 35 ? '#e6c55a' : '#8dc9a0', fontWeight: 600 }}>
                    {weatherData.floodRiskToday}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weatherData.floodRiskToday}%` }}
                    transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: weatherData.floodRiskToday > 60 ? '#C85C45' : weatherData.floodRiskToday > 35 ? '#D59A2A' : '#4c8c5e',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 12, color: weatherData.floodRiskToday > 35 ? '#f47c6a' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {weatherData.floodRiskToday > 35 ? <AlertTriangle size={12} /> : null}
                {disasterType}
              </div>
              {weatherData.error && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,150,50,0.8)' }}>⚠ {weatherData.error}</div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── Stats bar ────────────────────────────────────── */}
      <div style={{ background: 'var(--surf)', borderBottom: '1px solid var(--ln)', padding: '32px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          {[
            { icon: <Map size={22} style={{ color: '#C85C45' }} />, label: 'Lakes At Risk', target: BENGALURU_STATS.lakes, suffix: '' },
            { icon: <Users size={22} style={{ color: 'var(--pri)' }} />, label: 'Million Residents', target: 13.2, suffix: 'M', isFloat: true },
            { icon: <Droplets size={22} style={{ color: '#526C78' }} />, label: 'mm Peak Rainfall (2022)', target: 131, suffix: '' },
            { icon: <TrendingUp size={22} style={{ color: '#D59A2A' }} />, label: '°C Temperature Rise (2015–2025)', target: 2.4, suffix: '°C', isFloat: true },
          ].map(({ icon, label, target, suffix }) => {
            const ref = useRef(null)
            const inView = useInView(ref, { once: true })
            return (
              <FadeInSection key={label}>
                <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--bg)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ln)' }}>
                    {icon}
                  </div>
                  <div>
                    <motion.div
                      style={{ fontSize: 30, fontWeight: 700, color: 'var(--tx)', lineHeight: 1 }}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                    >
                      {inView ? (
                        <AnimatedNumber target={target} suffix={suffix} />
                      ) : '0'}
                    </motion.div>
                    <div style={{ fontSize: 13, color: 'var(--tx-muted)', marginTop: 2 }}>{label}</div>
                  </div>
                </div>
              </FadeInSection>
            )
          })}
        </div>
      </div>

      {/* ─── Historical disasters ──────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '60px auto', padding: '0 40px' }}>
        <FadeInSection>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>Recent Disasters in Bengaluru</h2>
              <p style={{ color: 'var(--tx-muted)', margin: '6px 0 0', fontSize: 14 }}>
                Real events that shaped our understanding of urban risk
              </p>
            </div>
            <Link to="/simulation" style={{ textDecoration: 'none' }}>
              <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Simulate these <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </FadeInSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {HISTORICAL_DISASTERS.slice(0, 3).map((d, i) => (
            <FadeInSection key={d.event} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                className="card"
                style={{ padding: 24 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>
                    {d.type === 'Flood' ? '🌊' : d.type === 'Heatwave' ? '🌡️' : d.type === 'Cloudbursts' ? '⛈️' : '⚠️'}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                    background: 'var(--dan-bg)', color: 'var(--dan)', border: '1px solid rgba(200,92,69,0.2)',
                  }}>
                    {d.month} {d.year}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{d.event}</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--tx-muted)', lineHeight: 1.55 }}>
                  {d.description.slice(0, 120)}...
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, borderTop: '1px solid var(--ln)', paddingTop: 12 }}>
                  {[
                    { label: 'Deaths', value: d.deaths },
                    { label: 'Displaced', value: d.displaced.toLocaleString() },
                    { label: `${d.peakRainfall > 0 ? d.peakRainfall + 'mm' : '—'}`, value: d.estimatedLoss > 0 ? `₹${d.estimatedLoss}Cr` : '' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{value}</div>
                      <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </FadeInSection>
          ))}
        </div>
      </div>

      {/* ─── How it works ─────────────────────────────────── */}
      <div style={{ background: 'var(--surf)', borderTop: '1px solid var(--ln)', padding: '60px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeInSection>
            <h2 style={{ textAlign: 'center', marginBottom: 8, fontSize: 22 }}>How SafeGround Works</h2>
            <p style={{ textAlign: 'center', color: 'var(--tx-muted)', marginBottom: 40 }}>
              Four steps from awareness to action
            </p>
          </FadeInSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { step: '01', title: 'Assess Hazards', desc: 'View Bengaluru zone-wise risk for floods, heat, and landslides — calibrated against BBMP data.', icon: <Map size={24} /> },
              { step: '02', title: 'Run Simulations', desc: 'Replay the Sep 2022 megaflood or create custom scenarios. See real impact estimates instantly.', icon: <Zap size={24} /> },
              { step: '03', title: 'Build Your Plan', desc: 'Complete your preparedness checklist. Tasks save automatically to your profile.', icon: <Shield size={24} /> },
              { step: '04', title: 'Stay Updated', desc: 'Live weather data from Open-Meteo refreshes every 10 minutes. Real flood risk, always.', icon: <TrendingUp size={24} /> },
            ].map((item, i) => (
              <FadeInSection key={item.step} delay={i * 0.1}>
                <motion.div whileHover={{ y: -3 }} className="card">
                  <div style={{ color: 'var(--pri)', marginBottom: 12 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', letterSpacing: 1, marginBottom: 6 }}>STEP {item.step}</div>
                  <h3 style={{ margin: '0 0 8px' }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--tx-muted)', lineHeight: 1.6 }}>{item.desc}</p>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '70px 40px', background: 'var(--bg)' }}>
        <FadeInSection>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Ready to prepare Bengaluru?</h2>
          <p style={{ color: 'var(--tx-muted)', marginBottom: 28 }}>
            Join the platform used to understand and simulate urban disaster risk.
          </p>
          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: 16 }}
            >
              Get Started — It's Free <ArrowRight size={16} />
            </motion.button>
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--tx-muted)' }}>
            Powered by Open-Meteo • Supabase • Real BBMP/KSNDMC data
          </p>
        </FadeInSection>
      </div>
    </div>
  )
}

// Simple animated number
function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const isFloat = !Number.isInteger(target)
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      <Counter target={target} isFloat={isFloat} />{suffix}
    </motion.span>
  )
}

function Counter({ target, isFloat }: { target: number; isFloat: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <span ref={ref}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        onAnimationComplete={() => {
          if (!ref.current || !inView) return
          let frame = 0
          const frames = 80
          const timer = setInterval(() => {
            frame++
            const progress = frame / frames
            const eased = 1 - Math.pow(1 - progress, 3)
            const val = target * eased
            if (ref.current) ref.current.textContent = isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString()
            if (frame >= frames) clearInterval(timer)
          }, 20)
        }}
      >
        {isFloat ? target.toFixed(1) : target.toLocaleString()}
      </motion.span>
    </span>
  )
}
