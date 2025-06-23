'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Button } from '@/components/ui'
import PostGrid from '@/components/posts/PostGrid'
import PostModal from '@/components/posts/PostModal'
import type { User, Post } from '@/types'

interface PublicProfileProps {
  user: User
  posts: Post[]
}

export default function PublicProfile({ user, posts }: PublicProfileProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const supabase = createClientComponentClient()

  const handleProductClick = async (productId: string, affiliateUrl: string) => {
    // Track click for analytics
    try {
      await supabase.from('clicks').insert({
        product_id: productId,
        ip_address: null, // Will be handled by server
        user_agent: navigator.userAgent,
        referrer: window.location.href
      })
    } catch (error) {
      console.error('Error tracking click:', error)
    }

    // Open affiliate link
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Gardrop
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/login">
                  <Button variant="outline" size="sm">Giriş</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Kayıt Ol</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Profile Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Profile Info */}
              <div className="w-full md:w-1/3">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                    <img
                      src={user.avatar_url || '/default-avatar.png'}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {user.username}
                  </h1>
                  
                  {user.bio && (
                    <p className="text-gray-600 mb-4 max-w-xs">
                      {user.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                    <span>
                      <strong className="text-gray-900">{posts.length}</strong> post
                    </span>
                    <span>
                      <strong className="text-gray-900">
                        {posts.reduce((total, post) => total + (post.product_count || 0), 0)}
                      </strong> ürün
                    </span>
                  </div>

                  <div className="w-full max-w-xs">
                    <Button className="w-full mb-3">
                      Takip Et
                    </Button>
                    <Link href="/register" className="block">
                      <Button variant="outline" className="w-full">
                        Benzer Profil Oluştur
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Posts Grid */}
              <div className="w-full md:w-2/3">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Henüz post yok
                    </h3>
                    <p className="text-gray-500">
                      {user.username} henüz hiç post paylaşmamış.
                    </p>
                  </div>
                ) : (
                  <PostGrid 
                    posts={posts} 
                    onPostClick={setSelectedPost}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-gray-500">
                © 2024 Gardrop. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center gap-6 mt-4 sm:mt-0">
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
                  Ana Sayfa
                </Link>
                <Link href="/register" className="text-sm text-gray-500 hover:text-gray-900">
                  Kayıt Ol
                </Link>
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onProductClick={handleProductClick}
        />
      )}
    </>
  )
}