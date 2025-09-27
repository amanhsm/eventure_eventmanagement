import { createClient } from "@/lib/supabase/client"

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: string
  related_event_id?: number
  is_read: boolean
  created_at: string
}

export interface CreateNotificationData {
  user_id: number
  title: string
  message: string
  type: string
  related_event_id?: number
}

export class NotificationService {
  private supabase = createClient()

  /**
   * Create a single notification
   */
  async createNotification(data: CreateNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert([{
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          related_event_id: data.related_event_id || null,
          is_read: false,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error creating notification:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Notification service error:', error)
      return { success: false, error: 'Failed to create notification' }
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(notifications: CreateNotificationData[]): Promise<{ success: boolean; error?: string }> {
    try {
      const notificationData = notifications.map(data => ({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        related_event_id: data.related_event_id || null,
        is_read: false,
        created_at: new Date().toISOString()
      }))

      const { error } = await this.supabase
        .from('notifications')
        .insert(notificationData)

      if (error) {
        console.error('Error creating bulk notifications:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Bulk notification service error:', error)
      return { success: false, error: 'Failed to create notifications' }
    }
  }

  /**
   * Notify all students about a new approved event
   */
  async notifyStudentsNewEvent(eventId: number, eventTitle: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all active students
      const { data: students, error: studentsError } = await this.supabase
        .from('users')
        .select('id')
        .eq('user_type', 'student')
        .eq('is_active', true)

      if (studentsError) {
        console.error('Error fetching students:', studentsError)
        return { success: false, error: studentsError.message }
      }

      if (!students || students.length === 0) {
        return { success: true } // No students to notify
      }

      // Create notifications for all students
      const notifications = students.map(student => ({
        user_id: student.id,
        title: 'New Event Available',
        message: `A new event "${eventTitle}" has been posted. Check it out!`,
        type: 'new_event',
        related_event_id: eventId
      }))

      return await this.createBulkNotifications(notifications)
    } catch (error) {
      console.error('Error notifying students:', error)
      return { success: false, error: 'Failed to notify students' }
    }
  }

  /**
   * Notify organizer about event status change
   */
  async notifyOrganizerEventStatus(
    organizerId: number, 
    eventId: number, 
    eventTitle: string, 
    status: 'approved' | 'rejected' | 'changes_requested',
    adminFeedback?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get organizer's user ID
      const { data: organizer, error: organizerError } = await this.supabase
        .from('organizers')
        .select('user_id')
        .eq('id', organizerId)
        .single()

      if (organizerError || !organizer) {
        console.error('Error fetching organizer:', organizerError)
        return { success: false, error: 'Organizer not found' }
      }

      let title: string
      let message: string
      let type: string

      switch (status) {
        case 'approved':
          title = 'Event Approved'
          message = `Your event "${eventTitle}" has been approved and is now live!`
          type = 'event_approved'
          break
        case 'rejected':
          title = 'Event Rejected'
          message = `Your event "${eventTitle}" has been rejected. ${adminFeedback ? `Reason: ${adminFeedback}` : ''}`
          type = 'event_rejected'
          break
        case 'changes_requested':
          title = 'Changes Requested'
          message = `Changes have been requested for your event "${eventTitle}". ${adminFeedback ? `Feedback: ${adminFeedback}` : ''}`
          type = 'event_changes_requested'
          break
        default:
          return { success: false, error: 'Invalid status' }
      }

      return await this.createNotification({
        user_id: organizer.user_id,
        title,
        message,
        type,
        related_event_id: eventId
      })
    } catch (error) {
      console.error('Error notifying organizer:', error)
      return { success: false, error: 'Failed to notify organizer' }
    }
  }

  /**
   * Notify admin about new event submission
   */
  async notifyAdminNewEventSubmission(eventId: number, eventTitle: string, organizerName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all admin users
      const { data: admins, error: adminsError } = await this.supabase
        .from('users')
        .select('id')
        .eq('user_type', 'admin')
        .eq('is_active', true)

      if (adminsError) {
        console.error('Error fetching admins:', adminsError)
        return { success: false, error: adminsError.message }
      }

      if (!admins || admins.length === 0) {
        return { success: true } // No admins to notify
      }

      // Create notifications for all admins
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: 'New Event Submission',
        message: `A new event "${eventTitle}" has been submitted by ${organizerName} for approval.`,
        type: 'new_event_submission',
        related_event_id: eventId
      }))

      return await this.createBulkNotifications(notifications)
    } catch (error) {
      console.error('Error notifying admins:', error)
      return { success: false, error: 'Failed to notify admins' }
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: number, limit: number = 20): Promise<{ notifications: Notification[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching notifications:', error)
        return { notifications: [], error: error.message }
      }

      return { notifications: data || [] }
    } catch (error) {
      console.error('Error getting user notifications:', error)
      return { notifications: [], error: 'Failed to fetch notifications' }
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: 'Failed to mark notification as read' }
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error: 'Failed to mark all notifications as read' }
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: number): Promise<{ count: number; error?: string }> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        return { count: 0, error: error.message }
      }

      return { count: count || 0 }
    } catch (error) {
      console.error('Error getting unread count:', error)
      return { count: 0, error: 'Failed to get unread count' }
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
