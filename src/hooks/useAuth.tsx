import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { saveUserRecord } from '../services/requestService'

export type UserRole = 'citizen' | 'ksndmc' | 'bbmp' | 'hospital'

export interface SafeGroundUserMetadata {
  full_name: string
  role?: string
  department?: string
  badge?: string
  role_key?: UserRole
  phone?: string
  zone?: string
}

export function getActiveRole(user: any): UserRole {
  if (!user) return 'citizen'
  if (user.user_metadata?.role_key) return user.user_metadata.role_key as UserRole
  const email = (user.email || '').toLowerCase()
  if (email.includes('hospital') || email.includes('hegde')) return 'hospital'
  if (email.includes('ksndmc') || email.includes('murthy')) return 'ksndmc'
  if (email.includes('bbmp') || email.includes('gowda')) return 'bbmp'
  const roleStr = (user.user_metadata?.role || '').toLowerCase()
  if (roleStr.includes('hospital') || roleStr.includes('triage') || roleStr.includes('doctor')) return 'hospital'
  if (roleStr.includes('ksndmc') || roleStr.includes('telemetry')) return 'ksndmc'
  if (roleStr.includes('bbmp') || roleStr.includes('relief')) return 'bbmp'
  return 'citizen'
}

export interface AuthState {
  user: (User & { user_metadata?: SafeGroundUserMetadata }) | null
  currentRole: UserRole
  session: Session | null
  loading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, phone?: string, zone?: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  loginAsGuest: () => void
  loginAsRole: (role: UserRole) => void
  signOut: () => Promise<void>
}

const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder'))
}

export const ROLE_PRESETS: Record<UserRole, { email: string; name: string; title: string; dept: string }> = {
  citizen: {
    email: 'priya.citizen@safeground.blr',
    name: 'Priya Ramanathan',
    title: 'Bengaluru Resident',
    dept: 'Citizen Preparedness',
  },
  ksndmc: {
    email: 'k.murthy@ksndmc.kar.nic.in',
    name: 'Dr. K. S. Murthy',
    title: 'KSNDMC Telemetry Officer',
    dept: 'Karnataka Disaster Monitoring Centre',
  },
  bbmp: {
    email: 'ramesh.gowda@bbmp.gov.in',
    name: 'Er. Ramesh Gowda',
    title: 'BBMP Disaster Relief Lead',
    dept: 'Stormwater Drain & Relief Dept',
  },
  hospital: {
    email: 'shalini.hegde@victoria.blr.gov.in',
    name: 'Dr. Shalini Hegde',
    title: 'Chief Hospital Coordinator',
    dept: 'Bengaluru Emergency Hospital Network',
  },
}

export const FIXED_AUTHORITIES = {
  bbmp: {
    email: 'bbmp@safeground.blr',
    username: 'bbmp',
    password: 'bbmp1234',
    name: 'Er. Ramesh Gowda',
    role: 'BBMP Disaster Relief Lead',
    dept: 'Stormwater Drain & Relief Dept',
    badge: 'BBMP-COMMANDER',
    role_key: 'bbmp' as UserRole,
    zone: 'Bengaluru Central & East',
    phone: '+91 80222 21188',
  },
  ksndmc: {
    email: 'ksndmc@safeground.blr',
    username: 'ksndmc',
    password: 'ksndmc1234',
    name: 'Dr. K. S. Murthy',
    role: 'KSNDMC Telemetry Officer',
    dept: 'Karnataka Disaster Monitoring Centre',
    badge: 'KSNDMC-OFFICER',
    role_key: 'ksndmc' as UserRole,
    zone: 'Bengaluru Urban & Rural',
    phone: '+91 80223 40676',
  },
  hospital: {
    email: 'hospital@safeground.blr',
    username: 'hospital',
    password: 'hospital1234',
    name: 'Dr. Shalini Hegde',
    role: 'Chief Medical & Bed Coordinator',
    dept: 'Bengaluru Hospital Disaster Response',
    badge: 'HOSPITAL-TRIAGE',
    role_key: 'bbmp' as UserRole,
    zone: 'Yelahanka & North Hospitals',
    phone: '+91 80285 61122',
  },
  citizen: {
    email: 'citizen@safeground.blr',
    username: 'citizen',
    password: 'citizen1234',
    name: 'Priya Ramanathan',
    role: 'Bengaluru Resident',
    dept: 'Citizen Preparedness',
    badge: 'RESIDENT',
    role_key: 'citizen' as UserRole,
    zone: 'Yelahanka',
    phone: '+91 98450 77123',
  },
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { user_metadata?: SafeGroundUserMetadata }) | null>(() => {
    try {
      const saved = localStorage.getItem('safeground_user') || localStorage.getItem('safeground_guest_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    // Check initial local storage
    const saved = localStorage.getItem('safeground_user') || localStorage.getItem('safeground_guest_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        setLoading(false)
        return
      } catch {
        localStorage.removeItem('safeground_user')
        localStorage.removeItem('safeground_guest_user')
      }
    }

    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setUser(session.user as any)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        setUser(session.user as any)
      } else {
        const local = localStorage.getItem('safeground_user')
        if (!local) setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isConfigured])

  const saveLocalUser = (mockUser: any, provider: 'email' | 'google' | 'role_preset' = 'email') => {
    localStorage.setItem('safeground_user', JSON.stringify(mockUser))
    setUser(mockUser)
    saveUserRecord({
      id: mockUser.id,
      email: mockUser.email,
      fullName: mockUser.user_metadata?.full_name || mockUser.email,
      phone: mockUser.user_metadata?.phone,
      zone: mockUser.user_metadata?.zone,
      role: mockUser.user_metadata?.role || 'Citizen',
      provider,
    })
  }

  const loginAsRole = (role: UserRole) => {
    const preset = ROLE_PRESETS[role]
    const mockUser: any = {
      id: `role-${role}-${Date.now()}`,
      email: preset.email,
      user_metadata: {
        full_name: preset.name,
        role: preset.title,
        department: preset.dept,
        badge: role.toUpperCase(),
        role_key: role,
        zone: role === 'bbmp' ? 'Bengaluru Central / East' : role === 'ksndmc' ? 'Bengaluru Urban & Rural' : 'Yelahanka',
      },
      aud: 'authenticated',
      role: 'authenticated',
    }
    saveLocalUser(mockUser, 'role_preset')
  }

  const loginAsGuest = () => {
    loginAsRole('citizen')
  }

  const signIn = async (rawEmail: string, rawPass: string) => {
    const input = (rawEmail || '').trim().toLowerCase()
    const pass = (rawPass || '').trim()

    // 1. Check fixed authority accounts (instant login for BBMP, KSNDMC, Hospital, Citizen)
    for (const authKey of Object.keys(FIXED_AUTHORITIES) as Array<keyof typeof FIXED_AUTHORITIES>) {
      const auth = FIXED_AUTHORITIES[authKey]
      if ((input === auth.email.toLowerCase() || input === auth.username.toLowerCase()) && pass === auth.password) {
        const mockUser: any = {
          id: `fixed-${authKey}`,
          email: auth.email,
          user_metadata: {
            full_name: auth.name,
            role: auth.role,
            department: auth.dept,
            badge: auth.badge,
            role_key: auth.role_key,
            zone: auth.zone,
            phone: auth.phone,
          },
          aud: 'authenticated',
          role: 'authenticated',
        }
        saveLocalUser(mockUser, 'role_preset')
        return { error: null }
      }
    }

    if (!isConfigured) {
      const namePart = input.split('@')[0].replace('.', ' ')
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
      const mockUser: any = {
        id: 'user-' + Date.now(),
        email: rawEmail,
        user_metadata: {
          full_name: formattedName,
          role: 'Verified Resident',
          department: 'Bengaluru Citizen',
          zone: 'Yelahanka',
        },
        aud: 'authenticated',
        role: 'authenticated',
      }
      saveLocalUser(mockUser, 'email')
      return { error: null }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: rawEmail, password: rawPass })
    if (data?.user) {
      setUser(data.user as any)
      setSession(data.session)
      localStorage.setItem('safeground_user', JSON.stringify(data.user))
      saveUserRecord({
        id: data.user.id,
        email: data.user.email || rawEmail,
        fullName: data.user.user_metadata?.full_name || rawEmail,
        phone: data.user.user_metadata?.phone,
        zone: data.user.user_metadata?.zone,
        role: data.user.user_metadata?.role || 'Resident',
        provider: 'email',
      })
    }
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, fullName: string, phone?: string, zone?: string) => {
    if (!isConfigured) {
      const mockUser: any = {
        id: 'user-' + Date.now(),
        email,
        user_metadata: {
          full_name: fullName || email.split('@')[0],
          phone: phone || '',
          zone: zone || 'Yelahanka',
          role: 'Registered Citizen',
          department: 'Community Volunteer',
        },
        aud: 'authenticated',
        role: 'authenticated',
      }
      saveLocalUser(mockUser, 'email')
      return { error: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone || '', zone: zone || 'Yelahanka' } },
    })
    if (data?.user) {
      setUser(data.user as any)
      setSession(data.session)
      localStorage.setItem('safeground_user', JSON.stringify(data.user))
      saveUserRecord({
        id: data.user.id,
        email: data.user.email || email,
        fullName,
        phone: phone || '',
        zone: zone || 'Yelahanka',
        role: 'Citizen',
        provider: 'email',
      })
    }
    return { error: error?.message ?? null }
  }

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      const mockUser: any = {
        id: 'google-user-' + Date.now(),
        email: 'bengaluru.resident@gmail.com',
        user_metadata: {
          full_name: 'Bengaluru Resident',
          phone: '+91 98450 88219',
          zone: 'Yelahanka',
          role: 'Google Verified Citizen',
          department: 'Greater Bengaluru Network',
        },
        aud: 'authenticated',
        role: 'authenticated',
      }
      saveLocalUser(mockUser, 'google')
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      return { error: error?.message ?? null }
    } catch (e: any) {
      return { error: e.message || 'Google OAuth failed' }
    }
  }

  const signOut = async () => {
    localStorage.removeItem('safeground_user')
    localStorage.removeItem('safeground_guest_user')
    if (isConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (e) {}
    }
    setUser(null)
    setSession(null)
  }

  const value: AuthState = {
    user,
    currentRole: getActiveRole(user),
    session,
    loading,
    isConfigured,
    signIn,
    signUp,
    signInWithGoogle,
    loginAsGuest,
    loginAsRole,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('safeground_user') || localStorage.getItem('safeground_guest_user')) : null
    let fallbackUser = null
    try {
      if (saved) fallbackUser = JSON.parse(saved)
    } catch {}
    return {
      user: fallbackUser,
      currentRole: getActiveRole(fallbackUser),
      session: null,
      loading: false,
      isConfigured: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signInWithGoogle: async () => ({ error: null }),
      loginAsGuest: () => {},
      loginAsRole: () => {},
      signOut: async () => {
        localStorage.removeItem('safeground_user')
        localStorage.removeItem('safeground_guest_user')
      },
    }
  }
  return context
}
