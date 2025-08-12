import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema
export interface Contact {
  id: string
  created_at: string
  user_id?: string
  name?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  email?: string
  company?: string
  status?: 'lead' | 'prospect' | 'client' | 'past_client'
  lead_score?: number
  urgency_level?: 'low' | 'medium' | 'high' | 'urgent'
  budget_range?: string
  property_interests?: string[]
  notes?: string
  source?: string
  assigned_agent?: string
  last_contact?: string
  next_follow_up?: string
  tags?: string[]
}

export interface CallLog {
  id: string
  created_at: string
  user_id?: string
  contact_id?: string
  call_sid?: string
  direction?: string
  duration?: number
  status?: string
  recording_url?: string
}

export interface VoiceCommand {
  id: string
  user_id?: string
  command_text: string
  parsed_data?: any
  action_type?: 'create_contact' | 'update_contact' | 'log_call' | 'schedule_follow_up'
  status?: 'pending' | 'processed' | 'error'
  error_message?: string
  created_at: string
  processed_at?: string
}

export interface Property {
  id: string
  property_id?: string
  address: string
  suburb?: string
  state?: string
  postcode?: string
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  car_spaces?: number
  price?: number
  price_display?: string
  status?: 'active' | 'pending' | 'sold' | 'withdrawn' | 'expired'
  listing_agent?: string
  listing_date?: string
  description?: string
}

export interface Deal {
  id: string
  contact_id?: string
  property_id?: string
  agent_id?: string
  deal_type: 'buyer' | 'seller'
  stage?: string
  value?: number
  commission_rate?: number
  estimated_commission?: number
  probability?: number
  expected_close_date?: string
  actual_close_date?: string
  notes?: string
}