import { createServerComponentClient } from '@/lib/supabase-server'

export async function getCurrentUser() {
  const supabase = await createServerComponentClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: userData } = await supabase
      .from('users')
      .select('*, role:user_roles(*), plan:subscription_plans(*)')
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
      .from('users')
      .select('*, role:user_roles!inner(*)')
      .eq('id', userId)
      .single()

    if (!userData || !userData.role) return false

    if (requiredRole) {
      return userData.role.name === requiredRole
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
      .from('users')
      .select('*, plan:subscription_plans!inner(*)')
      .eq('id', userId)
      .single()

    if (!userData || !userData.plan) return { allowed: false, current: 0, limit: 0 }

    if (type === 'posts') {
      if (userData.plan.max_posts === -1) {
        return { allowed: true, current: 0, limit: -1, unlimited: true }
      }

      const { count: currentPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      return {
        allowed: (currentPosts || 0) < userData.plan.max_posts,
        current: currentPosts || 0,
        limit: userData.plan.max_posts,
        planName: userData.plan.name
      }
    }

    if (type === 'products') {
      return {
        allowed: true,
        current: 0,
        limit: userData.plan.max_products_per_post,
        unlimited: userData.plan.max_products_per_post === -1,
        planName: userData.plan.name
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