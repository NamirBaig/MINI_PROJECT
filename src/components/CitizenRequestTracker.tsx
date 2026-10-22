import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, CheckCircle2, XCircle, Truck, HeartPulse, Bed,
  Droplets, ShieldAlert, AlertTriangle, Phone, MapPin, Building2,
  ChevronRight, RefreshCw, PlusCircle, Mail, ExternalLink, Printer,
  Copy, Sparkles, Navigation, User, ArrowRight, ShieldCheck, Check
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import {
  getAllRequests,
  getUserRequests,
  getAllKnownRequesterEmails,
  subscribeToRequests,
  type EmergencyRequest
} from '../services/requestService'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import EmergencyRequestModal from './EmergencyRequestModal'

interface CitizenRequestTrackerProps {
  onRequestClick?: () => void
}

export default function CitizenRequestTracker({ onRequestClick }: CitizenRequestTrackerProps = {}) {
  const { user } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live')
  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedEmailFilter, setSelectedEmailFilter] = useState<string>('AUTO')
  
  // Official Dispatch Email Memo Modal
  const [emailMemoRequest, setEmailMemoRequest] = useState<EmergencyRequest | null>(null)

  // Discovered emails across sessions
  const [knownEmails, setKnownEmails] = useState<string[]>([])

  const refresh = () => {
    const known = getAllKnownRequesterEmails()
    const all = getAllRequests()
    setKnownEmails(known)

    // Determine target email for filtering
    let primary = ''
    try {
      const saved = localStorage.getItem('safeground_primary_personal_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.email) primary = parsed.email.trim().toLowerCase()
      }
    } catch {}

    const activeUserEmail = user?.email?.trim().toLowerCase() || ''
    const currentFilter = selectedEmailFilter

    let filtered: EmergencyRequest[] = []

    if (currentFilter === 'ALL') {
      filtered = all
    } else if (currentFilter !== 'AUTO') {
      filtered = all.filter(r => (r.requesterEmail || '').trim().toLowerCase() === currentFilter.toLowerCase())
    } else {
      // AUTO mode: match active user email, primary email, or user.id
      filtered = all.filter(r => {
        const reqEmail = (r.requesterEmail || '').trim().toLowerCase()
        if (activeUserEmail && reqEmail === activeUserEmail) return true
        if (primary && reqEmail === primary) return true
        if (user && r.userId === user.id) return true
        return false
      })

      // If nothing found in AUTO and user is in demo citizen persona, fall back to showing requests from any known personal email
      if (filtered.length === 0 && known.length > 0) {
        filtered = all.filter(r => known.includes((r.requesterEmail || '').trim().toLowerCase()))
      }

      // If still empty, show all non-authority requests for demonstration
      if (filtered.length === 0) {
        filtered = all.filter(r => !r.requesterEmail.includes('@bbmp.gov.in') && !r.requesterEmail.includes('@ksndmc.'))
      }
    }

    setRequests(filtered)
  }

  useEffect(() => {
    refresh()
    const unsubscribeReq = subscribeToRequests(refresh)
    return () => {
      unsubscribeReq()
    }
  }, [user, selectedEmailFilter])

  const handleOpenModal = () => {
    playClickSound()
    if (onRequestClick) {
      onRequestClick()
    } else {
      setModalOpen(true)
    }
  }

  const activeEmailDisplay = user?.email || 'Registered Citizen'
  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const arrivingCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'DISPATCHED').length
  const deniedCount = requests.filter(r => r.status === 'DENIED').length

  const activeRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED' || r.status === 'DISPATCHED')

  return (
    <div className="bento-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ─── Top Header & Email Selector ──────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#34D399',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}>
              <HeartPulse size={13} />
              EMERGENCY RESOURCE TRACKER & DISPATCH CONSOLE
            </span>

            {arrivingCount > 0 && (
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 14,
                background: 'rgba(16, 185, 129, 0.25)',
                color: '#34D399',
                border: '1px solid #10B981',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}>
                <span className="live-dot" style={{ background: '#10B981' }} />
                {arrivingCount} ACCEPTED & ARRIVING SOON
              </span>
            )}

            {pendingCount > 0 && (
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 14,
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.45)',
              }}>
                {pendingCount} Pending Triage
              </span>
            )}
          </div>

          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>
            Hospital Bed Allocation & Live Transport Dispatch
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tx-muted)' }}>
            Real-time ambulance ETA, allocated hospital ICU bed bays, and official government dispatch notifications.
          </p>
        </div>

        {/* Action Button & Email Scope Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenModal}
            className="btn-shiny"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              fontSize: 13,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            }}
          >
            <PlusCircle size={15} />
            <span>Request Beds / Supplies</span>
          </motion.button>

          {/* Email View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <span style={{ color: 'var(--tx-muted)' }}>Tracking Email:</span>
            <select
              value={selectedEmailFilter}
              onChange={e => setSelectedEmailFilter(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 8,
                padding: '4px 8px',
                color: '#34D399',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <option value="AUTO" style={{ background: '#0C1A14', color: '#fff' }}>
                Active Session ({activeEmailDisplay})
              </option>
              {knownEmails.map(em => (
                <option key={em} value={em} style={{ background: '#0C1A14', color: '#fff' }}>
                  {em}
                </option>
              ))}
              <option value="ALL" style={{ background: '#0C1A14', color: '#fff' }}>
                All Requested Items (Audit View)
              </option>
            </select>
          </div>
        </div>
      </div>


      {/* ─── Mode Tabs: Live Tracking vs Complete History ────────── */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: 10,
        marginBottom: 16,
      }}>
        <button
          onClick={() => { playClickSound(); setActiveTab('live'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 16px',
            borderRadius: 8,
            border: activeTab === 'live' ? '1px solid #10B981' : '1px solid transparent',
            background: activeTab === 'live' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'live' ? '#34D399' : 'rgba(255, 255, 255, 0.7)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Truck size={15} />
          <span>Active Live Tracking ({activeRequests.length})</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('history'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 16px',
            borderRadius: 8,
            border: activeTab === 'history' ? '1px solid #10B981' : '1px solid transparent',
            background: activeTab === 'history' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'history' ? '#34D399' : 'rgba(255, 255, 255, 0.7)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Clock size={15} />
          <span>📜 Complete Request & Dispatch History ({requests.length})</span>
        </button>
      </div>

      {/* ─── Requests List Rendering ─────────────────────────── */}
      {requests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
        }}>
          <Bed size={34} color="rgba(255, 255, 255, 0.3)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
            No Emergency Requests on Record for {activeEmailDisplay}
          </h3>
          <p style={{ margin: '0 auto 18px', maxWidth: 460, fontSize: 13, color: 'var(--tx-muted)' }}>
            Need critical care ICU beds, general ward admission, clean drinking water tankers, or flood rescue boats? Submit an immediate distress request to Incident Command.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenModal}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#34D399',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            + Submit New Emergency Request
          </motion.button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(activeTab === 'live' ? activeRequests : requests).map(req => {
            const isApproved = req.status === 'APPROVED' || req.status === 'DISPATCHED'
            const isDispatched = req.status === 'DISPATCHED'
            const isDenied = req.status === 'DENIED'
            const isPending = req.status === 'PENDING'
            const isExpanded = expandedId === req.id

            return (
              <motion.div
                key={req.id}
                layout
                style={{
                  background: isApproved
                    ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 16, 11, 0.85) 100%)'
                    : isDenied
                    ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.1) 0%, rgba(16, 8, 8, 0.85) 100%)'
                    : 'linear-gradient(145deg, rgba(245, 158, 11, 0.08) 0%, rgba(14, 12, 6, 0.85) 100%)',
                  border: isApproved
                    ? '1.5px solid #10B981'
                    : isDenied
                    ? '1.5px solid rgba(239, 68, 68, 0.5)'
                    : '1.5px solid rgba(245, 158, 11, 0.45)',
                  borderRadius: 16,
                  padding: '20px 22px',
                  boxShadow: isApproved ? '0 0 25px rgba(16, 185, 129, 0.2)' : 'none',
                  position: 'relative',
                }}
              >
                {/* 1. Status Bar & Item Overview */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: isApproved ? 'rgba(16, 185, 129, 0.25)' : isDenied ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: isApproved ? '1px solid #10B981' : isDenied ? '1px solid #EF4444' : '1px solid #F59E0B',
                    }}>
                      {isApproved ? <Truck size={24} color="#34D399" /> : isDenied ? <XCircle size={24} color="#F87171" /> : <Clock size={24} color="#FBBF24" />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF' }}>
                          {req.quantity}x {req.resourceType}
                        </span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: req.urgency === 'CRITICAL' ? 'rgba(239, 68, 68, 0.3)' : req.urgency === 'HIGH' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                          color: req.urgency === 'CRITICAL' ? '#F87171' : req.urgency === 'HIGH' ? '#FBBF24' : '#34D399',
                          border: req.urgency === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
                        }}>
                          {req.urgency}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span>Token: <b style={{ color: '#E2E8F0' }}>{req.id}</b></span>
                        <span>•</span>
                        <span>Linked to: <b style={{ color: '#34D399' }}>{req.requesterEmail}</b></span>
                        <span>•</span>
                        <span>📍 {req.zone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Big Badge */}
                  <div>
                    {isApproved && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 4,
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          borderRadius: 30,
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.4) 100%)',
                          border: '1.5px solid #10B981',
                          color: '#34D399',
                          fontSize: 13,
                          fontWeight: 900,
                          letterSpacing: 0.5,
                          boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
                        }}>
                          <span className="live-dot" style={{ background: '#10B981' }} />
                          {isDispatched ? '🚚 UNIT DISPATCHED & EN ROUTE' : '🟢 ACCEPTED & ARRIVING SOON'}
                        </span>
                        <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>
                          ⏱️ ETA: {req.dispatchEta || '12-15 mins'}
                        </span>
                      </div>
                    )}

                    {isDenied && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 30,
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1.5px solid #EF4444',
                        color: '#F87171',
                        fontSize: 13,
                        fontWeight: 900,
                        letterSpacing: 0.5,
                      }}>
                        <XCircle size={15} />
                        ❌ REJECTED & REDIRECTED
                      </span>
                    )}

                    {isPending && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 30,
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1.5px solid #F59E0B',
                        color: '#FBBF24',
                        fontSize: 13,
                        fontWeight: 900,
                      }}>
                        <Clock size={15} />
                        ⏳ PENDING COMMAND TRIAGE
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. APPROVED: LIVE DISPATCH COCKPIT CARD */}
                {isApproved && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 12,
                    padding: '16px 18px',
                    marginBottom: 14,
                  }}>
                    {/* Stepper Visualizer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 11, fontWeight: 900 }}>✓</div>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#34D399' }}>Distress Logged</span>
                      </div>
                      <div style={{ flex: 1, height: 2, background: '#10B981', margin: '0 8px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 11, fontWeight: 900 }}>✓</div>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#34D399' }}>Bed Allocated</span>
                      </div>
                      <div style={{ flex: 1, height: 2, background: isDispatched ? '#10B981' : 'rgba(16, 185, 129, 0.4)', margin: '0 8px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: isDispatched ? '#10B981' : '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 11, fontWeight: 900 }}>
                          {isDispatched ? '✓' : '3'}
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: isDispatched ? '#34D399' : '#FFFFFF' }}>Ambulance En Route</span>
                      </div>
                    </div>

                    {/* Dispatch Details Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 12,
                      background: 'rgba(0, 0, 0, 0.35)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Building2 size={13} color="#34D399" /> Target Facility
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                          {req.allocatedHospital || 'Victoria Hospital Emergency Network'}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#34D399', fontWeight: 700, marginTop: 2 }}>
                          🛏️ {req.hospitalBedNumber || 'ICU Bay #04 (Floor 2)'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Truck size={13} color="#38BDF8" /> Transport Vehicle
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                          {req.dispatchVehicle || '108 ALS Ambulance KA-04-E-8421'}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                          Pilot: {req.driverName || 'Manjunath R.'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={13} color="#FBBF24" /> Emergency Pilot Phone
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#FBBF24', marginTop: 2 }}>
                          {req.driverPhone || '+91 98451 91108'}
                        </div>
                      </div>
                    </div>

                    {/* Official Notes */}
                    <div style={{ fontSize: 12.5, color: '#FFFFFF', lineHeight: 1.5, marginTop: 10 }}>
                      <b style={{ color: '#34D399' }}>Official Command Decision:</b> {req.actionNotes}
                    </div>

                    {/* Button to view email memo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)' }}>
                        Reviewed by <b>{req.reviewedBy}</b> at {req.reviewedAt ? new Date(req.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>

                      <button
                        onClick={() => setEmailMemoRequest(req)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.18)',
                          border: '1px solid #10B981',
                          color: '#34D399',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Mail size={13} />
                        <span>View Official Dispatch Email (Sent to: {req.requesterEmail})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. DENIED / REDIRECTED CARD */}
                {isDenied && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 12,
                    padding: '16px 18px',
                    marginBottom: 14,
                  }}>
                    <div style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.5, marginBottom: 8 }}>
                      <b style={{ color: '#F87171' }}>Triage Denial Rationale:</b> {req.actionNotes}
                    </div>

                    {req.redirectShelter && (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 12.5,
                        color: '#FFFFFF',
                        marginBottom: 10,
                      }}>
                        <div style={{ color: '#F87171', fontWeight: 800, marginBottom: 2 }}>
                          📍 Designated Safe Shelter Redirection:
                        </div>
                        <div>{req.redirectShelter}</div>
                        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                          Provisioned with dry cots, hot meals, drinking water, and first-aid medics. For urgent rescue call <b>112</b> or BBMP <b>1533</b>.
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)' }}>
                        Reviewed by <b>{req.reviewedBy}</b>
                      </span>

                      <button
                        onClick={() => setEmailMemoRequest(req)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(239, 68, 68, 0.18)',
                          border: '1px solid #EF4444',
                          color: '#F87171',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Mail size={13} />
                        <span>View Triage Decision Email Notice</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. PENDING CARD */}
                {isPending && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 14,
                    fontSize: 12.5,
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.5,
                  }}>
                    ⏳ <b>Triage in progress for {req.zone} Zone:</b> Your emergency request has been placed in the municipal priority triage queue. BBMP Disaster Relief & Medical Coordinators are actively reviewing capacity to allocate your bed and ambulance.
                  </div>
                )}

                {/* 5. Historical Audit Trail & Request Details Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--pri-neon)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{isExpanded ? 'Hide Audit Trail & Notes' : 'View Full History & Patient Notes'}</span>
                    <ChevronRight size={14} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>
                    Created: {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                {/* Expandable Historical Audit Trail */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 14 }}>
                      <div>
                        <span style={{ color: 'var(--tx-muted)' }}>Requester Name: </span>
                        <b>{req.requesterName}</b> ({req.requesterPhone})
                      </div>
                      <div>
                        <span style={{ color: 'var(--tx-muted)' }}>Notification Email: </span>
                        <b>{req.requesterEmail}</b>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--tx-muted)' }}>Pickup Location: </span>
                        {req.address} ({req.zone} Zone)
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--tx-muted)' }}>Medical Situation / Condition: </span>
                        <em>{req.patientNotes}</em>
                      </div>
                    </div>

                    {/* Step-by-Step Chronological Audit Trail */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pri-neon)', marginBottom: 8 }}>
                        📜 Official Incident Command Audit Trail:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(req.auditTrail || [
                          {
                            timestamp: req.createdAt,
                            action: 'Request Registered',
                            actor: req.requesterName,
                            details: `Emergency request initiated for ${req.quantity}x ${req.resourceType}.`,
                            badgeColor: '#F59E0B',
                          },
                        ]).map((log, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: 8,
                              padding: '8px 12px',
                              fontSize: 11.5,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <span style={{ fontWeight: 800, color: log.badgeColor || '#34D399' }}>
                                {log.action}
                              </span>
                              <span style={{ color: 'var(--tx-muted)', fontSize: 10.5 }}>
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ color: '#FFFFFF' }}>{log.details}</div>
                            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                              Actor: {log.actor}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ─── Modal 1: Official Email Dispatch Memorandum ────────── */}
      <AnimatePresence>
        {emailMemoRequest && (
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
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              style={{
                width: '100%',
                maxWidth: 620,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#0B1612',
                border: '1.5px solid #10B981',
                borderRadius: 16,
                padding: '24px 28px',
                color: '#FFFFFF',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(16, 185, 129, 0.25)',
              }}
            >
              {/* Email Client Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#34D399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Mail size={14} /> OFFICIAL DISPATCH NOTIFICATION EMAIL RECEIPT
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>
                    Government of Karnataka Emergency Command
                  </h3>
                </div>

                <button
                  onClick={() => setEmailMemoRequest(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
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
                  ✕
                </button>
              </div>

              {/* Email Envelope Metadata */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                marginBottom: 16,
              }}>
                <div><span style={{ color: 'var(--tx-muted)' }}>From:</span> <b>SafeGround Incident Command &lt;disaster.relief@karnataka.gov.in&gt;</b></div>
                <div><span style={{ color: 'var(--tx-muted)' }}>To:</span> <b style={{ color: '#34D399' }}>{emailMemoRequest.requesterEmail}</b> ({emailMemoRequest.requesterName})</div>
                <div><span style={{ color: 'var(--tx-muted)' }}>Date:</span> {emailMemoRequest.emailNotificationTimestamp ? new Date(emailMemoRequest.emailNotificationTimestamp).toLocaleString() : new Date().toLocaleString()}</div>
                <div>
                  <span style={{ color: 'var(--tx-muted)' }}>Subject:</span>{' '}
                  <b style={{ color: emailMemoRequest.status === 'APPROVED' ? '#34D399' : '#F87171' }}>
                    {emailMemoRequest.status === 'APPROVED'
                      ? `[URGENT DISPATCH] Bed Reservation & 108 Ambulance Confirmed — Token #${emailMemoRequest.id}`
                      : `[OFFICIAL NOTICE] SafeGround Triage Decision & Shelter Redirection — Token #${emailMemoRequest.id}`}
                  </b>
                </div>
              </div>

              {/* Email Printable Memo Body */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 12,
                padding: '18px 20px',
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#FBBF24', letterSpacing: 1 }}>
                    STATE NATURAL DISASTER MANAGEMENT CELL (KSNDMC) & BBMP
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>
                    OFFICIAL EMERGENCY DISPATCH MEMORANDUM
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Token Reference: {emailMemoRequest.id}</div>
                </div>

                <p style={{ margin: '0 0 12px' }}>
                  Dear <b>{emailMemoRequest.requesterName}</b>,
                </p>

                {emailMemoRequest.status === 'APPROVED' ? (
                  <>
                    <p style={{ margin: '0 0 14px' }}>
                      Your emergency distress request for <b>{emailMemoRequest.quantity}x {emailMemoRequest.resourceType}</b> in <b>{emailMemoRequest.zone} Zone</b> has been evaluated and officially <b style={{ color: '#34D399' }}>ACCEPTED</b>. Transport and facility reservations have been locked:
                    </p>

                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 8,
                      marginBottom: 14,
                    }}>
                      <div><span style={{ color: 'var(--tx-muted)' }}>Allocated Hospital:</span><br /><b style={{ color: '#FFFFFF' }}>{emailMemoRequest.allocatedHospital}</b></div>
                      <div><span style={{ color: 'var(--tx-muted)' }}>Reserved Bed Number:</span><br /><b style={{ color: '#34D399' }}>{emailMemoRequest.hospitalBedNumber}</b></div>
                      <div><span style={{ color: 'var(--tx-muted)' }}>Dispatch Transport:</span><br /><b style={{ color: '#38BDF8' }}>{emailMemoRequest.dispatchVehicle}</b></div>
                      <div><span style={{ color: 'var(--tx-muted)' }}>Driver / Pilot Contact:</span><br /><b style={{ color: '#FBBF24' }}>{emailMemoRequest.driverName} ({emailMemoRequest.driverPhone})</b></div>
                      <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--tx-muted)' }}>Estimated Arrival:</span><br /><b style={{ color: '#10B981', fontSize: 14 }}>{emailMemoRequest.dispatchEta || '12-15 mins'}</b></div>
                    </div>

                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>
                      <b>Instructions for Attendant:</b> Please ensure the patient is ready for transfer. Keep your mobile phone ({emailMemoRequest.requesterPhone}) on loud. The 108 pilot has been dispatched directly to <b>{emailMemoRequest.address}</b>.
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '0 0 14px' }}>
                      Your emergency request for <b>{emailMemoRequest.quantity}x {emailMemoRequest.resourceType}</b> was evaluated by the municipal emergency triage cell. In accordance with current disaster quota protocols, hospital inpatient beds have been allocated to critical trauma patients.
                    </p>

                    <div style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      marginBottom: 14,
                    }}>
                      <div style={{ color: '#F87171', fontWeight: 800, marginBottom: 4 }}>Designated Relief Redirection:</div>
                      <div style={{ color: '#FFFFFF', fontWeight: 700 }}>{emailMemoRequest.redirectShelter}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                        Decision Rationale: {emailMemoRequest.actionNotes}
                      </div>
                    </div>
                  </>
                )}

                {/* Digital Signature Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Digitally Authenticated By:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>{emailMemoRequest.reviewedBy || 'BBMP Disaster Command'}</div>
                    <div style={{ fontSize: 10.5, color: '#34D399' }}>Verified Government Token • SafeGround Incident Grid</div>
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    <div>[BARCODE: BLR-{emailMemoRequest.id}]</div>
                    <div>SECURE-VERIFIED-SHA256</div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => {
                    toast.copy(emailMemoRequest.id)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 16px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={13} /> Copy Token ID
                </button>

                <button
                  onClick={() => setEmailMemoRequest(null)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    color: '#030604',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
