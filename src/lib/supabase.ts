import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          name: string
          emoji: string
          ingredients: string[]
          difficulty: 'easy' | 'medium' | 'hard'
          category: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          emoji: string
          ingredients: string[]
          difficulty: 'easy' | 'medium' | 'hard'
          category: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          emoji?: string
          ingredients?: string[]
          difficulty?: 'easy' | 'medium' | 'hard'
          category?: string
          description?: string | null
          created_at?: string
        }
      }
      game_results: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          recipe_name: string
          attempts: number
          hints_used: number
          time_spent: number
          won: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          recipe_name: string
          attempts: number
          hints_used: number
          time_spent: number
          won: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          recipe_name?: string
          attempts?: number
          hints_used?: number
          time_spent?: number
          won?: boolean
          created_at?: string
        }
      }
    }
  }
} 