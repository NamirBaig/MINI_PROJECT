import React from 'react'
import { motion } from 'framer-motion'
import { Package, MapPin, AlertCircle, PhoneCall, ShieldAlert } from 'lucide-react'
import { BENGALURU_RESOURCES } from '../data/bengaluru'

export default function Resources() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px' }}>Municipal Resource Inventory</h1>
        <p className="sub" style={{ margin: 0 }}>
          Real-time municipal capacity versus emergency contingency benchmarks across Greater Bengaluru.
        </p>
      </div>

      {/* Resource Table Card */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>Critical Supplies & Logistical Readiness</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ln)', textAlign: 'left', color: 'var(--tx-muted)' }}>
                <th style={{ padding: '8px 6px' }}>Resource Asset</th>
                <th style={{ padding: '8px 6px' }}>Available</th>
                <th style={{ padding: '8px 6px' }}>Benchmark Need</th>
                <th style={{ padding: '8px 6px' }}>Deficit Status</th>
                <th style={{ padding: '8px 6px' }}>Base Depot / Location</th>
              </tr>
            </thead>
            <tbody>
              {BENGALURU_RESOURCES.map(r => {
                const deficit = Math.max(0, r.required - r.available)
                const deficitPct = Math.round((deficit / r.required) * 100)
                const isCritical = deficitPct >= 30

                return (
                  <tr key={r.type} style={{ borderBottom: '1px solid var(--ln)' }}>
                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>{r.type}</td>
                    <td style={{ padding: '10px 6px' }}>{r.available.toLocaleString()}</td>
                    <td style={{ padding: '10px 6px' }}>{r.required.toLocaleString()}</td>
                    <td style={{ padding: '10px 6px' }}>
                      {deficit > 0 ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          background: isCritical ? 'var(--dan-bg)' : 'var(--warn-bg)',
                          color: isCritical ? 'var(--dan)' : 'var(--warn)',
                        }}>
                          {deficit.toLocaleString()} short ({deficitPct}%)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--low)', fontWeight: 600 }}>Adequate</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 6px', color: 'var(--tx-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} />
                        {r.location}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logistics & Evacuation Depots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Designated High-Ground Relief Shelters</h2>
          <p style={{ fontSize: 13, color: 'var(--tx-muted)', marginBottom: 16 }}>
            BBMP community halls elevated above maximum recorded lake backwater levels:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
            <li><strong>Yelahanka Mini Stadium</strong> – Capacity: 2,500 evacuees (North Zone)</li>
            <li><strong>Malleswaram Canara Union Grounds</strong> – Capacity: 1,800 evacuees (Central West)</li>
            <li><strong>Jayanagar National College Grounds</strong> – Capacity: 3,200 evacuees (South Zone)</li>
            <li><strong>Mahadevapura Govt Model School</strong> – Capacity: 1,400 evacuees (East Corridor)</li>
          </ul>
        </div>

        <div className="card">
          <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Emergency Dispatch Protocol</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <div style={{ background: 'var(--surf2)', padding: 10, borderRadius: 6 }}>
              <strong>Stage 1 (Alert 50mm rain):</strong>
              <div style={{ color: 'var(--tx-muted)', marginTop: 2 }}>
                Clearing silt traps at Silk Board, Marathahalli & Bellandur outlets.
              </div>
            </div>
            <div style={{ background: 'var(--surf2)', padding: 10, borderRadius: 6 }}>
              <strong>Stage 2 (Warning 80mm rain):</strong>
              <div style={{ color: 'var(--tx-muted)', marginTop: 2 }}>
                Deployment of 28 motorized boats and high-flow diesel pumps to Mahadevapura.
              </div>
            </div>
            <div style={{ background: 'var(--surf2)', padding: 10, borderRadius: 6 }}>
              <strong>Stage 3 (Critical 120mm+ rain):</strong>
              <div style={{ color: 'var(--tx-muted)', marginTop: 2 }}>
                SDRF & NDRF airlifting and mobile medical camp activation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
