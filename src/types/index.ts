// Main application types with flexible typing for Supabase joins
export interface User {
  id: string
  username: string
  email: string
  bio?: string | null
  avatar_url?: string | null
  role_id?: string
  plan_id?: string
  created_at: string
  updated_at?: string
  is_active?: boolean
  // Flexible types for complex Supabase joins
  role?: any
  plan?: any
}

export interface UserRole {
  id: string
  name: string
  permissions: any
  created_at?: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  max_posts: number
  max_products_per_post: number
  price: number
  features: any
  is_active?: boolean
  created_at?: string
  user_count?: number
}

export interface Post {
  id: string
  user_id: string
  image_url: string
  caption?: string | null
  is_published: boolean
  created_at: string
  updated_at?: string
  // Flexible types for joins and computed fields
  user?: any
  products?: any[]
  username?: string
  user_avatar?: string
  product_count?: number
}

export interface Product {
  id: string
  post_id: string
  name: string
  description?: string | null
  affiliate_url: string
  x_coordinate: number
  y_coordinate: number
  is_active?: boolean
  created_at: string
  updated_at?: string
  // Flexible types for joins
  post?: any
  clicks?: any[]
}

export interface Click {
  id: string
  product_id: string
  user_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
  referrer?: string | null
  clicked_at: string
  // Flexible types for joins
  product?: any
  product_name?: string
}

export interface CreatePostData {
  image_url: string
  caption?: string
  is_published?: boolean
}

export interface CreateProductData {
  post_id: string
  name: string
  description?: string
  affiliate_url: string
  x_coordinate: number
  y_coordinate: number
}

export interface UserStats {
  total_posts: number
  total_products: number
  total_clicks: number
  this_month_clicks: number
}

export interface PlatformStats {
  total_users: number
  total_posts: number
  total_clicks: number
  revenue: number
}