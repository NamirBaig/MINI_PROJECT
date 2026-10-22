import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Lock, ShieldCheck, ArrowRight, UserPlus, LogIn, X
} from 'lucide-react'
import { playClickSound } from '../utils/audioFeedback'

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

  if (!isOpen) return null

  const handleGoToAuth = (tab: 'login' | 'signup') => {
    playClickSound()
    onClose()
    navigate(`/auth?tab=${tab}&redirect=${encodeURIComponent(targetPath)}`)
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
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
