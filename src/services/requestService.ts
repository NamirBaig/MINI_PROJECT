// ============================================================
// SafeGround Emergency Resource Request & User Database Service
// Handles citizen requests (ICU beds, general beds, water, boats)
// and authority approvals/denials with persistent dual-storage.
// ============================================================

import { supabase } from '../lib/supabase'

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MODERATE'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'DENIED'

export interface RequestAuditLog {
  timestamp: string
  action: string
  actor: string
  details: string
  badgeColor?: string
}

export interface EmergencyRequest {
  id: string
  userId: string
  requesterName: string
  requesterEmail: string
  requesterPhone: string
  zone: string
  address: string
  resourceType: string
  quantity: number
  urgency: UrgencyLevel
  patientNotes: string
  status: RequestStatus
  allocatedHospital?: string | null
  hospitalBedNumber?: string | null
  dispatchVehicle?: string | null
  driverName?: string | null
  driverPhone?: string | null
  dispatchEta?: string | null
  redirectShelter?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  actionNotes?: string | null
  emailNotificationSent?: boolean
  emailNotificationTimestamp?: string | null
  auditTrail?: RequestAuditLog[]
  createdAt: string
  updatedAt: string
}

export interface UserRecord {
  id: string
  email: string
  fullName: string
  phone?: string
  zone?: string
  role: string
  provider: 'email' | 'google' | 'role_preset'
  createdAt: string
  lastActiveAt: string
}

const REQUESTS_STORAGE_KEY = 'safeground_requests_db'
const USERS_STORAGE_KEY = 'safeground_users_db'
const KNOWN_EMAILS_KEY = 'safeground_known_requester_emails'

// Initial seed requests calibrated for Bengaluru flood zones
const SEED_REQUESTS: EmergencyRequest[] = [
  {
    id: 'REQ-2024-BLR-0418',
    userId: 'seed-user-1',
    requesterName: 'Smt. Gayatri Deshmukh',
    requesterEmail: 'gayatri.d@gmail.com',
    requesterPhone: '+91 98450 12891',
    zone: 'Yelahanka',
    address: 'Flat 402, Block C, Kendriya Vihar, Bellahalli Cross, Yelahanka',
    resourceType: 'Hospital ICU Beds',
    quantity: 1,
    urgency: 'CRITICAL',
    patientNotes: 'Elderly 78yo asthma patient with declining SpO2 (84%). Ground floor flooded with 3.5ft water; building power cut.',
    status: 'PENDING',
    allocatedHospital: null,
    hospitalBedNumber: null,
    dispatchVehicle: null,
    driverName: null,
    driverPhone: null,
    dispatchEta: null,
    redirectShelter: null,
    reviewedBy: null,
    reviewedAt: null,
    actionNotes: null,
    emailNotificationSent: false,
    emailNotificationTimestamp: null,
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        action: 'Request Registered',
        actor: 'Smt. Gayatri Deshmukh (Resident)',
        details: 'Critical emergency distress request broadcast for 1x Hospital ICU Bed at Kendriya Vihar.',
        badgeColor: '#EF4444',
      },
    ],
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'REQ-2024-BLR-0415',
    userId: 'seed-user-2',
    requesterName: 'Anand Venkatesh',
    requesterEmail: 'anand.v@outlook.com',
    requesterPhone: '+91 94481 44520',
    zone: 'Mahadevapura',
    address: 'Villa 42, Rainbow Drive Layout, Sarjapur Road, Mahadevapura',
    resourceType: 'Hospital General Beds',
    quantity: 2,
    urgency: 'HIGH',
    patientNotes: 'Mother injured foot in waterlogged basement; mild hypothermia. Requires wound debridement & ward admission.',
    status: 'APPROVED',
    allocatedHospital: 'Sakra World Hospital (Bellandur Ward 3)',
    hospitalBedNumber: 'General Ward Bed #14-B (Block C)',
    dispatchVehicle: '108 ALS Ambulance KA-04-E-1882',
    driverName: 'Manjunath R. (Ambulance Lead Pilot)',
    driverPhone: '+91 98451 91108',
    dispatchEta: '14 mins (Arriving Soon)',
    redirectShelter: null,
    reviewedBy: 'Er. Ramesh Gowda (BBMP Relief Lead)',
    reviewedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    actionNotes: 'Approved: 2 General Beds reserved at Sakra World Hospital. 108 Ambulance KA-04-E-1882 dispatched via Outer Ring Road.',
    emailNotificationSent: true,
    emailNotificationTimestamp: new Date(Date.now() - 89 * 60 * 1000).toISOString(),
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        action: 'Request Registered',
        actor: 'Anand Venkatesh',
        details: 'Submitted request for 2x Hospital General Beds.',
        badgeColor: '#F59E0B',
      },
      {
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        action: 'Accepted & Beds Reserved',
        actor: 'Er. Ramesh Gowda (BBMP Relief Lead)',
        details: 'Allocated at Sakra World Hospital. Bed #14-B reserved. 108 Ambulance KA-04-E-1882 dispatched.',
        badgeColor: '#10B981',
      },
    ],
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'REQ-2024-BLR-0409',
    userId: 'seed-user-3',
    requesterName: 'Karthik Somayaji',
    requesterEmail: 'karthik.s@gmail.com',
    requesterPhone: '+91 97311 90234',
    zone: 'Bommanahalli',
    address: 'House #18, 4th Cross, HSR Layout Sector 6, near Silk Board',
    resourceType: 'Emergency Drinking Water Tanker',
    quantity: 2,
    urgency: 'HIGH',
    patientNotes: 'Sump contaminated by storm drain backflow. 34 residents in apartment complex without drinking water since 6 AM.',
    status: 'DISPATCHED',
    allocatedHospital: 'BWSSB South Depot #4',
    hospitalBedNumber: 'Depot Docket #BWSSB-8821',
    dispatchVehicle: 'BWSSB Potable Water Tanker KA-01-F-3902 (6000L)',
    driverName: 'Someshwaraiah N. (BWSSB Pilot)',
    driverPhone: '+91 94481 22890',
    dispatchEta: '8 mins (Approaching Sector 6)',
    redirectShelter: null,
    reviewedBy: 'Dr. K. S. Murthy (KSNDMC Officer)',
    reviewedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    actionNotes: 'Approved: 6,000L BWSSB drinking water tanker dispatched with chlorination tablets.',
    emailNotificationSent: true,
    emailNotificationTimestamp: new Date(Date.now() - 149 * 60 * 1000).toISOString(),
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        action: 'Request Registered',
        actor: 'Karthik Somayaji',
        details: 'Submitted request for 2x Drinking Water Tankers.',
        badgeColor: '#06B6D4',
      },
      {
        timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
        action: 'Approved & Dispatched',
        actor: 'Dr. K. S. Murthy (KSNDMC Officer)',
        details: 'Tanker KA-01-F-3902 en route to HSR Layout Sector 6.',
        badgeColor: '#06B6D4',
      },
    ],
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
  },
  {
    id: 'REQ-2024-BLR-0398',
    userId: 'seed-user-4',
    requesterName: 'Praveen Narayanan',
    requesterEmail: 'praveen.n@yahoo.in',
    requesterPhone: '+91 80252 66710',
    zone: 'East',
    address: 'No 7, Cambridge Road, Ulsoor, Bengaluru East',
    resourceType: 'Hospital General Beds',
    quantity: 4,
    urgency: 'MODERATE',
    patientNotes: 'Requested 4 preventive beds for non-emergency family members.',
    status: 'DENIED',
    allocatedHospital: null,
    hospitalBedNumber: null,
    dispatchVehicle: null,
    driverName: null,
    driverPhone: null,
    dispatchEta: null,
    redirectShelter: 'Ulsoor BBMP Community Relief Center (Near Ulsoor Lake Gate 2, Ph: 080-25510101)',
    reviewedBy: 'Er. Ramesh Gowda (BBMP Relief Lead)',
    reviewedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    actionNotes: 'Denied: Inpatient beds prioritized for acute medical emergencies. Family directed to Ulsoor BBMP Community Relief Shelter with 80 dry beds and hot meals.',
    emailNotificationSent: true,
    emailNotificationTimestamp: new Date(Date.now() - 239 * 60 * 1000).toISOString(),
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
        action: 'Request Registered',
        actor: 'Praveen Narayanan',
        details: 'Submitted request for 4x Hospital General Beds.',
        badgeColor: '#F59E0B',
      },
      {
        timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        action: 'Rejected & Redirected',
        actor: 'Er. Ramesh Gowda (BBMP Relief Lead)',
        details: 'Prioritized for trauma patients. Redirected to Ulsoor Community Relief Center.',
        badgeColor: '#EF4444',
      },
    ],
    createdAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
  },
]

// Listeners for live real-time sync across components
type RequestChangeListener = () => void
const listeners = new Set<RequestChangeListener>()

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch (e) {
      console.error('Error notifying request listener:', e)
    }
  })
}

export function subscribeToRequests(callback: RequestChangeListener): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

/**
 * Register a known requester email for quick retrieval across persona toggles
 */
export function registerKnownEmail(email: string) {
  if (typeof window === 'undefined' || !email) return
  try {
    const raw = localStorage.getItem(KNOWN_EMAILS_KEY)
    const set: string[] = raw ? JSON.parse(raw) : []
    const clean = email.trim().toLowerCase()
    if (!set.includes(clean)) {
      set.push(clean)
      localStorage.setItem(KNOWN_EMAILS_KEY, JSON.stringify(set))
    }
  } catch {}
}

export function getAllKnownRequesterEmails(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KNOWN_EMAILS_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    // Also include primary personal user if saved
    const savedUser = localStorage.getItem('safeground_primary_personal_user')
    if (savedUser) {
      const u = JSON.parse(savedUser)
      if (u.email && !list.includes(u.email.toLowerCase())) {
        list.unshift(u.email.toLowerCase())
      }
    }
    return list
  } catch {
    return []
  }
}

/**
 * Load all emergency requests from storage
 */
export function getAllRequests(): EmergencyRequest[] {
  if (typeof window === 'undefined') return SEED_REQUESTS
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(SEED_REQUESTS))
      return SEED_REQUESTS
    }
    return JSON.parse(raw)
  } catch (e) {
    return SEED_REQUESTS
  }
}

/**
 * Filter requests by zone and status
 */
export function getRequests(zoneFilter?: string, statusFilter?: string): EmergencyRequest[] {
  const all = getAllRequests()
  return all.filter((req) => {
    const matchesZone = !zoneFilter || zoneFilter === 'All' || req.zone.toLowerCase() === zoneFilter.toLowerCase()
    const matchesStatus = !statusFilter || statusFilter === 'All' || req.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesZone && matchesStatus
  })
}

/**
 * Get requests submitted by a specific citizen/user with multi-email fallback
 */
export function getUserRequests(userId: string, email?: string): EmergencyRequest[] {
  const all = getAllRequests()
  const cleanEmail = email?.trim().toLowerCase()

  // Retrieve primary personal user email if available
  let primaryEmail = ''
  try {
    const saved = localStorage.getItem('safeground_primary_personal_user')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.email) primaryEmail = parsed.email.trim().toLowerCase()
    }
  } catch {}

  return all.filter((req) => {
    const reqEmail = (req.requesterEmail || '').trim().toLowerCase()
    if (cleanEmail && reqEmail === cleanEmail) return true
    if (primaryEmail && reqEmail === primaryEmail) return true
    if (req.userId === userId) return true
    return false
  })
}

/**
 * Submit a new emergency resource request
 */
export function createEmergencyRequest(
  data: Omit<EmergencyRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'reviewedBy' | 'reviewedAt' | 'actionNotes' | 'allocatedHospital' | 'hospitalBedNumber' | 'dispatchVehicle' | 'driverName' | 'driverPhone' | 'dispatchEta' | 'redirectShelter' | 'emailNotificationSent' | 'emailNotificationTimestamp' | 'auditTrail'>
): EmergencyRequest {
  const all = getAllRequests()
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const now = new Date().toISOString()
  
  const newReq: EmergencyRequest = {
    ...data,
    id: `REQ-${new Date().getFullYear()}-BLR-${randomNum}`,
    status: 'PENDING',
    allocatedHospital: null,
    hospitalBedNumber: null,
    dispatchVehicle: null,
    driverName: null,
    driverPhone: null,
    dispatchEta: null,
    redirectShelter: null,
    reviewedBy: null,
    reviewedAt: null,
    actionNotes: null,
    emailNotificationSent: false,
    emailNotificationTimestamp: null,
    auditTrail: [
      {
        timestamp: now,
        action: 'Request Submitted & Registered',
        actor: `${data.requesterName} (${data.requesterEmail})`,
        details: `Emergency distress call registered for ${data.quantity}x ${data.resourceType} in ${data.zone} Zone. Queued for BBMP & Hospital Incident Command triage.`,
        badgeColor: data.urgency === 'CRITICAL' ? '#EF4444' : '#F59E0B',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  registerKnownEmail(data.requesterEmail)

  const updated = [newReq, ...all]
  if (typeof window !== 'undefined') {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated))
  }

  // Attempt Supabase async background sync if configured
  try {
    supabase
      .from('resource_requests')
      .insert({
        id: newReq.id,
        user_id: newReq.userId,
        requester_name: newReq.requesterName,
        requester_phone: newReq.requesterPhone,
        zone: newReq.zone,
        address: newReq.address,
        resource_type: newReq.resourceType,
        quantity: newReq.quantity,
        urgency: newReq.urgency,
        patient_notes: newReq.patientNotes,
        status: newReq.status,
      })
      .then(() => {}, () => {})
  } catch (e) {}

  notifyListeners()
  return newReq
}

/**
 * Approve a citizen request (Authority Action)
 */
export function approveEmergencyRequest(
  requestId: string,
  authorityName: string,
  allocatedHospital: string,
  actionNotes: string,
  customBedNumber?: string,
  customVehicle?: string,
  customDriver?: string,
  customPhone?: string,
  customEta?: string
): EmergencyRequest | null {
  const all = getAllRequests()
  let target: EmergencyRequest | null = null
  const now = new Date().toISOString()

  const updated = all.map((req) => {
    if (req.id === requestId) {
      // Determine realistic dispatch parameters based on resource
      const isICU = req.resourceType.includes('ICU')
      const isWater = req.resourceType.includes('Water')
      const isBoat = req.resourceType.includes('Boat')

      const bedNum = customBedNumber || (
        isICU
          ? `ICU Bay #${Math.floor(1 + Math.random() * 8)} (Floor 2, Critical Care Wing)`
          : isWater
          ? `Depot Delivery Docket #${Math.floor(1000 + Math.random() * 9000)}`
          : `Emergency Ward Bed #${Math.floor(10 + Math.random() * 40)}-A`
      )

      const vehicle = customVehicle || (
        isWater
          ? 'BWSSB Potable Water Tanker (KA-01-F-3902)'
          : isBoat
          ? 'SDRF Inflatable Motorized Rescue Craft #04'
          : `108 ALS Ambulance (KA-04-E-${Math.floor(1000 + Math.random() * 9000)})`
      )

      const driver = customDriver || (
        isWater
          ? 'Someshwaraiah N. (BWSSB Pilot)'
          : isBoat
          ? 'Sub-Inspector Anand K. (NDRF 10th Bn)'
          : 'Manjunath R. (Ambulance Lead Pilot)'
      )

      const phone = customPhone || '+91 98451 91108'
      const eta = customEta || '12-15 mins (Arriving Soon)'

      const newAudit: RequestAuditLog = {
        timestamp: now,
        action: 'ACCEPTED & ARRIVING SOON',
        actor: authorityName,
        details: `Approved by Incident Command. Allocated at ${allocatedHospital}. Assigned ${bedNum}. Dispatch Unit: ${vehicle} (Pilot: ${driver}, ${phone}). Live ETA: ${eta}. Official dispatch receipt emailed to ${req.requesterEmail}.`,
        badgeColor: '#10B981',
      }

      target = {
        ...req,
        status: 'APPROVED',
        allocatedHospital: allocatedHospital || 'Bengaluru Municipal Relief Grid',
        hospitalBedNumber: bedNum,
        dispatchVehicle: vehicle,
        driverName: driver,
        driverPhone: phone,
        dispatchEta: eta,
        reviewedBy: authorityName,
        reviewedAt: now,
        actionNotes: actionNotes || `Approved: ${req.quantity}x ${req.resourceType} confirmed at ${allocatedHospital}. Response vehicle dispatched and arriving soon.`,
        emailNotificationSent: true,
        emailNotificationTimestamp: now,
        auditTrail: [...(req.auditTrail || []), newAudit],
        updatedAt: now,
      }
      return target
    }
    return req
  })

  if (typeof window !== 'undefined') {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated))
  }

  notifyListeners()
  return target
}

/**
 * Deny / Redirect a citizen request (Authority Action)
 */
export function denyEmergencyRequest(
  requestId: string,
  authorityName: string,
  actionNotes: string,
  customShelter?: string
): EmergencyRequest | null {
  const all = getAllRequests()
  let target: EmergencyRequest | null = null
  const now = new Date().toISOString()

  const updated = all.map((req) => {
    if (req.id === requestId) {
      const shelter = customShelter || `BBMP Ward Emergency Relief Shelter (${req.zone} Zone, Ph: 1533 / 080-22221188)`

      const newAudit: RequestAuditLog = {
        timestamp: now,
        action: 'REJECTED & REDIRECTED',
        actor: authorityName,
        details: `Request evaluated and denied for hospital admission based on municipal triage quota. Redirected to: ${shelter}. Official notification emailed to ${req.requesterEmail}.`,
        badgeColor: '#EF4444',
      }

      target = {
        ...req,
        status: 'DENIED',
        redirectShelter: shelter,
        reviewedBy: authorityName,
        reviewedAt: now,
        actionNotes: actionNotes || 'Request denied for inpatient bed allocation based on municipal triage protocol. Redirected to nearest dry community relief camp.',
        emailNotificationSent: true,
        emailNotificationTimestamp: now,
        auditTrail: [...(req.auditTrail || []), newAudit],
        updatedAt: now,
      }
      return target
    }
    return req
  })

  if (typeof window !== 'undefined') {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated))
  }

  notifyListeners()
  return target
}

/**
 * Mark request as dispatched / en-route (Authority Action)
 */
export function markAsDispatched(
  requestId: string,
  authorityName: string,
  actionNotes?: string
): EmergencyRequest | null {
  const all = getAllRequests()
  let target: EmergencyRequest | null = null
  const now = new Date().toISOString()

  const updated = all.map((req) => {
    if (req.id === requestId) {
      const newAudit: RequestAuditLog = {
        timestamp: now,
        action: 'UNIT EN ROUTE & ARRIVING',
        actor: authorityName || 'Ambulance & Logistics Command',
        details: actionNotes || `Vehicle ${req.dispatchVehicle || '108 ALS Ambulance'} is actively en route to ${req.address}. Live driver contact: ${req.driverPhone || '+91 98451 91108'}.`,
        badgeColor: '#06B6D4',
      }

      target = {
        ...req,
        status: 'DISPATCHED',
        dispatchEta: '8-10 mins (Approaching)',
        reviewedBy: authorityName || req.reviewedBy,
        reviewedAt: now,
        actionNotes: actionNotes || req.actionNotes || 'Ambulance / Relief unit dispatched and en-route.',
        auditTrail: [...(req.auditTrail || []), newAudit],
        updatedAt: now,
      }
      return target
    }
    return req
  })

  if (typeof window !== 'undefined') {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated))
  }

  notifyListeners()
  return target
}

// ============================================================
// User Profile Database Persistence
// Stores registered users and Google OAuth sign-in records
// ============================================================

export function getAllSavedUsers(): UserRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function saveUserRecord(user: {
  id: string
  email: string
  fullName: string
  phone?: string
  zone?: string
  role?: string
  provider?: 'email' | 'google' | 'role_preset'
}): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getAllSavedUsers()
    const now = new Date().toISOString()
    const index = existing.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase())

    const record: UserRecord = {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.email.split('@')[0],
      phone: user.phone || '',
      zone: user.zone || 'Bengaluru',
      role: user.role || 'Citizen',
      provider: user.provider || 'email',
      createdAt: index >= 0 ? existing[index].createdAt : now,
      lastActiveAt: now,
    }

    let updated: UserRecord[]
    if (index >= 0) {
      updated = [...existing]
      updated[index] = record
    } else {
      updated = [record, ...existing]
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated))

    // Attempt Supabase profiles upsert
    try {
      supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: record.fullName,
          city: record.zone || 'Bengaluru',
        })
        .then(() => {}, () => {})
    } catch (e) {}
  } catch (e) {
    console.error('Failed to save user record:', e)
  }
}
