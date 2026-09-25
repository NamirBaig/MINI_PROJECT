import React from 'react'
import { motion } from 'framer-motion'
import { Thermometer, Droplets, AlertTriangle, TrendingUp, Info } from 'lucide-react'
import { BENGALURU_CLIMATE, BENGALURU_LAKES, RESILIENCE_DIMS, BENGALURU_STATS } from '../data/bengaluru'

export default function Climate() {
  const years = BENGALURU_CLIMATE.map(c => c.year)
  const temps = BENGALURU_CLIMATE.map(c => c.avgTemp)
  const rains = BENGALURU_CLIMATE.map(c => c.annualRainfall)

  // SVG Chart helper
  const renderLineChart = (data: number[], color: string, unit: string) => {
    const W = 400, H = 140
    const min = Math.min(...data)
    const max = Math.max(...data)
    const pts = data.map((v, i) => [
      15 + (i / (data.length - 1)) * (W - 30),
      H - 20 - ((v - min) / (max - min || 1)) * (H - 40),
    ])
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ')

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ background: 'var(--surf)', borderRadius: 8, padding: 8 }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={3.5} fill={color} />
            <text x={p[0]} y={p[1] - 8} fontSize={9} fill="var(--tx)" textAnchor="middle" fontWeight="600">
              {data[i]}{unit}
            </text>
            <text x={p[0]} y={H - 5} fontSize={9} fill="var(--tx-muted)" textAnchor="middle">
              {years[i]}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px' }}>Bengaluru Climate Trends & Resilience</h1>
        <p className="sub" style={{ margin: 0 }}>
          Tracking 10-year meteorological shifts, urban heat island progression, and ecological loss in the Silicon Plateau.
        </p>
      </div>

      {/* Critical metrics banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C85C45', marginBottom: 6 }}>
            <Thermometer size={16} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>WARMING RATE</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>+2.4°C</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Average temp rise (2015–2025)</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D59A2A', marginBottom: 6 }}>
            <Droplets size={16} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>LAKES VANISHED</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{BENGALURU_STATS.lakesLost}</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Lakes paved over since 1960</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4c8c5e', marginBottom: 6 }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>VEGETATION COVER</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>3.8%</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Down from 68% in 1973 (IISc data)</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div className="card">
          <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Mean Annual Temperature Trend (°C)</h2>
          {renderLineChart(temps, '#C85C45', '°')}
          <p style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 8 }}>
            Data reflects urban heat island effect across central and Eastern tech zones.
          </p>
        </div>

        <div className="card">
          <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Annual Rainfall Volume (mm)</h2>
          {renderLineChart(rains, '#526C78', 'm')}
          <p style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 8 }}>
            Extreme cloudburst variability leading to chronic localized inundations.
          </p>
        </div>
      </div>

      {/* Resilience Dimensions & Lake Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
        {/* Dimensions */}
        <div className="card">
          <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>City Resilience Score: 52/100</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {RESILIENCE_DIMS.map(d => (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  <span style={{ fontWeight: 700, color: d.score < 50 ? 'var(--dan)' : 'var(--pri)' }}>{d.score}%</span>
                </div>
                <div className="bar">
                  <motion.div
                    className="bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ background: d.score < 50 ? 'var(--dan)' : 'var(--pri)' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>{d.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lake Health Index */}
        <div className="card">
          <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>Bengaluru Lake Encroachment & Capacity Index</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ln)', textAlign: 'left', color: 'var(--tx-muted)' }}>
                  <th style={{ padding: '6px 4px' }}>Lake</th>
                  <th style={{ padding: '6px 4px' }}>Zone</th>
                  <th style={{ padding: '6px 4px' }}>Capacity</th>
                  <th style={{ padding: '6px 4px' }}>Encroached</th>
                  <th style={{ padding: '6px 4px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {BENGALURU_LAKES.map(l => (
                  <tr key={l.name} style={{ borderBottom: '1px solid var(--ln)' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 600 }}>{l.name}</td>
                    <td style={{ padding: '8px 4px', color: 'var(--tx-muted)' }}>{l.zone}</td>
                    <td style={{ padding: '8px 4px' }}>{l.currentCapacity}%</td>
                    <td style={{ padding: '8px 4px', color: l.encroachment > 60 ? 'var(--dan)' : 'inherit' }}>
                      {l.encroachment}%
                    </td>
                    <td style={{ padding: '8px 4px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 700,
                        background: l.status === 'Critical' ? 'var(--dan-bg)' : l.status === 'High' ? 'var(--warn-bg)' : 'var(--low-bg)',
                        color: l.status === 'Critical' ? 'var(--dan)' : l.status === 'High' ? 'var(--warn)' : 'var(--low)',
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
