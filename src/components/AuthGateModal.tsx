import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Lock, ShieldCheck, ArrowRight, UserPlus, LogIn,
  Sparkles, X, Radio, HardHat, Check
} from 'lucide-react'
import { useAuth, type UserRole, ROLE_PRESETS } from '../hooks/useAuth'
import { playClickSound, playSuccessSound } from '../utils/audioFeedback'
import { useToast } from '../context/ToastContext'

interface AuthGateModalProps {
  isOpen: boolean
  onClose: () => void
  targetPath: string
  featureTitle?: string
}

export default function AuthGateModal({
  isOpen,
  onClose,
  targetPath,
  featureTitle = 'Protected Emergency System',
}: AuthGateModalProps) {
  const navigate = useNavigate()
  const { loginAsRole } = useAuth()
  const toast = useToast()

  if (!isOpen) return null

  const handleGoToAuth = (tab: 'login' | 'signup') => {
    playClickSound()
    onClose()
    navigate(`/auth?tab=${tab}&redirect=${encodeURIComponent(targetPath)}`)
  }

  const handleOneClickRole = (role: UserRole) => {
    playSuccessSound()
    loginAsRole(role)
    const preset = ROLE_PRESETS[role]
    toast.success('Clearance Granted', `Active session: ${preset.name}`)
    onClose()
    navigate(targetPath)
  }

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(2, 6, 4, 0.88)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: 520,
            background: 'linear-gradient(150deg, #0B1912 0%, #050E09 60%, #030805 100%)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            borderRadius: 20,
            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(16, 185, 129, 0.2)',
            padding: '28px 30px',
            color: '#FFFFFF',
            position: 'relative',
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

          {/* Icon Badge */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 95, 70, 0.4) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34D399',
            marginBottom: 16,
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
          }}>
            <Lock size={22} />
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
            Authentication Required
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.55 }}>
            Accessing <b>{featureTitle}</b> requires an authenticated citizen or municipal authority account. Please sign in or register to view live Bengaluru telemetry, run risk simulations, and request emergency hospital beds.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGoToAuth('login')}
              className="btn-shiny"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px 18px',
                fontSize: 14,
                borderRadius: 10,
              }}
            >
              <LogIn size={16} />
              <span>Sign In with Existing Account</span>
              <ArrowRight size={14} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGoToAuth('signup')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 18px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <UserPlus size={15} color="#34D399" />
              <span>Create New Citizen Account</span>
            </motion.button>
          </div>

          {/* 1-Click Role Quick Pass */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pri-neon)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={12} /> OR FAST 1-CLICK DEMO CLEARANCE:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <button
                onClick={() => handleOneClickRole('citizen')}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34D399',
                  borderRadius: 8,
                  padding: '7px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Resident
              </button>
              <button
                onClick={() => handleOneClickRole('bbmp')}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  borderRadius: 8,
                  padding: '7px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                BBMP Lead
              </button>
              <button
                onClick={() => handleOneClickRole('ksndmc')}
                style={{
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60A5FA',
                  borderRadius: 8,
                  padding: '7px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                KSNDMC
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
