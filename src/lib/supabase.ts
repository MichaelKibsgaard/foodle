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
      user_stats: {
        Row: {
          user_id: string;
          games_played: number;
          games_won: number;
          current_streak: number;
          best_streak: number;
          last_played: string; // ISO date string
        };
        Insert: {
          user_id: string;
          games_played?: number;
          games_won?: number;
          current_streak?: number;
          best_streak?: number;
          last_played?: string;
        };
        Update: {
          user_id?: string;
          games_played?: number;
          games_won?: number;
          current_streak?: number;
          best_streak?: number;
          last_played?: string;
        };
      };

      anonymous_game_results: {
        Row: {
          id: string;
          session_id: string;
          recipe_id: string;
          recipe_name: string;
          attempts: number;
          hints_used: number;
          time_spent: number;
          won: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          recipe_id: string;
          recipe_name: string;
          attempts: number;
          hints_used: number;
          time_spent: number;
          won: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          recipe_id?: string;
          recipe_name?: string;
          attempts?: number;
          hints_used?: number;
          time_spent?: number;
          won?: boolean;
          created_at?: string;
        };
      };
    }
  }
} 