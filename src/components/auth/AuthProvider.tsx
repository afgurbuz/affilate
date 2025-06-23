'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { User as CustomUser } from '@/types'

interface AuthContextType {
  user: User | null
  userData: CustomUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClientComponentClient()

  const fetchUserData = async (user: User) => {
    try {
      console.log('🔍 Starting fetchUserData for:', user.id)
      console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      // Simple test query first
      console.log('📝 Testing basic connection...')
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      console.log('✅ Basic connection test:', { testData, testError })
      
      console.log('📝 Fetching user with joins...')
      const { data, error } = await supabase
        .from('users')
        .select('*, role:user_roles(*), plan:subscription_plans(*)')
        .eq('id', user.id)
        .single()
      
      console.log('📊 Query result:', { data, error })
      
      if (error) {
        console.error('❌ Supabase error fetching user:', error)
        if (error.code === 'PGRST116') {
          console.log('👤 User not found in public.users table')
        }
        setUserData(null)
        return
      }
      
      console.log('✅ User data fetched successfully:', data)
      setUserData(data)
    } catch (error) {
      console.error('💥 Error in fetchUserData:', error)
      setUserData(null)
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      if (currentUser) {
        await fetchUserData(currentUser)
      } else {
        setUserData(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserData(null)
  }

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserData(session.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserData(session.user)
        } else {
          setUserData(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      signOut,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}