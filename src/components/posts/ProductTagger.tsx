'use client'

import { useState, useRef } from 'react'
import { Button, Input, Card, CardContent } from '@/components/ui'
import type { Product, CreateProductData } from '@/types'

interface ProductTaggerProps {
  imageUrl: string
  postId: string
  products: Product[]
  maxProducts: number
  onProductAdd: (product: CreateProductData) => Promise<void>
  onProductUpdate: (productId: string, updates: Partial<Product>) => Promise<void>
  onProductDelete: (productId: string) => Promise<void>
}

interface TempProduct {
  x: number
  y: number
  name: string
  description: string
  affiliate_url: string
}

export default function ProductTagger({
  imageUrl,
  postId,
  products,
  maxProducts,
  onProductAdd,
  onProductUpdate,
  onProductDelete
}: ProductTaggerProps) {
  const [isTagging, setIsTagging] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [tempProduct, setTempProduct] = useState<TempProduct | null>(null)
  const [showForm, setShowForm] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagging || products.length >= maxProducts) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setTempProduct({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      name: '',
      description: '',
      affiliate_url: ''
    })
    setShowForm(true)
  }

  const handleSaveProduct = async () => {
    if (!tempProduct || !tempProduct.name.trim() || !tempProduct.affiliate_url.trim()) {
      alert('Ürün adı ve affiliate URL zorunludur.')
      return
    }

    try {
      await onProductAdd({
        post_id: postId,
        name: tempProduct.name.trim(),
        description: tempProduct.description.trim() || '',
        affiliate_url: tempProduct.affiliate_url.trim(),
        x_coordinate: tempProduct.x,
        y_coordinate: tempProduct.y
      })

      setTempProduct(null)
      setShowForm(false)
      setIsTagging(false)
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Ürün kaydedilirken bir hata oluştu.')
    }
  }

  const handleCancelProduct = () => {
    setTempProduct(null)
    setShowForm(false)
  }

  const handleProductClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProduct(product)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return
    
    try {
      await onProductDelete(productId)
      setSelectedProduct(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Ürün silinirken bir hata oluştu.')
    }
  }

  const canAddMore = products.length < maxProducts || maxProducts === -1

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Ürün Etiketleme</h3>
          <p className="text-sm text-gray-500">
            {maxProducts === -1 
              ? `${products.length} ürün etiketlendi`
              : `${products.length}/${maxProducts} ürün etiketlendi`
            }
          </p>
        </div>
        <div className="space-x-2">
          {canAddMore && (
            <Button
              variant={isTagging ? 'primary' : 'outline'}
              onClick={() => setIsTagging(!isTagging)}
              disabled={showForm}
            >
              {isTagging ? 'Etiketleme Aktif' : 'Ürün Etiketle'}
            </Button>
          )}
          {!canAddMore && (
            <p className="text-sm text-orange-600">
              Maksimum ürün sayısına ulaştınız
            </p>
          )}
        </div>
      </div>

      {/* Image with product tags */}
      <div className="relative">
        <div
          ref={imageRef}
          className={`relative overflow-hidden rounded-lg ${
            isTagging ? 'cursor-crosshair' : 'cursor-default'
          }`}
          onClick={handleImageClick}
        >
          <img
            src={imageUrl}
            alt="Post"
            className="w-full h-auto max-h-96 object-contain"
            draggable={false}
          />
          
          {/* Existing product tags */}
          {products.map((product) => (
            <div
              key={product.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${product.x_coordinate}%`,
                top: `${product.y_coordinate}%`
              }}
              onClick={(e) => handleProductClick(product, e)}
            >
              <div className="w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                <span className="text-xs text-white font-bold">+</span>
              </div>
            </div>
          ))}

          {/* Temporary product tag */}
          {tempProduct && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${tempProduct.x}%`,
                top: `${tempProduct.y}%`
              }}
            >
              <div className="w-6 h-6 bg-green-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
                <span className="text-xs text-white font-bold">+</span>
              </div>
            </div>
          )}
        </div>

        {isTagging && canAddMore && (
          <p className="text-sm text-gray-500 mt-2">
            Fotoğraf üzerinde ürün etiketlemek istediğiniz yere tıklayın
          </p>
        )}
      </div>

      {/* Product form */}
      {showForm && tempProduct && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Yeni Ürün Ekle</h4>
            <div className="space-y-4">
              <Input
                label="Ürün Adı *"
                value={tempProduct.name}
                onChange={(e) => setTempProduct({
                  ...tempProduct,
                  name: e.target.value
                })}
                placeholder="Örn: Mavi Tişört"
              />
              
              <Input
                label="Açıklama (İsteğe bağlı)"
                value={tempProduct.description}
                onChange={(e) => setTempProduct({
                  ...tempProduct,
                  description: e.target.value
                })}
                placeholder="Ürün hakkında kısa açıklama"
              />
              
              <Input
                label="Affiliate URL *"
                value={tempProduct.affiliate_url}
                onChange={(e) => setTempProduct({
                  ...tempProduct,
                  affiliate_url: e.target.value
                })}
                placeholder="https://example.com/urun?ref=12345"
                helperText="Ürünün satın alınabileceği affiliate link"
              />
              
              <div className="flex gap-2">
                <Button onClick={handleSaveProduct} className="flex-1">
                  Ürünü Kaydet
                </Button>
                <Button variant="outline" onClick={handleCancelProduct}>
                  İptal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected product details */}
      {selectedProduct && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium">Ürün Detayları</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                Kapat
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                {selectedProduct.description && (
                  <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Affiliate URL:</p>
                <a
                  href={selectedProduct.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {selectedProduct.affiliate_url}
                </a>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteProduct(selectedProduct.id)}
                >
                  Ürünü Sil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      {products.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Etiketli Ürünler ({products.length})</h4>
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-gray-600">{product.description}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProduct(product)}
                  >
                    Görüntüle
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}