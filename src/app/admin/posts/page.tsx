'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface Post {
  id: string
  caption: string | null
  image_url: string
  is_published: boolean
  created_at: string
  user: any
  product_count: number
  products?: any[]
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPosts()
  }, [filter])

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          caption,
          image_url,
          is_published,
          created_at,
          user:users(username),
          products(id)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('is_published', filter === 'published')
      }

      const { data, error } = await query

      if (error) throw error
      
      // Transform data to include product_count
      const postsWithCount = (data || []).map(post => ({
        ...post,
        product_count: post.products?.length || 0
      }))
      
      setPosts(postsWithCount)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePostStatus = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_published: !currentStatus })
        .eq('id', postId)

      if (error) throw error

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_published: !currentStatus }
          : post
      ))
    } catch (error) {
      console.error('Error updating post status:', error)
      alert('Post durumu güncellenirken bir hata oluştu.')
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post Yönetimi</h1>
          <p className="text-gray-600">
            Toplam {posts.length} post
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tümü
          </Button>
          <Button
            variant={filter === 'published' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('published')}
          >
            Yayında
          </Button>
          <Button
            variant={filter === 'draft' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('draft')}
          >
            Taslak
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              {post.product_count > 0 && (
                <div className="absolute bottom-2 left-2">
                  <span className="bg-black bg-opacity-75 text-white px-2 py-1 text-xs rounded-full">
                    {post.product_count} ürün
                  </span>
                </div>
              )}
            </div>
            
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  @{post.user?.username || 'unknown'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {post.caption || 'Açıklama yok'}
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePostStatus(post.id, post.is_published)}
                  className="flex-1"
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/${post.user?.username || 'unknown'}`, '_blank')}
                className="w-full"
              >
                Profilde Gör
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {posts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Post bulunamadı</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}