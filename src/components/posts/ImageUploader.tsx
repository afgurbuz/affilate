'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { storageService } from '@/lib/storage'

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void
  userId: string
  className?: string
  disabled?: boolean
}

export default function ImageUploader({ 
  onImageUploaded, 
  userId, 
  className = '', 
  disabled = false 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setError('')

    try {
      const result = await storageService.uploadPostImage(file, userId)
      
      if (result.error) {
        throw result.error
      }

      if (result.data) {
        onImageUploaded(result.data.publicUrl)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'Resim yüklenirken bir hata oluştu')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(imageFile)
      uploadFile(imageFile)
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-w-md rounded-lg shadow-md"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Yükleniyor...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" className="h-12 w-12">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Resim Yükle
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Dosyayı sürükle bırak veya tıklayarak seç
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PNG, JPG, GIF formatları desteklenir (Max: 10MB)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading}
              isLoading={isUploading}
            >
              {isUploading ? 'Yükleniyor...' : 'Dosya Seç'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}