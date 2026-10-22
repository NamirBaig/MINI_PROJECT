import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, Sparkles, X, CheckCircle2, ShieldCheck, CreditCard,
  Building2, Droplets, Bed, Truck, Copy, Download, Share2, Activity
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound } from '../utils/audioFeedback'
import { submitDonation, MAX_DONATION_AMOUNT, type DonationRecord } from '../services/incidentAndReliefService'

interface DisasterDonationModalProps {
  isOpen: boolean
  onClose: () => void
}

const PRESET_AMOUNTS = [500, 2000, 5000, 10000, 50000, 100000]

const RELIEF_CAUSES = [
  { id: 'beds', label: 'Emergency ICU Oxygen Beds & Patient Trauma Care', icon: Bed, color: '#EF4444' },
  { id: 'water', label: 'BWSSB Potable Drinking Water Tankers & Chlorination', icon: Droplets, color: '#06B6D4' },
  { id: 'rescue', label: 'SDRF Inflatable Motorized Rescue Boats & Life Vests', icon: ShieldCheck, color: '#10B981' },
  { id: 'food', label: 'Dry Ration Food Kits & Community Relief Shelter Meals', icon: Truck, color: '#F59E0B' },
]

/**
 * Professional Cardiac Heartbeat + Bandage Wrap + ECG Wave Animation
 * Replaces overly stylized feminine graphics with an authentic medical-relief visual
 */
function HeartbeatBandageGraphic() {
  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}>
      {/* Background medical vital glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.2, 0.45, 0.2],
        }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -10,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <svg
        viewBox="0 0 140 140"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <linearGradient id="bandageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
          <filter id="vitalGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Beating Heart with Authentic Cardiac Rhythm (lub-dub) */}
        <motion.g
          animate={{
            scale: [1, 1.15, 1.02, 1.2, 1],
          }}
          transition={{
            duration: 1.25,
            repeat: Infinity,
            times: [0, 0.15, 0.3, 0.45, 1],
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '70px 65px' }}
        >
          {/* Heart path */}
          <path
            d="M 70 108 C 32 86, 16 62, 16 40 C 16 23, 29 12, 46 12 C 58 12, 66 18, 70 26 C 74 18, 82 12, 94 12 C 111 12, 124 23, 124 40 C 124 62, 108 86, 70 108 Z"
            fill="url(#heartGradient)"
            stroke="#F87171"
            strokeWidth="2.5"
            filter="drop-shadow(0 6px 16px rgba(239, 68, 68, 0.45))"
          />

          {/* Medical Relief Cross Crest */}
          <rect x="66" y="32" width="8" height="24" rx="2" fill="#FFFFFF" opacity="0.95" />
          <rect x="58" y="40" width="24" height="8" rx="2" fill="#FFFFFF" opacity="0.95" />

          {/* 2. Bandage Wrap Going Diagonally Around Heart */}
          <motion.path
            d="M 24 52 Q 70 72 116 46"
            fill="none"
            stroke="url(#bandageGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="4 2"
            opacity="0.94"
            filter="drop-shadow(0 2px 6px rgba(0,0,0,0.45))"
            animate={{
              strokeWidth: [13, 15, 13],
            }}
            transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Bandage central medic clip */}
          <rect x="61" y="56" width="18" height="11" rx="3" fill="#D97706" opacity="0.85" />
          <circle cx="65" cy="61.5" r="1.5" fill="#FEF3C7" />
          <circle cx="75" cy="61.5" r="1.5" fill="#FEF3C7" />
        </motion.g>

        {/* 3. Live ECG Oscilloscope Vital Line passing across */}
        <motion.path
          d="M 5 120 L 35 120 L 44 120 L 49 105 L 55 133 L 61 95 L 67 128 L 71 120 L 85 120 L 92 114 L 98 120 L 135 120"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#vitalGlow)"
          animate={{
            pathLength: [0, 1, 1],
            pathOffset: [0, 0, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Vital blip dot */}
        <motion.circle
          cx="61"
          cy="95"
          r="4"
          fill="#34D399"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.8, 0.2, 0.8],
          }}
          transition={{ duration: 1.25, repeat: Infinity }}
        />
      </svg>
    </div>
  )
}

export default function DisasterDonationModal({ isOpen, onClose }: DisasterDonationModalProps) {
  const { user } = useAuth()
  const toast = useToast()

  const [amount, setAmount] = useState<number>(2000)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [targetCause, setTargetCause] = useState<string>(RELIEF_CAUSES[0].label)
  const [donorName, setDonorName] = useState(() => {
    return user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Bengaluru Resident')
  })
  const [donorEmail, setDonorEmail] = useState(() => {
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
  const [donorPhone, setDonorPhone] = useState(user?.user_metadata?.phone || '+91 98450 12345')
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NetBanking' | 'Card'>('UPI')
  const [submitting, setSubmitting] = useState(false)

  // Donation confirmation state
  const [completedDonation, setCompletedDonation] = useState<DonationRecord | null>(null)

  if (!isOpen) return null

  const handleSelectPreset = (val: number) => {
    playClickSound()
    setAmount(val)
    setCustomAmount('')
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setCustomAmount(val)
    const num = parseInt(val, 10) || 0
    if (num > MAX_DONATION_AMOUNT) {
      toast.alert('Limit Exceeded', 'Maximum donation per contribution is ₹10,00,000 (10 Lakhs).')
      setAmount(MAX_DONATION_AMOUNT)
    } else {
      setAmount(num)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount <= 0) {
      toast.alert('Invalid Amount', 'Please choose or enter a donation amount.')
      return
    }
    if (amount > MAX_DONATION_AMOUNT) {
      toast.alert('Exceeds Limit', 'Maximum donation is ₹10,00,000 (Rs 10 Lakh).')
      return
    }
    if (!donorName.trim() || !donorEmail.trim()) {
      toast.alert('Required Info', 'Please enter your name and email.')
      return
    }

    setSubmitting(true)
    playSuccessSound()

    try {
      const record = submitDonation({
        userId: user?.id,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        donorPhone: donorPhone.trim(),
        amount,
        targetReliefCause: targetCause,
        paymentMethod: `${paymentMethod} (BBMP Disaster Contingency)`,
      })

      setSubmitting(false)
      setCompletedDonation(record)
    } catch (err: any) {
      toast.alert('Donation Error', err.message || 'Unable to process donation')
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(2, 6, 4, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <AnimatePresence mode="wait">
        {!completedDonation ? (
          // ─── Step 1: Donation Selection & Payment Form ───
          <motion.div
            key="donation-form"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'linear-gradient(145deg, #0C1E17 0%, #06120D 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              borderRadius: 20,
              padding: '24px 28px',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.2)',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34D399',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                  }}>
                    <HeartPulse size={14} color="#34D399" />
                    BENGALURU DISASTER RELIEF CONTINGENCY FUND
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#FFFFFF' }}>
                  Contribute to Emergency Relief & Medical Aid
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--tx-muted)' }}>
                  100% of proceeds fund emergency ICU beds, rescue boats & drinking water. Tax deductible under 80G. Max ₹10,00,000.
                </p>
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
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Preset Amounts */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: '#E2E8F0' }}>
                  Select Contribution Amount (Max ₹10,00,000 / Rs 10 Lakh)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PRESET_AMOUNTS.map(preset => {
                    const isSelected = amount === preset && !customAmount
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 10,
                          background: isSelected ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '1px solid #34D399' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
                        }}
                      >
                        ₹{preset.toLocaleString('en-IN')}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Amount Field */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#34D399' }}>₹</span>
                    <input
                      type="text"
                      placeholder="Or enter custom amount up to ₹10,00,000"
                      value={customAmount}
                      onChange={handleCustomChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 32px',
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: customAmount ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 700,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Target Relief Cause */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: '#E2E8F0' }}>
                  Choose Targeted Relief Cause
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {RELIEF_CAUSES.map(c => {
                    const isSelected = targetCause === c.label
                    const Icon = c.icon
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          playClickSound()
                          setTargetCause(c.label)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: isSelected ? 800 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={16} color={isSelected ? '#34D399' : c.color} />
                        <span style={{ flex: 1 }}>{c.label}</span>
                        {isSelected && <CheckCircle2 size={15} color="#34D399" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Donor Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: '#E2E8F0' }}>
                    Donor Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: '#E2E8F0' }}>
                    Personal Email (Tax 80G Receipt)
                  </label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={e => setDonorEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>
                  Secure Payment Gateway Simulation
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['UPI', 'NetBanking', 'Card'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { playClickSound(); setPaymentMethod(mode); }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 8,
                        background: paymentMethod === mode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: paymentMethod === mode ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: paymentMethod === mode ? '#34D399' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 6,
                  padding: '12px 20px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.45)',
                }}
              >
                <HeartPulse size={17} color="#FFFFFF" />
                <span>Confirm & Allocate ₹{amount.toLocaleString('en-IN')}</span>
              </motion.button>
            </form>
          </motion.div>
        ) : (
          // ─── Step 2: HEARTBEAT & BANDAGE ANIMATION + CITIZEN GRATITUDE ───
          <motion.div
            key="heartbeat-bandage-overlay"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'linear-gradient(145deg, #0A1C14 0%, #040E0A 100%)',
              border: '2px solid #10B981',
              borderRadius: 24,
              padding: '36px 30px',
              textAlign: 'center',
              color: '#FFFFFF',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(16, 185, 129, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* The Heartbeat & Bandage Wrap Component */}
            <HeartbeatBandageGraphic />

            {/* Official Confirmation Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                fontSize: 11,
                fontWeight: 900,
                color: '#34D399',
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 10,
              }}>
                <ShieldCheck size={14} />
                STATE DISASTER RELIEF CONTRIBUTION ACCREDITED
              </div>

              <h2 style={{ margin: '0 0 8px', fontSize: 23, fontWeight: 900, color: '#FFFFFF' }}>
                Thank You, {completedDonation.donorName}!
              </h2>

              <p style={{ margin: '0 auto 18px', maxWidth: 440, fontSize: 13, color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.6 }}>
                Your emergency relief allocation of <b style={{ color: '#34D399', fontSize: 15 }}>₹{completedDonation.amount.toLocaleString('en-IN')}</b> has been successfully transferred to the contingency operations pool for <b style={{ color: '#FFFFFF' }}>{completedDonation.targetReliefCause}</b>.
              </p>
            </motion.div>

            {/* Official Receipt Token */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 14,
              padding: '14px 18px',
              fontSize: 12,
              textAlign: 'left',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--tx-muted)' }}>Section 80G Tax Exemption Token:</span>
                <b style={{ color: '#34D399', fontFamily: 'monospace' }}>{completedDonation.taxExemptionToken}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--tx-muted)' }}>Allocated Cause:</span>
                <b style={{ color: '#FFFFFF' }}>{completedDonation.targetReliefCause}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tx-muted)' }}>Donor Email for Audit:</span>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>{completedDonation.donorEmail}</span>
              </div>
            </div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                playClickSound()
                setCompletedDonation(null)
                onClose()
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.45)',
              }}
            >
              Continue to SafeGround
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
