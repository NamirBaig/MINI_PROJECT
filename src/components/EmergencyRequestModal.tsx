import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, AlertTriangle, ShieldAlert, Bed, Droplets, Truck,
  HeartPulse, Sparkles, Send, MapPin, Phone, User, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import { createEmergencyRequest, type UrgencyLevel } from '../services/requestService'

interface EmergencyRequestModalProps {
  isOpen: boolean
  onClose: () => void
  defaultZone?: string
  defaultResourceType?: string
}

const RESOURCE_TYPES = [
  { id: 'Hospital ICU Beds', label: 'Hospital ICU Beds (Critical Care)', icon: HeartPulse, color: '#EF4444' },
  { id: 'Hospital General Beds', label: 'Hospital General Inpatient Beds', icon: Bed, color: '#3B82F6' },
  { id: 'Emergency Drinking Water Tanker', label: 'Clean Drinking Water (BWSSB Tanker)', icon: Droplets, color: '#06B6D4' },
  { id: 'Evacuation Boat & Diver Unit', label: 'Evacuation Rescue Boat & Diver Team', icon: ShieldAlert, color: '#F59E0B' },
  { id: 'Emergency Medical & Oxygen Kit', label: 'Oxygen Concentrator & Trauma Kit', icon: HeartPulse, color: '#10B981' },
  { id: 'Food & Milk Rations', label: 'Emergency Dry Rations & Infant Milk', icon: Truck, color: '#A855F7' },
]

const BENGALURU_ZONES = [
  'Yelahanka', 'Mahadevapura', 'Bommanahalli', 'East',
  'West', 'South', 'RR Nagar', 'Dasarahalli'
]

export default function EmergencyRequestModal({
  isOpen,
  onClose,
  defaultZone = 'Yelahanka',
  defaultResourceType = 'Hospital ICU Beds',
}: EmergencyRequestModalProps) {
  const { user } = useAuth()
  const toast = useToast()

  const [resourceType, setResourceType] = useState(defaultResourceType)
  const [quantity, setQuantity] = useState(1)
  const [urgency, setUrgency] = useState<UrgencyLevel>('HIGH')
  const [zone, setZone] = useState(user?.user_metadata?.zone || defaultZone)
  const [address, setAddress] = useState('')
  const [requesterName, setRequesterName] = useState(user?.user_metadata?.full_name || '')
  const [requesterPhone, setRequesterPhone] = useState(user?.user_metadata?.phone || '')
  const [patientNotes, setPatientNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim() || !requesterName.trim() || !requesterPhone.trim() || !patientNotes.trim()) {
      playAlertSound()
      toast.alert('Incomplete Request', 'Please fill in address, contact phone, and medical notes.')
      return
    }

    setSubmitting(true)
    playClickSound()

    try {
      const newReq = createEmergencyRequest({
        userId: user?.id || `anon-${Date.now()}`,
        requesterName: requesterName.trim(),
        requesterEmail: user?.email || `${requesterName.toLowerCase().replace(/\s+/g, '.')}@citizen.blr`,
        requesterPhone: requesterPhone.trim(),
        zone,
        address: address.trim(),
        resourceType,
        quantity: Math.max(1, quantity),
        urgency,
        patientNotes: patientNotes.trim(),
      })

      playSuccessSound()
      toast.success(
        `Emergency Request Dispatched (${newReq.id})`,
        `Assigned to BBMP & Hospital Command for ${zone} Zone`
      )
      setSubmitting(false)
      onClose()
    } catch (err: any) {
      toast.alert('Dispatch Failed', err?.message || 'Unable to submit request')
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(3, 7, 5, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: 620,
            maxHeight: '92vh',
            overflowY: 'auto',
            background: 'linear-gradient(145deg, #0F1C16 0%, #08110D 100%)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            borderRadius: 18,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(239, 68, 68, 0.2)',
            color: '#FFFFFF',
            padding: '24px 28px',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 9px',
                  borderRadius: 20,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#F87171',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                }}>
                  <AlertTriangle size={13} />
                  EMERGENCY RESOURCE DISPATCH
                </span>
                <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>BBMP & Hospital Direct Triage</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                Request Emergency Beds & Critical Relief
              </h2>
            </div>

            <button
              onClick={() => {
                playClickSound()
                onClose()
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: 34,
                height: 34,
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* 1. Resource Selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#E2E8F0' }}>
                Required Emergency Resource
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                {RESOURCE_TYPES.map(res => {
                  const isSelected = resourceType === res.id
                  const Icon = res.icon
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        playClickSound()
                        setResourceType(res.id)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                        fontSize: 12.5,
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={16} color={isSelected ? '#34D399' : res.color} />
                      <span style={{ flex: 1 }}>{res.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Quantity & Urgency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>
                  Quantity Required
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--tx-muted)', whiteSpace: 'nowrap' }}>Unit(s)</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>
                  Urgency / Triaging Level
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['CRITICAL', 'HIGH', 'MODERATE'] as UrgencyLevel[]).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        playClickSound()
                        setUrgency(lvl)
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 6px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: urgency === lvl
                          ? (lvl === 'CRITICAL' ? '#EF4444' : lvl === 'HIGH' ? '#F59E0B' : '#10B981')
                          : 'rgba(255, 255, 255, 0.05)',
                        border: urgency === lvl
                          ? '1px solid transparent'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        color: urgency === lvl ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Zone & Exact Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>
                  Zone
                </label>
                <select
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {BENGALURU_ZONES.map(z => (
                    <option key={z} value={z} style={{ background: '#111814', color: '#fff' }}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>
                  Detailed Address & Landmark (Tower, Floor, Gate)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 304, Tower 3, Kendriya Vihar, Bellahalli Cross"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* 4. Requester Name & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>
                  Requester Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohit Kumar"
                    value={requesterName}
                    onChange={e => setRequesterName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>
                  Contact Phone Number (Active Mobile)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={requesterPhone}
                    onChange={e => setRequesterPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 5. Medical Emergency & Patient Condition Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>
                Patient Medical Emergency & Situation Details
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe patient age, medical condition (e.g. oxygen SpO2, cardiac history, mobility), flood water level, or urgent relief needs..."
                value={patientNotes}
                onChange={e => setPatientNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                }}
                style={{
                  padding: '11px 20px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 24px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.45)',
                }}
              >
                <Send size={15} />
                <span>{submitting ? 'Transmitting to Command...' : 'Transmit Request to Authorities'}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
