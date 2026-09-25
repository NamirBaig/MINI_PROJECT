import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  loginAsGuest: () => void
  signOut: () => Promise<void>
}

const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder'))
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    // Check local storage for guest session
    const guestUser = localStorage.getItem('safeground_guest_user')
    if (guestUser) {
      try {
        setUser(JSON.parse(guestUser))
        setLoading(false)
        return
      } catch (e) {}
    }

    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isConfigured])

  const loginAsGuest = () => {
    const mockUser: any = {
      id: 'guest-blr-user',
      email: 'citizen@safeground.blr',
      user_metadata: { full_name: 'Bengaluru Citizen' },
      aud: 'authenticated',
      role: 'authenticated',
    }
    localStorage.setItem('safeground_guest_user', JSON.stringify(mockUser))
    setUser(mockUser)
  }

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      // Demo login
      const mockUser: any = {
        id: 'demo-' + Date.now(),
        email,
        user_metadata: { full_name: email.split('@')[0] },
      }
      localStorage.setItem('safeground_guest_user', JSON.stringify(mockUser))
      setUser(mockUser)
      return { error: null }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isConfigured) {
      // Demo signup
      const mockUser: any = {
        id: 'demo-' + Date.now(),
        email,
        user_metadata: { full_name: fullName || email.split('@')[0] },
      }
      localStorage.setItem('safeground_guest_user', JSON.stringify(mockUser))
      setUser(mockUser)
      return { error: null }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: error?.message ?? null }
  }

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      // Gracefully authenticate as Google Demo User without redirecting to dead placeholder server
      const mockUser: any = {
        id: 'google-demo-' + Date.now(),
        email: 'bengaluru.resident@gmail.com',
        user_metadata: { full_name: 'Bengaluru Resident', avatar_url: '' },
      }
      localStorage.setItem('safeground_guest_user', JSON.stringify(mockUser))
      setUser(mockUser)
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
    localStorage.removeItem('safeground_guest_user')
    if (isConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (e) {}
    }
    setUser(null)
    setSession(null)
  }

  return { user, session, loading, isConfigured, signIn, signUp, signInWithGoogle, loginAsGuest, signOut }
}
