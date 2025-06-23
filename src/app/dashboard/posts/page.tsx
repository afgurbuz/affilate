'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import type { Post } from '@/types'

export default function PostsPage() {
  const { userData } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ current: 0, limit: 0, unlimited: false })
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (userData) {
      fetchPosts()
      updateStats()
    }
  }, [userData])

  const fetchPosts = async () => {
    if (!userData) return

    try {
      const { data, error } = await supabase
        .from('post_details')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStats = () => {
    if (!userData) return
    
    setStats({
      current: posts.length,
      limit: userData.max_posts || 0,
      unlimited: userData.max_posts === -1
    })
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Bu postu silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      
      setPosts(posts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Post silinirken bir hata oluştu.')
    }
  }

  const togglePublish = async (postId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_published: !isPublished })
        .eq('id', postId)

      if (error) throw error
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_published: !isPublished }
          : post
      ))
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Post durumu güncellenirken bir hata oluştu.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Postlarım</h1>
              <p className="text-gray-600">
                {stats.unlimited 
                  ? `${stats.current} post`
                  : `${stats.current}/${stats.limit} post kullanıldı`
                }
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">← Dashboard</Button>
              </Link>
              <Link href="/dashboard/posts/new">
                <Button disabled={!stats.unlimited && stats.current >= stats.limit}>
                  Yeni Post
                </Button>
              </Link>
            </div>
          </div>
          
          {!stats.unlimited && stats.current >= stats.limit && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                Post limitinize ulaştınız. Daha fazla post paylaşmak için planınızı yükseltin.
              </p>
              <Link href="/dashboard/upgrade" className="text-yellow-900 underline">
                Planı Yükselt
              </Link>
            </div>
          )}
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz hiç post paylaşmadınız
              </h3>
              <p className="text-gray-500 mb-6">
                İlk postunuzu oluşturun ve ürünlerinizi etiketlemeye başlayın.
              </p>
              <Link href="/dashboard/posts/new">
                <Button>İlk Postunu Oluştur</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Post'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      post.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {post.is_published ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                  {(post.product_count || 0) > 0 && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black bg-opacity-75 text-white px-2 py-1 text-xs rounded-full">
                        {post.product_count || 0} ürün
                      </span>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {post.caption || 'Açıklama yok'}
                  </p>
                  
                  <div className="flex gap-2">
                    <Link href={`/dashboard/posts/${post.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Düzenle
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublish(post.id, post.is_published)}
                    >
                      {post.is_published ? 'Gizle' : 'Yayınla'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deletePost(post.id)}
                    >
                      Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}