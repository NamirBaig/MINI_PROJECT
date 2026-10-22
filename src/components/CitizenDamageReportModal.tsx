import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, AlertTriangle, X, CheckCircle2, MapPin,
  Waves, Car, Zap, Building, ShieldAlert, Send, Sparkles
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import { submitDamageReport, type CitizenDamageReport } from '../services/incidentAndReliefService'

interface CitizenDamageReportModalProps {
  isOpen: boolean
  onClose: () => void
  initialLandmark?: string
  initialZone?: string
}

const BENGALURU_ZONES = [
  'Mahadevapura',
  'Yelahanka',
  'Bommanahalli',
  'East',
  'West',
  'South',
  'RR Nagar',
  'Dasarahalli',
]

const LANDMARK_PRESETS = [
  { name: 'Outer Ring Road (EcoSpace Underpass & Service Road)', zone: 'Mahadevapura' },
  { name: 'Kendriya Vihar & Kogilu Cross Corridor', zone: 'Yelahanka' },
  { name: 'Silk Board Junction & Madiwala Underpass', zone: 'Bommanahalli' },
  { name: 'Manyata Tech Park & Nagawara Ring Road', zone: 'East' },
  { name: 'Bellandur Lake Spillway & Yamalur Bridge', zone: 'Mahadevapura' },
  { name: 'Kuvempu Nagar & Dollars Colony Drain Stretch', zone: 'Dasarahalli' },
  { name: 'Kengeri Satellite Town & Vrishabhavathi Bank', zone: 'RR Nagar' },
]

const DAMAGE_TYPES: Array<{
  type: CitizenDamageReport['damageType']
  label: string
  icon: any
  desc: string
}> = [
  { type: 'Road Submersion', label: 'Road Submersion', icon: Waves, desc: 'Impassable arterial street or underpass' },
  { type: 'Submerged Vehicles', label: 'Submerged Vehicles', icon: Car, desc: 'Cars/bikes trapped or floating' },
  { type: 'Basement Inundation', label: 'Basement Inundation', icon: Building, desc: 'Apartment parking or elevator pit flooded' },
  { type: 'Power Cut', label: 'Substation / Transformer Failure', icon: Zap, desc: 'Blackout or electrocution risk' },
  { type: 'Drinking Water Contamination', label: 'Sump Water Contamination', icon: Droplets, desc: 'Sewage backflow into drinking supply' },
  { type: 'Structural Crack', label: 'Compound Wall / Structural Crack', icon: AlertTriangle, desc: 'Risk of boundary collapse' },
]

export default function CitizenDamageReportModal({
  isOpen,
  onClose,
  initialLandmark,
  initialZone,
}: CitizenDamageReportModalProps) {
  const { user } = useAuth()
  const toast = useToast()

  const [zone, setZone] = useState<string>(initialZone || 'Mahadevapura')
  const [landmark, setLandmark] = useState<string>(initialLandmark || LANDMARK_PRESETS[0].name)
  const [waterDepthFeet, setWaterDepthFeet] = useState<number>(3.0)
  const [damageType, setDamageType] = useState<CitizenDamageReport['damageType']>('Road Submersion')
  const [description, setDescription] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedReport, setSubmittedReport] = useState<CitizenDamageReport | null>(null)

  const [reporterName, setReporterName] = useState(() => {
    return user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Bengaluru Resident')
  })

  const [reporterEmail, setReporterEmail] = useState(() => {
    if (user?.email && !user.email.endsWith('@safeground.blr')) return user.email
    try {
      const saved = localStorage.getItem('safeground_primary_personal_user')
      if (saved) {
        const p = JSON.parse(saved)
        if (p.email) return p.email
      }
    } catch {}
    return user?.email || 'citizen@gmail.com'
  })

  const [reporterPhone, setReporterPhone] = useState(user?.user_metadata?.phone || '+91 98450 12345')

  if (!isOpen) return null

  const severity: CitizenDamageReport['severity'] =
    waterDepthFeet >= 3.5 ? 'CRITICAL' : waterDepthFeet >= 2.0 ? 'HIGH' : 'MODERATE'

  const handlePresetSelect = (preset: { name: string; zone: string }) => {
    playClickSound()
    setLandmark(preset.name)
    setZone(preset.zone)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!landmark.trim()) {
      toast.alert('Missing Location', 'Please specify the affected landmark or road.')
      return
    }
    if (!description.trim()) {
      toast.alert('Missing Description', 'Please provide a brief description of the water or damage.')
      return
    }

    setSubmitting(true)
    playAlertSound()

    try {
      const rep = submitDamageReport({
        userId: user?.id || 'citizen-anon',
        reporterName: reporterName.trim(),
        reporterEmail: reporterEmail.trim(),
        reporterPhone: reporterPhone.trim(),
        zone,
        landmark: landmark.trim(),
        waterDepthFeet: Number(waterDepthFeet.toFixed(1)),
        damageType,
        damageDescription: description.trim(),
        severity,
      })

      setSubmittedReport(rep)
      playSuccessSound()
      toast.success(
        'Waterlogging & Damage Incident Logged',
        `Authorities notified. Incident #${rep.id} will be correlated into the Live Red Zone cluster map.`
      )
    } catch (err: any) {
      toast.alert('Submission Error', err?.message || 'Failed to submit damage report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 8, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <AnimatePresence mode="wait">
        {!submittedReport ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            style={{
              width: '100%',
              maxWidth: 620,
              background: 'linear-gradient(145deg, #121F19 0%, #0A1410 100%)',
              border: '1px solid rgba(52, 211, 153, 0.28)',
              borderRadius: 20,
              padding: '24px',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 35px rgba(16, 185, 129, 0.15)',
              position: 'relative',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Droplets size={24} color="#38BDF8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>
                    Report Waterlogging & Damage
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--tx-muted)' }}>
                    Feeds real-time depth telemetry to BBMP, KSNDMC & alerts neighbors
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Informational Crowdsource Alert */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 18,
                fontSize: 12,
                color: '#BAE6FD',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <ShieldAlert size={20} color="#38BDF8" style={{ flexShrink: 0 }} />
              <div>
                <b>Automated Red Zone Clustering:</b> When multiple residents report waterlogging or damage in your area,
                SafeGround immediately marks it as an official <b>Crowdsourced Red Zone</b> and broadcasts safe elevated bypass routes.
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Personal Email and Identity */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Reporter Name
                  </label>
                  <input
                    type="text"
                    required
                    value={reporterName}
                    onChange={e => setReporterName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Personal / Google Email
                  </label>
                  <input
                    type="email"
                    required
                    value={reporterEmail}
                    onChange={e => setReporterEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={reporterPhone}
                    onChange={e => setReporterPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Water Depth Slider (Feet) */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(52, 211, 153, 0.18)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Waves size={16} color="#38BDF8" /> Water Depth Level (Current Standing Water)
                  </label>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background:
                        waterDepthFeet >= 3.5
                          ? 'rgba(239, 68, 68, 0.2)'
                          : waterDepthFeet >= 2.0
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                      color:
                        waterDepthFeet >= 3.5
                          ? '#EF4444'
                          : waterDepthFeet >= 2.0
                          ? '#F59E0B'
                          : '#34D399',
                      border: `1px solid ${waterDepthFeet >= 3.5 ? '#EF4444' : waterDepthFeet >= 2.0 ? '#F59E0B' : '#34D399'}`,
                    }}
                  >
                    {waterDepthFeet.toFixed(1)} Feet ({Math.round(waterDepthFeet * 30.48)} cm) • {severity}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.1"
                  value={waterDepthFeet}
                  onChange={e => setWaterDepthFeet(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: waterDepthFeet >= 3.5 ? '#EF4444' : '#38BDF8',
                    cursor: 'pointer',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx-muted)', marginTop: 4 }}>
                  <span>0.5 ft (Ankle)</span>
                  <span>2.0 ft (Knee / Car Exhaust)</span>
                  <span>3.5 ft (Waist / Engine Submerged)</span>
                  <span>6.0+ ft (Dangerous Inundation)</span>
                </div>
              </div>

              {/* Zone and Landmark selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 6 }}>
                    BBMP Zone
                  </label>
                  <select
                    value={zone}
                    onChange={e => setZone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    {BENGALURU_ZONES.map(z => (
                      <option key={z} value={z} style={{ background: '#121F19', color: '#fff' }}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 6 }}>
                    Landmark / Street / Corridor Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Outer Ring Road EcoSpace Underpass"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', display: 'block', marginBottom: 6 }}>
                  Quick Bengaluru Choke Points:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LANDMARK_PRESETS.slice(0, 4).map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handlePresetSelect(p)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        borderRadius: 6,
                        background: landmark === p.name ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${landmark === p.name ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
                        color: landmark === p.name ? '#38BDF8' : 'var(--tx-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {p.name.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Damage Type Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 8 }}>
                  Damage Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                  {DAMAGE_TYPES.map(item => {
                    const Icon = item.icon
                    const isSelected = damageType === item.type
                    return (
                      <div
                        key={item.type}
                        onClick={() => {
                          playClickSound()
                          setDamageType(item.type)
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(52, 211, 153, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isSelected ? '#10B981' : 'rgba(255, 255, 255, 0.08)'}`,
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: isSelected ? '#10B981' : 'rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? '#000' : '#fff',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#FFFFFF' : 'var(--tx)' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--tx-muted)' }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 6 }}>
                  Damage Situation & Visual Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. 4 sedans stalled in underpass, floodwater gushing from adjoining storm drain, power disconnected on 2nd cross road."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    lineHeight: 1.4,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    onClose()
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                  }}
                >
                  <Send size={15} /> Submit Official Incident Report
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Confirmation Screen */
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'linear-gradient(145deg, #10241A 0%, #091510 100%)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              borderRadius: 20,
              padding: '28px',
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={32} color="#10B981" />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>
              Incident Report #{submittedReport.id} Registered
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--tx-muted)' }}>
              Transmitted to BBMP Control Room, SDRF Bengaluru & KSNDMC Hydrology Cell.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '14px 16px',
                textAlign: 'left',
                fontSize: 12.5,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              <div><b>Location:</b> {submittedReport.landmark} ({submittedReport.zone})</div>
              <div><b>Water Depth:</b> <span style={{ color: '#38BDF8', fontWeight: 800 }}>{submittedReport.waterDepthFeet} ft</span></div>
              <div><b>Damage Type:</b> {submittedReport.damageType}</div>
              <div><b>Contact Logged:</b> {submittedReport.reporterEmail} ({submittedReport.reporterPhone})</div>
            </div>

            <button
              onClick={() => {
                playClickSound()
                setSubmittedReport(null)
                onClose()
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Done & Return to Live Tracker
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
