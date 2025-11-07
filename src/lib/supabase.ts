import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types matching the updated schema
export interface Transaction {
  id?: string
  date: string
  type: 'expense' | 'income'
  amount: number
  currency: string
  category: string
  description?: string
  payment_method?: string
  fully_settled?: boolean // Matches database column name
  created_at?: string
}

export interface Category {
  id?: string
  name: string
  type: 'expense' | 'income'
  order?: number // Added for ordering
  created_at?: string
}

export interface PaymentMethod {
  id?: string
  name: string
  order?: number // Added for ordering
  created_at?: string
} 