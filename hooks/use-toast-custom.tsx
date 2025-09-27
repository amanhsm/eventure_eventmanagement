"use client"

import { useState, useCallback } from "react"
import { CheckCircle, X } from "lucide-react"

interface ToastMessage {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info'
}

export function useCustomToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((title: string, description?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = { id, title, description, type }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            min-w-[300px] max-w-[400px] p-4 rounded-lg shadow-lg
            flex items-start gap-3 animate-in slide-in-from-right-full
            ${toast.type === 'success' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : ''}
            ${toast.type === 'error' ? 'bg-gradient-to-r from-red-400 to-red-500 text-white' : ''}
            ${toast.type === 'info' ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' : ''}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight">
              {toast.title}
            </h4>
            {toast.description && (
              <p className="text-sm opacity-90 mt-1 leading-tight">
                {toast.description}
              </p>
            )}
          </div>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )

  return {
    showToast,
    ToastContainer
  }
}
