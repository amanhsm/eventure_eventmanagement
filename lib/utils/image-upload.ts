import { createClient } from "@/lib/supabase/client"

export interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
}

export class ImageUploadService {
  private bucketName = 'event-images'

  /**
   * Upload an image file to Supabase Storage
   * @param file - The image file to upload
   * @param eventId - Optional event ID for organizing files
   * @returns Promise with upload result
   */
  async uploadEventImage(file: File, eventId?: string): Promise<ImageUploadResult> {
    try {
      // Create a fresh Supabase client instance
      const supabase = createClient()
      
      // Validate file type
      if (!this.isValidImageType(file)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload JPG, PNG, or WebP images.'
        }
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error: 'File size too large. Please upload images smaller than 5MB.'
        }
      }

      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Auth session check:', { session: !!session, sessionError })
      
      if (sessionError || !session) {
        return {
          success: false,
          error: 'Please log in to upload images.'
        }
      }

      // Generate secure filename with user context
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2)
      const fileName = `${eventId || 'event'}_${timestamp}_${randomId}.${fileExt}`
      
      // Use session user ID for secure path
      const filePath = `events/${session.user.id}/${fileName}`

      // Upload to Supabase Storage
      console.log('Uploading to path:', filePath)
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        return {
          success: false,
          error: `Storage error: ${error.message}`
        }
      }

      console.log('Upload successful, data:', data)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      console.log('Public URL generated:', urlData.publicUrl)

      return {
        success: true,
        url: urlData.publicUrl
      }

    } catch (error) {
      console.error('Image upload error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during upload.'
      }
    }
  }

  /**
   * Delete an image from Supabase Storage
   * @param imageUrl - The full URL of the image to delete
   * @returns Promise with deletion result
   */
  async deleteEventImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.indexOf(this.bucketName)
      
      if (bucketIndex === -1) {
        return {
          success: false,
          error: 'Invalid image URL format.'
        }
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/')

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        console.error('Storage deletion error:', error)
        return {
          success: false,
          error: 'Failed to delete image.'
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Image deletion error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during deletion.'
      }
    }
  }

  /**
   * Validate if the file is a supported image type
   * @param file - The file to validate
   * @returns boolean indicating if file type is valid
   */
  private isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    return validTypes.includes(file.type)
  }

  /**
   * Create the storage bucket if it doesn't exist
   * This should be called during app initialization
   */
  async initializeBucket(): Promise<void> {
    try {
      const supabase = createClient()
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some((bucket: any) => bucket.name === this.bucketName)

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (error) {
          console.error('Failed to create storage bucket:', error)
        } else {
          console.log('Event images storage bucket created successfully')
        }
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error)
    }
  }
}

// Export singleton instance
export const imageUploadService = new ImageUploadService()
