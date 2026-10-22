import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, MapPin, AlertCircle, PhoneCall, ShieldAlert,
  Copy, CheckCircle2, Truck, Waves, Send, X, PlusCircle, Compass, Crosshair
} from 'lucide-react'
import { BENGALURU_RESOURCES, BENGALURU_ZONES } from '../data/bengaluru'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import RequirementMap from '../components/RequirementMap'
import EmergencyRequestModal from '../components/EmergencyRequestModal'

const EMERGENCY_CONTACTS = [
  { name: 'BBMP Disaster Control Room', phone: '080-22221188', tollFree: '1533', desc: 'Central stormwater, dewatering pumps & fallen trees' },
  { name: 'Unified State Emergency', phone: '112', tollFree: '112', desc: 'Police, Fire and Immediate Life Hazard Rescue' },
  { name: 'Karnataka SDRF Headquarters', phone: '080-22340675', tollFree: '1070', desc: 'State Disaster Response Force motorized boats & divers' },
  { name: 'KSNDMC Varuna Mitra', phone: '080-22340676', tollFree: '1800-425-1188', desc: 'State Natural Disaster Monitoring real-time rain alerts' },
  { name: 'Karnataka 108 Emergency Ambulance', phone: '108', tollFree: '108', desc: 'Medical emergency airlift & trauma response' },
  { name: 'BESCOM Electrical Helpline', phone: '1912', tollFree: '1912', desc: 'Substation shutoff & transformer submersion risks' },
]

export default function Resources() {
  const { currentRole } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'requirement_map' | 'inventory'>('requirement_map')
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
  const [resources, setResources] = useState(() => BENGALURU_RESOURCES)
  const [filter, setFilter] = useState('All')
  const [dispatchModalItem, setDispatchModalItem] = useState<any | null>(null)
  const [targetWard, setTargetWard] = useState('Yelahanka (Kendriya Vihar)')
  const [dispatchQty, setDispatchQty] = useState(5)

  const handleCopy = (num: string, name: string) => {
    toast.copy(num)
  }

  const handleOpenDispatch = (res: any) => {
    playClickSound()
    setDispatchModalItem(res)
    setDispatchQty(Math.min(5, res.available))
  }

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dispatchModalItem) return
    playSuccessSound()

    setResources(prev => prev.map(r => {
      if (r.type === dispatchModalItem.type) {
        return { ...r, available: Math.max(0, r.available - dispatchQty) }
      }
      return r
    }))

    toast.success(
      `Dispatched ${dispatchQty} units of ${dispatchModalItem.type}`,
      `Route: Base Depot ➔ ${targetWard}`
    )
    setDispatchModalItem(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="status-pill">
            <Package size={14} /> Municipal Logistics Grid
          </span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontWeight: 800 }}>Municipal Resource Inventory & Logistics</h1>
        <p className="sub" style={{ margin: 0, fontSize: 15 }}>
          Real-time municipal inventory versus contingency benchmarks with 1-click rapid deployment across Bengaluru.
        </p>
      </div>

      {/* ─── Tabs Switcher ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: 14,
      }}>
        <button
          onClick={() => { playClickSound(); setActiveTab('requirement_map'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: activeTab === 'requirement_map' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'requirement_map' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'requirement_map' ? '#030604' : '#FFFFFF',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Crosshair size={16} />
          <span>📍 Live Ward Requirement & Severity Map</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('inventory'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: activeTab === 'inventory' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'inventory' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'inventory' ? '#030604' : '#FFFFFF',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Package size={16} />
          <span>📦 Municipal Depot Inventory & Rapid Dispatch</span>
        </button>
      </div>

      {activeTab === 'requirement_map' ? (
        <RequirementMap />
      ) : (
        <>
      {/* ─── Emergency Helplines Cockpit ─────────────────────── */}
      <div className="bento-card">
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: 'var(--tx)' }}>
          Direct Emergency Dispatch Numbers
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}>
          {EMERGENCY_CONTACTS.map((c, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{c.name}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}>
                  TOLL FREE {c.tollFree}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--tx-muted)', lineHeight: 1.4 }}>{c.desc}</div>

              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCopy(c.phone, c.name)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--pri-neon)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={13} /> {c.phone}
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Critical Supplies Table Card ────────────────────── */}
      <div className="bento-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Critical Supplies & Logistical Readiness</h2>
          <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Updated hourly by KSSDMA</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--tx-muted)' }}>
                <th style={{ padding: '12px 10px' }}>Resource Asset</th>
                <th style={{ padding: '12px 10px' }}>Available</th>
                <th style={{ padding: '12px 10px' }}>Benchmark Need</th>
                <th style={{ padding: '12px 10px' }}>Deficit Status</th>
                <th style={{ padding: '12px 10px' }}>Base Depot / Location</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => {
                const deficit = Math.max(0, r.required - r.available)
                const deficitPct = Math.round((deficit / r.required) * 100)
                const isCritical = deficitPct >= 30

                return (
                  <tr key={r.type} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 10px', fontWeight: 700, color: '#FFFFFF' }}>{r.type}</td>
                    <td style={{ padding: '14px 10px', fontWeight: 800, color: 'var(--pri-neon)' }}>{r.available.toLocaleString()}</td>
                    <td style={{ padding: '14px 10px', color: 'rgba(255,255,255,0.7)' }}>{r.required.toLocaleString()}</td>
                    <td style={{ padding: '14px 10px' }}>
                      {deficit > 0 ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isCritical ? '#EF4444' : '#F59E0B',
                          border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        }}>
                          {deficit.toLocaleString()} short ({deficitPct}%)
                        </span>
                      ) : (
                        <span style={{ color: '#34D399', fontWeight: 700 }}>Adequate</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 10px', color: 'var(--tx-dim)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} color="var(--pri-neon)" />
                        {r.location}
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenDispatch(r)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34D399',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Request Dispatch
                      </motion.button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Relief Shelters Section ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="bento-card">
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>High-Ground Evacuation Shelters</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Yelahanka Mini Stadium', cap: '2,500 evacuees', zone: 'North Zone', elevated: '+18m above lake level' },
              { name: 'Malleswaram Canara Union Grounds', cap: '1,800 evacuees', zone: 'Central West', elevated: '+24m elevation' },
              { name: 'Jayanagar National College Grounds', cap: '3,200 evacuees', zone: 'South Zone', elevated: '+15m elevation' },
              { name: 'Mahadevapura Govt Model School', cap: '1,400 evacuees', zone: 'East Corridor', elevated: '+12m above ORR canal' },
            ].map((s, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{s.zone} · {s.elevated}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--pri-neon)' }}>{s.cap}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card">
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>Emergency Escalation Thresholds</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontWeight: 800, color: '#34D399' }}>Stage 1 (Alert 50mm Rain):</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                Clearing silt traps at Silk Board, Marathahalli & Bellandur outlets.
              </div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontWeight: 800, color: '#FBBF24' }}>Stage 2 (Warning 80mm Rain):</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                Deployment of 28 motorized boats and high-flow diesel pumps to Mahadevapura.
              </div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontWeight: 800, color: '#EF4444' }}>Stage 3 (Critical 120mm+ Cloudburst):</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                SDRF & NDRF motorized boat rescue and mobile emergency clinic activation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modal: Request Dispatch ─────────────────────────── */}
      <AnimatePresence>
        {dispatchModalItem && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 18,
                padding: '28px 32px',
                maxWidth: 480,
                width: '100%',
                color: '#FFFFFF',
                boxShadow: '0 0 50px rgba(16, 185, 129, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Truck size={22} color="#34D399" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Dispatch: {dispatchModalItem.type}</h3>
                </div>
                <button
                  onClick={() => setDispatchModalItem(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--tx-dim)', marginBottom: 6 }}>
                    Destination Emergency Zone
                  </label>
                  <select
                    value={targetWard}
                    onChange={e => setTargetWard(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)',
                      color: '#FFFFFF', fontSize: 13, boxSizing: 'border-box'
                    }}
                  >
                    <option value="Yelahanka (Kendriya Vihar & Kogilu)" style={{ background: '#0C1A14' }}>Yelahanka (Kendriya Vihar & Kogilu)</option>
                    <option value="Whitefield (ITPL & Varthur Lake Spillway)" style={{ background: '#0C1A14' }}>Whitefield (ITPL & Varthur Lake Spillway)</option>
                    <option value="Outer Ring Road (Bellandur EcoSpace Underpass)" style={{ background: '#0C1A14' }}>Outer Ring Road (Bellandur EcoSpace Underpass)</option>
                    <option value="Koramangala 5th Block Low-Lying Layouts" style={{ background: '#0C1A14' }}>Koramangala 5th Block Low-Lying Layouts</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--tx-dim)', marginBottom: 6 }}>
                    Quantity to Dispatch (Max {dispatchModalItem.available})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={dispatchModalItem.available}
                    value={dispatchQty}
                    onChange={e => setDispatchQty(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)',
                      color: '#FFFFFF', fontSize: 13, boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-shiny"
                  style={{ marginTop: 8, padding: '12px', justifyContent: 'center' }}
                >
                  Confirm Rapid Deployment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}

      {/* Emergency Request Modal */}
      <EmergencyRequestModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </div>
  )
}
