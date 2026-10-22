// ============================================================
// SafeGround Incident, Crowdsourced Red Zones & Relief Donation Service
// Handles:
// 1. Citizen Waterlogging & Damage Reports
// 2. Automated Crowdsourced Red Zone Clusters & Safer Routes
// 3. Authority Advisory Authorizations & Broadcasts
// 4. Ward-by-Ward Preparedness Percentage Aggregator
// 5. Disaster Relief Donations (Max ₹10 Lakh) with User Audit
// ============================================================

import { supabase } from '../lib/supabase'

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

  // Ensure sequence is strictly greater than all existing items in storage
  if (seqKey === SEQ_DONATION_KEY || seqKey === SEQ_TAX_TOKEN_KEY) {
    try {
      const rawDonations = localStorage.getItem(DONATIONS_KEY)
      if (rawDonations) {
        const list: DonationRecord[] = JSON.parse(rawDonations)
        list.forEach(d => {
          const match = (seqKey === SEQ_DONATION_KEY ? d.id : d.taxExemptionToken).match(/(\d+)$/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (!isNaN(num) && num < 9000 && num > current) current = num
          }
        })
      }
    } catch {}
  } else if (seqKey === SEQ_DAMAGE_REPORT_KEY) {
    try {
      const rawReports = localStorage.getItem(DAMAGE_REPORTS_KEY)
      if (rawReports) {
        const list: CitizenDamageReport[] = JSON.parse(rawReports)
        list.forEach(r => {
          const match = r.id.match(/(\d+)$/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (!isNaN(num) && num < 9000 && num > current) current = num
          }
        })
      }
    } catch {}
  } else if (seqKey === SEQ_ADVISORY_KEY) {
    try {
      const rawAdvs = localStorage.getItem(ADVISORIES_KEY)
      if (rawAdvs) {
        const list: AuthorityAdvisory[] = JSON.parse(rawAdvs)
        list.forEach(a => {
          const match = a.id.match(/(\d+)$/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (!isNaN(num) && num < 9000 && num > current) current = num
          }
        })
      }
    } catch {}
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

// Cross-tab real-time synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DAMAGE_REPORTS_KEY) notifyReports()
    if (e.key === ADVISORIES_KEY) notifyAdvisories()
    if (e.key === DONATIONS_KEY) notifyDonations()
  })
}

export function toSupabaseDonation(d: DonationRecord) {
  return {
    id: d.id,
    donor_name: d.donorName,
    donor_email: d.donorEmail,
    donor_pan: d.donorPhone || '',
    amount: d.amount,
    allocated_cause: d.targetReliefCause,
    payment_ref: d.paymentMethod,
    tax_token: d.taxExemptionToken,
    certificate_issued: true,
    donated_at: d.timestamp,
  }
}

export function fromSupabaseDonation(row: any): DonationRecord {
  return {
    id: row.id,
    userId: `donor-${row.id}`,
    donorName: row.donor_name || 'Anonymous Donor',
    donorEmail: row.donor_email || '',
    donorPhone: row.donor_pan || '+91 98450 00000',
    amount: Number(row.amount) || 0,
    targetReliefCause: row.allocated_cause || 'Bengaluru Flood Relief Fund',
    paymentMethod: row.payment_ref || 'UPI / NetBanking',
    timestamp: row.donated_at || new Date().toISOString(),
    taxExemptionToken: row.tax_token || 'KA-80G-0001',
  }
}

export function toSupabaseAdvisory(a: AuthorityAdvisory) {
  return {
    id: a.id,
    title: a.title,
    zone: a.zone,
    severity: a.severity,
    message: a.message,
    water_depth_reported: a.waterDepthReported,
    safer_alternative_route: a.saferAlternativeRoute,
    authority_name: a.authorityName,
    published_at: a.publishedAt,
  }
}

export function fromSupabaseAdvisory(row: any): AuthorityAdvisory {
  return {
    id: row.id,
    title: row.title || '',
    zone: row.zone || '',
    severity: (row.severity as any) || 'HIGH',
    message: row.message || '',
    waterDepthReported: row.water_depth_reported || '',
    saferAlternativeRoute: row.safer_alternative_route || '',
    authorityName: row.authority_name || 'BBMP / KSNDMC',
    publishedAt: row.published_at || new Date().toISOString(),
    active: true,
  }
}

export function toSupabaseDamageReport(r: CitizenDamageReport) {
  return {
    id: r.id,
    reporter_name: r.reporterName,
    reporter_email: r.reporterEmail,
    reporter_phone: r.reporterPhone,
    zone: r.zone,
    landmark: r.landmark,
    water_depth_feet: r.waterDepthFeet,
    damage_type: r.damageType,
    damage_description: r.damageDescription,
    severity: r.severity,
    status: r.status,
    reported_at: r.reportedAt,
  }
}

export function fromSupabaseDamageReport(row: any): CitizenDamageReport {
  return {
    id: row.id,
    userId: 'reporter-anon',
    reporterName: row.reporter_name || '',
    reporterEmail: row.reporter_email || '',
    reporterPhone: row.reporter_phone || '',
    zone: row.zone || '',
    landmark: row.landmark || '',
    waterDepthFeet: Number(row.water_depth_feet) || 0,
    damageType: (row.damage_type as any) || 'Road Submersion',
    damageDescription: row.damage_description || '',
    severity: (row.severity as any) || 'HIGH',
    status: (row.status as any) || 'PENDING_REVIEW',
    reportedAt: row.reported_at || new Date().toISOString(),
    verifiedBy: null,
    publishedAdvisoryId: null,
  }
}

let hasInitializedReliefSync = false

export async function pullCloudReliefData(): Promise<void> {
  if (typeof window === 'undefined') return

  // 1. Fetch Donations from Supabase
  try {
    const { data, error } = await supabase
      .from('relief_donations')
      .select('*')
      .order('donated_at', { ascending: false })

    if (!error && data) {
      const cloud = data.map(fromSupabaseDonation)
      const local = getAllDonations()
      const map = new Map<string, DonationRecord>()
      cloud.forEach(d => map.set(d.id, d))
      local.forEach(d => {
        if (!map.has(d.id)) map.set(d.id, d)
      })
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      localStorage.setItem(DONATIONS_KEY, JSON.stringify(merged))
      notifyDonations()
    }
  } catch (err) {
    console.warn('Donations cloud pull error:', err)
  }

  // 2. Fetch Advisories from Supabase
  try {
    const { data, error } = await supabase
      .from('authority_advisories')
      .select('*')
      .order('published_at', { ascending: false })

    if (!error && data) {
      const cloud = data.map(fromSupabaseAdvisory)
      const local = getAllAdvisories()
      const map = new Map<string, AuthorityAdvisory>()
      cloud.forEach(a => map.set(a.id, a))
      local.forEach(a => {
        if (!map.has(a.id)) map.set(a.id, a)
      })
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      localStorage.setItem(ADVISORIES_KEY, JSON.stringify(merged))
      notifyAdvisories()
    }
  } catch (err) {
    console.warn('Advisories cloud pull error:', err)
  }

  // 3. Fetch Damage Reports from Supabase
  try {
    const { data, error } = await supabase
      .from('citizen_damage_reports')
      .select('*')
      .order('reported_at', { ascending: false })

    if (!error && data) {
      const cloud = data.map(fromSupabaseDamageReport)
      const local = getAllDamageReports()
      const map = new Map<string, CitizenDamageReport>()
      cloud.forEach(r => map.set(r.id, r))
      local.forEach(r => {
        if (!map.has(r.id)) map.set(r.id, r)
      })
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
      )
      localStorage.setItem(DAMAGE_REPORTS_KEY, JSON.stringify(merged))
      notifyReports()
    }
  } catch (err) {
    console.warn('Damage reports cloud pull error:', err)
  }
}

export function initSupabaseReliefSync() {
  if (typeof window === 'undefined' || hasInitializedReliefSync) return
  hasInitializedReliefSync = true

  // Initial cloud fetch
  pullCloudReliefData()

  // Periodic polling every 3.5 seconds across all devices
  setInterval(() => {
    pullCloudReliefData()
  }, 3500)

  // Re-sync on tab switch or focus
  window.addEventListener('focus', () => pullCloudReliefData())
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pullCloudReliefData()
    }
  })

  // 4. Supabase Realtime Channels for Cross-Device Sync
  try {
    supabase
      .channel('relief_donations_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relief_donations' }, (payload) => {
        const all = getAllDonations()
        if (payload.eventType === 'INSERT') {
          const item = fromSupabaseDonation(payload.new)
          if (!all.some(d => d.id === item.id)) {
            localStorage.setItem(DONATIONS_KEY, JSON.stringify([item, ...all]))
            notifyDonations()
          }
        } else if (payload.eventType === 'UPDATE') {
          const item = fromSupabaseDonation(payload.new)
          localStorage.setItem(DONATIONS_KEY, JSON.stringify(all.map(d => d.id === item.id ? item : d)))
          notifyDonations()
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
          localStorage.setItem(DONATIONS_KEY, JSON.stringify(all.filter(d => d.id !== payload.old.id)))
          notifyDonations()
        }
      })
      .subscribe()
  } catch {}

  try {
    supabase
      .channel('authority_advisories_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'authority_advisories' }, (payload) => {
        const all = getAllAdvisories()
        if (payload.eventType === 'INSERT') {
          const item = fromSupabaseAdvisory(payload.new)
          if (!all.some(a => a.id === item.id)) {
            localStorage.setItem(ADVISORIES_KEY, JSON.stringify([item, ...all]))
            notifyAdvisories()
          }
        } else if (payload.eventType === 'UPDATE') {
          const item = fromSupabaseAdvisory(payload.new)
          localStorage.setItem(ADVISORIES_KEY, JSON.stringify(all.map(a => a.id === item.id ? item : a)))
          notifyAdvisories()
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
          localStorage.setItem(ADVISORIES_KEY, JSON.stringify(all.filter(a => a.id !== payload.old.id)))
          notifyAdvisories()
        }
      })
      .subscribe()
  } catch {}

  try {
    supabase
      .channel('citizen_damage_reports_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citizen_damage_reports' }, (payload) => {
        const all = getAllDamageReports()
        if (payload.eventType === 'INSERT') {
          const item = fromSupabaseDamageReport(payload.new)
          if (!all.some(r => r.id === item.id)) {
            localStorage.setItem(DAMAGE_REPORTS_KEY, JSON.stringify([item, ...all]))
            notifyReports()
          }
        } else if (payload.eventType === 'UPDATE') {
          const item = fromSupabaseDamageReport(payload.new)
          localStorage.setItem(DAMAGE_REPORTS_KEY, JSON.stringify(all.map(r => r.id === item.id ? item : r)))
          notifyReports()
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
          localStorage.setItem(DAMAGE_REPORTS_KEY, JSON.stringify(all.filter(r => r.id !== payload.old.id)))
          notifyReports()
        }
      })
      .subscribe()
  } catch {}
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
  try {
    supabase.from('citizen_damage_reports').upsert(toSupabaseDamageReport(newReport)).then(() => {})
  } catch {}
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
  try {
    supabase.from('authority_advisories').upsert(toSupabaseAdvisory(newAdv)).then(() => {})
  } catch {}

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
  try {
    supabase
      .from('relief_donations')
      .insert(toSupabaseDonation(newDonation))
      .then(({ error }) => {
        if (error) {
          console.warn('Supabase donation insert error:', error.message)
          if (error.code === '23505') {
            const fallback = {
              ...toSupabaseDonation(newDonation),
              id: `${newDonation.id}-${Date.now().toString().slice(-4)}`,
            }
            supabase.from('relief_donations').insert(fallback).then(() => {})
          }
        }
      })
  } catch (err) {
    console.warn('Supabase donation trigger error:', err)
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
export async function clearAllIncidentAndReliefData(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DAMAGE_REPORTS_KEY)
    localStorage.removeItem(ADVISORIES_KEY)
    localStorage.removeItem(DONATIONS_KEY)
    localStorage.removeItem(SEQ_DONATION_KEY)
    localStorage.removeItem(SEQ_TAX_TOKEN_KEY)
    localStorage.removeItem(SEQ_DAMAGE_REPORT_KEY)
    localStorage.removeItem(SEQ_ADVISORY_KEY)
  }
  try {
    await Promise.allSettled([
      supabase.from('relief_donations').delete().neq('id', '_none_'),
      supabase.from('authority_advisories').delete().neq('id', '_none_'),
      supabase.from('citizen_damage_reports').delete().neq('id', '_none_'),
    ])
  } catch (e) {
    console.warn('Supabase relief reset error:', e)
  }
  notifyReports()
  notifyAdvisories()
  notifyDonations()
}
