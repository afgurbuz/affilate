'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface AnalyticsData {
  totalPosts: number
  totalProducts: number
  totalClicks: number
  clicksThisMonth: number
  clicksThisWeek: number
  topProducts: Array<{
    id: string
    name: string
    affiliate_url: string
    total_clicks: number
    post_caption: string
  }>
  recentClicks: Array<{
    id: string
    product_name: string
    clicked_at: string
    ip_address?: string
  }>
}

export default function AnalyticsPage() {
  const { userData } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (userData) {
      fetchAnalytics()
    }
  }, [userData, timeRange])

  const fetchAnalytics = async () => {
    if (!userData) return

    try {
      // Total counts
      const [
        { count: totalPosts },
        { count: totalProducts },
        { count: totalClicks }
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userData.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).in('post_id', 
          (await supabase.from('posts').select('id').eq('user_id', userData.id)).data?.map(p => p.id) || []
        ),
        supabase.from('clicks').select('*', { count: 'exact', head: true }).in('product_id',
          (await supabase.from('products').select('id').in('post_id',
            (await supabase.from('posts').select('id').eq('user_id', userData.id)).data?.map(p => p.id) || []
          )).data?.map(p => p.id) || []
        )
      ])

      // Time-based clicks
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const { count: clicksThisMonth } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .in('product_id',
          (await supabase.from('products').select('id').in('post_id',
            (await supabase.from('posts').select('id').eq('user_id', userData.id)).data?.map(p => p.id) || []
          )).data?.map(p => p.id) || []
        )
        .gte('clicked_at', monthAgo.toISOString())

      const { count: clicksThisWeek } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .in('product_id',
          (await supabase.from('products').select('id').in('post_id',
            (await supabase.from('posts').select('id').eq('user_id', userData.id)).data?.map(p => p.id) || []
          )).data?.map(p => p.id) || []
        )
        .gte('clicked_at', weekAgo.toISOString())

      // Top products
      const { data: topProductsData } = await supabase
        .from('products')
        .select(`
          id,
          name,
          affiliate_url,
          post:posts(caption),
          clicks(id)
        `)
        .in('post_id',
          (await supabase.from('posts').select('id').eq('user_id', userData.id)).data?.map(p => p.id) || []
        )
        .limit(10)

      const topProducts = (topProductsData || [])
        .map(product => ({
          id: product.id,
          name: product.name,
          affiliate_url: product.affiliate_url,
          total_clicks: product.clicks?.length || 0,
          post_caption: product.post?.caption || 'Açıklama yok'
        }))
        .sort((a, b) => b.total_clicks - a.total_clicks)
        .slice(0, 5)

      // Recent clicks
      const { data: recentClicksData } = await supabase
        .from('clicks')
        .select(`
          id,
          clicked_at,
          ip_address,
          product:products(name)
        `)
        .in('product_id',
          (await supabase.from('products').select('id').in('post_id',
            (await supabase.from('posts').select('id').eq('user_id', userData.id)).data?.map(p => p.id) || []
          )).data?.map(p => p.id) || []
        )
        .order('clicked_at', { ascending: false })
        .limit(10)

      const recentClicks = (recentClicksData || []).map(click => ({
        id: click.id,
        product_name: click.product?.name || 'Bilinmeyen ürün',
        clicked_at: click.clicked_at,
        ip_address: click.ip_address
      }))

      setAnalytics({
        totalPosts: totalPosts || 0,
        totalProducts: totalProducts || 0,
        totalClicks: totalClicks || 0,
        clicksThisMonth: clicksThisMonth || 0,
        clicksThisWeek: clicksThisWeek || 0,
        topProducts,
        recentClicks
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analytics yüklenemedi
          </h2>
          <Button onClick={fetchAnalytics}>Tekrar Dene</Button>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Toplam Post',
      value: analytics.totalPosts,
      icon: '📸',
      color: 'bg-blue-500'
    },
    {
      title: 'Toplam Ürün',
      value: analytics.totalProducts,
      icon: '🏷️',
      color: 'bg-purple-500'
    },
    {
      title: 'Toplam Tıklama',
      value: analytics.totalClicks,
      icon: '👆',
      color: 'bg-green-500'
    },
    {
      title: 'Bu Ay Tıklama',
      value: analytics.clicksThisMonth,
      icon: '📈',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600">
                Performansınızı ve tıklama istatistiklerinizi takip edin
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">← Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Plan Check */}
        {userData?.plan?.name === 'free' && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    📊 Detaylı Analytics
                  </p>
                  <p className="text-sm text-yellow-700">
                    Daha detaylı analytics için planınızı yükseltin
                  </p>
                </div>
                <Link href="/dashboard/upgrade">
                  <Button variant="outline" size="sm">
                    Planı Yükselt
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>En Çok Tıklanan Ürünler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {product.post_caption}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {product.total_clicks} tıklama
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(product.affiliate_url, '_blank')}
                      >
                        Linki Gör
                      </Button>
                    </div>
                  </div>
                ))}
                {analytics.topProducts.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Henüz tıklama yok
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Clicks */}
          <Card>
            <CardHeader>
              <CardTitle>Son Tıklamalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentClicks.map((click) => (
                  <div key={click.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {click.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(click.clicked_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      {click.ip_address && (
                        <p className="text-xs text-gray-400 font-mono">
                          {click.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {analytics.recentClicks.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Henüz tıklama yok
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {analytics.totalClicks === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz analytics verisi yok
              </h3>
              <p className="text-gray-500 mb-6">
                Post paylaşın ve ürün etiketleyin, verileriniz burada görünecek.
              </p>
              <Link href="/dashboard/posts/new">
                <Button>İlk Postunu Oluştur</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}