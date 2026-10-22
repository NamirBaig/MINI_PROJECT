import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, CheckCircle2, XCircle, Truck, HeartPulse,
  Bed, Phone, MapPin, Building2, AlertTriangle, User,
  Filter, Search, Send, Clock, X, ChevronDown, Check, Droplets
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import {
  getAllRequests,
  approveEmergencyRequest,
  denyEmergencyRequest,
  markAsDispatched,
  subscribeToRequests,
  type EmergencyRequest,
  type RequestStatus,
  type UrgencyLevel
} from '../services/requestService'

const BENGALURU_ZONES = [
  'All', 'Yelahanka', 'Mahadevapura', 'Bommanahalli', 'East',
  'West', 'South', 'RR Nagar', 'Dasarahalli'
]

const HOSPITAL_OPTIONS = [
  'Yelahanka Sub-District Hospital (Ward 3 & 4)',
  'Bowring & Lady Curzon Hospital (Shivajinagar)',
  'KC General Hospital (Malleshwaram)',
  'Sakra World Hospital (Bellandur / ORR)',
  'Manipal Hospital (Hebbal / Airport Road)',
  'Columbia Asia Hospital (Hebbal)',
  'BBMP Flood Emergency Relief Shelter (Kendriya Vihar)',
  'BWSSB Emergency Tanker Supply Base #2',
]

export default function AuthorityRequestTriage() {
  const { user, currentRole } = useAuth()
  const toast = useToast()

  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [zoneFilter, setZoneFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Approve Action Modal
  const [approveModalItem, setApproveModalItem] = useState<EmergencyRequest | null>(null)
  const [allocatedHospital, setAllocatedHospital] = useState(HOSPITAL_OPTIONS[0])
  const [approvalNotes, setApprovalNotes] = useState('')

  // Deny Action Modal
  const [denyModalItem, setDenyModalItem] = useState<EmergencyRequest | null>(null)
  const [denialNotes, setDenialNotes] = useState('')

  const authorityName = user?.user_metadata?.full_name || 'BBMP Incident Commander'
  const authorityRole = user?.user_metadata?.role || 'Disaster Relief Lead'

  const loadRequests = () => {
    setRequests(getAllRequests())
  }

  useEffect(() => {
    loadRequests()
    const unsubscribe = subscribeToRequests(loadRequests)
    return () => unsubscribe()
  }, [])

  // Filtering
  const filtered = requests.filter(req => {
    const matchesZone = zoneFilter === 'All' || req.zone.toLowerCase() === zoneFilter.toLowerCase()
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter
    const matchesUrgency = urgencyFilter === 'All' || req.urgency === urgencyFilter
    const matchesSearch =
      searchQuery === '' ||
      req.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.resourceType.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesZone && matchesStatus && matchesUrgency && matchesSearch
  })

  // Counters
  const totalCount = requests.length
  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const approvedCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'DISPATCHED').length
  const deniedCount = requests.filter(r => r.status === 'DENIED').length

  // Handlers
  const handleOpenApprove = (req: EmergencyRequest) => {
    playClickSound()
    setApproveModalItem(req)
    setAllocatedHospital(HOSPITAL_OPTIONS[0])
    setApprovalNotes(`Approved: ${req.quantity} unit(s) of ${req.resourceType} reserved for ${req.requesterName}. 108 Ambulance unit notified for immediate evacuation.`)
  }

  const handleConfirmApprove = (e: React.FormEvent) => {
    e.preventDefault()
    if (!approveModalItem) return

    playSuccessSound()
    const updated = approveEmergencyRequest(
      approveModalItem.id,
      `${authorityName} (${authorityRole})`,
      allocatedHospital,
      approvalNotes
    )

    toast.success(
      `Request Approved (${approveModalItem.id})`,
      `Allocated at ${allocatedHospital}`
    )
    setApproveModalItem(null)
  }

  const handleOpenDeny = (req: EmergencyRequest) => {
    playAlertSound()
    setDenyModalItem(req)
    setDenialNotes(`Denied: Inpatient beds prioritized for acute emergencies in ${req.zone}. Citizen redirected to nearest dry relief camp with water and food supplies.`)
  }

  const handleConfirmDeny = (e: React.FormEvent) => {
    e.preventDefault()
    if (!denyModalItem) return

    playAlertSound()
    denyEmergencyRequest(
      denyModalItem.id,
      `${authorityName} (${authorityRole})`,
      denialNotes
    )

    toast.alert(
      `Request Denied / Redirected (${denyModalItem.id})`,
      'Action notes recorded for citizen view'
    )
    setDenyModalItem(null)
  }

  const handleDispatch = (req: EmergencyRequest) => {
    playSuccessSound()
    markAsDispatched(
      req.id,
      `${authorityName} (${authorityRole})`,
      `Relief unit and ambulance dispatched on priority to ${req.address}. ETA 18 minutes.`
    )
    toast.info(`Dispatched (${req.id})`, 'Transport and paramedic team en route')
  }

  return (
    <div className="bento-card" style={{ position: 'relative' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#F87171',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}>
              <ShieldAlert size={14} />
              AUTHORITY TRIAGE & DISPATCH COMMAND
            </span>
            <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
              Logged in: <b>{authorityName}</b> ({authorityRole})
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#FFFFFF' }}>
            Emergency Resource Requests & Bed Allocation Console
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tx-muted)' }}>
            Inspect incoming requests from citizens in distress across Bengaluru zones. Approve hospital bed allocation or deny with municipal rationale.
          </p>
        </div>

        {/* Counter Summary Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '6px 12px', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FBBF24' }}>{pendingCount}</div>
            <div style={{ fontSize: 10, color: 'var(--tx-muted)', fontWeight: 700 }}>PENDING</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '6px 12px', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#34D399' }}>{approvedCount}</div>
            <div style={{ fontSize: 10, color: 'var(--tx-muted)', fontWeight: 700 }}>APPROVED</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '6px 12px', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F87171' }}>{deniedCount}</div>
            <div style={{ fontSize: 10, color: 'var(--tx-muted)', fontWeight: 700 }}>DENIED</div>
          </div>
        </div>
      </div>

      {/* Filter Matrix Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 20,
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Search citizen name, ID, road..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: 12,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Zone Selector */}
        <div>
          <select
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {BENGALURU_ZONES.map(z => (
              <option key={z} value={z} style={{ background: '#111814', color: '#fff' }}>
                Zone: {z}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="All" style={{ background: '#111814', color: '#fff' }}>Status: All</option>
            <option value="PENDING" style={{ background: '#111814', color: '#fff' }}>Status: Pending Review</option>
            <option value="APPROVED" style={{ background: '#111814', color: '#fff' }}>Status: Approved</option>
            <option value="DISPATCHED" style={{ background: '#111814', color: '#fff' }}>Status: Dispatched</option>
            <option value="DENIED" style={{ background: '#111814', color: '#fff' }}>Status: Denied</option>
          </select>
        </div>

        {/* Urgency Filter */}
        <div>
          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="All" style={{ background: '#111814', color: '#fff' }}>Urgency: All Levels</option>
            <option value="CRITICAL" style={{ background: '#111814', color: '#fff' }}>Urgency: Critical</option>
            <option value="HIGH" style={{ background: '#111814', color: '#fff' }}>Urgency: High</option>
            <option value="MODERATE" style={{ background: '#111814', color: '#fff' }}>Urgency: Moderate</option>
          </select>
        </div>
      </div>

      {/* Requests Triage Table / Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--tx-muted)' }}>
          No emergency requests matching the selected filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(req => {
            const isCritical = req.urgency === 'CRITICAL'
            const isApproved = req.status === 'APPROVED' || req.status === 'DISPATCHED'
            const isDenied = req.status === 'DENIED'
            const isPending = req.status === 'PENDING'

            return (
              <motion.div
                key={req.id}
                layout
                style={{
                  background: isCritical && isPending
                    ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 19, 0.75) 100%)'
                    : 'rgba(255, 255, 255, 0.035)',
                  border: isCritical && isPending
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : isApproved
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : isDenied
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  padding: '18px 20px',
                  position: 'relative',
                }}
              >
                {/* Request Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--pri-neon)' }}>
                        {req.id}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: req.urgency === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : req.urgency === 'HIGH' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                        color: req.urgency === 'CRITICAL' ? '#F87171' : req.urgency === 'HIGH' ? '#FBBF24' : '#34D399',
                        border: req.urgency === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                      }}>
                        {req.urgency}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                        Submitted {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#FFFFFF' }}>
                      {req.quantity}x {req.resourceType}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 12px',
                        borderRadius: 20,
                        background: 'rgba(245, 158, 11, 0.18)',
                        border: '1px solid #F59E0B',
                        color: '#FBBF24',
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}>
                        <Clock size={13} />
                        PENDING ACTION
                      </span>
                    )}
                    {req.status === 'APPROVED' && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 12px',
                        borderRadius: 20,
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10B981',
                        color: '#34D399',
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}>
                        <CheckCircle2 size={13} />
                        APPROVED
                      </span>
                    )}
                    {req.status === 'DISPATCHED' && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 12px',
                        borderRadius: 20,
                        background: 'rgba(6, 182, 212, 0.2)',
                        border: '1px solid #06B6D4',
                        color: '#22D3EE',
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}>
                        <Truck size={13} />
                        DISPATCHED
                      </span>
                    )}
                    {isDenied && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 12px',
                        borderRadius: 20,
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #EF4444',
                        color: '#F87171',
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}>
                        <XCircle size={13} />
                        DENIED
                      </span>
                    )}
                  </div>
                </div>

                {/* Citizen Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 14,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <User size={13} color="#34D399" /> Requester Person
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                      {req.requesterName}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
                      {req.requesterEmail}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={13} color="#38BDF8" /> Contact Phone
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                      {req.requesterPhone}
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} color="#FBBF24" /> Specific Location ({req.zone} Zone)
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>
                      {req.address}
                    </div>
                  </div>
                </div>

                {/* Patient Situation / Emergency Notes */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 1.5,
                  marginBottom: 14,
                }}>
                  <b style={{ color: '#F87171' }}>Patient Emergency Condition:</b> {req.patientNotes}
                </div>

                {/* If already actioned: display notes */}
                {req.actionNotes && (
                  <div style={{
                    marginBottom: 14,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: isApproved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: 12,
                  }}>
                    <div style={{ color: isApproved ? '#34D399' : '#F87171', fontWeight: 700, marginBottom: 2 }}>
                      {isApproved ? 'Bed Allocation / Dispatch Decision:' : 'Official Denial Rationale:'}
                    </div>
                    <div style={{ color: '#FFFFFF' }}>{req.actionNotes}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                      Reviewed by {req.reviewedBy} at {req.reviewedAt ? new Date(req.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </div>
                  </div>
                )}

                {/* Authority Action Control Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {isPending && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpenDeny(req)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          borderRadius: 8,
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#F87171',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <XCircle size={15} />
                        <span>Deny / Redirect</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpenApprove(req)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 18px',
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          border: 'none',
                          color: '#030604',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <CheckCircle2 size={15} />
                        <span>Approve & Allocate Beds</span>
                      </motion.button>
                    </>
                  )}

                  {req.status === 'APPROVED' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDispatch(req)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 18px',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <Truck size={15} />
                      <span>Dispatch Ambulance / Rescue Unit</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ─── Modal 1: Approve & Allocate Bed ─── */}
      <AnimatePresence>
        {approveModalItem && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(3, 7, 5, 0.85)',
            backdropFilter: 'blur(16px)',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: 540,
                background: 'linear-gradient(145deg, #0C1E16 0%, #06110B 100%)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                borderRadius: 16,
                padding: '24px 26px',
                color: '#FFFFFF',
                boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} />
                  Approve & Allocate Resources ({approveModalItem.id})
                </h3>
                <button
                  onClick={() => setApproveModalItem(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
                Approving <b>{approveModalItem.quantity}x {approveModalItem.resourceType}</b> for <b>{approveModalItem.requesterName}</b> ({approveModalItem.zone} Zone).
              </div>

              <form onSubmit={handleConfirmApprove} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    Select Allocated Hospital or Depot
                  </label>
                  <select
                    value={allocatedHospital}
                    onChange={e => setAllocatedHospital(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {HOSPITAL_OPTIONS.map(h => (
                      <option key={h} value={h} style={{ background: '#111814', color: '#fff' }}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    Official Dispatch & Bed Allocation Decision Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={approvalNotes}
                    onChange={e => setApprovalNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      lineHeight: 1.4,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setApproveModalItem(null)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
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
                    Confirm Bed Allocation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal 2: Deny & Redirect ─── */}
      <AnimatePresence>
        {denyModalItem && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(3, 7, 5, 0.85)',
            backdropFilter: 'blur(16px)',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: 520,
                background: 'linear-gradient(145deg, #1C100F 0%, #0D0606 100%)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: 16,
                padding: '24px 26px',
                color: '#FFFFFF',
                boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={18} />
                  Deny / Redirect Request ({denyModalItem.id})
                </h3>
                <button
                  onClick={() => setDenyModalItem(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmDeny} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    Official Municipal Rationale & Redirection Guidance
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={denialNotes}
                    onChange={e => setDenialNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      lineHeight: 1.4,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setDenyModalItem(null)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '9px 20px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm Denial
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
