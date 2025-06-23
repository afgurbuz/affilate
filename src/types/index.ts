export interface User {
  id: string
  username: string
  email: string
  bio?: string
  avatar_url?: string
  role_id: string
  plan_id: string
  created_at: string
  role?: UserRole
  plan?: SubscriptionPlan
  // From joins
  is_active?: boolean
}

export interface UserRole {
  id: string
  name: 'admin' | 'user'
  permissions: Record<string, boolean>
}

export interface SubscriptionPlan {
  id: string
  name: 'free' | 'basic' | 'premium' | 'pro'
  max_posts: number
  max_products_per_post: number
  price: number
  features: string[]
}

export interface Post {
  id: string
  user_id: string
  image_url: string
  caption?: string
  is_published: boolean
  created_at: string
  updated_at?: string
  user?: User
  products?: Product[]
  // From post_details view
  username?: string
  user_avatar?: string
  product_count?: number
}

export interface Product {
  id: string
  post_id: string
  name: string
  description?: string
  affiliate_url: string
  x_coordinate: number
  y_coordinate: number
  created_at: string
  post?: Post
  clicks?: Click[]
}

export interface Click {
  id: string
  product_id: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  clicked_at: string
  product?: Product
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