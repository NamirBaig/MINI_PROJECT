import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, CheckCircle2, XCircle, Truck, HeartPulse, Bed,
  Droplets, ShieldAlert, AlertTriangle, Phone, MapPin, Building2,
  ChevronRight, RefreshCw, PlusCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getUserRequests, subscribeToRequests, type EmergencyRequest } from '../services/requestService'
import { playClickSound } from '../utils/audioFeedback'
import EmergencyRequestModal from './EmergencyRequestModal'

interface CitizenRequestTrackerProps {
  onRequestClick?: () => void
}

export default function CitizenRequestTracker({ onRequestClick }: CitizenRequestTrackerProps = {}) {
  const { user } = useAuth()
  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleOpenModal = () => {
    playClickSound()
    if (onRequestClick) {
      onRequestClick()
    } else {
      setModalOpen(true)
    }
  }

  const refresh = () => {
    if (!user) return
    const userReqs = getUserRequests(user.id, user.email)
    setRequests(userReqs)
  }

  useEffect(() => {
    refresh()
    const unsubscribe = subscribeToRequests(refresh)
    return () => unsubscribe()
  }, [user])

  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const approvedCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'DISPATCHED').length

  return (
    <div className="bento-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34D399',
              fontSize: 11,
              fontWeight: 800,
            }}>
              <HeartPulse size={13} />
              MY EMERGENCY REQUESTS & APPROVAL TRACKER
            </span>
            {pendingCount > 0 && (
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
              }}>
                {pendingCount} Pending Triage
              </span>
            )}
            {approvedCount > 0 && (
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}>
                {approvedCount} Approved
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#FFFFFF' }}>
            Live Hospital Bed & Emergency Resource Status
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tx-muted)' }}>
            Real-time tracking of requests evaluated by BBMP Disaster Relief & KSNDMC Hospital Coordinators.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenModal}
          className="btn-shiny"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 16px',
            fontSize: 13,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          }}
        >
          <PlusCircle size={15} />
          <span>New Emergency Request</span>
        </motion.button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '36px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
        }}>
          <Bed size={32} color="rgba(255, 255, 255, 0.3)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
            No Active Emergency Requests
          </h3>
          <p style={{ margin: '0 auto 16px', maxWidth: 440, fontSize: 13, color: 'var(--tx-muted)' }}>
            If you or your family require ICU hospital beds, general ward admission, clean drinking water, or rescue boats in flooded wards, request them directly.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenModal}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Request Hospital Beds or Supplies
          </motion.button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => {
            const isApproved = req.status === 'APPROVED' || req.status === 'DISPATCHED'
            const isDenied = req.status === 'DENIED'
            const isPending = req.status === 'PENDING'
            const isExpanded = expandedId === req.id

            return (
              <motion.div
                key={req.id}
                layout
                style={{
                  background: isApproved
                    ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 11, 8, 0.7) 100%)'
                    : isDenied
                    ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, rgba(6, 11, 8, 0.7) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isApproved
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : isDenied
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  boxShadow: isApproved ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: isApproved ? 'rgba(16, 185, 129, 0.2)' : isDenied ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isApproved ? <CheckCircle2 size={20} color="#34D399" /> : isDenied ? <XCircle size={20} color="#F87171" /> : <Clock size={20} color="#FBBF24" />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>
                          {req.quantity}x {req.resourceType}
                        </span>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: req.urgency === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : req.urgency === 'HIGH' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                          color: req.urgency === 'CRITICAL' ? '#F87171' : req.urgency === 'HIGH' ? '#FBBF24' : '#34D399',
                        }}>
                          {req.urgency}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span>ID: <b style={{ color: '#E2E8F0' }}>{req.id}</b></span>
                        <span>•</span>
                        <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>📍 {req.zone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: 'rgba(245, 158, 11, 0.18)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        color: '#FBBF24',
                        fontSize: 12,
                        fontWeight: 800,
                      }}>
                        <span className="live-dot" style={{ background: '#FBBF24' }} />
                        ⏳ PENDING REVIEW
                      </span>
                    )}

                    {req.status === 'APPROVED' && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 20,
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10B981',
                        color: '#34D399',
                        fontSize: 12,
                        fontWeight: 800,
                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                      }}>
                        <CheckCircle2 size={14} />
                        ✅ APPROVED — ALLOCATED
                      </span>
                    )}

                    {req.status === 'DISPATCHED' && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 20,
                        background: 'rgba(6, 182, 212, 0.2)',
                        border: '1px solid #06B6D4',
                        color: '#22D3EE',
                        fontSize: 12,
                        fontWeight: 800,
                      }}>
                        <Truck size={14} />
                        🚚 UNIT DISPATCHED
                      </span>
                    )}

                    {isDenied && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 20,
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #EF4444',
                        color: '#F87171',
                        fontSize: 12,
                        fontWeight: 800,
                      }}>
                        <XCircle size={14} />
                        ❌ REDIRECTED / DENIED
                      </span>
                    )}
                  </div>
                </div>

                {/* Authority Action Result Callout (Crucial for Citizen) */}
                {isApproved && (
                  <div style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#34D399', fontWeight: 800, fontSize: 12 }}>
                      <Building2 size={14} />
                      Allocated Facility: {req.allocatedHospital || 'Yelahanka Sub-District Hospital'}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#FFFFFF', lineHeight: 1.5 }}>
                      <b>Official Authority Decision:</b> {req.actionNotes}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                      Approved by <b>{req.reviewedBy}</b> at {req.reviewedAt ? new Date(req.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </div>
                  </div>
                )}

                {isDenied && (
                  <div style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                  }}>
                    <div style={{ fontSize: 12.5, color: '#FFFFFF', lineHeight: 1.5 }}>
                      <b style={{ color: '#F87171' }}>Authority Action Note:</b> {req.actionNotes}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                      Reviewed by <b>{req.reviewedBy}</b> · For urgent life safety call <b>112</b> or BBMP <b>1533</b>
                    </div>
                  </div>
                )}

                {isPending && (
                  <div style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.7)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}>
                    ⏳ <b>Triage in progress:</b> Your request has been queued on the BBMP Disaster Relief & Hospital Emergency Matrix for {req.zone}. An authority officer will approve bed allocation shortly.
                  </div>
                )}

                {/* Expand Details Toggle */}
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--pri-neon)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Address & Medical Notes'}</span>
                    <ChevronRight size={13} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.8)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--tx-muted)' }}>Requester: </span>
                      <b>{req.requesterName}</b> ({req.requesterPhone})
                    </div>
                    <div>
                      <span style={{ color: 'var(--tx-muted)' }}>Location: </span>
                      {req.address}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--tx-muted)' }}>Patient Condition: </span>
                      <em>{req.patientNotes}</em>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Emergency Request Modal */}
      <EmergencyRequestModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          refresh()
        }}
      />
    </div>
  )
}
