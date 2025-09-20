"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, X, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface EventRegistration {
  id: number
  status: string
  registration_date: string
  events: {
    id: number
    title: string
    description: string
    event_date: string
    start_time: string
    end_time: string
    registration_fee: number
    cancellation_allowed: boolean
    event_categories: {
      name: string
    } | null
    venues: {
      name: string
      block: string
    } | null
    organizers: {
      name: string
    } | null
  }
}

export default function RegistrationReview() {
  const { user } = useAuth()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRegistrations()
  }, [user])

  const fetchRegistrations = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          status,
          registration_date,
          events (
            id,
            title,
            description,
            event_date,
            start_time,
            end_time,
            registration_fee,
            cancellation_allowed,
            event_categories(name),
            venues(name, block),
            organizers(name)
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'registered')
        .order('registration_date', { ascending: false })

      if (error) throw error

      // Transform the data to flatten nested arrays
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        events: {
          ...item.events,
          event_categories: Array.isArray(item.events.event_categories) 
            ? item.events.event_categories[0] || null 
            : item.events.event_categories,
          venues: Array.isArray(item.events.venues) 
            ? item.events.venues[0] || null 
            : item.events.venues,
          organizers: Array.isArray(item.events.organizers) 
            ? item.events.organizers[0] || null 
            : item.events.organizers
        }
      }))

      setRegistrations(transformedData as EventRegistration[])
    } catch (error) {
      console.error('Error fetching registrations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRegistration = async (registrationId: number) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return

    try {
      setCancellingId(registrationId)
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('id', registrationId)

      if (error) throw error

      // Remove from local state
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId))
    } catch (error) {
      console.error('Error cancelling registration:', error)
      alert('Failed to cancel registration. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const handleViewEvent = (eventId: number) => {
    router.push(`/events/${eventId}`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          My Registrations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No active registrations</p>
            <Button 
              onClick={() => router.push('/browse')}
              className="bg-[#799EFF] hover:bg-[#6B8EFF] text-white cursor-pointer"
            >
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => {
              const event = registration.events
              const categoryName = event.event_categories?.name || 'Unknown'
              const venueName = event.venues ? `${event.venues.name}, ${event.venues.block}` : 'TBA'
              const organizerName = event.organizers?.name || 'Unknown'
              const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })

              return (
                <div key={registration.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">by {organizerName}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {categoryName}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Registered
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{event.registration_fee}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{venueName}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewEvent(event.id)}
                      className="cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Event
                    </Button>
                    {event.cancellation_allowed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRegistration(registration.id)}
                        disabled={cancellingId === registration.id}
                        className="text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {cancellingId === registration.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
