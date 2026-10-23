import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { saveUserRecord, registerKnownEmail } from '../services/requestService'

export type UserRole = 'citizen' | 'authority' | 'ksndmc' | 'bbmp' | 'hospital'

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
  const roleKey = user.user_metadata?.role_key
  if (roleKey === 'authority' || roleKey === 'bbmp' || roleKey === 'ksndmc' || roleKey === 'hospital') {
    return 'authority'
  }
  const email = (user.email || '').toLowerCase()
  if (
    email.includes('authority') ||
    email.includes('bbmp') ||
    email.includes('ksndmc') ||
    email.includes('hospital') ||
    email.includes('hegde') ||
    email.includes('murthy') ||
    email.includes('gowda') ||
    email.endsWith('@safeground.blr') ||
    email.includes('gov.in') ||
    email.includes('nic.in')
  ) {
    return 'authority'
  }
  const roleStr = (user.user_metadata?.role || '').toLowerCase()
  if (
    roleStr.includes('authority') ||
    roleStr.includes('command') ||
    roleStr.includes('lead') ||
    roleStr.includes('officer') ||
    roleStr.includes('coordinator') ||
    roleStr.includes('hospital') ||
    roleStr.includes('triage') ||
    roleStr.includes('doctor') ||
    roleStr.includes('ksndmc') ||
    roleStr.includes('telemetry') ||
    roleStr.includes('bbmp') ||
    roleStr.includes('relief')
  ) {
    return 'authority'
  }
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
  signInWithGoogle: (customEmail?: string) => Promise<{ error: string | null }>
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
  authority: {
    email: 'authority@safeground.blr',
    name: 'Bengaluru Disaster Command',
    title: 'Disaster Operations Authority',
    dept: 'Integrated Emergency & Disaster Command (BBMP, KSNDMC & Health)',
  },
  ksndmc: {
    email: 'authority@safeground.blr',
    name: 'Bengaluru Disaster Command',
    title: 'Disaster Operations Authority',
    dept: 'Integrated Emergency & Disaster Command (BBMP, KSNDMC & Health)',
  },
  bbmp: {
    email: 'authority@safeground.blr',
    name: 'Bengaluru Disaster Command',
    title: 'Disaster Operations Authority',
    dept: 'Integrated Emergency & Disaster Command (BBMP, KSNDMC & Health)',
  },
  hospital: {
    email: 'authority@safeground.blr',
    name: 'Bengaluru Disaster Command',
    title: 'Disaster Operations Authority',
    dept: 'Integrated Emergency & Disaster Command (BBMP, KSNDMC & Health)',
  },
}

export const FIXED_AUTHORITIES = {
  authority: {
    email: 'authority@safeground.blr',
    username: 'authority',
    password: 'authority1234',
    name: 'Bengaluru Disaster Command',
    role: 'Disaster Operations Authority',
    dept: 'Integrated Emergency & Disaster Command (BBMP, KSNDMC & Health)',
    badge: 'COMMAND',
    role_key: 'authority' as UserRole,
    zone: 'All Bengaluru Zones (Grid Command)',
    phone: '1533 / 080-22221188',
  },
  bbmp: {
    email: 'authority@safeground.blr',
    username: 'bbmp',
    password: 'bbmp1234',
    name: 'Bengaluru Disaster Command',
    role: 'Disaster Operations Authority',
    dept: 'Integrated Emergency & Disaster Command (BBMP, KSNDMC & Health)',
    badge: 'COMMAND',
    role_key: 'authority' as UserRole,
    zone: 'All Bengaluru Zones (Grid Command)',
    phone: '1533 / 080-22221188',
  },
  ksndmc: {
    email: 'authority@safeground.blr',
    username: 'ksndmc',
    password: 'ksndmc1234',
    name: 'Bengaluru Disaster Command',
    role: 'Disaster Operations Authority',
    dept: 'Integrated Emergency & Disaster Command (BBMP, KSNDMC & Health)',
    badge: 'COMMAND',
    role_key: 'authority' as UserRole,
    zone: 'All Bengaluru Zones (Grid Command)',
    phone: '1533 / 080-22221188',
  },
  hospital: {
    email: 'authority@safeground.blr',
    username: 'hospital',
    password: 'hospital1234',
    name: 'Bengaluru Disaster Command',
    role: 'Disaster Operations Authority',
    dept: 'Integrated Emergency & Disaster Command (BBMP, KSNDMC & Health)',
    badge: 'COMMAND',
    role_key: 'authority' as UserRole,
    zone: 'All Bengaluru Zones (Grid Command)',
    phone: '1533 / 080-22221188',
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
    // Populate from cached local storage immediately to prevent flicker
    const saved = localStorage.getItem('safeground_user') || localStorage.getItem('safeground_guest_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
      } catch {
        localStorage.removeItem('safeground_user')
        localStorage.removeItem('safeground_guest_user')
      }
    }

    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Process Supabase auth user (including Google OAuth user)
    const processSupabaseUser = (sbUser: User) => {
      const meta = sbUser.user_metadata || {}
      const fullName = meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Verified Resident'
      const isGoogle = sbUser.app_metadata?.provider === 'google' || !!meta.avatar_url

      const formatted: any = {
        ...sbUser,
        user_metadata: {
          ...meta,
          full_name: fullName,
          role: meta.role || (isGoogle ? 'Google Verified Citizen' : 'Registered Citizen'),
          role_key: (meta.role_key || 'citizen') as UserRole,
          badge: meta.badge || (isGoogle ? 'GOOGLE VERIFIED' : 'CITIZEN'),
          zone: meta.zone || 'Yelahanka',
          phone: meta.phone || '',
        },
      }
      setUser(formatted)
      localStorage.setItem('safeground_user', JSON.stringify(formatted))
      saveUserRecord({
        id: sbUser.id,
        email: sbUser.email || '',
        fullName,
        role: formatted.user_metadata.role,
        provider: isGoogle ? 'google' : 'email',
      })
      return formatted
    }

    // Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        processSupabaseUser(session.user)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth changes (including Google OAuth redirects!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        processSupabaseUser(session.user)
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

    const email = (mockUser.email || '').toLowerCase()
    const isAuthority =
      email.includes('authority') ||
      email.endsWith('@safeground.blr') ||
      email.includes('bbmp.gov.in') ||
      email.includes('ksndmc.kar.nic.in') ||
      email.includes('victoria.blr.gov.in') ||
      mockUser.user_metadata?.role_key === 'authority' ||
      mockUser.user_metadata?.role_key === 'bbmp' ||
      mockUser.user_metadata?.role_key === 'ksndmc' ||
      mockUser.user_metadata?.role_key === 'hospital'

    if (!isAuthority) {
      try {
        localStorage.setItem('safeground_primary_personal_user', JSON.stringify(mockUser))
        registerKnownEmail(mockUser.email)
      } catch {}
    }

    saveUserRecord({
      id: mockUser.id,
      email: mockUser.email,
      fullName: mockUser.user_metadata?.full_name || mockUser.email,
      phone: mockUser.user_metadata?.phone,
      zone: mockUser.user_metadata?.zone,
      role: mockUser.user_metadata?.role || (isAuthority ? 'Disaster Operations Authority' : 'Citizen'),
      provider,
    })
  }

  const loginAsRole = (role: UserRole) => {
    if (role === 'citizen') {
      try {
        const savedPersonal = localStorage.getItem('safeground_primary_personal_user')
        if (savedPersonal) {
          const personalUser = JSON.parse(savedPersonal)
          localStorage.setItem('safeground_user', JSON.stringify(personalUser))
          setUser(personalUser)
          return
        }
      } catch {}
    }

    const targetKey: UserRole = role === 'citizen' ? 'citizen' : 'authority'
    const preset = ROLE_PRESETS[targetKey] || ROLE_PRESETS.authority
    const mockUser: any = {
      id: `role-${targetKey}-${Date.now()}`,
      email: preset.email,
      user_metadata: {
        full_name: preset.name,
        role: preset.title,
        department: preset.dept,
        badge: targetKey === 'citizen' ? 'RESIDENT' : 'COMMAND',
        role_key: targetKey,
        zone: targetKey === 'citizen' ? 'Yelahanka' : 'All Bengaluru Zones (Grid Command)',
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
      return { error: 'Supabase cloud configuration is missing.' }
    }

    try {
      const redirectTo = `${window.location.origin}/dashboard`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // Enforces Google to prompt for account chooser and permission consent screen ("Allow / Don't Allow")
          },
        },
      })

      if (error) {
        return { error: error.message }
      }
      return { error: null }
    } catch (err: any) {
      return { error: err?.message || 'Failed to initialize Google Sign-In' }
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
