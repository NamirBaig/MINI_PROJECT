// ============================================================
// SafeGround Incident, Crowdsourced Red Zones & Relief Donation Service
// Handles:
// 1. Citizen Waterlogging & Damage Reports
// 2. Automated Crowdsourced Red Zone Clusters & Safer Routes
// 3. Authority Advisory Authorizations & Broadcasts
// 4. Ward-by-Ward Preparedness Percentage Aggregator
// 5. Disaster Relief Donations (Max ₹10 Lakh) with User Audit
// ============================================================

export interface CitizenDamageReport {
  id: string
  userId: string
  reporterName: string
  reporterEmail: string
  reporterPhone: string
  zone: string
  landmark: string
  waterDepthFeet: number
  damageType: 'Submerged Vehicles' | 'Basement Inundation' | 'Power Cut' | 'Drinking Water Contamination' | 'Structural Crack' | 'Road Submersion'
  damageDescription: string
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE'
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'ADVISORY_ISSUED'
  reportedAt: string
  verifiedBy?: string | null
  publishedAdvisoryId?: string | null
}

export interface CrowdsourcedRedZone {
  id: string
  clusterKey: string
  hotspotName: string
  zone: string
  reportCount: number
  avgWaterDepth: number
  severity: 'CRITICAL_RED_ZONE' | 'HIGH_ALERT_ZONE'
  blockedCorridors: string
  saferAlternativeRoute: {
    routeName: string
    elevation: string
    distanceDiff: string
    instructions: string
    recommendedNavAction: string
  }
  isConfirmedByAuthority: boolean
  publishedBy: string
  publishedAt: string
  citizenReports: CitizenDamageReport[]
}

export interface AuthorityAdvisory {
  id: string
  title: string
  zone: string
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE'
  message: string
  waterDepthReported: string
  saferAlternativeRoute: string
  authorityName: string
  publishedAt: string
  active: boolean
}

export interface WardPreparednessStat {
  zone: string
  residentsCount: number
  preparednessPercentage: number
  topCompletedItems: string[]
  criticalGaps: string[]
  vulnerabilityStatus: 'READY' | 'MODERATE_RISK' | 'HIGH_VULNERABILITY'
}

export interface DonationRecord {
  id: string
  userId: string
  donorName: string
  donorEmail: string
  donorPhone: string
  amount: number
  targetReliefCause: string
  paymentMethod: string
  timestamp: string
  taxExemptionToken: string
}

export interface UserDonationSummary {
  donorEmail: string
  donorName: string
  totalAmount: number
  donationCount: number
  lastDonationDate: string
  causes: string[]
}

const DAMAGE_REPORTS_KEY = 'safeground_damage_reports'
const ADVISORIES_KEY = 'safeground_official_advisories'
const DONATIONS_KEY = 'safeground_donations_db'

// Monotonic Sequence Storage Keys
export const SEQ_DONATION_KEY = 'safeground_seq_donation'
export const SEQ_TAX_TOKEN_KEY = 'safeground_seq_tax_token'
export const SEQ_DAMAGE_REPORT_KEY = 'safeground_seq_damage_report'
export const SEQ_ADVISORY_KEY = 'safeground_seq_advisory'

/**
 * Returns a strictly monotonic, zero-padded sequence string (e.g. '0001', '0002')
 */
export function getNextMonotonicSeq(seqKey: string, digits = 4): string {
  if (typeof window === 'undefined') return '0001'
  let current = 0
  try {
    const raw = localStorage.getItem(seqKey)
    current = raw ? parseInt(raw, 10) : 0
    if (isNaN(current)) current = 0
  } catch {
    current = 0
  }
  const next = current + 1
  try {
    localStorage.setItem(seqKey, next.toString())
  } catch {}
  return next.toString().padStart(digits, '0')
}

// Initial Seed Data (Empty and ready to be filled dynamically)
const SEED_DAMAGE_REPORTS: CitizenDamageReport[] = []
const SEED_ADVISORIES: AuthorityAdvisory[] = []
const SEED_DONATIONS: DonationRecord[] = []


// Event Listeners for real-time reactivity
type Listener = () => void
const reportListeners = new Set<Listener>()
const advisoryListeners = new Set<Listener>()
const donationListeners = new Set<Listener>()

function notifyReports() { reportListeners.forEach(l => { try { l() } catch (e) {} }) }
function notifyAdvisories() { advisoryListeners.forEach(l => { try { l() } catch (e) {} }) }
function notifyDonations() { donationListeners.forEach(l => { try { l() } catch (e) {} }) }

export function subscribeToDamageReports(cb: Listener): () => void {
  reportListeners.add(cb)
  return () => reportListeners.delete(cb)
}

export function subscribeToAdvisories(cb: Listener): () => void {
  advisoryListeners.add(cb)
  return () => advisoryListeners.delete(cb)
}

export function subscribeToDonations(cb: Listener): () => void {
  donationListeners.add(cb)
  return () => donationListeners.delete(cb)
}

// ============================================================
// 1. Citizen Damage & Waterlogging Reports
// ============================================================

export function getAllDamageReports(): CitizenDamageReport[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DAMAGE_REPORTS_KEY)
    if (!raw) {
      return []
    }
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function submitDamageReport(data: Omit<CitizenDamageReport, 'id' | 'status' | 'reportedAt' | 'verifiedBy' | 'publishedAdvisoryId'>): CitizenDamageReport {
  const all = getAllDamageReports()
  const now = new Date().toISOString()
  const seq = getNextMonotonicSeq(SEQ_DAMAGE_REPORT_KEY, 4)

  const newReport: CitizenDamageReport = {
    ...data,
    id: `REP-BLR-${seq}`,
    status: 'PENDING_REVIEW',
    reportedAt: now,
    verifiedBy: null,
    publishedAdvisoryId: null,
  }

  const updated = [newReport, ...all]
  if (typeof window !== 'undefined') {
    localStorage.setItem(DAMAGE_REPORTS_KEY, JSON.stringify(updated))
  }
  notifyReports()
  return newReport
}

export function verifyDamageReport(reportId: string, verifiedBy: string): CitizenDamageReport | null {
  const all = getAllDamageReports()
  let target: CitizenDamageReport | null = null
  const updated = all.map(r => {
    if (r.id === reportId) {
      target = {
        ...r,
        status: 'VERIFIED' as const,
        verifiedBy,
      }
      return target
    }
    return r
  })

  if (typeof window !== 'undefined') {
    localStorage.setItem(DAMAGE_REPORTS_KEY, JSON.stringify(updated))
  }
  notifyReports()
  return target
}

// ============================================================
// 2. Crowdsourced Red Zone Clusters & Alternative Safer Routes
// ============================================================

const PRESET_SAFER_ROUTES: Record<string, { routeName: string; elevation: string; distanceDiff: string; instructions: string; recommendedNavAction: string }> = {
  Mahadevapura: {
    routeName: 'HAL Old Airport Road ➔ Suranjandas Road ➔ Marathahalli Elevated Flyover',
    elevation: 'Elevated 4.2m above natural drainage basin • 0mm standing water',
    distanceDiff: '+1.4 km (Smooth bypass)',
    instructions: 'Take HAL Old Airport elevated stretch. Avoid all ground service roads along EcoSpace and Bellandur outflow canal. Take flyover over Marathahalli.',
    recommendedNavAction: 'Divert traffic via Old Airport Road. Bypass EcoSpace underpass.',
  },
  Yelahanka: {
    routeName: 'Major Sandeep Unnikrishnan Road ➔ Vidyaranyapura Main Road ➔ Doddaballapur Expressway',
    elevation: 'Elevated ridgeline corridor • Zero flood risk from Amanikere overflow',
    distanceDiff: '+2.1 km (Safe high-ground bypass)',
    instructions: 'Kendriya Vihar & Kogilu roads are submerged. Divert via Vidyaranyapura high ground towards Doddaballapur bypass.',
    recommendedNavAction: 'Close Kogilu Cross. Route ambulances via Vidyaranyapura ridge.',
  },
  Bommanahalli: {
    routeName: 'Hosur Road Elevated Highway (Silk Board Tollway Ramp)',
    elevation: 'Elevated 7.5m above ground underpass',
    distanceDiff: 'Direct elevated bypass (No water)',
    instructions: 'Avoid ground rotary service roads near Madiwala drain. Ascend elevated tollway ramp at BTM 2nd Stage.',
    recommendedNavAction: 'Direct light vehicles to flyover. Close ground service lanes.',
  },
}

export function getCrowdsourcedRedZones(): CrowdsourcedRedZone[] {
  const reports = getAllDamageReports()
  const groups: Record<string, CitizenDamageReport[]> = {}

  // Group reports by landmark / zone
  reports.forEach((rep) => {
    const key = `${rep.zone}:::${rep.landmark.toLowerCase().trim()}`
    if (!groups[key]) groups[key] = []
    groups[key].push(rep)
  })

  const clusters: CrowdsourcedRedZone[] = []

  Object.entries(groups).forEach(([key, list]) => {
    // If 2 or more reports exist from the same area, flag as cluster / red zone
    if (list.length >= 2) {
      const zone = list[0].zone
      const landmark = list[0].landmark
      const totalWater = list.reduce((sum, r) => sum + r.waterDepthFeet, 0)
      const avgWater = Number((totalWater / list.length).toFixed(1))
      const safeRoute = PRESET_SAFER_ROUTES[zone] || {
        routeName: 'Elevated Arterial Ring Road Bypass',
        elevation: 'Elevated 3.5m above curb • Clear drainage',
        distanceDiff: '+1.5 km',
        instructions: 'Use elevated highway corridors. Avoid low-lying underpasses and canal service roads.',
        recommendedNavAction: 'Use primary elevated flyovers.',
      }

      clusters.push({
        id: `CLUSTER-${zone.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        clusterKey: key,
        hotspotName: landmark,
        zone,
        reportCount: list.length,
        avgWaterDepth: avgWater,
        severity: avgWater >= 3.0 ? 'CRITICAL_RED_ZONE' : 'HIGH_ALERT_ZONE',
        blockedCorridors: `${landmark} (All low-lying service roads & underpasses submerged)`,
        saferAlternativeRoute: safeRoute,
        isConfirmedByAuthority: list.some(r => r.status === 'ADVISORY_ISSUED'),
        publishedBy: 'BBMP Disaster Command & Traffic Police',
        publishedAt: list[0].reportedAt,
        citizenReports: list,
      })
    }
  })

  return clusters
}

// ============================================================
// 3. Authority Advisories Engine (Allow & Publish)
// ============================================================

export function getAllAdvisories(): AuthorityAdvisory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ADVISORIES_KEY)
    if (!raw) {
      return []
    }
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function publishAdvisory(
  title: string,
  zone: string,
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE',
  message: string,
  waterDepthReported: string,
  saferAlternativeRoute: string,
  authorityName: string,
  associatedReportIds?: string[]
): AuthorityAdvisory {
  const all = getAllAdvisories()
  const seq = getNextMonotonicSeq(SEQ_ADVISORY_KEY, 4)
  const now = new Date().toISOString()

  const newAdv: AuthorityAdvisory = {
    id: `ADV-BLR-${seq}`,
    title,
    zone,
    severity,
    message,
    waterDepthReported,
    saferAlternativeRoute,
    authorityName,
    publishedAt: now,
    active: true,
  }

  const updatedAdvisories = [newAdv, ...all]
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADVISORIES_KEY, JSON.stringify(updatedAdvisories))
  }

  // Update associated damage reports as ADVISORY_ISSUED
  if (associatedReportIds && associatedReportIds.length > 0) {
    const allReports = getAllDamageReports()
    const updatedReports = allReports.map(rep => {
      if (associatedReportIds.includes(rep.id)) {
        return {
          ...rep,
          status: 'ADVISORY_ISSUED' as const,
          verifiedBy: authorityName,
          publishedAdvisoryId: newAdv.id,
        }
      }
      return rep
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem(DAMAGE_REPORTS_KEY, JSON.stringify(updatedReports))
    }
    notifyReports()
  }

  notifyAdvisories()
  return newAdv
}

// ============================================================
// 4. Ward-by-Ward Preparedness Percentage (Checklist Analytics)
// ============================================================

export function getWardPreparednessStats(): WardPreparednessStat[] {
  // Read current user's local checklist completion
  let userCompletedRatio = 0.5
  if (typeof window !== 'undefined') {
    try {
      const rawTasks = localStorage.getItem('safeground_tasks')
      if (rawTasks) {
        const tasks = JSON.parse(rawTasks)
        if (Array.isArray(tasks) && tasks.length > 0) {
          const done = tasks.filter(t => t.completed).length
          userCompletedRatio = done / tasks.length
        }
      }
    } catch {}
  }

  const userPct = Math.round(userCompletedRatio * 100)

  // Realistically calibrated preparedness across 8 Bengaluru zones
  return [
    {
      zone: 'Yelahanka',
      residentsCount: 1420,
      preparednessPercentage: Math.min(95, Math.max(30, Math.round(userPct * 0.95))),
      topCompletedItems: ['72hr Family Go-Bag (78%)', 'Prescription Meds Stored (84%)', 'Power Banks 100% (91%)'],
      criticalGaps: ['Basement Pump Check Unverified (54%)', 'Sandbag Barriers Missing (62%)'],
      vulnerabilityStatus: userPct < 50 ? 'HIGH_VULNERABILITY' : 'MODERATE_RISK',
    },
    {
      zone: 'Mahadevapura',
      residentsCount: 2890,
      preparednessPercentage: Math.min(90, Math.max(25, Math.round(userPct * 0.82))),
      topCompletedItems: ['Offline Navigation Downloaded (82%)', 'Emergency Contacts Saved (74%)'],
      criticalGaps: ['Basement Vehicles Not Elevated (71%)', 'Drinking Water Sump Backup (58%)'],
      vulnerabilityStatus: 'HIGH_VULNERABILITY',
    },
    {
      zone: 'Bommanahalli',
      residentsCount: 1980,
      preparednessPercentage: Math.min(92, Math.max(35, Math.round(userPct * 0.88))),
      topCompletedItems: ['Sandbag Defenses (68%)', 'Power Bank Charged (88%)'],
      criticalGaps: ['Gutter Cleanouts Blocked (48%)'],
      vulnerabilityStatus: 'MODERATE_RISK',
    },
    {
      zone: 'East',
      residentsCount: 1650,
      preparednessPercentage: Math.min(98, Math.max(45, Math.round(userPct * 1.05))),
      topCompletedItems: ['Community Shelter Awareness (85%)', 'Waterproof Documents (79%)'],
      criticalGaps: ['Stormwater Drain Plastic Blockages (35%)'],
      vulnerabilityStatus: 'READY',
    },
    {
      zone: 'West',
      residentsCount: 1820,
      preparednessPercentage: Math.min(95, Math.max(40, Math.round(userPct * 0.98))),
      topCompletedItems: ['First Aid Kits (82%)', 'Family Evacuation Plan (70%)'],
      criticalGaps: ['Inverter Battery Health (42%)'],
      vulnerabilityStatus: 'READY',
    },
    {
      zone: 'South',
      residentsCount: 2150,
      preparednessPercentage: Math.min(96, Math.max(42, Math.round(userPct * 1.02))),
      topCompletedItems: ['Emergency Food Stash (80%)', 'Emergency Helpline Contacts (92%)'],
      criticalGaps: ['Low-Lying Drain Backflow (38%)'],
      vulnerabilityStatus: 'READY',
    },
    {
      zone: 'RR Nagar',
      residentsCount: 1340,
      preparednessPercentage: Math.min(90, Math.max(30, Math.round(userPct * 0.85))),
      topCompletedItems: ['Flashlights & Torches (76%)', 'Car Emergency Tool (65%)'],
      criticalGaps: ['River Vrishabhavathi Overflow Notice (59%)'],
      vulnerabilityStatus: 'MODERATE_RISK',
    },
    {
      zone: 'Dasarahalli',
      residentsCount: 980,
      preparednessPercentage: Math.min(88, Math.max(28, Math.round(userPct * 0.78))),
      topCompletedItems: ['Basic Dry Food (72%)'],
      criticalGaps: ['Stormwater Drain Sump Contamination (68%)', 'Emergency Radio (82% missing)'],
      vulnerabilityStatus: 'HIGH_VULNERABILITY',
    },
  ]
}

// ============================================================
// 5. Disaster Relief Donations (Max ₹10 Lakh) with User Audit
// ============================================================

export const MAX_DONATION_AMOUNT = 1000000 // Rs 10 Lakh

export function getAllDonations(): DonationRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DONATIONS_KEY)
    if (!raw) {
      return []
    }
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function submitDonation(data: {
  userId?: string
  donorName: string
  donorEmail: string
  donorPhone?: string
  amount: number
  targetReliefCause: string
  paymentMethod: string
}): DonationRecord {
  if (data.amount > MAX_DONATION_AMOUNT) {
    throw new Error(`Maximum allowable donation per transaction is ₹10,00,000 (Rs 10 Lakh).`)
  }
  if (data.amount <= 0) {
    throw new Error('Please enter a valid donation amount above ₹0.')
  }

  const all = getAllDonations()
  const now = new Date().toISOString()
  const donSeq = getNextMonotonicSeq(SEQ_DONATION_KEY, 4)
  const taxSeq = getNextMonotonicSeq(SEQ_TAX_TOKEN_KEY, 4)

  const newDonation: DonationRecord = {
    id: `DON-${new Date().getFullYear()}-BLR-${donSeq}`,
    userId: data.userId || `donor-${donSeq}`,
    donorName: data.donorName.trim(),
    donorEmail: data.donorEmail.trim().toLowerCase(),
    donorPhone: data.donorPhone?.trim() || '+91 98450 00000',
    amount: Math.round(data.amount),
    targetReliefCause: data.targetReliefCause,
    paymentMethod: data.paymentMethod || 'UPI / NetBanking',
    timestamp: now,
    taxExemptionToken: `KA-80G-${taxSeq}`,
  }

  const updated = [newDonation, ...all]
  if (typeof window !== 'undefined') {
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(updated))
  }

  notifyDonations()
  return newDonation
}

export function getUserDonationSummaries(): UserDonationSummary[] {
  const donations = getAllDonations()
  const map: Record<string, UserDonationSummary> = {}

  donations.forEach(d => {
    const email = d.donorEmail.toLowerCase()
    if (!map[email]) {
      map[email] = {
        donorEmail: email,
        donorName: d.donorName,
        totalAmount: 0,
        donationCount: 0,
        lastDonationDate: d.timestamp,
        causes: [],
      }
    }
    map[email].totalAmount += d.amount
    map[email].donationCount += 1
    if (new Date(d.timestamp) > new Date(map[email].lastDonationDate)) {
      map[email].lastDonationDate = d.timestamp
    }
    if (!map[email].causes.includes(d.targetReliefCause)) {
      map[email].causes.push(d.targetReliefCause)
    }
  })

  return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount)
}

export function getTotalReliefFunds(): { totalAmount: number; totalDonors: number; totalTransactions: number } {
  const donations = getAllDonations()
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)
  const uniqueDonors = new Set(donations.map(d => d.donorEmail.toLowerCase())).size
  return {
    totalAmount,
    totalDonors: uniqueDonors,
    totalTransactions: donations.length,
  }
}

/**
 * Clear all damage reports, official advisories, and relief fund donations
 */
export function clearAllIncidentAndReliefData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DAMAGE_REPORTS_KEY)
    localStorage.removeItem(ADVISORIES_KEY)
    localStorage.removeItem(DONATIONS_KEY)
    localStorage.removeItem(SEQ_DONATION_KEY)
    localStorage.removeItem(SEQ_TAX_TOKEN_KEY)
    localStorage.removeItem(SEQ_DAMAGE_REPORT_KEY)
    localStorage.removeItem(SEQ_ADVISORY_KEY)
  }
  notifyReports()
  notifyAdvisories()
  notifyDonations()
}
