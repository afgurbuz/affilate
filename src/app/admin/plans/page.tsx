'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface Plan {
  id: string
  name: string
  max_posts: number
  max_products_per_post: number
  price: number
  features: any
  is_active: boolean
  created_at: string
  user_count?: number
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    max_posts: -1,
    max_products_per_post: -1,
    price: 0,
    features: '',
    is_active: true
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true })

      if (plansError) throw plansError

      // Get user count for each plan
      const plansWithUserCount = await Promise.all(
        (plansData || []).map(async (plan) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', plan.id)

          return { ...plan, user_count: count || 0 }
        })
      )

      setPlans(plansWithUserCount)
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      max_posts: plan.max_posts,
      max_products_per_post: plan.max_products_per_post,
      price: plan.price,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      is_active: plan.is_active
    })
  }

  const handleSave = async () => {
    if (!editingPlan) return

    try {
      const features = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)

      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: formData.name,
          max_posts: formData.max_posts,
          max_products_per_post: formData.max_products_per_post,
          price: formData.price,
          features,
          is_active: formData.is_active
        })
        .eq('id', editingPlan.id)

      if (error) throw error

      setEditingPlan(null)
      fetchPlans()
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Plan güncellenirken bir hata oluştu.')
    }
  }

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId)

      if (error) throw error

      setPlans(plans.map(plan => 
        plan.id === planId 
          ? { ...plan, is_active: !currentStatus }
          : plan
      ))
    } catch (error) {
      console.error('Error updating plan status:', error)
      alert('Plan durumu güncellenirken bir hata oluştu.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plan Yönetimi</h1>
        <p className="text-gray-600">
          Abonelik planlarını yönet ve fiyatlandırmayı düzenle
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">{plan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    plan.is_active ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                  >
                    Düzenle
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  ₺{plan.price}
                  <span className="text-sm font-normal text-gray-500">/ay</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Maksimum Post:</span>
                  <span className="font-medium">
                    {plan.max_posts === -1 ? 'Sınırsız' : plan.max_posts}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Post Başına Ürün:</span>
                  <span className="font-medium">
                    {plan.max_products_per_post === -1 ? 'Sınırsız' : plan.max_products_per_post}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kullanıcı Sayısı:</span>
                  <span className="font-medium">{plan.user_count}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Özellikler:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant={plan.is_active ? 'danger' : 'primary'}
                size="sm"
                onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                className="w-full"
              >
                {plan.is_active ? 'Pasifleştir' : 'Aktifleştir'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPlan.name} Planını Düzenle
            </h3>
            
            <div className="space-y-4">
              <Input
                label="Plan Adı"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              
              <Input
                label="Maksimum Post (-1 = Sınırsız)"
                type="number"
                value={formData.max_posts}
                onChange={(e) => setFormData({ ...formData, max_posts: parseInt(e.target.value) })}
              />
              
              <Input
                label="Post Başına Maksimum Ürün (-1 = Sınırsız)"
                type="number"
                value={formData.max_products_per_post}
                onChange={(e) => setFormData({ ...formData, max_products_per_post: parseInt(e.target.value) })}
              />
              
              <Input
                label="Aylık Fiyat (₺)"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Özellikler (Her satıra bir özellik)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Özellik 1&#10;Özellik 2&#10;Özellik 3"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Aktif plan
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1">
                Kaydet
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingPlan(null)}
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}