import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartPulse, Droplets, X, ChevronUp, ShieldCheck } from 'lucide-react'
import { playClickSound } from '../utils/audioFeedback'
import DisasterDonationModal from './DisasterDonationModal'
import CitizenDamageReportModal from './CitizenDamageReportModal'

export default function FloatingReliefWidget() {
  const [expanded, setExpanded] = useState(false)
  const [donationOpen, setDonationOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  return (
    <>
      <div className="floating-relief-container">
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
                background: 'rgba(10, 20, 15, 0.96)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                borderRadius: '16px',
                padding: '12px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 25px rgba(16, 185, 129, 0.18)',
                minWidth: '230px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 4px 4px' }}>
                Civic Relief & Field Reports
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
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.28) 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.45)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <HeartPulse size={17} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ color: '#34D399', fontWeight: 800 }}>Disaster Relief Fund</div>
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 10px rgba(2, 132, 199, 0.4)',
                  }}
                >
                  <Droplets size={17} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ color: '#38BDF8', fontWeight: 800 }}>Report Flood Depth</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Depth in Feet • Real-Time Alert</div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Pill */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            background: 'linear-gradient(135deg, #10261E 0%, #0A1712 100%)',
            border: '1px solid rgba(52, 211, 153, 0.5)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.3)',
            borderRadius: '30px',
            padding: '8px 14px 8px 10px',
            cursor: 'pointer',
          }}
          onClick={() => {
            playClickSound()
            setExpanded(!expanded)
          }}
        >
          {/* Animated Heartbeat ECG pulse icon */}
          <motion.div
            animate={{
              scale: [1, 1.18, 1.02, 1.22, 1],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              times: [0, 0.15, 0.3, 0.45, 1],
              ease: 'easeInOut',
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.7)',
            }}
          >
            <HeartPulse size={15} color="#FFFFFF" />
          </motion.div>

          <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.4px' }}>
            Relief & Field Reports
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
