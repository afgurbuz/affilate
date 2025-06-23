'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import ProductTagger from '@/components/posts/ProductTagger'
import type { Post, Product, CreateProductData } from '@/types'

interface EditPostPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const [postId, setPostId] = useState<string>('')
  const { userData } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [caption, setCaption] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setPostId(resolvedParams.id)
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (userData && postId) {
      fetchPost()
    }
  }, [userData, postId])

  const fetchPost = async () => {
    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', userData?.id)
        .single()

      if (postError) throw postError
      if (!postData) {
        router.push('/dashboard/posts')
        return
      }

      setPost(postData)
      setCaption(postData.caption || '')

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('post_id', postId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (productsError) throw productsError
      setProducts(productsData || [])

    } catch (error: any) {
      console.error('Error fetching post:', error)
      setError('Post yüklenirken bir hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateCaption = async () => {
    if (!post) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('posts')
        .update({ caption: caption.trim() || null })
        .eq('id', post.id)

      if (error) throw error
      
      setPost({ ...post, caption: caption.trim() || '' })
    } catch (error: any) {
      console.error('Error updating caption:', error)
      alert('Açıklama güncellenirken bir hata oluştu.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleProductAdd = async (productData: CreateProductData) => {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) throw error
    setProducts([...products, data])
  }

  const handleProductUpdate = async (productId: string, updates: Partial<Product>) => {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)

    if (error) throw error
    
    setProducts(products.map(p => 
      p.id === productId ? { ...p, ...updates } : p
    ))
  }

  const handleProductDelete = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)

    if (error) throw error
    setProducts(products.filter(p => p.id !== productId))
  }

  const togglePublish = async () => {
    if (!post) return

    try {
      const newStatus = !post.is_published
      const { error } = await supabase
        .from('posts')
        .update({ is_published: newStatus })
        .eq('id', post.id)

      if (error) throw error
      setPost({ ...post, is_published: newStatus })
    } catch (error: any) {
      console.error('Error updating post status:', error)
      alert('Post durumu güncellenirken bir hata oluştu.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Post bulunamadı</h2>
          <p className="text-gray-600 mb-4">{error || 'Bu post mevcut değil veya erişim yetkiniz yok.'}</p>
          <Link href="/dashboard/posts">
            <Button>Postlara Dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  const maxProducts = userData?.plan?.max_products_per_post || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/posts">
                <Button variant="outline">← Postlara Dön</Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Post Düzenle</h1>
                <p className="text-gray-600">
                  {new Date(post.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturuldu
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={post.is_published ? 'outline' : 'primary'}
                onClick={togglePublish}
              >
                {post.is_published ? 'Gizle' : 'Yayınla'}
              </Button>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                post.is_published 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {post.is_published ? 'Yayında' : 'Taslak'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Post Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full rounded-lg"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Input
                    label="Açıklama"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Bu postla ilgili bir açıklama yazın..."
                    maxLength={500}
                    className="flex-1"
                  />
                  <div className="flex items-end">
                    <Button
                      onClick={updateCaption}
                      disabled={caption === (post.caption || '') || isSaving}
                      isLoading={isSaving}
                      size="sm"
                    >
                      Güncelle
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>Post ID: {post.id}</p>
                  <p>Oluşturulma: {new Date(post.created_at).toLocaleString('tr-TR')}</p>
                  <p>Son güncelleme: {new Date(post.updated_at || post.created_at).toLocaleString('tr-TR')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Plan Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Planınız: {userData?.plan?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {maxProducts === -1 
                        ? 'Sınırsız ürün etiketleyebilirsiniz'
                        : `Post başına maksimum ${maxProducts} ürün`
                      }
                    </p>
                  </div>
                  {maxProducts !== -1 && (
                    <Link href="/dashboard/upgrade">
                      <Button variant="outline" size="sm">
                        Planı Yükselt
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Tagger */}
          <div>
            <ProductTagger
              imageUrl={post.image_url}
              postId={post.id}
              products={products}
              maxProducts={maxProducts}
              onProductAdd={handleProductAdd}
              onProductUpdate={handleProductUpdate}
              onProductDelete={handleProductDelete}
            />
          </div>
        </div>
      </div>
    </div>
  )
}