import { createServerComponentClient } from '@/lib/supabase-server'

export async function getCurrentUser() {
  const supabase = await createServerComponentClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: userData } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', user.id)
      .single()

    return userData
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function checkUserRole(userId: string, requiredRole?: string) {
  const supabase = await createServerComponentClient()
  
  try {
    const { data: userData } = await supabase
      .from('user_details')
      .select('role_name, role_permissions')
      .eq('id', userId)
      .single()

    if (!userData) return false

    if (requiredRole) {
      return userData.role_name === requiredRole
    }

    return userData
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

export async function checkSubscriptionLimits(userId: string, type: 'posts' | 'products') {
  const supabase = await createServerComponentClient()
  
  try {
    const { data: userData } = await supabase
      .from('user_details')
      .select('max_posts, max_products_per_post, plan_name')
      .eq('id', userId)
      .single()

    if (!userData) return { allowed: false, current: 0, limit: 0 }

    if (type === 'posts') {
      if (userData.max_posts === -1) {
        return { allowed: true, current: 0, limit: -1, unlimited: true }
      }

      const { count: currentPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      return {
        allowed: (currentPosts || 0) < userData.max_posts,
        current: currentPosts || 0,
        limit: userData.max_posts,
        planName: userData.plan_name
      }
    }

    if (type === 'products') {
      return {
        allowed: true,
        current: 0,
        limit: userData.max_products_per_post,
        unlimited: userData.max_products_per_post === -1,
        planName: userData.plan_name
      }
    }

    return { allowed: false, current: 0, limit: 0 }
  } catch (error) {
    console.error('Error checking subscription limits:', error)
    return { allowed: false, current: 0, limit: 0 }
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  const isAdmin = await checkUserRole(user.id, 'admin')
  if (!isAdmin) {
    throw new Error('Admin access required')
  }
  return user
}