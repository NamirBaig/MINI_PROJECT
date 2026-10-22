import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, CheckCircle2, XCircle, Truck, HeartPulse,
  Bed, Phone, MapPin, Building2, AlertTriangle, User,
  Filter, Search, Send, Clock, X, ChevronDown, Check, Droplets,
  Radio, Compass, ShieldCheck, Heart, Sparkles, AlertOctagon,
  Users, BarChart3, Navigation, ExternalLink, ArrowRight, Layers
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
  clearAllEmergencyRequests,
  type EmergencyRequest,
} from '../services/requestService'
import {
  getAllDamageReports,
  verifyDamageReport,
  getCrowdsourcedRedZones,
  getAllAdvisories,
  publishAdvisory,
  getWardPreparednessStats,
  getUserDonationSummaries,
  getTotalReliefFunds,
  subscribeToDamageReports,
  subscribeToAdvisories,
  subscribeToDonations,
  clearAllIncidentAndReliefData,
  type CitizenDamageReport,
  type CrowdsourcedRedZone,
  type AuthorityAdvisory,
  type WardPreparednessStat,
  type UserDonationSummary,
} from '../services/incidentAndReliefService'

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

type AuthorityTab = 'requests' | 'water_damage' | 'red_zones' | 'ward_preparedness' | 'relief_donations'

export default function AuthorityRequestTriage() {
  const { user, currentRole } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<AuthorityTab>('requests')

  // Emergency Requests state
  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [zoneFilter, setZoneFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Water & Damage Reports state
  const [damageReports, setDamageReports] = useState<CitizenDamageReport[]>([])
  const [reportZoneFilter, setReportZoneFilter] = useState('All')

  // Crowdsourced Red Zones
  const [redZones, setRedZones] = useState<CrowdsourcedRedZone[]>([])

  // Advisories state
  const [advisories, setAdvisories] = useState<AuthorityAdvisory[]>([])
  const [advisoryModalOpen, setAdvisoryModalOpen] = useState(false)
  const [advTitle, setAdvTitle] = useState('')
  const [advZone, setAdvZone] = useState('Mahadevapura')
  const [advSeverity, setAdvSeverity] = useState<'CRITICAL' | 'HIGH' | 'MODERATE'>('CRITICAL')
  const [advMessage, setAdvMessage] = useState('')
  const [advWaterDepth, setAdvWaterDepth] = useState('3.5 ft')
  const [advSaferRoute, setAdvSaferRoute] = useState('')
  const [advTargetReportIds, setAdvTargetReportIds] = useState<string[]>([])

  // Ward Preparedness
  const [wardStats, setWardStats] = useState<WardPreparednessStat[]>([])

  // Donations Audit
  const [donationSummaries, setDonationSummaries] = useState<UserDonationSummary[]>([])
  const [reliefTotals, setReliefTotals] = useState({ totalAmount: 0, totalDonors: 0, totalTransactions: 0 })
  const [donorSearch, setDonorSearch] = useState('')

  // Approve Action Modal
  const [approveModalItem, setApproveModalItem] = useState<EmergencyRequest | null>(null)
  const [allocatedHospital, setAllocatedHospital] = useState(HOSPITAL_OPTIONS[0])
  const [bedNumber, setBedNumber] = useState('ICU Bay #04 (Floor 2, Critical Care Wing)')
  const [dispatchVehicle, setDispatchVehicle] = useState('108 ALS Ambulance (KA-04-E-8421)')
  const [driverName, setDriverName] = useState('Manjunath R. (Ambulance Lead Pilot)')
  const [driverPhone, setDriverPhone] = useState('+91 98451 91108')
  const [dispatchEta, setDispatchEta] = useState('14 mins (Arriving Soon)')
  const [approvalNotes, setApprovalNotes] = useState('')

  // Deny Action Modal
  const [denyModalItem, setDenyModalItem] = useState<EmergencyRequest | null>(null)
  const [denialNotes, setDenialNotes] = useState('')
  const [redirectShelter, setRedirectShelter] = useState('BBMP Ward 04 Community Relief Center, Kodigehalli (Ph: 080-22660000)')

  const authorityName = user?.user_metadata?.full_name || 'BBMP Incident Commander'
  const authorityRole = user?.user_metadata?.role || 'Disaster Relief Lead'

  // Data Loading & Subscriptions
  const refreshAll = () => {
    setRequests(getAllRequests())
    setDamageReports(getAllDamageReports())
    setRedZones(getCrowdsourcedRedZones())
    setAdvisories(getAllAdvisories())
    setWardStats(getWardPreparednessStats())
    setDonationSummaries(getUserDonationSummaries())
    setReliefTotals(getTotalReliefFunds())
  }

  useEffect(() => {
    refreshAll()
    const unsubReq = subscribeToRequests(refreshAll)
    const unsubRep = subscribeToDamageReports(refreshAll)
    const unsubAdv = subscribeToAdvisories(refreshAll)
    const unsubDon = subscribeToDonations(refreshAll)

    return () => {
      unsubReq()
      unsubRep()
      unsubAdv()
      unsubDon()
    }
  }, [])

  // Emergency Requests Filtering
  const filteredRequests = requests.filter(req => {
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

  // Damage Reports Filtering
  const filteredDamageReports = damageReports.filter(rep => {
    return reportZoneFilter === 'All' || rep.zone.toLowerCase() === reportZoneFilter.toLowerCase()
  })

  // User Donations Filtering
  const filteredDonors = donationSummaries.filter(d => {
    const q = donorSearch.toLowerCase()
    return d.donorEmail.toLowerCase().includes(q) || d.donorName.toLowerCase().includes(q)
  })

  // Counters
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length
  const pendingReportsCount = damageReports.filter(r => r.status === 'PENDING_REVIEW').length
  const redZonesCount = redZones.length

  // Handlers for Emergency Requests
  const handleOpenApprove = (req: EmergencyRequest) => {
    playClickSound()
    setApproveModalItem(req)
    setAllocatedHospital(HOSPITAL_OPTIONS[0])
    const isWater = req.resourceType.includes('Water')
    const isBoat = req.resourceType.includes('Boat')
    const isICU = req.resourceType.includes('ICU')

    const initialBed = isICU
      ? `ICU Bay #0${Math.floor(1 + Math.random() * 8)} (Floor 2, Critical Care Wing)`
      : isWater
      ? `Depot Delivery Docket #BWSSB-${Math.floor(1000 + Math.random() * 9000)}`
      : `Emergency Ward Bed #${Math.floor(12 + Math.random() * 30)}-A`

    const initialVehicle = isWater
      ? 'BWSSB Potable Water Tanker KA-01-F-3902 (6000L)'
      : isBoat
      ? 'SDRF Inflatable Motorized Rescue Craft #04'
      : `108 ALS Ambulance (KA-04-E-${Math.floor(2000 + Math.random() * 7000)})`

    const initialDriver = isWater
      ? 'Someshwaraiah N. (BWSSB Pilot)'
      : isBoat
      ? 'Sub-Inspector Kumaraswamy (SDRF Flood Squad)'
      : 'Manjunath R. (Ambulance Lead Pilot)'

    const initialPhone = isWater ? '+91 94480 33100' : isBoat ? '+91 94480 11999' : '+91 98451 91108'
    const initialEta = isWater ? '22 mins (En Route)' : isBoat ? '18 mins (Rapid Response)' : '14 mins (Arriving Soon)'

    setBedNumber(initialBed)
    setDispatchVehicle(initialVehicle)
    setDriverName(initialDriver)
    setDriverPhone(initialPhone)
    setDispatchEta(initialEta)
    setApprovalNotes(`Priority authorization granted for ${req.resourceType}. Government notification dispatched to ${req.requesterEmail}.`)
  }

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault()
    if (!approveModalItem) return
    playSuccessSound()

    const updated = approveEmergencyRequest(
      approveModalItem.id,
      authorityName,
      allocatedHospital,
      approvalNotes,
      bedNumber,
      dispatchVehicle,
      driverName,
      driverPhone,
      dispatchEta
    )

    if (updated) {
      toast.success(
        'Request Approved & Dispatched',
        `Allocated ${bedNumber} at ${allocatedHospital}. Tracking updated to ACCEPTED & ARRIVING SOON.`
      )
    }
    setApproveModalItem(null)
  }

  const handleOpenDeny = (req: EmergencyRequest) => {
    playClickSound()
    setDenyModalItem(req)
    setDenialNotes(`High regional demand surge in ${req.zone}. Redirected to nearest municipal shelter with continuous water & first-aid support.`)
  }

  const handleConfirmDenial = (e: React.FormEvent) => {
    e.preventDefault()
    if (!denyModalItem) return
    playAlertSound()

    const updated = denyEmergencyRequest(
      denyModalItem.id,
      authorityName,
      denialNotes,
      redirectShelter
    )

    if (updated) {
      toast.alert(
        'Request Redirected & Notified',
        `Citizen notified with alternative relief shelter at ${redirectShelter}.`
      )
    }
    setDenyModalItem(null)
  }

  // Damage Report Actions
  const handleVerifyReport = (rep: CitizenDamageReport) => {
    playSuccessSound()
    verifyDamageReport(rep.id, `${authorityName} (${authorityRole})`)
    toast.success('Report Verified', `Incident #${rep.id} verified at ${rep.landmark}`)
  }

  const handleOpenAdvisoryModal = (rep?: CitizenDamageReport, cluster?: CrowdsourcedRedZone) => {
    playClickSound()
    if (cluster) {
      setAdvTitle(`OFFICIAL FLOOD RED ZONE: ${cluster.hotspotName}`)
      setAdvZone(cluster.zone)
      setAdvSeverity('CRITICAL')
      setAdvWaterDepth(`${cluster.avgWaterDepth} ft`)
      setAdvMessage(`Multiple residents report severe inundation averaging ${cluster.avgWaterDepth} ft. Road impassable. Traffic diversion active.`)
      setAdvSaferRoute(cluster.saferAlternativeRoute.routeName)
      setAdvTargetReportIds(cluster.citizenReports.map(r => r.id))
    } else if (rep) {
      setAdvTitle(`FLOOD ALERT: ${rep.landmark} Submerged`)
      setAdvZone(rep.zone)
      setAdvSeverity(rep.severity)
      setAdvWaterDepth(`${rep.waterDepthFeet} ft`)
      setAdvMessage(`Standing water level reaches ${rep.waterDepthFeet} ft due to drainage backflow. Submerged vehicles reported.`)
      setAdvSaferRoute(`Elevated Ring Road corridor bypassing ${rep.landmark}`)
      setAdvTargetReportIds([rep.id])
    } else {
      setAdvTitle('EMERGENCY FLOOD DIVERSION ADVISORY')
      setAdvZone('Mahadevapura')
      setAdvSeverity('CRITICAL')
      setAdvWaterDepth('3.5 ft')
      setAdvMessage('Severe waterlogging detected. Low-lying service roads are closed.')
      setAdvSaferRoute('HAL Old Airport Road elevated flyover')
      setAdvTargetReportIds([])
    }
    setAdvisoryModalOpen(true)
  }

  const handlePublishAdvisory = (e: React.FormEvent) => {
    e.preventDefault()
    playAlertSound()
    publishAdvisory(
      advTitle,
      advZone,
      advSeverity,
      advMessage,
      advWaterDepth,
      advSaferRoute,
      `${authorityName} (${authorityRole})`,
      advTargetReportIds
    )
    toast.alert('Official Advisory Broadcasted', `Relayed to Bengaluru citizens, Traffic Police & BBMP Control`)
    setAdvisoryModalOpen(false)
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0F1713 0%, #080D0A 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 20,
        padding: '24px',
        color: '#FFFFFF',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        marginBottom: 28,
      }}
    >
      {/* ─── COMMAND TOP HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#F87171',
                fontSize: 11.5,
                fontWeight: 900,
                letterSpacing: 0.5,
              }}
            >
              <ShieldAlert size={15} />
              BBMP • KSNDMC • DISASTER OPERATIONS HUB
            </span>
            <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
              Commander: <b>{authorityName}</b> ({authorityRole})
            </span>
          </div>

          <h2 style={{ margin: 0, fontSize: 23, fontWeight: 900, color: '#FFFFFF' }}>
            Bengaluru Authority Crisis & Relief Cockpit
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tx-muted)' }}>
            Inspect distress requests, citizen water depths, crowdsourced red zones, ward preparedness, and relief donations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              playClickSound()
              clearAllEmergencyRequests()
              clearAllIncidentAndReliefData()
              toast.success('All Records Reset', 'All relief fund, dispatch details, and reports cleared to null & empty.')
              refreshAll()
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🧹 Clear All Records (Reset to Empty)
          </button>

          {/* Quick Action: Publish Advisory */}
          <button
            onClick={() => handleOpenAdvisoryModal()}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            }}
          >
            <Radio size={16} /> Broadcast Official Advisory
          </button>
        </div>
      </div>

      {/* ─── 5-TAB COMMAND NAVIGATION ─── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '6px',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: 22,
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => {
            playClickSound()
            setActiveTab('requests')
          }}
          style={{
            flex: 1,
            minWidth: 160,
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'requests' ? '#10B981' : 'transparent',
            color: activeTab === 'requests' ? '#000000' : '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <Bed size={16} />
          Bed & Supply Triage
          {pendingRequestsCount > 0 && (
            <span style={{ padding: '2px 6px', borderRadius: 10, background: activeTab === 'requests' ? '#000' : '#EF4444', color: '#fff', fontSize: 10 }}>
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            playClickSound()
            setActiveTab('water_damage')
          }}
          style={{
            flex: 1,
            minWidth: 170,
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'water_damage' ? '#0284C7' : 'transparent',
            color: activeTab === 'water_damage' ? '#FFFFFF' : '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <Droplets size={16} />
          Citizen Water & Damage
          {pendingReportsCount > 0 && (
            <span style={{ padding: '2px 6px', borderRadius: 10, background: '#F59E0B', color: '#000', fontSize: 10 }}>
              {pendingReportsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            playClickSound()
            setActiveTab('red_zones')
          }}
          style={{
            flex: 1,
            minWidth: 180,
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'red_zones' ? '#DC2626' : 'transparent',
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <AlertOctagon size={16} />
          Red Zones & Safer Routes
          {redZonesCount > 0 && (
            <span style={{ padding: '2px 6px', borderRadius: 10, background: '#FEF08A', color: '#854D0E', fontSize: 10 }}>
              {redZonesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            playClickSound()
            setActiveTab('ward_preparedness')
          }}
          style={{
            flex: 1,
            minWidth: 170,
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'ward_preparedness' ? '#8B5CF6' : 'transparent',
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <BarChart3 size={16} />
          Ward Preparedness %
        </button>

        <button
          onClick={() => {
            playClickSound()
            setActiveTab('relief_donations')
          }}
          style={{
            flex: 1,
            minWidth: 170,
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'relief_donations' ? '#EC4899' : 'transparent',
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <Heart size={16} />
          Relief Fund Audit (₹)
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: EMERGENCY BED & SUPPLY REQUESTS
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Filter Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                placeholder="Search citizen, ID, street..."
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

            <div>
              <select
                value={zoneFilter}
                onChange={e => setZoneFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              >
                {BENGALURU_ZONES.map(z => (
                  <option key={z} value={z} style={{ background: '#111827', color: '#fff' }}>
                    Zone: {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              >
                <option value="All" style={{ background: '#111827' }}>Status: All</option>
                <option value="PENDING" style={{ background: '#111827' }}>Status: Pending Triage</option>
                <option value="APPROVED" style={{ background: '#111827' }}>Status: Approved / Arriving Soon</option>
                <option value="DISPATCHED" style={{ background: '#111827' }}>Status: Dispatched</option>
                <option value="DENIED" style={{ background: '#111827' }}>Status: Denied / Redirected</option>
              </select>
            </div>
          </div>

          {/* Request Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredRequests.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--tx-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                No requests found matching current filter criteria.
              </div>
            ) : (
              filteredRequests.map(req => {
                const isPending = req.status === 'PENDING'
                const isApproved = req.status === 'APPROVED' || req.status === 'DISPATCHED'
                const isDenied = req.status === 'DENIED'

                return (
                  <div
                    key={req.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${
                        isPending
                          ? 'rgba(245, 158, 11, 0.35)'
                          : isApproved
                          ? 'rgba(16, 185, 129, 0.35)'
                          : 'rgba(239, 68, 68, 0.35)'
                      }`,
                      borderRadius: 14,
                      padding: '16px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 14,
                    }}
                  >
                    <div style={{ flex: '1 1 340px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF' }}>{req.resourceType}</span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 800,
                            background:
                              isPending ? 'rgba(245, 158, 11, 0.2)' : isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: isPending ? '#F59E0B' : isApproved ? '#34D399' : '#EF4444',
                          }}
                        >
                          {req.status === 'APPROVED' ? 'ACCEPTED & ARRIVING SOON' : req.status}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>ID: #{req.id}</span>
                      </div>

                      <div style={{ fontSize: 12.5, color: '#E5E7EB', marginBottom: 6 }}>
                        <b>{req.requesterName}</b> ({req.requesterPhone}) • <span style={{ color: '#38BDF8' }}>{req.requesterEmail}</span>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} color="#34D399" />
                        {req.address} ({req.zone}) • {req.quantity} units requested
                      </div>

                      {req.patientNotes && (
                        <div style={{ fontSize: 11.5, color: '#FCD34D', marginTop: 4, background: 'rgba(245, 158, 11, 0.08)', padding: '4px 8px', borderRadius: 6 }}>
                          Note: {req.patientNotes}
                        </div>
                      )}

                      {/* Dispatch info if approved */}
                      {isApproved && (
                        <div style={{ marginTop: 8, fontSize: 11.5, color: '#6EE7B7', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>🛏️ {req.hospitalBedNumber}</span>
                          <span>🚑 {req.dispatchVehicle}</span>
                          <span>⏱️ {req.dispatchEta}</span>
                        </div>
                      )}

                      {/* Shelter redirection if denied */}
                      {isDenied && req.redirectShelter && (
                        <div style={{ marginTop: 8, fontSize: 11.5, color: '#FCA5A5' }}>
                          🏛️ Redirected to: <b>{req.redirectShelter}</b>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleOpenApprove(req)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              background: '#10B981',
                              border: 'none',
                              color: '#000000',
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Check size={14} /> Approve & Dispatch
                          </button>
                          <button
                            onClick={() => handleOpenDeny(req)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid #EF4444',
                              color: '#EF4444',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <X size={14} /> Deny & Redirect
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: 11.5, color: 'var(--tx-muted)', textAlign: 'right' }}>
                          Triage Completed by<br />
                          <b>{req.reviewedBy || 'Authority'}</b>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: CITIZEN WATER & DAMAGE REPORTS
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'water_damage' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                Citizen Flood Depth & Damage Registry
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--tx-muted)' }}>
                Inspect water level in feet reported by citizens with direct verification and advisory publishing.
              </p>
            </div>

            <div>
              <select
                value={reportZoneFilter}
                onChange={e => setReportZoneFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: 12,
                }}
              >
                {BENGALURU_ZONES.map(z => (
                  <option key={z} value={z} style={{ background: '#111827' }}>Zone: {z}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredDamageReports.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--tx-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                <Droplets size={32} color="rgba(56, 189, 248, 0.4)" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>No Citizen Waterlogging Reports</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Telemetry records are empty and ready to receive fresh citizen flood depth & damage submissions.</div>
              </div>
            ) : (
              filteredDamageReports.map(rep => {
              const isCrit = rep.waterDepthFeet >= 3.5
              const isHigh = rep.waterDepthFeet >= 2.0 && rep.waterDepthFeet < 3.5

              return (
                <div
                  key={rep.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '16px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: '1 1 360px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 900,
                          background: isCrit ? 'rgba(239, 68, 68, 0.25)' : isHigh ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                          color: isCrit ? '#EF4444' : isHigh ? '#F59E0B' : '#38BDF8',
                          border: `1px solid ${isCrit ? '#EF4444' : isHigh ? '#F59E0B' : '#38BDF8'}`,
                        }}
                      >
                        🌊 {rep.waterDepthFeet} FEET STANDING WATER ({Math.round(rep.waterDepthFeet * 30.48)} cm)
                      </span>

                      <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                        {rep.damageType}
                      </span>

                      <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>#{rep.id}</span>
                    </div>

                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                      {rep.landmark} <span style={{ color: '#10B981', fontWeight: 600 }}>({rep.zone})</span>
                    </div>

                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginBottom: 8, lineHeight: 1.5 }}>
                      "{rep.damageDescription}"
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--tx-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>Reported by: <b>{rep.reporterName}</b></span>
                      <span>Email: <b style={{ color: '#38BDF8' }}>{rep.reporterEmail}</b></span>
                      <span>Phone: <b>{rep.reporterPhone}</b></span>
                      <span>Status: <b style={{ color: rep.status === 'ADVISORY_ISSUED' ? '#EF4444' : rep.status === 'VERIFIED' ? '#34D399' : '#F59E0B' }}>{rep.status}</b></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {rep.status === 'PENDING_REVIEW' && (
                      <button
                        onClick={() => handleVerifyReport(rep)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid #10B981',
                          color: '#34D399',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <ShieldCheck size={14} /> Verify Depth
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenAdvisoryModal(rep)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Radio size={14} /> Issue Public Advisory
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: CROWDSOURCED RED ZONES & SAFER ALTERNATIVE ROUTES
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'red_zones' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
              🔴 Automated Crowdsourced Red Zones & Safer Bypass Routes
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--tx-muted)' }}>
              When multiple residents report waterlogging in an area, SafeGround automatically marks it as a <b>Red Zone</b> and calculates an elevated alternative corridor.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {redZones.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: 16,
                  padding: '40px 24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>🛡️</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
                  No Active Crowdsourced Red Zones
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--tx-muted)', maxWidth: 460, margin: '0 auto' }}>
                  All zones are currently clear. When multiple residents report waterlogging or flooding in an area, SafeGround automatically marks it as a Red Zone and computes safer bypass routes.
                </div>
              </div>
            ) : (
              redZones.map(cluster => {
                const safe = cluster.saferAlternativeRoute

              return (
                <div
                  key={cluster.id}
                  style={{
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 16,
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 900,
                          background: '#EF4444',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <AlertOctagon size={14} />
                        AUTO RED ZONE • {cluster.reportCount} CITIZEN FLOOD REPORTS
                      </span>

                      <span style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 700 }}>
                        Avg Depth: <b>{cluster.avgWaterDepth} Feet</b>
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenAdvisoryModal(undefined, cluster)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: '#EF4444',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Radio size={14} /> Broadcast Warning & Divert
                    </button>
                  </div>

                  <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>
                    {cluster.hotspotName} ({cluster.zone})
                  </h3>

                  <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#FCA5A5' }}>
                    ⛔ <b>Blocked Low-Lying Corridor:</b> {cluster.blockedCorridors}
                  </p>

                  {/* Safer Alternative Route Card */}
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 12,
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Navigation size={18} color="#34D399" />
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#34D399', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        OFFICIAL SAFER ALTERNATIVE ROUTE (ELEVATED BYPASS)
                      </span>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
                      {safe.routeName}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 12, marginBottom: 8 }}>
                      <div style={{ color: '#A7F3D0' }}>
                        🏔️ <b>Terrain Elevation:</b> {safe.elevation}
                      </div>
                      <div style={{ color: '#A7F3D0' }}>
                        📏 <b>Route Delta:</b> {safe.distanceDiff}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                      <b>Traffic Guidance:</b> {safe.instructions}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: WARD PREPAREDNESS MATRIX (PERCENTAGES & CHECKBOXES)
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'ward_preparedness' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
              📊 Ward-by-Ward Community Preparedness Matrix
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--tx-muted)' }}>
              Calculated dynamically by taking the percentage prepared checkboxes of each resident in each BBMP zone.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {wardStats.map(ward => {
              const pct = ward.preparednessPercentage
              const isHigh = pct >= 70
              const isMid = pct >= 50 && pct < 70
              const barColor = isHigh ? '#10B981' : isMid ? '#F59E0B' : '#EF4444'

              return (
                <div
                  key={ward.zone}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>{ward.zone} Zone</h4>
                      <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{ward.residentsCount.toLocaleString()} residents surveyed</span>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 800,
                        background:
                          ward.vulnerabilityStatus === 'READY'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : ward.vulnerabilityStatus === 'MODERATE_RISK'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                        color:
                          ward.vulnerabilityStatus === 'READY'
                            ? '#34D399'
                            : ward.vulnerabilityStatus === 'MODERATE_RISK'
                            ? '#F59E0B'
                            : '#EF4444',
                      }}
                    >
                      {ward.vulnerabilityStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Preparedness Percentage Progress Bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
                      <span style={{ color: 'var(--tx-muted)' }}>Preparedness Score:</span>
                      <span style={{ color: barColor }}>{pct}% Ready</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: barColor,
                          borderRadius: 4,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Top Completed Checkbox Items */}
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', display: 'block', marginBottom: 4 }}>
                      ✅ Top Completed Tasks (from User Checkboxes):
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                      {ward.topCompletedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Critical Gaps */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', display: 'block', marginBottom: 4 }}>
                      ⚠️ Critical Preparedness Gaps:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#FCA5A5' }}>
                      {ward.criticalGaps.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: DISASTER RELIEF FUND AUDIT (USER TOTALS)
          ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'relief_donations' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Summary Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div style={{ background: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.3)', padding: '14px', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Total City Relief Funds</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#F472B6' }}>
                ₹{reliefTotals.totalAmount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 11, color: '#FBCFE8', marginTop: 2 }}>Max contribution limit: ₹10 Lakh per transaction</div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Contributing Donors</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#34D399' }}>
                {reliefTotals.totalDonors}
              </div>
              <div style={{ fontSize: 11, color: '#A7F3D0', marginTop: 2 }}>Citizens & Corporate relief trusts</div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '14px', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Transactions Audited</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#38BDF8' }}>
                {reliefTotals.totalTransactions}
              </div>
              <div style={{ fontSize: 11, color: '#BAE6FD', marginTop: 2 }}>All with 80G tax tokens</div>
            </div>
          </div>

          {/* Search by User Email or Name */}
          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Search donor by personal/google email or name..."
              value={donorSearch}
              onChange={e => setDonorSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* User Donation Totals Table */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px 14px', color: 'var(--tx-muted)' }}>Donor Name & Email</th>
                  <th style={{ padding: '12px 14px', color: 'var(--tx-muted)' }}>Total Amount Contributed</th>
                  <th style={{ padding: '12px 14px', color: 'var(--tx-muted)' }}>Donations Count</th>
                  <th style={{ padding: '12px 14px', color: 'var(--tx-muted)' }}>Last Contribution</th>
                  <th style={{ padding: '12px 14px', color: 'var(--tx-muted)' }}>Allocated Causes</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--tx-muted)' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>💝</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                        No Relief Donations Recorded Yet
                      </div>
                      <div style={{ fontSize: 12 }}>
                        The disaster relief fund is currently at ₹0. Donations submitted by citizens will appear here in real time with individual donor totals and cause allocations.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDonors.map(donor => (
                    <tr key={donor.donorEmail} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#FFFFFF' }}>{donor.donorName}</div>
                        <div style={{ fontSize: 11, color: '#F472B6' }}>{donor.donorEmail}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#34D399' }}>
                          ₹{donor.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#E5E7EB' }}>
                        {donor.donationCount} {donor.donationCount === 1 ? 'gift' : 'gifts'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--tx-muted)', fontSize: 11.5 }}>
                        {new Date(donor.lastDonationDate).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.85)', fontSize: 11.5 }}>
                        {donor.causes.join(', ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: APPROVE EMERGENCY BED & DISPATCH
          ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {approveModalItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(5, 10, 8, 0.82)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              style={{
                width: '100%',
                maxWidth: 580,
                background: '#121F19',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                borderRadius: 18,
                padding: 24,
                color: '#FFFFFF',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                  Approve Request #{approveModalItem.id}
                </h3>
                <button
                  onClick={() => setApproveModalItem(null)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmApproval} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Allocated Hospital / Relief Facility
                  </label>
                  <select
                    value={allocatedHospital}
                    onChange={e => setAllocatedHospital(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 12.5,
                    }}
                  >
                    {HOSPITAL_OPTIONS.map(h => (
                      <option key={h} value={h} style={{ background: '#121F19' }}>{h}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                      Bed Bay / Allocation Docket
                    </label>
                    <input
                      type="text"
                      required
                      value={bedNumber}
                      onChange={e => setBedNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                      Dispatch Vehicle Registration
                    </label>
                    <input
                      type="text"
                      required
                      value={dispatchVehicle}
                      onChange={e => setDispatchVehicle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                      Driver / Pilot Name
                    </label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={e => setDriverName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                      Pilot Phone (Click-to-Call)
                    </label>
                    <input
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={e => setDriverPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Live Arrival Countdown (ETA)
                  </label>
                  <input
                    type="text"
                    required
                    value={dispatchEta}
                    onChange={e => setDispatchEta(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setApproveModalItem(null)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      background: '#10B981',
                      border: 'none',
                      color: '#000000',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm & Send Notification to {approveModalItem.requesterEmail}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: DENY & REDIRECT REQUEST
          ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {denyModalItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(5, 10, 8, 0.82)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              style={{
                width: '100%',
                maxWidth: 520,
                background: '#1C1212',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 18,
                padding: 24,
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                  Deny Request #{denyModalItem.id} & Redirect
                </h3>
                <button
                  onClick={() => setDenyModalItem(null)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmDenial} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Designated Relief Shelter (Redirection)
                  </label>
                  <input
                    type="text"
                    required
                    value={redirectShelter}
                    onChange={e => setRedirectShelter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Municipal Rationale
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={denialNotes}
                    onChange={e => setDenialNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setDenyModalItem(null)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      background: '#EF4444',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm Redirection
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: PUBLISH OFFICIAL ADVISORY
          ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {advisoryModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(5, 10, 8, 0.82)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              style={{
                width: '100%',
                maxWidth: 560,
                background: '#181215',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 18,
                padding: 24,
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={20} color="#EF4444" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                    Publish Official Public Advisory
                  </h3>
                </div>
                <button
                  onClick={() => setAdvisoryModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePublishAdvisory} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Advisory Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={advTitle}
                    onChange={e => setAdvTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                      Affected Zone
                    </label>
                    <select
                      value={advZone}
                      onChange={e => setAdvZone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: 12,
                      }}
                    >
                      {BENGALURU_ZONES.filter(z => z !== 'All').map(z => (
                        <option key={z} value={z} style={{ background: '#121F19' }}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                      Reported Water Depth
                    </label>
                    <input
                      type="text"
                      required
                      value={advWaterDepth}
                      onChange={e => setAdvWaterDepth(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Safer Alternative Bypass Route (Instructions to Public)
                  </label>
                  <input
                    type="text"
                    required
                    value={advSaferRoute}
                    onChange={e => setAdvSaferRoute(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--tx-muted)', marginBottom: 4 }}>
                    Advisory Body & Public Safety Instructions
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={advMessage}
                    onChange={e => setAdvMessage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setAdvisoryModalOpen(false)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      background: '#EF4444',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Broadcast to All Residents
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
