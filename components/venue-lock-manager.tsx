"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'

interface VenueLock {
  id: number
  venue_id: number
  event_date: string
  start_time: string
  end_time: string
  expires_at: string
  lock_type: 'temporary' | 'draft' | 'confirmed'
  session_id?: string
}

interface VenueLockResult {
  success: boolean
  lock_id?: number
  expires_at?: string
  message: string
  error?: string
}

export function useVenueLocking() {
  const { user } = useAuth()
  const supabase = createClient()
  const [activeLocks, setActiveLocks] = useState<VenueLock[]>([])
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  // Clean up locks when component unmounts or user leaves
  useEffect(() => {
    const cleanup = () => {
      activeLocks.forEach(lock => {
        if (lock.lock_type === 'temporary') {
          releaseLock(lock.id)
        }
      })
    }

    window.addEventListener('beforeunload', cleanup)
    return () => {
      cleanup()
      window.removeEventListener('beforeunload', cleanup)
    }
  }, [activeLocks])

  const createLock = useCallback(async (
    venueId: number,
    eventDate: string,
    startTime: string,
    endTime: string,
    lockType: 'temporary' | 'draft' = 'temporary',
    durationMinutes: number = 15
  ): Promise<VenueLockResult> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' }
    }

    try {
      const { data, error } = await supabase.rpc('create_venue_lock', {
        p_venue_id: venueId,
        p_event_date: eventDate,
        p_start_time: startTime,
        p_end_time: endTime,
        p_user_id: user.id,
        p_lock_duration_minutes: durationMinutes,
        p_lock_type: lockType,
        p_session_id: sessionId
      })

      if (error) throw error

      const result = data as VenueLockResult
      
      if (result.success && result.lock_id) {
        // Add to active locks
        const newLock: VenueLock = {
          id: result.lock_id,
          venue_id: venueId,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          expires_at: result.expires_at || '',
          lock_type: lockType,
          session_id: sessionId
        }
        setActiveLocks(prev => [...prev, newLock])
      }

      return result
    } catch (error) {
      console.error('Error creating venue lock:', error)
      return { 
        success: false, 
        message: 'Failed to create venue lock',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [user, sessionId, supabase])

  const extendLock = useCallback(async (
    lockId: number,
    additionalMinutes: number = 15
  ): Promise<VenueLockResult> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' }
    }

    try {
      const { data, error } = await supabase.rpc('extend_venue_lock', {
        p_lock_id: lockId,
        p_user_id: user.id,
        p_additional_minutes: additionalMinutes
      })

      if (error) throw error

      return data as VenueLockResult
    } catch (error) {
      console.error('Error extending venue lock:', error)
      return { 
        success: false, 
        message: 'Failed to extend venue lock',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [user, supabase])

  const releaseLock = useCallback(async (lockId: number): Promise<VenueLockResult> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' }
    }

    try {
      const { data, error } = await supabase.rpc('release_venue_lock', {
        p_lock_id: lockId,
        p_user_id: user.id
      })

      if (error) throw error

      // Remove from active locks
      setActiveLocks(prev => prev.filter(lock => lock.id !== lockId))

      return data as VenueLockResult
    } catch (error) {
      console.error('Error releasing venue lock:', error)
      return { 
        success: false, 
        message: 'Failed to release venue lock',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [user, supabase])

  const confirmLock = useCallback(async (
    lockId: number,
    eventId: number
  ): Promise<VenueLockResult> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' }
    }

    try {
      const { data, error } = await supabase.rpc('confirm_venue_lock', {
        p_lock_id: lockId,
        p_event_id: eventId,
        p_user_id: user.id
      })

      if (error) throw error

      // Update lock type in active locks
      setActiveLocks(prev => prev.map(lock => 
        lock.id === lockId 
          ? { ...lock, lock_type: 'confirmed' as const }
          : lock
      ))

      return data as VenueLockResult
    } catch (error) {
      console.error('Error confirming venue lock:', error)
      return { 
        success: false, 
        message: 'Failed to confirm venue lock',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [user, supabase])

  const checkAvailability = useCallback(async (
    venueId: number,
    eventDate: string,
    startTime: string,
    endTime: string,
    excludeLockId?: number
  ): Promise<{ available: boolean; reason?: string }> => {
    try {
      const { data, error } = await supabase.rpc('check_venue_availability', {
        p_venue_id: venueId,
        p_event_date: eventDate,
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_lock_id: excludeLockId
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error checking venue availability:', error)
      return { 
        available: false, 
        reason: 'Failed to check availability'
      }
    }
  }, [supabase])

  return {
    activeLocks,
    createLock,
    extendLock,
    releaseLock,
    confirmLock,
    checkAvailability,
    sessionId
  }
}

// Hook for automatic lock extension
export function useAutoLockExtension(lockId: number | null, extendLock: (lockId: number) => Promise<VenueLockResult>) {
  useEffect(() => {
    if (!lockId) return

    // Extend lock every 10 minutes (before 15-minute expiration)
    const interval = setInterval(async () => {
      const result = await extendLock(lockId)
      if (!result.success) {
        console.warn('Failed to extend venue lock:', result.message)
      }
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearInterval(interval)
  }, [lockId, extendLock])
}
