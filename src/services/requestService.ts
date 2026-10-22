// ============================================================
// SafeGround Emergency Resource Request & User Database Service
// Handles citizen requests (ICU beds, general beds, water, boats)
// and authority approvals/denials with persistent dual-storage.
// ============================================================

import { supabase } from '../lib/supabase'

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MODERATE'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'DENIED'

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
  reviewedBy?: string | null
  reviewedAt?: string | null
  actionNotes?: string | null
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
    reviewedBy: null,
    reviewedAt: null,
    actionNotes: null,
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
    reviewedBy: 'Er. Ramesh Gowda (BBMP Relief Lead)',
    reviewedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    actionNotes: 'Approved: 2 General Beds reserved at Sakra World Hospital. 108 Ambulance KA-04-E-1882 dispatched via Outer Ring Road.',
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
    reviewedBy: 'Dr. K. S. Murthy (KSNDMC Officer)',
    reviewedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    actionNotes: 'Approved: 6,000L BWSSB drinking water tanker dispatched with chlorination tablets.',
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
    reviewedBy: 'Er. Ramesh Gowda (BBMP Relief Lead)',
    reviewedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    actionNotes: 'Denied: Inpatient beds prioritized for acute medical emergencies. Family directed to Ulsoor BBMP Community Relief Shelter with 80 dry beds.',
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
 * Get requests submitted by a specific citizen/user
 */
export function getUserRequests(userId: string, email?: string): EmergencyRequest[] {
  const all = getAllRequests()
  return all.filter((req) => {
    if (req.userId === userId) return true
    if (email && req.requesterEmail.toLowerCase() === email.toLowerCase()) return true
    return false
  })
}

/**
 * Submit a new emergency resource request
 */
export function createEmergencyRequest(
  data: Omit<EmergencyRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'reviewedBy' | 'reviewedAt' | 'actionNotes' | 'allocatedHospital'>
): EmergencyRequest {
  const all = getAllRequests()
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const newReq: EmergencyRequest = {
    ...data,
    id: `REQ-${new Date().getFullYear()}-BLR-${randomNum}`,
    status: 'PENDING',
    allocatedHospital: null,
    reviewedBy: null,
    reviewedAt: null,
    actionNotes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

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
  actionNotes: string
): EmergencyRequest | null {
  const all = getAllRequests()
  let target: EmergencyRequest | null = null

  const updated = all.map((req) => {
    if (req.id === requestId) {
      target = {
        ...req,
        status: 'APPROVED',
        allocatedHospital: allocatedHospital || 'Bengaluru Municipal Relief Grid',
        reviewedBy: authorityName,
        reviewedAt: new Date().toISOString(),
        actionNotes: actionNotes || `Approved: Resources allocated at ${allocatedHospital}. Response unit notified.`,
        updatedAt: new Date().toISOString(),
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
  actionNotes: string
): EmergencyRequest | null {
  const all = getAllRequests()
  let target: EmergencyRequest | null = null

  const updated = all.map((req) => {
    if (req.id === requestId) {
      target = {
        ...req,
        status: 'DENIED',
        reviewedBy: authorityName,
        reviewedAt: new Date().toISOString(),
        actionNotes: actionNotes || 'Request denied / redirected based on municipal triage protocol.',
        updatedAt: new Date().toISOString(),
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

  const updated = all.map((req) => {
    if (req.id === requestId) {
      target = {
        ...req,
        status: 'DISPATCHED',
        reviewedBy: authorityName || req.reviewedBy,
        reviewedAt: new Date().toISOString(),
        actionNotes: actionNotes || req.actionNotes || 'Ambulance / Relief unit dispatched and en-route.',
        updatedAt: new Date().toISOString(),
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
