import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Clock,
  KeyRound,
} from 'lucide-react'
import { verifyEmailOtp, sendEmailOtp } from '../services/emailService'
import { playClickSound, playSuccessSound } from '../utils/audioFeedback'

interface EmailOtpModalProps {
  isOpen: boolean
  email: string
  fullName?: string
  purpose?: 'signup' | 'request' | 'donation' | 'verification'
  initialDebugOtp?: string
  onClose: () => void
  onVerified: (email: string) => void
}

export default function EmailOtpModal({
  isOpen,
  email,
  fullName = 'Citizen',
  purpose = 'verification',
  initialDebugOtp,
  onClose,
  onVerified,
}: EmailOtpModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [cooldown, setCooldown] = useState<number>(60)
  const [resending, setResending] = useState<boolean>(false)
  const [verifying, setVerifying] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | undefined>(initialDebugOtp)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset inputs when opened
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', ''])
      setErrorMsg(null)
      setSuccessMsg(null)
      setCooldown(60)
      if (initialDebugOtp) setDebugOtp(initialDebugOtp)
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 150)
    }
  }, [isOpen, initialDebugOtp])

  // 60-second resend cooldown timer
  useEffect(() => {
    if (!isOpen || cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, cooldown])

  if (!isOpen) return null

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, '')
    if (!clean) {
      const copy = [...digits]
      copy[index] = ''
      setDigits(copy)
      return
    }

    // Single digit input
    const char = clean.slice(-1)
    const copy = [...digits]
    copy[index] = char
    setDigits(copy)
    playClickSound()

    // Auto-advance to next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    } else {
      // If last box filled, auto-trigger verification
      const fullCode = copy.join('')
      if (fullCode.length === 6) {
        verifyCode(fullCode)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!text) return
    const arr = text.split('')
    const next = ['', '', '', '', '', '']
    arr.forEach((ch, idx) => {
      if (idx < 6) next[idx] = ch
    })
    setDigits(next)
    playClickSound()
    if (arr.length === 6) {
      inputRefs.current[5]?.focus()
      verifyCode(text)
    } else {
      inputRefs.current[Math.min(arr.length, 5)]?.focus()
    }
  }

  const verifyCode = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || digits.join('')
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.')
      return
    }

    setVerifying(true)
    setErrorMsg(null)

    const result = await verifyEmailOtp(email, fullCode)
    if (result.verified) {
      playSuccessSound()
      setSuccessMsg('Email verified successfully! Securing connection...')
      setTimeout(() => {
        setVerifying(false)
        onVerified(email)
      }, 700)
    } else {
      setErrorMsg(result.message)
      setVerifying(false)
      // Clear inputs for re-try
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    playClickSound()
    setResending(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const result = await sendEmailOtp(email, fullName)
      if (result.success) {
        setCooldown(60)
        setDebugOtp(result.debugOtp)
        setSuccessMsg(`A fresh verification code was sent to ${email}`)
        setDigits(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setErrorMsg(result.message || 'Failed to dispatch verification code.')
      }
    } catch {
      setErrorMsg('Could not dispatch code. Check internet connection.')
    } finally {
      setResending(false)
    }
  }

  const getPurposeTitle = () => {
    switch (purpose) {
      case 'signup':
        return 'Verify Your Personal Email'
      case 'request':
        return 'Verify Distress Requester Email'
      case 'donation':
        return 'Verify Donor Email for 80G Receipt'
      default:
        return 'Security Code Verification'
    }
  }

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(3, 8, 6, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: 480,
            background: 'linear-gradient(180deg, #0A1410 0%, #060B08 100%)',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            borderRadius: 20,
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.2)',
            padding: '24px 24px 28px',
            position: 'relative',
            color: '#F9FAFB',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => {
              playClickSound()
              onClose()
            }}
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>

          {/* Header Shield */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              <KeyRound size={26} color="#34D399" />
            </div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#34D399',
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <ShieldCheck size={12} />
              <span>KSNDMC & BBMP Official Identity Verification</span>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
              {getPurposeTitle()}
            </h3>

            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>
              We dispatched a 6-digit confirmation code to:
              <br />
              <b style={{ color: '#34D399', fontSize: 13.5 }}>{email}</b>
            </p>
          </div>

          {/* Quick Debug OTP banner (for instant testing before EmailJS is configured) */}
          {debugOtp && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px dashed rgba(52, 211, 153, 0.4)',
                borderRadius: 10,
                padding: '8px 12px',
                marginBottom: 16,
                fontSize: 11.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#D1FAE5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#34D399" />
                <span>Test Code: <b style={{ letterSpacing: 2, color: '#FFFFFF' }}>{debugOtp}</b></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  const arr = debugOtp.split('')
                  setDigits(arr)
                  verifyCode(debugOtp)
                }}
                style={{
                  background: 'rgba(52, 211, 153, 0.25)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#34D399',
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Auto-Fill & Verify
              </button>
            </motion.div>
          )}

          {/* 6 Digit Input Group */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              margin: '22px 0 16px',
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 12,
                  background: digit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: digit ? '2px solid #34D399' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: 22,
                  fontWeight: 800,
                  textAlign: 'center',
                  outline: 'none',
                  boxShadow: digit ? '0 0 12px rgba(52, 211, 153, 0.3)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              />
            ))}
          </div>

          {/* Alerts / Success feedback */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 10,
                padding: '9px 12px',
                color: '#FCA5A5',
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 10,
                padding: '9px 12px',
                color: '#6EE7B7',
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Primary Action Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={verifying || digits.join('').length !== 6}
            onClick={() => verifyCode()}
            style={{
              width: '100%',
              padding: '13px 18px',
              borderRadius: 12,
              background:
                digits.join('').length === 6
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: digits.join('').length === 6 ? '#FFFFFF' : '#6B7280',
              fontSize: 14,
              fontWeight: 800,
              cursor: digits.join('').length === 6 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: digits.join('').length === 6 ? '0 4px 18px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s ease',
              marginBottom: 14,
            }}
          >
            {verifying ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Verifying Identity...</span>
              </>
            ) : (
              <>
                <span>Confirm & Lock Email</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>

          {/* Resend Cooldown Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#9CA3AF',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} />
              <span>Expires in 5 minutes</span>
            </div>

            {cooldown > 0 ? (
              <span style={{ color: '#9CA3AF' }}>
                Resend in <b style={{ color: '#34D399' }}>{cooldown}s</b>
              </span>
            ) : (
              <button
                type="button"
                disabled={resending}
                onClick={handleResend}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#34D399',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                <span>Resend Code</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
