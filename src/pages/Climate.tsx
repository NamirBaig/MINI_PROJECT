import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Thermometer, Droplets, AlertTriangle, TrendingUp, Info, Waves, Sparkles } from 'lucide-react'
import { BENGALURU_CLIMATE, BENGALURU_LAKES, RESILIENCE_DIMS, BENGALURU_STATS } from '../data/bengaluru'
import { playClickSound } from '../utils/audioFeedback'
import { useToast } from '../context/ToastContext'

export default function Climate() {
  const toast = useToast()
  const [selectedLakeTab, setSelectedLakeTab] = useState<'all' | 'critical'>('all')

  const years = BENGALURU_CLIMATE.map(c => c.year)
  const temps = BENGALURU_CLIMATE.map(c => c.avgTemp)
  const rains = BENGALURU_CLIMATE.map(c => c.annualRainfall)

  // SVG Chart helper
  const renderLineChart = (data: number[], color: string, unit: string) => {
    const W = 400, H = 140
    const min = Math.min(...data)
    const max = Math.max(...data)
    const pts = data.map((v, i) => [
      20 + (i / (data.length - 1)) * (W - 40),
      H - 24 - ((v - min) / (max - min || 1)) * (H - 48),
    ])
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ')

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '10px 4px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={3.5} fill={color} stroke="#FFFFFF" strokeWidth={1} />
            <text x={p[0]} y={p[1] - 8} fontSize={9} fill="rgba(255,255,255,0.85)" textAnchor="middle" fontWeight="700">
              {data[i]}{unit}
            </text>
            <text x={p[0]} y={H - 6} fontSize={9} fill="var(--tx-muted)" textAnchor="middle">
              {years[i]}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  const displayedLakes = selectedLakeTab === 'critical'
    ? BENGALURU_LAKES.filter(l => l.status === 'Critical')
    : BENGALURU_LAKES

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="status-pill">
            <TrendingUp size={14} /> IISc & IMD Decadal Research
          </span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontWeight: 800 }}>Bengaluru Climate Trends & Ecological Loss</h1>
        <p className="sub" style={{ margin: 0, fontSize: 15 }}>
          Tracking 10-year meteorological shifts, urban heat island progression, and lake encroachment across the Silicon Plateau.
        </p>
      </div>

      {/* Critical metrics banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
        <div className="bento-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', marginBottom: 8 }}>
            <Thermometer size={16} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>WARMING RATE</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#FFFFFF' }}>+2.4°C</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 4 }}>Decadal surface warming (2015–2025)</div>
        </div>

        <div className="bento-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B', marginBottom: 8 }}>
            <Droplets size={16} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>LAKES PAVED OVER</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#FFFFFF' }}>{BENGALURU_STATS.lakesLost}</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 4 }}>Disappeared since 1960 due to urban sprawl</div>
        </div>

        <div className="bento-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', marginBottom: 8 }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>TREE CANOPY LEFT</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--pri-neon)' }}>3.8%</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 4 }}>Plummeted from 68% in 1973 (IISc Report 123)</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        <div className="bento-card">
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>Mean Annual Temperature Trend (°C)</h2>
          {renderLineChart(temps, '#EF4444', '°')}
          <p style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 10 }}>
            Radiative heat trap caused by 1005% increase in concrete surfaces.
          </p>
        </div>

        <div className="bento-card">
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>Annual Rainfall Volume (mm)</h2>
          {renderLineChart(rains, '#34D399', 'm')}
          <p style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 10 }}>
            Erratic monsoon cloudburst intensity resulting in instant urban runoff.
          </p>
        </div>
      </div>

      {/* Resilience Dimensions & Lake Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 24 }}>
        {/* Dimensions */}
        <div className="bento-card">
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>City Resilience Score: 52/100</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {RESILIENCE_DIMS.map(d => (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{d.name}</span>
                  <span style={{ fontWeight: 800, color: d.score < 50 ? '#EF4444' : '#34D399' }}>{d.score}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 0.8 }}
                    style={{
                      height: '100%',
                      background: d.score < 50 ? 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)' : 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                      borderRadius: 6,
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 4 }}>{d.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lake Health Index */}
        <div className="bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Bengaluru Lake Encroachment Index</h2>
            <div style={{ display: 'flex', gap: 6, background: 'var(--surf2)', padding: 3, borderRadius: 8 }}>
              <button
                onClick={() => { playClickSound(); setSelectedLakeTab('all'); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: selectedLakeTab === 'all' ? 'var(--pri)' : 'transparent',
                  color: selectedLakeTab === 'all' ? '#030604' : 'var(--tx-dim)',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                All (10)
              </button>
              <button
                onClick={() => { playClickSound(); setSelectedLakeTab('critical'); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: selectedLakeTab === 'critical' ? '#EF4444' : 'transparent',
                  color: selectedLakeTab === 'critical' ? '#FFFFFF' : 'var(--tx-dim)',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Critical (3)
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--tx-muted)' }}>
                  <th style={{ padding: '8px 6px' }}>Lake</th>
                  <th style={{ padding: '8px 6px' }}>Zone</th>
                  <th style={{ padding: '8px 6px' }}>Capacity</th>
                  <th style={{ padding: '8px 6px' }}>Encroached</th>
                  <th style={{ padding: '8px 6px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedLakes.map(l => (
                  <tr key={l.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 6px', fontWeight: 700, color: '#FFFFFF' }}>{l.name}</td>
                    <td style={{ padding: '10px 6px', color: 'var(--tx-muted)' }}>{l.zone}</td>
                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>{l.currentCapacity}%</td>
                    <td style={{ padding: '10px 6px', color: l.encroachment > 60 ? '#EF4444' : 'inherit', fontWeight: 700 }}>
                      {l.encroachment}%
                    </td>
                    <td style={{ padding: '10px 6px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 800,
                        background: l.status === 'Critical' ? 'rgba(239,68,68,0.15)' : l.status === 'High' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: l.status === 'Critical' ? '#EF4444' : l.status === 'High' ? '#F59E0B' : '#34D399',
                        border: `1px solid ${l.status === 'Critical' ? 'rgba(239,68,68,0.3)' : l.status === 'High' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                      }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
