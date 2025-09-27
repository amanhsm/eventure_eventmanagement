"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { imageUploadService } from "@/lib/utils/image-upload"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  onImageRemove: () => void
  currentImage?: string
  eventId?: string
  disabled?: boolean
}

export function ImageUpload({ 
  onImageUpload, 
  onImageRemove, 
  currentImage, 
  eventId,
  disabled = false 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleFileSelect = async (file: File) => {
    if (disabled || isUploading) return

    console.log('Starting file upload:', file.name, file.size, file.type)
    console.log('Current user from auth context:', user)
    
    if (!user) {
      alert('Please log in to upload images.')
      return
    }

    setIsUploading(true)
    
    try {
      // Handle upload directly here instead of using the service
      const supabase = createClient()
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload JPG, PNG, or WebP images.')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please upload images smaller than 5MB.')
        return
      }

      // Generate filename
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2)
      const fileName = `${eventId || 'event'}_${timestamp}_${randomId}.${fileExt}`
      const filePath = `events/${user.id}/${fileName}`

      console.log('Uploading to path:', filePath)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        alert(`Upload failed: ${error.message}`)
        return
      }

      console.log('Upload successful, data:', data)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', urlData.publicUrl)

      if (urlData.publicUrl) {
        console.log('Upload successful, setting image URL:', urlData.publicUrl)
        onImageUpload(urlData.publicUrl)
      }

    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload error: ${error}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleRemoveImage = async () => {
    if (currentImage) {
      // Optionally delete from storage
      await imageUploadService.deleteEventImage(currentImage)
      onImageRemove()
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  if (currentImage) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="relative group">
            <img
              src={currentImage}
              alt="Event image"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={openFileDialog}
                  disabled={disabled || isUploading}
                  className="cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Change
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveImage}
                  disabled={disabled || isUploading}
                  className="cursor-pointer"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </CardContent>
    </Card>
  )
}
