import { createClientComponentClient } from './supabase'

export interface UploadResult {
  data: {
    path: string
    fullPath: string
    publicUrl: string
  } | null
  error: Error | null
}

export class StorageService {
  private supabase = createClientComponentClient()
  private bucket = 'post-images'

  async uploadPostImage(file: File, userId: string): Promise<UploadResult> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece resim dosyaları yüklenebilir')
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Dosya boyutu 10MB\'dan küçük olmalıdır')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload file
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath)

      return {
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl
        },
        error: null
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      return {
        data: null,
        error: error as Error
      }
    }
  }

  async deletePostImage(filePath: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([filePath])

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting image:', error)
      return { error: error as Error }
    }
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}

// Export singleton instance
export const storageService = new StorageService()