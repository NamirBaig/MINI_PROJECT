import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Sparkles, X, CheckCircle2, ShieldCheck, CreditCard,
  Building2, Droplets, Bed, Truck, Copy, Download, Share2
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

  // Healing heart animation state
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
              background: 'linear-gradient(145deg, #0D1C16 0%, #06100B 100%)',
              border: '1.5px solid rgba(236, 72, 153, 0.45)',
              borderRadius: 20,
              padding: '24px 28px',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(236, 72, 153, 0.25)',
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
                    gap: 5,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(236, 72, 153, 0.2)',
                    border: '1px solid rgba(236, 72, 153, 0.45)',
                    color: '#F472B6',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                  }}>
                    <Heart size={13} fill="#F472B6" />
                    BENGALURU DISASTER RELIEF CONTINGENCY FUND
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#FFFFFF' }}>
                  Donate for Emergency Flood & Medical Relief
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
                          background: isSelected ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '1px solid #F472B6' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 15px rgba(236, 72, 153, 0.4)' : 'none',
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
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#F472B6' }}>₹</span>
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
                        border: customAmount ? '1.5px solid #EC4899' : '1px solid rgba(255, 255, 255, 0.15)',
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
                          background: isSelected ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid #EC4899' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: isSelected ? 800 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={16} color={isSelected ? '#F472B6' : c.color} />
                        <span style={{ flex: 1 }}>{c.label}</span>
                        {isSelected && <CheckCircle2 size={15} color="#F472B6" />}
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
                        background: paymentMethod === mode ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: paymentMethod === mode ? '1px solid #EC4899' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: paymentMethod === mode ? '#F472B6' : 'rgba(255, 255, 255, 0.7)',
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
                  background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(236, 72, 153, 0.45)',
                }}
              >
                <Heart size={17} fill="#FFFFFF" />
                <span>Confirm & Donate ₹{amount.toLocaleString('en-IN')}</span>
              </motion.button>
            </form>
          </motion.div>
        ) : (
          // ─── Step 2: HEALING HEART ANIMATION & THANK YOU MESSAGE ───
          <motion.div
            key="healing-heart-overlay"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={{
              width: '100%',
              maxWidth: 500,
              background: 'radial-gradient(circle at center, #1B0B14 0%, #080306 100%)',
              border: '2px solid #EC4899',
              borderRadius: 24,
              padding: '36px 30px',
              textAlign: 'center',
              color: '#FFFFFF',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(236, 72, 153, 0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Animated Glow Rings Behind the Heart */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* The Healing Beating Heart */}
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 20px' }}>
              <motion.div
                animate={{
                  scale: [1, 1.25, 1.05, 1.3, 1],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={82} color="#F472B6" fill="#EC4899" style={{ filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))' }} />
              </motion.div>

              {/* Healing sparkles */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [0.9, 1.2, 0.9],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: -8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Sparkles size={36} color="#FDE047" style={{ position: 'absolute', top: -4, right: -4 }} />
                <Sparkles size={28} color="#34D399" style={{ position: 'absolute', bottom: 4, left: -6 }} />
              </motion.div>
            </div>

            {/* Emotional Thank-You Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: 900,
                color: '#F472B6',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 6,
              }}>
                💖 YOUR GENEROSITY HEALS BENGALURU
              </div>

              <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>
                Thank You, {completedDonation.donorName}!
              </h2>

              <p style={{ margin: '0 auto 18px', maxWidth: 420, fontSize: 13.5, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                Your heartfelt contribution of <b style={{ color: '#F472B6', fontSize: 16 }}>₹{completedDonation.amount.toLocaleString('en-IN')}</b> is actively delivering emergency relief, warm shelter beds, and clean drinking water to displaced Bengaluru families.
              </p>
            </motion.div>

            {/* Official Receipt Pill */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 12,
              textAlign: 'left',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--tx-muted)' }}>Receipt Token:</span>
                <b style={{ color: '#34D399' }}>{completedDonation.taxExemptionToken}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--tx-muted)' }}>Cause:</span>
                <b style={{ color: '#FFFFFF' }}>{completedDonation.targetReliefCause}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tx-muted)' }}>Donor Email:</span>
                <span style={{ color: '#F472B6', fontWeight: 700 }}>{completedDonation.donorEmail}</span>
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
                background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.45)',
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
