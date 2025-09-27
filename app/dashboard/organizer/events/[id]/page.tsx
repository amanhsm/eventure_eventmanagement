"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MapPin, Users, Clock, Mail, Phone, User, FileText, AlertCircle } from "lucide-react"
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
  registration_fee: number
  registration_deadline: string
  status: string
  approval_status: string
  requirements: string
  eligibility_criteria: string
  contact_person: string
  contact_email: string
  contact_phone: string
  priority: string
  additional_notes: string
  admin_feedback: string
  created_at: string
  event_categories: {
    name: string
  } | null
  venues: {
    venue_name: string
    blocks: {
      block_name: string
    } | null
  } | null
  organizers: {
    name: string
    users: {
      email: string
    } | null
  } | null
}

export default function EventViewPage() {
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
            venues(venue_name, blocks(block_name)),
            organizers(name, users(email))
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
  
  const registrationDeadline = event.registration_deadline ? 
    new Date(event.registration_deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Not set'

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "changes_requested":
        return "bg-orange-100 text-orange-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "Pending Approval"
      case "changes_requested":
        return "Changes Requested"
      case "draft":
        return "Draft"
      case "approved":
        return "Active"
      case "completed":
        return "Completed"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

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
        <h1 className="text-2xl font-bold">Event Details</h1>
      </div>

      {/* Admin Feedback if exists */}
      {event.admin_feedback && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              Admin Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 whitespace-pre-wrap">{event.admin_feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Event Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()}
                </Badge>
                <Badge className={getStatusColor(event.status)}>
                  {getStatusDisplayText(event.status)}
                </Badge>
                <Badge className={
                  event.priority === 'high' ? 'bg-red-100 text-red-800' :
                  event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }>
                  {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)} Priority
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                ₹{(event.current_participants * event.registration_fee).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{eventDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium">{formatTimeRange(event.start_time, event.end_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Venue</p>
                <p className="font-medium">{venueName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="font-medium">{event.current_participants}/{event.max_participants}</p>
              </div>
            </div>
          </div>

          {/* Registration Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Registration Progress</span>
              <span>{Math.round((event.current_participants / event.max_participants) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${(event.current_participants / event.max_participants) * 100}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{event.description}</p>
          </div>

          {/* Registration Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Registration Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration Fee:</span>
                  <span className="font-medium">₹{event.registration_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration Deadline:</span>
                  <span className="font-medium">{registrationDeadline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{new Date(event.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                {event.contact_person && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{event.contact_person}</span>
                  </div>
                )}
                {event.contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{event.contact_email}</span>
                  </div>
                )}
                {event.contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{event.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Requirements & Eligibility */}
          {(event.requirements || event.eligibility_criteria) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.requirements && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {event.requirements}
                  </p>
                </div>
              )}
              {event.eligibility_criteria && (
                <div>
                  <h3 className="font-semibold mb-2">Eligibility Criteria</h3>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {event.eligibility_criteria}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Additional Notes */}
          {event.additional_notes && (
            <div>
              <h3 className="font-semibold mb-2">Additional Notes</h3>
              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                {event.additional_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
