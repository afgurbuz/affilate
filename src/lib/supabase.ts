import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client
export const createClientComponentClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Admin client (server-only)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : null

// Database types
export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          name: string
          permissions: any
        }
        Insert: {
          id?: string
          name: string
          permissions?: any
        }
        Update: {
          id?: string
          name?: string
          permissions?: any
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          max_posts: number
          max_products_per_post: number
          price: number
          features: any
        }
        Insert: {
          id?: string
          name: string
          max_posts: number
          max_products_per_post: number
          price: number
          features?: any
        }
        Update: {
          id?: string
          name?: string
          max_posts?: number
          max_products_per_post?: number
          price?: number
          features?: any
        }
      }
      users: {
        Row: {
          id: string
          username: string
          email: string
          bio: string | null
          avatar_url: string | null
          role_id: string
          plan_id: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          bio?: string | null
          avatar_url?: string | null
          role_id: string
          plan_id: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          bio?: string | null
          avatar_url?: string | null
          role_id?: string
          plan_id?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          image_url: string
          caption: string | null
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          caption?: string | null
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          caption?: string | null
          is_published?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          post_id: string
          name: string
          description: string | null
          affiliate_url: string
          x_coordinate: number
          y_coordinate: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          name: string
          description?: string | null
          affiliate_url: string
          x_coordinate: number
          y_coordinate: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          name?: string
          description?: string | null
          affiliate_url?: string
          x_coordinate?: number
          y_coordinate?: number
          created_at?: string
        }
      }
      clicks: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          clicked_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          clicked_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          clicked_at?: string
        }
      }
    }
  }
}