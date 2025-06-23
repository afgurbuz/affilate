// Supabase Database Types
// Auto-generated and manually extended types for better TypeScript support

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          bio: string | null
          avatar_url: string | null
          role_id: string
          plan_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          bio?: string | null
          avatar_url?: string | null
          role_id: string
          plan_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          bio?: string | null
          avatar_url?: string | null
          role_id?: string
          plan_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          name: string
          permissions: any
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          permissions?: any
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          permissions?: any
          created_at?: string
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
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          max_posts: number
          max_products_per_post: number
          price?: number
          features?: any
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          max_posts?: number
          max_products_per_post?: number
          price?: number
          features?: any
          is_active?: boolean
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
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          caption?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          caption?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
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
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          name: string
          description?: string | null
          affiliate_url: string
          x_coordinate: number
          y_coordinate: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          name?: string
          description?: string | null
          affiliate_url?: string
          x_coordinate?: number
          y_coordinate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clicks: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          clicked_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          clicked_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          clicked_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Extended types with relationships
export interface UserWithRelations extends Database['public']['Tables']['users']['Row'] {
  role?: Database['public']['Tables']['user_roles']['Row'] | any
  plan?: Database['public']['Tables']['subscription_plans']['Row'] | any
}

export interface PostWithRelations extends Database['public']['Tables']['posts']['Row'] {
  user?: Pick<Database['public']['Tables']['users']['Row'], 'username' | 'avatar_url'> | any
  products?: Database['public']['Tables']['products']['Row'][] | any
  product_count?: number
}

export interface ProductWithRelations extends Database['public']['Tables']['products']['Row'] {
  post?: Pick<Database['public']['Tables']['posts']['Row'], 'caption' | 'user_id'> | any
  clicks?: Database['public']['Tables']['clicks']['Row'][] | any
}

export interface ClickWithRelations extends Database['public']['Tables']['clicks']['Row'] {
  product?: Pick<Database['public']['Tables']['products']['Row'], 'name'> | any
}

// API Response types
export interface SupabaseResponse<T> {
  data: T | null
  error: any | null
}

export interface SupabaseListResponse<T> {
  data: T[] | null
  error: any | null
  count?: number | null
}