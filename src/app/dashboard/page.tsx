'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
      } else {
        setUser(user)
      }
      setIsLoading(false)
    }

    getUser()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Hoş geldin, {user?.user_metadata?.username || user?.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Postlarım</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-500">Toplam post</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ürünlerim</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-500">Toplam ürün</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tıklamalar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-500">Bu ay</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link href="/dashboard/posts/new">
                    <Button className="h-20 flex-col w-full">
                      <span className="text-lg mb-1">📷</span>
                      Yeni Post
                    </Button>
                  </Link>
                  <Link href="/dashboard/posts">
                    <Button variant="outline" className="h-20 flex-col w-full">
                      <span className="text-lg mb-1">📋</span>
                      Postları Yönet
                    </Button>
                  </Link>
                  <Link href={`/${user?.user_metadata?.username || 'profile'}`}>
                    <Button variant="outline" className="h-20 flex-col w-full">
                      <span className="text-lg mb-1">👤</span>
                      Profili Görüntüle
                    </Button>
                  </Link>
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-lg mb-1">⚙️</span>
                    Ayarlar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}