"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Calendar, MapPin, Users, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { formatTimeRange } from "@/lib/utils/time-format"

interface Event {
  id: number
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  max_participants: number
  current_participants: number
  status: string
  admin_feedback: string
  requirements: string
  eligibility_criteria: string
  contact_person: string
  contact_email: string
  contact_phone: string
  priority: string
  additional_notes: string
  event_categories: {
    name: string
  } | null
  venues: {
    venue_name: string
    blocks: {
      block_name: string
    } | null
  } | null
}

export default function ChangeRequestPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const eventId = params?.id as string

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            event_categories(name),
            venues(venue_name, blocks(block_name))
          `)
          .eq('id', eventId)
          .single()

        if (error) throw error
        setEvent(data)

      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">Event not found</p>
            <Button onClick={() => router.push('/dashboard/organizer')} className="mt-4">
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryName = event.event_categories?.name || 'Unknown'
  const venueName = event.venues ? `${event.venues.venue_name}, ${event.venues.blocks?.block_name || 'Unknown Block'}` : 'TBA'
  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/organizer')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Button>
        <h1 className="text-2xl font-bold">Change Request Details</h1>
      </div>

      {/* Admin Feedback Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            Admin Feedback - Changes Requested
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-orange-200">
            <p className="text-gray-800 whitespace-pre-wrap">
              {event.admin_feedback || 'No specific feedback provided. Please review your event details and make necessary improvements.'}
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => router.push(`/dashboard/organizer/events/${eventId}/edit`)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{event.title}</span>
            <Badge className="bg-orange-100 text-orange-800">Changes Requested</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-medium">{eventDate}</p>
                <p className="text-sm text-gray-600">{formatTimeRange(event.start_time, event.end_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Venue</p>
                <p className="font-medium">{venueName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="font-medium">{event.current_participants}/{event.max_participants}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Category</h3>
              <Badge className="bg-blue-100 text-blue-800">
                {categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Priority</h3>
              <Badge className={
                event.priority === 'high' ? 'bg-red-100 text-red-800' :
                event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }>
                {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Contact Person</p>
                <p className="font-medium">{event.contact_person || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{event.contact_email || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium">{event.contact_phone || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {event.requirements && (
            <div>
              <h3 className="font-semibold mb-2">Requirements</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{event.requirements}</p>
            </div>
          )}

          {/* Eligibility Criteria */}
          {event.eligibility_criteria && (
            <div>
              <h3 className="font-semibold mb-2">Eligibility Criteria</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{event.eligibility_criteria}</p>
            </div>
          )}

          {/* Additional Notes */}
          {event.additional_notes && (
            <div>
              <h3 className="font-semibold mb-2">Additional Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{event.additional_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
