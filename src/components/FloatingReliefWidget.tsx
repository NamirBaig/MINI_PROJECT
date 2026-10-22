import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Droplets, Sparkles, X, ChevronUp, ShieldCheck } from 'lucide-react'
import { playClickSound } from '../utils/audioFeedback'
import DisasterDonationModal from './DisasterDonationModal'
import CitizenDamageReportModal from './CitizenDamageReportModal'

export default function FloatingReliefWidget() {
  const [expanded, setExpanded] = useState(false)
  const [donationOpen, setDonationOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px',
        }}
      >
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.92 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(12, 20, 16, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(52, 211, 153, 0.28)',
                borderRadius: '16px',
                padding: '12px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(236, 72, 153, 0.15)',
                minWidth: '220px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 4px 4px' }}>
                Quick Disaster Actions
              </div>

              {/* Donate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playClickSound()
                  setDonationOpen(true)
                  setExpanded(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(190, 24, 93, 0.3) 100%)',
                  border: '1px solid rgba(244, 114, 182, 0.45)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#EC4899',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Heart size={16} color="#FFFFFF" fill="#FFFFFF" />
                </div>
                <div>
                  <div style={{ color: '#F472B6' }}>Donate for Relief</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Max ₹10 Lakh • 80G Tax Exemption</div>
                </div>
              </motion.button>

              {/* Water & Damage Report Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playClickSound()
                  setReportOpen(true)
                  setExpanded(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(3, 105, 161, 0.25) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Droplets size={16} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ color: '#38BDF8' }}>Report Water Depth</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Crowdsource Red Zones • In Feet</div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Pill */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #17372D 0%, #0F231D 100%)',
            border: '1px solid rgba(52, 211, 153, 0.45)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.25)',
            borderRadius: '30px',
            padding: '8px 14px 8px 10px',
            cursor: 'pointer',
          }}
          onClick={() => {
            playClickSound()
            setExpanded(!expanded)
          }}
        >
          {/* Animated Heart Pulsing icon */}
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(236, 72, 153, 0.6)',
            }}
          >
            <Heart size={14} color="#FFFFFF" fill="#FFFFFF" />
          </motion.div>

          <span style={{ fontSize: '12px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.3px' }}>
            💝 Relief & Reports
          </span>

          <motion.div animate={{ rotate: expanded ? 180 : 0 }} style={{ display: 'flex', alignItems: 'center' }}>
            <ChevronUp size={14} color="#34D399" />
          </motion.div>
        </motion.div>
      </div>

      {/* Disaster Donation Modal */}
      <DisasterDonationModal
        isOpen={donationOpen}
        onClose={() => setDonationOpen(false)}
      />

      {/* Citizen Water & Damage Report Modal */}
      <CitizenDamageReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  )
}
