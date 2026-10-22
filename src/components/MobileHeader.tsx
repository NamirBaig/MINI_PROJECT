import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, LogOut, User, Sparkles, ChevronDown, Check } from 'lucide-react'
import { playClickSound, playSuccessSound } from '../utils/audioFeedback'
import { useToast } from '../context/ToastContext'
import { useAuth, type UserRole, ROLE_PRESETS } from '../hooks/useAuth'

interface MobileHeaderProps {
  user: any
  onSignOut?: () => void
}

export default function MobileHeader({ user, onSignOut }: MobileHeaderProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const { loginAsRole, currentRole } = useAuth()
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Resident'
  const roleTitle = user?.user_metadata?.role ? user.user_metadata.role.split(' ')[0] : 'Resident'

  return (
    <header className="mobile-header" style={{
      display: 'none', // Shown on mobile via CSS @media (max-width: 767px)
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 80,
      background: 'rgba(6, 11, 8, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '10px 16px',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand Logo */}
      <Link
        to="/"
        onClick={() => playClickSound()}
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
        }}>
          <ShieldCheck size={18} color="#030604" strokeWidth={2.5} />
        </div>
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.8, color: '#FFFFFF', display: 'block' }}>
            SAFEGROUND
          </span>
          <span style={{ fontSize: 8.5, color: '#34D399', fontWeight: 700, letterSpacing: 0.5 }}>
            BENGALURU
          </span>
        </div>
      </Link>

      {/* Right Controls: User/Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* User Status / Persona Switcher / Sign Out */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playClickSound()
                setRoleMenuOpen(!roleMenuOpen)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: currentRole === 'bbmp' ? 'rgba(239, 68, 68, 0.15)' : currentRole === 'ksndmc' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: currentRole === 'bbmp' ? '1px solid rgba(239, 68, 68, 0.35)' : currentRole === 'ksndmc' ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                padding: '4px 8px',
                borderRadius: 8,
                fontSize: 11,
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span style={{ color: currentRole === 'bbmp' ? '#F87171' : currentRole === 'ksndmc' ? '#60A5FA' : '#34D399' }}>
                {displayName}
              </span>
              <ChevronDown size={11} style={{ opacity: 0.7 }} />
            </motion.button>

            {/* Persona Switcher Dropdown */}
            {roleMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                width: 220,
                background: 'rgba(8, 15, 11, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 12,
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.9)',
                padding: 6,
                zIndex: 100,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--pri-neon)', padding: '4px 6px', textTransform: 'uppercase' }}>
                  Switch Evaluator Role:
                </div>
                {(['citizen', 'ksndmc', 'bbmp'] as UserRole[]).map(r => {
                  const preset = ROLE_PRESETS[r]
                  const isCurrent = currentRole === r
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        playSuccessSound()
                        loginAsRole(r)
                        toast.success('Clearance Switched', `Active session: ${preset.name}`)
                        setRoleMenuOpen(false)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: isCurrent ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        border: isCurrent ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 11,
                        marginBottom: 3,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: r === 'bbmp' ? '#F87171' : r === 'ksndmc' ? '#60A5FA' : '#34D399' }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: 9.5, color: 'var(--tx-muted)' }}>{preset.title}</div>
                      </div>
                      {isCurrent && <Check size={12} color="#34D399" />}
                    </button>
                  )
                })}
              </div>
            )}

            {onSignOut && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  playClickSound()
                  onSignOut()
                }}
                title="Sign Out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  gap: 4,
                }}
              >
                <LogOut size={13} />
              </motion.button>
            )}
          </div>
        ) : (
          <Link
            to="/auth"
            onClick={() => playClickSound()}
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#030604',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  )
}
