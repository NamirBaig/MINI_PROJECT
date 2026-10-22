import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, LogOut, User } from 'lucide-react'
import { playClickSound } from '../utils/audioFeedback'
import { useAuth } from '../hooks/useAuth'

interface MobileHeaderProps {
  user: any
  onSignOut?: () => void
}

export default function MobileHeader({ user, onSignOut }: MobileHeaderProps) {
  const navigate = useNavigate()
  const { currentRole } = useAuth()
  const isAuthority = currentRole !== 'citizen'

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Resident'
  const roleTitle = isAuthority ? 'Command' : 'Resident'

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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: isAuthority ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: isAuthority ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                padding: '4px 8px',
                borderRadius: 8,
                fontSize: 11,
                color: '#FFFFFF',
                fontWeight: 700,
              }}
            >
              <span style={{ color: isAuthority ? '#34D399' : '#FFFFFF' }}>
                {displayName}
              </span>
              <span style={{
                fontSize: 9,
                fontWeight: 800,
                color: isAuthority ? '#34D399' : '#9CA3AF',
                background: 'rgba(0,0,0,0.3)',
                padding: '1px 4px',
                borderRadius: 4,
              }}>
                {roleTitle}
              </span>
            </div>

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
