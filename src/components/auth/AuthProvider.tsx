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
      const { data } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setUserData(data)
    } catch (error) {
      console.error('Error fetching user data:', error)
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
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserData(session.user)
      }
      
      setLoading(false)
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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