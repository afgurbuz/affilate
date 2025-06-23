'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface Plan {
  id: string
  name: string
  max_posts: number
  max_products_per_post: number
  price: number
  features: string[]
  is_active: boolean
}

export default function UpgradePage() {
  const { userData } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = (planId: string, planName: string) => {
    // In a real application, this would integrate with a payment processor
    alert(`${planName} planına yükseltme işlemi yakında eklenecek!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentPlan = userData?.plan?.name || 'free'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            ← Dashboard&apos;a Dön
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planınızı Yükseltin
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Daha fazla post paylaşın, daha çok ürün etiketleyin ve gelişmiş analitiklere erişin
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Şu anki planınız: <span className="capitalize font-bold ml-1">{currentPlan}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative overflow-hidden ${
              plan.name === 'premium' ? 'ring-2 ring-blue-500 shadow-lg' : ''
            } ${currentPlan === plan.name ? 'opacity-50' : ''}`}>
              {plan.name === 'premium' && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-medium">
                  Popüler
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold capitalize">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">₺{plan.price}</span>
                  <span className="text-gray-500">/ay</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Maksimum Post</span>
                    <span className="font-medium">
                      {plan.max_posts === -1 ? 'Sınırsız' : plan.max_posts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Post Başına Ürün</span>
                    <span className="font-medium">
                      {plan.max_products_per_post === -1 ? 'Sınırsız' : plan.max_products_per_post}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Özellikler</h4>
                  <ul className="space-y-2">
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  {currentPlan === plan.name ? (
                    <Button disabled className="w-full">
                      Mevcut Planınız
                    </Button>
                  ) : plan.price === 0 ? (
                    <Button disabled className="w-full">
                      Ücretsiz Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id, plan.name)}
                      className="w-full"
                      variant={plan.name === 'premium' ? 'primary' : 'outline'}
                    >
                      {plan.name} Planına Geç
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Plan Karşılaştırması
          </h2>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Özellik
                    </th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="capitalize">{plan.name}</div>
                        <div className="text-lg font-bold text-gray-900 mt-1">₺{plan.price}/ay</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Maksimum Post Sayısı
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {plan.max_posts === -1 ? 'Sınırsız' : plan.max_posts}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Post Başına Ürün
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {plan.max_products_per_post === -1 ? 'Sınırsız' : plan.max_products_per_post}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Analytics
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      Temel
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      Temel
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      Gelişmiş
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      Pro
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Destek
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      E-mail
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      E-mail
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      Öncelikli
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      7/24 Öncelikli
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Sık Sorulan Sorular
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  Planımı istediğim zaman değiştirebilir miyim?
                </h3>
                <p className="text-gray-600">
                  Evet, planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. 
                  Değişiklik anında geçerli olur.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  Ödeme güvenli mi?
                </h3>
                <p className="text-gray-600">
                  Tüm ödemeler SSL şifreleme ile korunur ve güvenli ödeme sağlayıcıları kullanılır.
                  Kredi kartı bilgileriniz saklanmaz.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  İptal etmek istersem ne olur?
                </h3>
                <p className="text-gray-600">
                  İstediğiniz zaman iptal edebilirsiniz. İptal ettiğinizde mevcut dönem sonuna kadar 
                  premium özellikler aktif kalır.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}