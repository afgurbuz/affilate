'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export default function NewPostPage() {
  const { userData } = useAuth()
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userData?.id}/${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !userData) return

    setIsLoading(true)
    setError('')

    try {
      // Check post limit
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userData.id)

      if ((userData.plan?.max_posts || 0) !== -1 && count && count >= (userData.plan?.max_posts || 0)) {
        setError('Post limitinize ulaştınız. Planınızı yükseltin.')
        return
      }

      // Upload image
      const imageUrl = await uploadImage(imageFile)

      // Create post
      const { data, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userData.id,
          image_url: imageUrl,
          caption: caption.trim() || null,
          is_published: true
        })
        .select()
        .single()

      if (postError) throw postError

      router.push(`/dashboard/posts/${data.id}/edit`)
    } catch (err: any) {
      console.error('Error creating post:', err)
      setError(err.message || 'Post oluşturulurken bir hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/posts">
              <Button variant="outline">← Postlara Dön</Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Post Oluştur</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Fotoğraf Yükle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-64 object-cover mx-auto rounded"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                      >
                        Farklı Fotoğraf Seç
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Fotoğraf seçmek için tıklayın
                          </span>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF dosyaları desteklenir
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Post Details */}
          <Card>
            <CardHeader>
              <CardTitle>Post Detayları</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Input
                  label="Açıklama (İsteğe bağlı)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Bu postla ilgili bir açıklama yazın..."
                  maxLength={500}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📍 Sonraki Adım</h4>
                  <p className="text-sm text-blue-800">
                    Post oluşturduktan sonra fotoğraf üzerindeki ürünleri etiketleyebilir 
                    ve affiliate linklerinizi ekleyebilirsiniz.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={!imageFile || isLoading}
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    Post Oluştur
                  </Button>
                  <Link href="/dashboard/posts">
                    <Button type="button" variant="outline">
                      İptal
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Plan Info */}
        {userData && (userData.plan?.max_posts || 0) !== -1 && (
          <Card className="mt-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Plan Limitiniz: {userData.plan?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Maksimum {userData.plan?.max_posts || 0} post paylaşabilirsiniz
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
      </div>
    </div>
  )
}