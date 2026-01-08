import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Public client for all operations (uses anon key with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  first_name: string
  last_name: string
  age?: number
  gender?: string
  leadership_experience?: number
  created_at: string
}

export interface Assessment {
  id: string
  user_id: string
  answers: Record<string, number>
  vision_score?: number
  people_score?: number
  execution_score?: number
  extraversion_score?: number
  introversion_score?: number
  personality_type?: string
  vision_self?: number
  people_self?: number
  execution_self?: number
  created_at: string
}

export interface TestLink {
  id: string
  link_code: string
  is_used: boolean
  created_at: string
  used_at?: string
  show_results_immediately?: boolean | null
  expires_at?: string | null
  single_use?: boolean
}

export interface Setting {
  id: string
  key: string
  value: boolean
}

export interface Profile {
  code: string
  title: string
  style_name: string
  dominant_orientation: string
  supporting_orientation: string
  blind_spot: string
  description: string
  strengths: string[]
  development_areas: string[]
  pitfalls: string[]
}

export interface Question {
  id: string
  domain: string
  component: string
  text: string
  tag: string
}

export interface AdminUser {
  id: string
  user_id: string
  email: string
  created_at: string
  created_by?: string
  is_active: boolean
}

export interface AccessRequest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  organization?: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  generated_link_id?: string
}