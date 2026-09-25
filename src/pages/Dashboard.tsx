import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, ThermometerSun, Wind, AlertTriangle, TrendingUp,
  ArrowRight, Activity, ShieldCheck, MapPin, CheckCircle2,
  ExternalLink, Waves, Zap, ChevronDown, ChevronUp, BellRing
} from 'lucide-react'
import type { WeatherData } from '../hooks/useWeather'
import { BENGALURU_ZONES, BENGALURU_CLIMATE, RESILIENCE_DIMS, BENGALURU_STATS } from '../data/bengaluru'
import { useAuth } from '../hooks/useAuth'

interface DashboardProps {
  weatherData: WeatherData
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  LOW: { color: '#4c8c5e', bg: 'rgba(76, 140, 94, 0.1)', border: 'rgba(76, 140, 94, 0.25)' },
  MODERATE: { color: '#b45309', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.25)' },
  HIGH: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.25)' },
  CRITICAL: { color: '#991b1b', bg: 'rgba(153, 27, 27, 0.15)', border: 'rgba(153, 27, 27, 0.35)' },
}

const LIVE_ALERTS = [
  {
    id: 'a1',
    title: 'Severe Storm Drain Overflow Alert',
    sev: 'HIGH',
    zone: 'Outer Ring Road (ORR) / Bellandur Basin',
    time: '8 mins ago',
    detail: 'Rainfall exceeding 45mm/3h recorded. Stormwater velocity near Bellandur lake inlets has exceeded nominal drain throughput (7mm/h). Multiple tech corridor underpasses at risk.',
    action: 'Avoid Silk Board to Marathahalli flyover service lanes; shift electrical generators to higher floor levels.',
  },
  {
    id: 'a2',
    title: 'Varthur Lake Spillway Watch',
    sev: 'MODERATE',
    zone: 'Whitefield East / Varthur',
    time: '42 mins ago',
    detail: 'Water surface elevation reached 87% of crest gate threshold. Downstream stormwater channels operating near full capacity.',
    action: 'Residents in low-lying layouts advised to monitor BBMP ward updates and keep emergency supplies ready.',
  },
  {
    id: 'a3',
    title: 'Urban Heat Island Advisory',
    sev: 'LOW',
    zone: 'Shivajinagar / Central CBD',
    time: '3 hours ago',
    detail: 'Surface radiative temperatures 4.2°C above seasonal baseline due to dense built infrastructure and minimal green canopy.',
    action: 'Hydration checkpoints active across municipal bus terminals.',
  },
]

export default function Dashboard({ weatherData }: DashboardProps) {
  const { user } = useAuth()
  const [expandedAlert, setExpandedAlert] = useState<string | null>('a1')
  const [selectedZoneTab, setSelectedZoneTab] = useState<'all' | 'high'>('all')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const citizenName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Resident'

  // Computed risk
  const overallRisk = Math.round((weatherData.floodRiskToday * 0.65 + weatherData.heatRiskToday * 0.35))
  const riskLevel = overallRisk >= 70 ? 'CRITICAL' : overallRisk >= 50 ? 'HIGH' : overallRisk >= 35 ? 'MODERATE' : 'LOW'
  const riskMeta = SEVERITY_CONFIG[riskLevel]

  const highRiskZones = BENGALURU_ZONES.filter(z => z.floodRisk >= 60)
  const displayedZones = selectedZoneTab === 'high' ? highRiskZones : BENGALURU_ZONES

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ─── Top Welcome & Status Banner ──────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: 'rgba(23, 55, 45, 0.08)',
              color: 'var(--pri)',
              border: '1px solid rgba(23, 55, 45, 0.15)',
            }}>
              <ShieldCheck size={14} /> Verified Citizen
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--surf)',
              color: 'var(--tx-muted)',
              border: '1px solid var(--ln)',
            }}>
              <MapPin size={12} /> Greater Bengaluru (BBMP)
            </span>
          </div>

          <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.5vw, 34px)', fontWeight: 700, color: 'var(--tx)' }}>
            {greeting}, {citizenName}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--tx-muted)', fontSize: 14 }}>
            Real-time urban telemetry & disaster preparedness hub for Bengaluru
          </p>
        </div>

        {/* Live sync pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--surf)',
          padding: '8px 16px',
          borderRadius: 30,
          border: '1px solid var(--ln)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>Open-Meteo Live</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
            Synced {weatherData.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ─── Metric Cards Grid ────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 18,
      }}>
        {/* Card 1: City Risk */}
        <motion.div
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
          className="card"
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              City Risk Index
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              background: riskMeta.bg,
              color: riskMeta.color,
              border: `1px solid ${riskMeta.border}`,
            }}>
              {riskLevel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: riskMeta.color, lineHeight: 1 }}>
              {overallRisk}
            </span>
            <span style={{ fontSize: 14, color: 'var(--tx-muted)', fontWeight: 600 }}>/ 100</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
            Primary driver: <b style={{ color: 'var(--tx)' }}>{weatherData.floodRiskToday > 40 ? 'Precipitation Overload' : 'Thermal Load'}</b>
          </div>
        </motion.div>

        {/* Card 2: 24h Rainfall */}
        <motion.div
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
          className="card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              24h Precipitation
            </span>
            <Droplets size={16} color="var(--pri)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: 'var(--tx)', lineHeight: 1 }}>
              {weatherData.rainfall24h}
            </span>
            <span style={{ fontSize: 15, color: 'var(--tx-muted)', fontWeight: 600 }}>mm</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
            Threshold: <b style={{ color: weatherData.rainfall1h >= 7 ? 'var(--dan)' : 'var(--tx)' }}>7mm/h drain capacity</b>
          </div>
        </motion.div>

        {/* Card 3: Lake Network Status */}
        <motion.div
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
          className="card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Active Lake Cascades
            </span>
            <Waves size={16} color="#3b82f6" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>
              {BENGALURU_STATS.lakes}
            </span>
            <span style={{ fontSize: 13, color: 'var(--dan)', fontWeight: 600 }}>
              (-{BENGALURU_STATS.lakesLost} lost)
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
            Bellandur & Varthur spillways on watch
          </div>
        </motion.div>

        {/* Card 4: Preparedness Readiness */}
        <motion.div
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
          className="card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Readiness Score
            </span>
            <CheckCircle2 size={16} color="var(--low)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: 'var(--low)', lineHeight: 1 }}>
              75%
            </span>
            <span style={{ fontSize: 13, color: 'var(--tx-muted)', fontWeight: 600 }}>6 of 8 items</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
            <Link to="/preparedness" style={{ color: 'var(--pri)', fontWeight: 600, textDecoration: 'none' }}>
              Complete remaining tasks →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ─── Weather Telemetry Glass Bar ──────────────────────── */}
      <div style={{
        background: 'var(--surf)',
        border: '1px solid var(--ln)',
        borderRadius: 12,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        {[
          { icon: <ThermometerSun size={18} color="var(--pri)" />, label: 'Ambient Temperature', value: `${weatherData.currentTemp}°C`, sub: `Feels like ${weatherData.feelsLike}°C` },
          { icon: <Droplets size={18} color="#3b82f6" />, label: 'Hourly Rain Rate', value: `${weatherData.rainfall1h} mm/h`, sub: weatherData.rainfall1h >= 7 ? 'Drain overload risk' : 'Nominal runoff' },
          { icon: <Wind size={18} color="var(--pri)" />, label: 'Wind Velocity', value: `${weatherData.windSpeed} km/h`, sub: 'SW Monsoon breeze' },
          { icon: <Activity size={18} color="#b45309" />, label: 'Atmospheric State', value: weatherData.condition, sub: `${weatherData.humidity}% humidity` },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'var(--bg)',
              border: '1px solid var(--ln)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>
                {item.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Two-Column Layout ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 32 }}>

        {/* ── Left Column: Alerts & Climate ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Active Alerts Section */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BellRing size={18} color="var(--dan)" />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  Active Emergency Bulletins ({LIVE_ALERTS.length})
                </h2>
              </div>
              <span style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>
                KSNDMC / BBMP FEED
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {LIVE_ALERTS.map(alert => {
                const isExpanded = expandedAlert === alert.id
                const meta = SEVERITY_CONFIG[alert.sev]
                return (
                  <div
                    key={alert.id}
                    style={{
                      border: '1px solid var(--ln)',
                      borderLeft: `4px solid ${meta.color}`,
                      borderRadius: 8,
                      background: 'var(--bg)',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          background: meta.bg,
                          color: meta.color,
                        }}>
                          {alert.sev}
                        </span>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {alert.title}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--tx-muted)', fontSize: 12 }}>
                        <span>{alert.time}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ padding: '0 16px 14px', borderTop: '1px solid var(--ln)' }}
                        >
                          <div style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 10, fontWeight: 600 }}>
                            LOCATION: {alert.zone}
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--tx)', margin: '6px 0 10px', lineHeight: 1.5 }}>
                            {alert.detail}
                          </p>
                          <div style={{
                            background: 'var(--surf)',
                            padding: '8px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            color: 'var(--pri)',
                            fontWeight: 500,
                          }}>
                            <b>Action:</b> {alert.action}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Climate Warming Trajectory */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  Bengaluru Warming Trajectory (2015–2025)
                </h2>
                <div style={{ fontSize: 13, color: 'var(--tx-muted)', marginTop: 4 }}>
                  Decadal warming rate: <b style={{ color: 'var(--dan)' }}>+2.4°C</b> above historical baseline
                </div>
              </div>
              <Link to="/climate" style={{ color: 'var(--pri)', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Full Analytics <ArrowRight size={13} />
              </Link>
            </div>

            {/* Smooth SVG Temperature Curve */}
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--ln)' }}>
              <svg viewBox="0 0 460 140" width="100%" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C85C45" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#C85C45" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal reference grid lines */}
                <line x1="20" y1="30" x2="440" y2="30" stroke="var(--ln)" strokeDasharray="3 3" />
                <line x1="20" y1="75" x2="440" y2="75" stroke="var(--ln)" strokeDasharray="3 3" />
                <line x1="20" y1="120" x2="440" y2="120" stroke="var(--ln)" strokeDasharray="3 3" />

                {/* Data points mapping */}
                {(() => {
                  const data = BENGALURU_CLIMATE.map(c => c.avgTemp)
                  const min = Math.min(...data)
                  const max = Math.max(...data)
                  const pts = data.map((v, i) => [
                    24 + (i / (data.length - 1)) * 412,
                    120 - ((v - min) / (max - min || 1)) * 90,
                  ])
                  const dPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ')
                  const fillPath = `${dPath} L ${pts[pts.length - 1][0]},125 L ${pts[0][0]},125 Z`

                  return (
                    <>
                      <path d={fillPath} fill="url(#tempGradient)" />
                      <path d={dPath} fill="none" stroke="#C85C45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={p[0]} cy={p[1]} r="4" fill="#C85C45" stroke="#ffffff" strokeWidth="1.5" />
                          {i % 2 === 0 && (
                            <text x={p[0]} y={p[1] - 8} fontSize="10" fill="var(--tx)" textAnchor="middle" fontWeight="600">
                              {data[i]}°
                            </text>
                          )}
                        </g>
                      ))}
                    </>
                  )
                })()}
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx-muted)', marginTop: 8, padding: '0 8px' }}>
                <span>2015</span>
                <span>2017</span>
                <span>2019</span>
                <span>2021</span>
                <span>2023</span>
                <span>2025</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Zone Risk & Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* BBMP Zone Vulnerability Card */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  BBMP Ward Risk Telemetry
                </h2>
                <div style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 2 }}>
                  Live vulnerability scoring per zone
                </div>
              </div>

              <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 6, padding: 2, border: '1px solid var(--ln)' }}>
                <button
                  onClick={() => setSelectedZoneTab('all')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedZoneTab === 'all' ? 'var(--surf)' : 'transparent',
                    color: 'var(--tx)',
                  }}
                >
                  All (8)
                </button>
                <button
                  onClick={() => setSelectedZoneTab('high')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedZoneTab === 'high' ? 'var(--surf)' : 'transparent',
                    color: selectedZoneTab === 'high' ? 'var(--dan)' : 'var(--tx-muted)',
                  }}
                >
                  High Risk (4)
                </button>
              </div>
            </div>

            {/* Zone List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 310, overflowY: 'auto' }}>
              {displayedZones.map(zone => {
                const isCritical = zone.floodRisk >= 70
                const isModerate = zone.floodRisk >= 50
                const color = isCritical ? 'var(--dan)' : isModerate ? 'var(--warn)' : 'var(--low)'
                return (
                  <Link
                    key={zone.id}
                    to="/risk-map"
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--bg)',
                      border: '1px solid var(--ln)',
                      transition: 'transform 0.15s, border-color 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--tx)' }}>
                        {zone.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>
                        {zone.ward} · {zone.nearbyLakes[0] || 'Urban Corridor'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color }}>
                          {zone.floodRisk} / 100
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--tx-muted)' }}>
                          {zone.drainageCapacity} mm/h cap
                        </div>
                      </div>
                      <ArrowRight size={13} color="var(--tx-muted)" />
                    </div>
                  </Link>
                )
              })}
            </div>

            <Link to="/risk-map" style={{ textDecoration: 'none' }}>
              <button
                className="btn-outline"
                style={{ width: '100%', marginTop: 14, justifyContent: 'center', fontSize: 13 }}
              >
                Open Full Geospatial Risk Map →
              </button>
            </Link>
          </div>

          {/* Quick Simulation CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #17372D 0%, #1d4337 100%)',
            borderRadius: 12,
            padding: '22px 24px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#9DBFA9' }}>
              <Zap size={18} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                What-If Scenario
              </span>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#ffffff' }}>
              Simulate a 130mm Megaflood in Bengaluru
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Test how Bellandur Lake overflow, transformer submersion, and road cut-offs would cascade into your neighbourhood.
            </p>
            <Link to="/simulation" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: '#9DBFA9',
                  color: '#17372D',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Launch Simulator <ArrowRight size={14} />
              </motion.button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
