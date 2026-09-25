import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          city: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          city?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          city?: string
        }
      }
      checklist_items: {
        Row: {
          id: string
          user_id: string
          task: string
          category: string | null
          priority: string | null
          completed: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task: string
          category?: string | null
          priority?: string | null
          completed?: boolean
        }
        Update: {
          completed?: boolean
          updated_at?: string
        }
      }
      simulation_runs: {
        Row: {
          id: string
          user_id: string | null
          inputs: Record<string, unknown>
          results: Record<string, unknown>
          created_at: string
        }
        Insert: {
          user_id?: string | null
          inputs: Record<string, unknown>
          results: Record<string, unknown>
        }
        Update: Record<string, never>
      }
      alerts: {
        Row: {
          id: string
          title: string
          severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
          zone: string
          message: string
          created_at: string
          is_active: boolean
        }
      }
    }
  }
}
