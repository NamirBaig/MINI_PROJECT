import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, ThermometerSun, Wind, AlertTriangle, TrendingUp,
  ArrowRight, Activity, ShieldCheck, MapPin, CheckCircle2,
  ExternalLink, Waves, Zap, ChevronDown, ChevronUp, BellRing, Radio,
  PhoneCall, AlertOctagon, Share2, RefreshCw, X, Send, Compass,
  Sparkles, LifeBuoy, Truck, Building2, CheckSquare, ShieldAlert, Heart, HeartPulse, Navigation
} from 'lucide-react'
import type { WeatherData } from '../hooks/useWeather'
import { BENGALURU_ZONES, BENGALURU_CLIMATE, FLOOD_PRONE_SPOTS } from '../data/bengaluru'
import { useAuth, type UserRole, ROLE_PRESETS } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound, playAlertSound, playSirenSound } from '../utils/audioFeedback'
import AnimatedWeatherBadge, { AnimatedWeatherIcon } from '../components/AnimatedWeatherBadge'
import EmergencyRequestModal from '../components/EmergencyRequestModal'
import CitizenRequestTracker from '../components/CitizenRequestTracker'
import AuthorityRequestTriage from '../components/AuthorityRequestTriage'
import DisasterDonationModal from '../components/DisasterDonationModal'
import {
  submitDamageReport,
  getAllAdvisories,
  subscribeToAdvisories,
  publishAdvisory,
  type AuthorityAdvisory
} from '../services/incidentAndReliefService'

interface DashboardProps {
  weatherData: WeatherData
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  LOW: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
  MODERATE: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
  HIGH: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
  CRITICAL: { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)', border: 'rgba(220, 38, 38, 0.4)' },
}

// Role-specific live alerts
const ROLE_ALERTS: Record<UserRole, Array<{ id: string; title: string; sev: string; zone: string; time: string; detail: string; action: string }>> = {
  citizen: [
    {
      id: 'c1',
      title: 'Waterlogging Advisory for Silk Board & ORR',
      sev: 'HIGH',
      zone: 'Outer Ring Road (Silk Board to Marathahalli)',
      time: '12 mins ago',
      detail: 'Water has accumulated up to 20cm along service roads near Silk Board and EcoSpace due to afternoon rain. Traffic is moving slowly.',
      action: 'Use the main elevated flyovers instead of low-lying service roads.',
    },
    {
      id: 'c2',
      title: 'Varthur & Bellandur Lake Outflow Safe',
      sev: 'MODERATE',
      zone: 'Whitefield East & Bellandur',
      time: '45 mins ago',
      detail: 'Lake flood gates are open to release surplus rainwater. Water levels are safe and contained within designated canals.',
      action: 'No evacuation needed. Normal precautions apply for low-lying areas.',
    },
    {
      id: 'c3',
      title: 'Hydration Checkpoints Active',
      sev: 'LOW',
      zone: 'Majestic & Central CBD Bus Terminals',
      time: '2 hours ago',
      detail: 'Warm afternoon temperatures around major transport hubs in the city center.',
      action: 'Free drinking water kiosks are open at BMTC and KSRTC bus stands.',
    },
  ],
  authority: [
    {
      id: 'a1',
      title: 'Amanikere Lake Inflow Surge: 8.4 m³/s • Sluice Pre-Release Authorized',
      sev: 'HIGH',
      zone: 'Hebbal-Yelahanka Hydrological Basin',
      time: '5 mins ago',
      detail: 'AWS telemetry station 204 indicates water level reaching 94.2% capacity. Sluice gate pre-release advisory active to prevent residential embankment flooding.',
      action: 'Authorize 20% discharge through secondary stormwater overflow canal.',
    },
    {
      id: 'a2',
      title: 'NDRF 10th Battalion & 18 Boats Pre-Positioned at Yelahanka & EcoSpace',
      sev: 'HIGH',
      zone: 'Kendriya Vihar & Outer Ring Road',
      time: '15 mins ago',
      detail: '6 motorized inflatable rescue craft and 24 personnel deployed at Yelahanka Air Force base perimeter for rapid flood response.',
      action: 'Keep quick response units on standby for residential basements.',
    },
    {
      id: 'a3',
      title: 'Citywide Hospital ICU Surge Quota & 46 Dewatering Pumps Active',
      sev: 'MODERATE',
      zone: 'Greater Bengaluru Metropolitan Area',
      time: '35 mins ago',
      detail: '24 emergency ICU beds reserved at Victoria Hospital, 12 BBMP relief shelters provisioned with cots and rations.',
      action: 'Maintain automated telemetry logging at 60-second intervals.',
    },
  ],
  ksndmc: [
    {
      id: 'k1',
      title: 'Amanikere Lake Inflow Rate: 8.4 m³/s Surge',
      sev: 'HIGH',
      zone: 'Hebbal-Yelahanka Hydrological Basin',
      time: '8 mins ago',
      detail: 'AWS telemetry station 204 indicates water level reaching 94.2% capacity. Sluice gate pre-release advisory recommended to avoid embankment strain.',
      action: 'Authorize 20% discharge through secondary stormwater overflow canal.',
    },
    {
      id: 'k2',
      title: 'AWS Station 412 (Mahadevapura) Rain Rate Spike',
      sev: 'MODERATE',
      zone: 'K&C Valley Stormwater Corridor',
      time: '30 mins ago',
      detail: 'Localized cloud density observed on Doppler radar. Rainfall rate recorded at 34 mm/h in 15-minute burst.',
      action: 'Maintain automated telemetry logging at 60-second intervals.',
    },
    {
      id: 'k3',
      title: 'Doppler Radar Velocity Azimuth Nominal',
      sev: 'LOW',
      zone: 'BIAL 128 RPM Terminal Radar Grid',
      time: '1 hour ago',
      detail: 'Atmospheric moisture band drifting North-East toward Chikkaballapur. Zero mesoscale cloudburst signatures within 50km radius.',
      action: 'State meteorological bulletin status remains code AMBER.',
    },
  ],
  bbmp: [
    {
      id: 'b1',
      title: 'NDRF 10th Battalion Pre-Positioned at Yelahanka',
      sev: 'HIGH',
      zone: 'Kendriya Vihar & Chowdeshwari Nagar',
      time: '15 mins ago',
      detail: '6 motorized inflatable rescue craft and 24 personnel deployed at Yelahanka Air Force base perimeter for rapid flood response.',
      action: 'Keep quick response units on standby for residential basements.',
    },
    {
      id: 'b2',
      title: '500 GPM Dewatering Operations at Chowdeshwari Underpass',
      sev: 'MODERATE',
      zone: 'North Corridor Traffic Line',
      time: '40 mins ago',
      detail: 'Two heavy-duty diesel dewatering pumps actively clearing curb runoff. Roadway clear for single-lane light vehicular traffic.',
      action: 'Maintain diesel replenishment tankers on site.',
    },
    {
      id: 'b3',
      title: 'BBMP Ward 174 Relief Shelter Provisioned',
      sev: 'LOW',
      zone: 'HSR Layout Sector 3 Community Centre',
      time: '2 hours ago',
      detail: '150 emergency sleeping cots, drinking water sachets, and dry food rations fully stocked by BBMP Disaster Relief wing.',
      action: 'Volunteers and medical staff briefed for overnight shift.',
    },
  ],
  hospital: [
    {
      id: 'h1',
      title: 'Victoria Hospital Emergency Trauma Surge Capacity',
      sev: 'HIGH',
      zone: 'Central City Medical Belt',
      time: '10 mins ago',
      detail: '24 emergency ICU beds and 40 oxygen-supported cots reserved for flood trauma admissions from North and East zones.',
      action: 'Maintain triage ambulance bay clear for 108 emergency transfers.',
    },
    {
      id: 'h2',
      title: 'Yelahanka General Hospital Flood Quota Active',
      sev: 'CRITICAL',
      zone: 'Yelahanka Satellite Town',
      time: '25 mins ago',
      detail: 'Kendriya Vihar distress requests allocated. Secondary generator backups tested and portable dialysis units positioned.',
      action: 'Confirm bed reception with BBMP Disaster Cell on 1533.',
    },
    {
      id: 'h3',
      title: 'Manipal Whitefield Casualty Inflow Nominal',
      sev: 'LOW',
      zone: 'Mahadevapura Tech Corridor',
      time: '1 hour ago',
      detail: 'Adequate antivenom, oral rehydration salts, and emergency sutures cataloged for monsoon inundation cases.',
      action: 'Standard Level-2 flood readiness protocol active.',
    },
  ],
}

export default function Dashboard({ weatherData }: DashboardProps) {
  const { user, currentRole } = useAuth()
  const isAuthority = currentRole !== 'citizen'
  const toast = useToast()

  const [expandedAlert, setExpandedAlert] = useState<string | null>('c1')
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'all' | 'high' | 'moderate'>('all')
  const [climateTimeline, setClimateTimeline] = useState<'10yr' | '5yr' | 'recent'>('10yr')
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([])

  // Citizen Modals
  const [sosModalOpen, setSosModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [underpassDrawerOpen, setUnderpassDrawerOpen] = useState(false)
  const [gobagModalOpen, setGobagModalOpen] = useState(false)
  const [reportStreet, setReportStreet] = useState('')
  const [reportDepth, setReportDepth] = useState('Ankle Deep (10-20cm)')
  const [gobagItems, setGobagItems] = useState([
    { name: '15 Liters Drinking Water (3-Day Supply)', done: true },
    { name: 'Waterproof Emergency LED Torch & Extra Batteries', done: true },
    { name: '20,000 mAh Charged Power Bank & Cables', done: true },
    { name: 'First Aid Kit & 7-Day Chronic Prescriptions', done: true },
    { name: 'Waterproof Pouch for Aadhaar, Insurance & Property Papers', done: false },
    { name: 'Ready-to-eat High-Calorie Energy Bars & Biscuits', done: true },
  ])

  // KSNDMC Modals
  const [bulletinModalOpen, setBulletinModalOpen] = useState(false)
  const [sluiceModalOpen, setSluiceModalOpen] = useState(false)
  const [selectedBasin, setSelectedBasin] = useState('Hebbal-Yelahanka Valley')
  const [bulletinSeverity, setBulletinSeverity] = useState('RED (FLASH FLOOD WARNING)')

  // BBMP Modals
  const [boatModalOpen, setBoatModalOpen] = useState(false)
  const [pumpModalOpen, setPumpModalOpen] = useState(false)
  const [shelterModalOpen, setShelterModalOpen] = useState(false)
  const [trafficModalOpen, setTrafficModalOpen] = useState(false)
  const [boatTarget, setBoatTarget] = useState('Kendriya Vihar, Yelahanka')
  const [pumpTarget, setPumpTarget] = useState('Silk Board Junction Underpass')
  const [shelterTarget, setShelterTarget] = useState('BBMP Ward 4 Community Hall, Yelahanka')
  const [trafficTarget, setTrafficTarget] = useState('Silk Board Service Road (Diverted to Elevated Flyover)')
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
  const [donationModalOpen, setDonationModalOpen] = useState(false)
  const [liveAdvisories, setLiveAdvisories] = useState<AuthorityAdvisory[]>([])

  useEffect(() => {
    setLiveAdvisories(getAllAdvisories())
    const unsubscribe = subscribeToAdvisories(() => {
      setLiveAdvisories(getAllAdvisories())
    })
    return () => unsubscribe()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const citizenName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || (isAuthority ? 'Disaster Commander' : 'Resident')
  const userRole = user?.user_metadata?.role || (isAuthority ? 'Disaster Operations Authority' : 'Bengaluru Resident')

  // Computed risk
  const overallRisk = Math.round((weatherData.floodRiskToday * 0.65 + weatherData.heatRiskToday * 0.35))
  const riskLevel = overallRisk >= 70 ? 'CRITICAL' : overallRisk >= 50 ? 'HIGH' : overallRisk >= 35 ? 'MODERATE' : 'LOW'
  const riskMeta = SEVERITY_CONFIG[riskLevel]

  // Map live government advisories so they are broadcast to citizens and authorities
  const mappedOfficialAdvisories = liveAdvisories.map((adv) => ({
    id: adv.id,
    title: `${adv.title}`,
    sev: adv.severity,
    zone: `${adv.zone} Zone`,
    time: `${new Date(adv.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Live Broadcast`,
    detail: `${adv.message} • Flood Depth: ${adv.waterDepthReported}. Authorized by: ${adv.authorityName}.`,
    action: `Mandatory Safer Route: ${adv.saferAlternativeRoute}`,
    isOfficialGovt: true,
  }))

  const baseAlerts = isAuthority
    ? [
        {
          id: 'b1',
          title: 'NDRF 10th Battalion Pre-Positioned at Yelahanka',
          sev: 'HIGH',
          zone: 'Kendriya Vihar & Chowdeshwari Nagar',
          time: '15 mins ago',
          detail: '6 motorized inflatable rescue craft and 24 personnel deployed at Yelahanka Air Force base perimeter for rapid flood response.',
          action: 'Keep quick response units on standby for residential basements.',
        },
        {
          id: 'k1',
          title: 'Amanikere Lake Inflow Rate: 8.4 m³/s Surge',
          sev: 'HIGH',
          zone: 'Hebbal-Yelahanka Hydrological Basin',
          time: '8 mins ago',
          detail: 'AWS telemetry station 204 indicates water level reaching 94.2% capacity. Sluice gate pre-release advisory recommended.',
          action: 'Authorize 20% discharge through secondary stormwater overflow canal.',
        },
        {
          id: 'h1',
          title: 'Victoria & Bowring Hospital ICU Bed Surge Capacity',
          sev: 'MODERATE',
          zone: 'Central City Medical Belt',
          time: '25 mins ago',
          detail: '24 emergency ICU beds and 40 oxygen-supported cots reserved for flood trauma admissions from North and East zones.',
          action: 'Health triage desk monitoring live incoming citizen requests.',
        },
      ]
    : ROLE_ALERTS.citizen

  const alerts = isAuthority ? baseAlerts : [...mappedOfficialAdvisories, ...baseAlerts]

  const handleAcknowledgeAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    playSuccessSound()
    setAcknowledgedAlerts(prev => [...prev, id])
    toast.success('Alert Acknowledged', 'Recorded in personal emergency log')
  }

  const handleShareAlert = (title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    playClickSound()
    toast.copy(`[SAFEGROUND ADVISORY] ${title} - Live telemetry for Bengaluru.`)
  }

  // Citizen Actions
  const triggerSosBroadcast = () => {
    playSirenSound()
    setSosModalOpen(true)
  }

  const handleConfirmSos = () => {
    playAlertSound()
    toast.alert('Emergency Beacon Active', 'Dispatched GPS coordinates to BBMP Disaster Control (1533)')
    setSosModalOpen(false)
  }

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    playSuccessSound()
    const depthNumber =
      reportDepth.includes('Chest') ? 5.5 :
      reportDepth.includes('Waist') ? 3.5 :
      reportDepth.includes('Knee') ? 1.8 : 0.8
    try {
      submitDamageReport({
        userId: user?.id || 'citizen-anon',
        reporterName: citizenName,
        reporterEmail: user?.email || 'citizen@safeground.blr',
        reporterPhone: user?.user_metadata?.phone || '+91 98450 12345',
        zone: 'Mahadevapura',
        landmark: reportStreet || 'Outer Ring Road Bellandur Corridor',
        waterDepthFeet: depthNumber,
        damageType: 'Road Submersion',
        damageDescription: `Reported ${reportDepth} water standing along ${reportStreet || 'neighborhood street'}.`,
        severity: depthNumber >= 3.5 ? 'CRITICAL' : 'HIGH',
      })
    } catch {}
    toast.success('Waterlogging Report Logged', `Logged ${reportDepth} (${depthNumber} ft) at ${reportStreet || 'Current Ward'}`)
    setReportModalOpen(false)
    setReportStreet('')
  }

  // KSNDMC Actions
  const handleBroadcastBulletin = (e: React.FormEvent) => {
    e.preventDefault()
    playAlertSound()

    const zoneName = selectedBasin.includes('Yelahanka') ? 'Yelahanka' : selectedBasin.includes('Valley') ? 'Mahadevapura' : 'South'
    const isCritical = bulletinSeverity.includes('RED')
    const safeRoute = selectedBasin.includes('Yelahanka')
      ? 'Major Sandeep Unnikrishnan Road ➔ Vidyaranyapura Main Road ➔ Doddaballapur Expressway (Elevated high-ground bypass)'
      : selectedBasin.includes('Valley')
      ? 'HAL Old Airport Road ➔ Suranjandas Road ➔ Marathahalli Elevated Flyover'
      : 'Hosur Road Elevated Highway (Silk Board Tollway Ramp)'

    const newAdv = publishAdvisory(
      `STATE RED ALERT: Severe Flash Flood Warning for ${selectedBasin}`,
      zoneName,
      isCritical ? 'CRITICAL' : 'HIGH',
      `Immediate emergency broadcast from State Hydro-Meteorological Command. Torrential storm runoff and lake overflow imminent in ${selectedBasin}. Residents in ground basements & low-lying zones must follow designated high-ground corridors.`,
      isCritical ? '4.2 ft (Rapid Flash Inundation)' : '2.8 ft standing water',
      safeRoute,
      `${user?.user_metadata?.full_name || 'Disaster Operations Authority'} (State Hydro-Meteorological Command)`
    )

    toast.alert(`State Red Alert Broadcasted to Public`, `Advisory #${newAdv.id} transmitted to citizens across Bengaluru.`)
    setBulletinModalOpen(false)
  }

  const handleAuthorizeSluice = (e: React.FormEvent) => {
    e.preventDefault()
    playSuccessSound()
    toast.success('Lake Sluice Pre-Release Approved', 'Authorized 25% discharge rate through downstream stormwater buffer')
    setSluiceModalOpen(false)
  }

  // BBMP Actions
  const handleDispatchBoats = (e: React.FormEvent) => {
    e.preventDefault()
    playSirenSound()
    toast.success('NDRF Rescue Boats Dispatched', `4 Motorized rescue boats dispatched to ${boatTarget} (ETA 14 mins)`)
    setBoatModalOpen(false)
  }

  const handleDeployPump = (e: React.FormEvent) => {
    e.preventDefault()
    playSuccessSound()
    toast.success('500 GPM Pump Dispatched', `Heavy de-watering pump unit en route to ${pumpTarget}`)
    setPumpModalOpen(false)
  }

  const handleOpenShelter = (e: React.FormEvent) => {
    e.preventDefault()
    playSuccessSound()
    toast.success('Relief Shelter Activated', `${shelterTarget} opened with 120 cots & emergency rations`)
    setShelterModalOpen(false)
  }

  const handleOrderTrafficBarricade = (e: React.FormEvent) => {
    e.preventDefault()
    playAlertSound()
    toast.alert('Traffic Barricades Deployed', `Sealed ${trafficTarget}. Traffic diverted.`)
    setTrafficModalOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ─── Top Command Cockpit Banner ────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: isAuthority ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isAuthority ? '#F87171' : '#34D399',
              border: `1px solid ${isAuthority ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            }}>
              <ShieldCheck size={14} /> {userRole}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--tx-dim)',
              border: '1px solid var(--border-glass)',
            }}>
              <MapPin size={12} /> Greater Bengaluru (BBMP)
            </span>
          </div>

          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 3.2vw, 34px)', fontWeight: 800, color: 'var(--tx)' }}>
            {greeting}, {citizenName}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--tx-muted)', fontSize: 14 }}>
            {!isAuthority ? 'Resident Preparedness & Neighborhood Flood Intelligence' : 'Unified Bengaluru Disaster Management Authority • Tactical Command & Hydro Grid'}
          </p>
        </div>

        {/* Live sync pill with interactive refresh & Animated Weather */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <AnimatedWeatherBadge
            condition={weatherData.condition}
            temp={weatherData.currentTemp}
            size={18}
            showConditionText={true}
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              playClickSound()
              toast.info('Telemetry Synchronized', `Live sensors: 19 stations reporting across Bengaluru`)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surf)',
              padding: '8px 16px',
              borderRadius: 30,
              border: '1px solid var(--border-glass)',
              color: 'var(--tx)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#34D399',
              boxShadow: '0 0 10px #34D399',
              display: 'inline-block',
            }} />
            <span>KSNDMC & Open-Meteo Live</span>
            <RefreshCw size={13} style={{ opacity: 0.7 }} />
          </motion.button>
        </div>
      </div>

      {/* ─── ROLE-SPECIFIC INTERACTIVE OPERATIONS COCKPIT ──────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--pri-neon)', marginBottom: 8, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          {isAuthority ? 'AUTHORITY OPERATIONS: UNIFIED BENGALURU DISASTER COMMAND' : 'RESIDENT EMERGENCY COCKPIT'}
        </div>

        {/* 1. CITIZEN COCKPIT */}
        {currentRole === 'citizen' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={triggerSosBroadcast}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                <AlertOctagon size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#EF4444' }}>SOS Emergency Beacon</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Transmit flood distress to 1533</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setReportModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0 }}>
                <Waves size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#60A5FA' }}>Report Waterlogging</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Crowdsource localized flood depth</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setUnderpassDrawerOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', flexShrink: 0 }}>
                <Compass size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#34D399' }}>Commuter Underpass Radar</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Live status of Silk Board & Hebbal</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setGobagModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24', flexShrink: 0 }}>
                <CheckSquare size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FBBF24' }}>Family Go-Bag Checklist</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Check emergency kit readiness</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playAlertSound(); setEmergencyModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.18) 0%, rgba(219, 39, 119, 0.06) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.4)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(236, 72, 153, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F472B6', flexShrink: 0 }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#F472B6' }}>Request Beds & Relief</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>ICU/Oxygen beds, water, boats</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setDonationModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.08) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.45)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                <HeartPulse size={20} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: '#34D399' }}>Contribute to Disaster Relief</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Max ₹10 Lakh • 80G Tax Exemption</div>
              </div>
            </motion.button>
          </div>
        )}

        {/* Real-time Citizen Request Status Tracker */}
        {currentRole === 'citizen' && (
          <div style={{ marginTop: 20 }}>
            <CitizenRequestTracker onRequestClick={() => setEmergencyModalOpen(true)} />
          </div>
        )}

        {/* 2. UNIFIED AUTHORITY OPERATIONS COCKPIT */}
        {isAuthority && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playAlertSound(); setBoatModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                <LifeBuoy size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#EF4444' }}>Dispatch NDRF Boats</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Deploy motorized rescue craft</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setPumpModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0 }}>
                <Truck size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#60A5FA' }}>Deploy 500 GPM Pump</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Dewater flooded underpasses</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setSluiceModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 116, 144, 0.05) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#67E8F9', flexShrink: 0 }}>
                <Waves size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#67E8F9' }}>Authorize Sluice Release</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Amanikere & Bellandur buffer</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playAlertSound(); setBulletinModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                <Radio size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#EF4444' }}>Broadcast State Red Alert</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Issue official hydro bulletin</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setShelterModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', flexShrink: 0 }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#34D399' }}>Activate Relief Shelter</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Open BBMP Community Halls</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playAlertSound(); setTrafficModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24', flexShrink: 0 }}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FBBF24' }}>Order Traffic Barricade</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Divert flooded traffic lines</div>
              </div>
            </motion.button>
          </div>
        )}

        {/* Live Authority Resource Request Triage Queue & Requirement Map Radar */}
        {currentRole !== 'citizen' && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 14,
              padding: '12px 18px',
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF' }}>
                  🚨 Real-time Bengaluru Ward Requirement & Severity Radar
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
                  Inspect ward-by-ward deficits for ICU beds, rescue craft, and water tankers with live GPS detection
                </div>
              </div>

              <Link to="/risk-map" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-shiny"
                  style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <MapPin size={14} /> Open Requirement Map <ArrowRight size={14} />
                </motion.button>
              </Link>
            </div>

            <AuthorityRequestTriage />
          </div>
        )}
      </div>

      {/* ─── ROLE-SPECIFIC METRIC COCKPIT CARDS ───────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18,
      }}>
        {/* CITIZEN METRIC CARDS */}
        {currentRole === 'citizen' && (
          <>
            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>City Flood Risk</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, color: riskMeta.color, background: riskMeta.bg, border: `1px solid ${riskMeta.border}` }}>
                  {riskLevel}
                </span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--tx)', lineHeight: 1 }}>
                {overallRisk}<span style={{ fontSize: 16, color: 'var(--tx-muted)' }}>/100</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#34D399', fontWeight: 600 }}>
                Roads and storm canals flowing normally
              </div>
            </div>

            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Today's Rainfall</span>
                <Droplets size={18} color="#34D399" />
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--tx)', lineHeight: 1 }}>
                {weatherData.rainfall24h}<span style={{ fontSize: 16, color: 'var(--tx-muted)' }}> mm</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tx-dim)' }}>
                Normal seasonal rain. No cloudburst alert.
              </div>
            </div>

            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Underpasses on Watch</span>
                <Compass size={18} color="#F59E0B" />
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>
                3 <span style={{ fontSize: 16, color: 'var(--tx-muted)' }}>Spots</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tx-dim)' }}>
                Silk Board, Marathahalli, Hebbal (Passable)
              </div>
            </div>

            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>24x7 Helpline</span>
                <PhoneCall size={18} color="#34D399" />
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>
                1533
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tx-dim)' }}>
                BBMP Disaster Control Room (Toll-Free)
              </div>
            </div>
          </>
        )}

        {/* UNIFIED AUTHORITY COMMAND METRIC CARDS */}
        {isAuthority && (
          <>
            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>AWS Telemetry Grid</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  100% ONLINE
                </span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>
                842<span style={{ fontSize: 16, color: 'var(--tx-muted)' }}> / 842</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tx-dim)' }}>
                Automated rain gauge telemetry stations active
              </div>
            </div>

            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>NDRF Rescue Fleet</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  READY
                </span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>
                18 <span style={{ fontSize: 16, color: 'var(--tx-muted)' }}>/ 28 Boats</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tx-dim)' }}>
                Pre-positioned: Kendriya Vihar, EcoSpace & Hebbal
              </div>
            </div>

            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Lake Holding Buffer</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  BUFFER WATCH
                </span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>
                81.4<span style={{ fontSize: 16, color: 'var(--tx-muted)' }}>% Full</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tx-dim)' }}>
                Bellandur: 82% • Amanikere: 94% • Varthur: 79%
              </div>
            </div>

            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Dewatering & Logistics</span>
                <Truck size={18} color="#60A5FA" />
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#60A5FA', lineHeight: 1 }}>
                46 <span style={{ fontSize: 16, color: 'var(--tx-muted)' }}>/ 64 Active</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tx-dim)' }}>
                500 GPM submersible units pumping underpasses & 12 shelters active
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Active Alerts Section (Role-Aware) ───────────────── */}
      <div className="bento-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--tx)' }}>
            {!isAuthority ? 'Urgent Weather & Drainage Advisories' : 'Unified Authority Telemetry, Operations & Evacuation Dispatch'}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--pri-neon)', fontWeight: 600 }}>
            {!isAuthority ? 'Verified Resident Feed' : 'Unified Authority Operations Grid'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map(alert => {
            const isExpanded = expandedAlert === alert.id
            const isAck = acknowledgedAlerts.includes(alert.id)
            const meta = SEVERITY_CONFIG[alert.sev] || SEVERITY_CONFIG.LOW

            return (
              <motion.div
                key={alert.id}
                onClick={() => {
                  playClickSound()
                  setExpandedAlert(isExpanded ? null : alert.id)
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isExpanded ? meta.color : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isExpanded ? `0 0 20px ${meta.bg}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      color: meta.color,
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                    }}>
                      {alert.sev}
                    </span>
                    {(alert as any).isOfficialGovt && (
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 900,
                        padding: '2px 7px',
                        borderRadius: 5,
                        background: '#EF4444',
                        color: '#FFFFFF',
                        letterSpacing: '0.04em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Radio size={11} /> OFFICIAL DIRECTIVE
                      </span>
                    )}
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: '#FFFFFF' }}>
                      {alert.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>{alert.time}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 12 }}>
                        {alert.detail}
                      </div>

                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        color: 'var(--pri-neon)',
                        fontWeight: 600,
                        marginBottom: 14,
                      }}>
                        ⚡ Action: {alert.action}
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={(e) => handleAcknowledgeAlert(alert.id, e)}
                          disabled={isAck}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: isAck ? 'rgba(255,255,255,0.1)' : 'var(--pri)',
                            color: isAck ? 'rgba(255,255,255,0.4)' : '#030604',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isAck ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <CheckCircle2 size={14} />
                          {isAck ? 'Acknowledged' : 'Acknowledge Notice'}
                        </button>

                        <button
                          onClick={(e) => handleShareAlert(alert.title, e)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'transparent',
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Share2 size={14} /> Share Advisory
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ─── MODALS ────────────────────────────────────────────── */}

      {/* 1. CITIZEN: SOS Modal */}
      <AnimatePresence>
        {sosModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #1A0C0C 0%, #0B0606 100%)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: 18, padding: '28px 32px', maxWidth: 480, width: '100%', color: '#FFFFFF', boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <AlertOctagon size={32} color="#EF4444" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#EF4444' }}>Confirm SOS Emergency Beacon</h3>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Priority Dispatch to BBMP Control Cell (1533)</div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 20 }}>
                This relays your GPS coordinates and household flood emergency status to the nearest SDRF Battalion and BBMP Ward disaster response truck.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleConfirmSos} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Confirm & Transmit SOS
                </button>
                <button onClick={() => setSosModalOpen(false)} style={{ padding: '12px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#FFFFFF', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. CITIZEN: Report Waterlogging Modal */}
      <AnimatePresence>
        {reportModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 18, padding: '28px 32px', maxWidth: 480, width: '100%', color: '#FFFFFF', boxShadow: '0 0 50px rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Waves size={22} color="#60A5FA" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Report Street Waterlogging</h3>
                </div>
                <button onClick={() => setReportModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Street or Landmark Name</label>
                  <input type="text" required placeholder="e.g. Outer Ring Road, Ecospace Service Lane" value={reportStreet} onChange={e => setReportStreet(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Estimated Water Depth</label>
                  <select value={reportDepth} onChange={e => setReportDepth(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13, boxSizing: 'border-box' }}>
                    <option value="Ankle Deep (10-20cm)" style={{ background: '#0C1A14' }}>Ankle Deep (10–20 cm)</option>
                    <option value="Knee Deep (30-60cm)" style={{ background: '#0C1A14' }}>Knee Deep (30–60 cm)</option>
                    <option value="Waist Deep (90-120cm)" style={{ background: '#0C1A14' }}>Waist Deep (90–120 cm)</option>
                    <option value="Chest Deep (150cm+ / Boat Needed)" style={{ background: '#0C1A14' }}>Chest Deep (150cm+ / Boat Needed)</option>
                  </select>
                </div>
                <button type="submit" style={{ marginTop: 8, padding: '12px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Submit Real-Time Report
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. CITIZEN: Go-Bag Modal */}
      <AnimatePresence>
        {gobagModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: 18, padding: '28px 32px', maxWidth: 500, width: '100%', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckSquare size={22} color="#FBBF24" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Household Flood Go-Bag</h3>
                </div>
                <button onClick={() => setGobagModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {gobagItems.map((item, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={item.done} onChange={() => {
                      playClickSound()
                      const updated = [...gobagItems]
                      updated[idx].done = !updated[idx].done
                      setGobagItems(updated)
                    }} style={{ accentColor: '#10B981', width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: item.done ? '#34D399' : '#FFFFFF', textDecoration: item.done ? 'line-through' : 'none', fontWeight: 600 }}>
                      {item.name}
                    </span>
                  </label>
                ))}
              </div>
              <button onClick={() => { playSuccessSound(); toast.success('Go-Bag Updated', 'Household readiness score synced'); setGobagModalOpen(false); }} style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#030604', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                Save Readiness Status
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. KSNDMC: Red Alert Bulletin Modal */}
      <AnimatePresence>
        {bulletinModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #1A0C0C 0%, #0B0606 100%)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: 18, padding: '28px 32px', maxWidth: 500, width: '100%', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Radio size={22} color="#EF4444" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#EF4444' }}>Broadcast State Hydro Red Alert</h3>
                </div>
                <button onClick={() => setBulletinModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleBroadcastBulletin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Target Catchment Basin</label>
                  <select value={selectedBasin} onChange={e => setSelectedBasin(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13 }}>
                    <option value="Hebbal-Yelahanka Valley" style={{ background: '#0C1A14' }}>Hebbal-Yelahanka Basin (Yelahanka, Kendriya Vihar)</option>
                    <option value="K&C Valley Corridor" style={{ background: '#0C1A14' }}>K&C Valley Corridor (Bellandur, Varthur, ORR)</option>
                    <option value="Vrishabhavathi Basin" style={{ background: '#0C1A14' }}>Vrishabhavathi Basin (Banashankari, Rajajinagar)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Bulletin Priority Classification</label>
                  <select value={bulletinSeverity} onChange={e => setBulletinSeverity(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13 }}>
                    <option value="RED (FLASH FLOOD WARNING)" style={{ background: '#0C1A14' }}>RED (Immediate Flash Flood Warning &gt;50mm/h)</option>
                    <option value="AMBER (INUNDATION ADVISORY)" style={{ background: '#0C1A14' }}>AMBER (Pre-Release Inundation Advisory)</option>
                  </select>
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx-muted)', lineHeight: 1.5 }}>
                  This transmits an encrypted alert to BBMP Control Room, SDRF Quick Response Cell, and Karnataka State Media Desk.
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Authorize State Broadcast
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. KSNDMC: Sluice Release Modal */}
      <AnimatePresence>
        {sluiceModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: 18, padding: '28px 32px', maxWidth: 500, width: '100%', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Waves size={22} color="#67E8F9" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#67E8F9' }}>Authorize Lake Sluice Pre-Release</h3>
                </div>
                <button onClick={() => setSluiceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAuthorizeSluice} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '12px', borderRadius: 10, border: '1px solid rgba(6, 182, 212, 0.3)', fontSize: 12.5, lineHeight: 1.5, color: '#A5F3FC' }}>
                  <strong>Current Lake Levels:</strong> Amanikere Lake is at <b>94.2%</b> capacity. Bellandur Lake is at <b>81.8%</b>. Controlled discharge prevents catastrophic embankment overtopping.
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Discharge Outflow Rate</label>
                  <select style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13 }}>
                    <option value="15" style={{ background: '#0C1A14' }}>Controlled Pre-Release: 15% (8.5 m³/s into canal)</option>
                    <option value="25" style={{ background: '#0C1A14' }}>Active Buffer Discharge: 25% (14.2 m³/s into canal)</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#06B6D4', color: '#030604', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Confirm Sluice Discharge Order
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. BBMP: Boat Dispatch Modal */}
      <AnimatePresence>
        {boatModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #1A0C0C 0%, #0B0606 100%)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: 18, padding: '28px 32px', maxWidth: 500, width: '100%', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <LifeBuoy size={22} color="#EF4444" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#EF4444' }}>Deploy NDRF Rescue Boat Unit</h3>
                </div>
                <button onClick={() => setBoatModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleDispatchBoats} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Deployment Target Basin</label>
                  <select value={boatTarget} onChange={e => setBoatTarget(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13 }}>
                    <option value="Kendriya Vihar, Yelahanka" style={{ background: '#0C1A14' }}>Kendriya Vihar Inundation Basin (Yelahanka)</option>
                    <option value="EcoSpace Service Road, Bellandur" style={{ background: '#0C1A14' }}>EcoSpace & Outer Ring Road (Bellandur)</option>
                    <option value="Rainbow Drive Layout, Sarjapur" style={{ background: '#0C1A14' }}>Rainbow Drive Layout (Sarjapur Road)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Boat Unit Allocation</label>
                  <select style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13 }}>
                    <option value="4" style={{ background: '#0C1A14' }}>4 Motorized Rescue Inflatables (QRT Unit 3)</option>
                    <option value="6" style={{ background: '#0C1A14' }}>6 Heavy-Duty Evacuation Craft (NDRF 10th Bn)</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Confirm Boat Deployment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. BBMP: Dewatering Pump Modal */}
      <AnimatePresence>
        {pumpModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 18, padding: '28px 32px', maxWidth: 500, width: '100%', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Truck size={22} color="#60A5FA" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#60A5FA' }}>Deploy 500 GPM Pump Truck</h3>
                </div>
                <button onClick={() => setPumpModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleDeployPump} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Choke Point Location</label>
                  <select value={pumpTarget} onChange={e => setPumpTarget(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13 }}>
                    <option value="Silk Board Junction Underpass" style={{ background: '#0C1A14' }}>Silk Board Junction Underpass</option>
                    <option value="Marathahalli Bridge Underpass" style={{ background: '#0C1A14' }}>Marathahalli Bridge Underpass</option>
                    <option value="Hebbal Flyover Sump Line" style={{ background: '#0C1A14' }}>Hebbal Flyover Sump Line</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#FFFFFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Dispatch Dewatering Truck
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. BBMP: Relief Shelter Modal */}
      <AnimatePresence>
        {shelterModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 18, padding: '28px 32px', maxWidth: 500, width: '100%', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Building2 size={22} color="#34D399" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#34D399' }}>Activate Municipal Relief Shelter</h3>
                </div>
                <button onClick={() => setShelterModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleOpenShelter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Municipal Facility</label>
                  <select value={shelterTarget} onChange={e => setShelterTarget(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13 }}>
                    <option value="BBMP Ward 4 Community Hall, Yelahanka" style={{ background: '#0C1A14' }}>BBMP Ward 4 Community Hall, Yelahanka (120 cots)</option>
                    <option value="Govt Primary School, HSR Layout" style={{ background: '#0C1A14' }}>Govt Primary School, HSR Layout (90 cots)</option>
                    <option value="BBMP Kalyan Mantap, Koramangala" style={{ background: '#0C1A14' }}>BBMP Kalyan Mantap, Koramangala (180 cots)</option>
                  </select>
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
                  Opening the shelter automatically alerts Karnataka Civil Supplies for drinking water and community kitchen deployment.
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#10B981', color: '#030604', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Open Shelter & Mobilize Rations
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. BBMP: Traffic Barricade Modal */}
      <AnimatePresence>
        {trafficModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #1A0C0C 0%, #0B0606 100%)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: 18, padding: '28px 32px', maxWidth: 500, width: '100%', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={22} color="#FBBF24" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FBBF24' }}>Order Traffic Barricade</h3>
                </div>
                <button onClick={() => setTrafficModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleOrderTrafficBarricade} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>Inundated Roadway / Underpass</label>
                  <select value={trafficTarget} onChange={e => setTrafficTarget(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', fontSize: 13 }}>
                    <option value="Silk Board Service Road (Diverted to Elevated Flyover)" style={{ background: '#0C1A14' }}>Silk Board Service Road (Diverted to Elevated Flyover)</option>
                    <option value="Chowdeshwari Nagar Underpass (Sealed)" style={{ background: '#0C1A14' }}>Chowdeshwari Nagar Underpass (Sealed)</option>
                    <option value="Marathahalli Bridge Underpass (Diverted to Ring Road)" style={{ background: '#0C1A14' }}>Marathahalli Bridge Underpass (Diverted to Ring Road)</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#030604', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Deploy Police Barricades
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Drawer: Underpass Flood Radar */}
      <AnimatePresence>
        {underpassDrawerOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 18, padding: '28px 32px', maxWidth: 540, width: '100%', maxHeight: '80vh', overflowY: 'auto', color: '#FFFFFF', boxShadow: '0 0 50px rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Compass size={22} color="#34D399" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Critical Underpass Flood Radar</h3>
                </div>
                <button onClick={() => setUnderpassDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FLOOD_PRONE_SPOTS.map((spot, i) => {
                  const isBlocked = i === 0 || i === 1 || i === 3
                  return (
                    <div key={spot} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{spot}</div>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8, color: isBlocked ? '#EF4444' : '#34D399', background: isBlocked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${isBlocked ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                        {isBlocked ? 'HIGH INUNDATION' : 'PASSABLE'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. Modal: Emergency Resource & Hospital Bed Request */}
      <EmergencyRequestModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      {/* 12. Modal: Disaster Relief Fund Donation (Max ₹10 Lakh & Healing Heart) */}
      <DisasterDonationModal
        isOpen={donationModalOpen}
        onClose={() => setDonationModalOpen(false)}
      />
    </div>
  )
}
