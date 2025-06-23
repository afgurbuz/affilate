'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Button } from '@/components/ui'
import type { Post, Product } from '@/types'

interface PostModalProps {
  post: Post
  onClose: () => void
  onProductClick: (productId: string, affiliateUrl: string) => void
}

export default function PostModal({ post, onClose, onProductClick }: PostModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchProducts()
  }, [post.id])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('post_id', post.id)
        .eq('is_active', true)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductTagClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProduct(product)
  }

  const handleProductAction = (product: Product) => {
    onProductClick(product.id, product.affiliate_url)
    setSelectedProduct(null)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4 bg-white rounded-lg overflow-hidden flex">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image section */}
        <div className="relative flex-1 bg-black flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            <img
              src={post.image_url}
              alt={post.caption || 'Post'}
              className="max-w-full max-h-[90vh] object-contain"
            />
            
            {/* Product tags */}
            {!loading && products.map((product) => (
              <div
                key={product.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `${product.x_coordinate}%`,
                  top: `${product.y_coordinate}%`
                }}
                onClick={(e) => handleProductTagClick(product, e)}
              >
                <div className="w-6 h-6 bg-white border-2 border-blue-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Details panel */}
        <div className="w-96 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img
                src={post.user?.avatar_url || '/default-avatar.png'}
                alt={post.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium text-gray-900">{post.username}</span>
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="p-4 border-b border-gray-200">
              <p className="text-gray-900">{post.caption}</p>
            </div>
          )}

          {/* Products list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>Bu postta etiketlenmiş ürün bulunmuyor.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <h3 className="font-medium text-gray-900 mb-3">
                  Etiketlenmiş Ürünler ({products.length})
                </h3>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => handleProductAction(product)}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    )}
                    <Button size="sm" className="w-full">
                      Ürüne Git →
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {new Date(post.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-2">{selectedProduct.name}</h3>
            {selectedProduct.description && (
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={() => handleProductAction(selectedProduct)}
                className="flex-1"
              >
                Ürüne Git
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedProduct(null)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}