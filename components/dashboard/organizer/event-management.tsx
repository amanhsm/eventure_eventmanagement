"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Edit, Trash2, Eye, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import EventCreationForm from "./event-creation-form"

interface Event {
  id: number
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  current_participants: number
  max_participants: number
  registration_deadline: string
  registration_fee: number
  status: string
  venue_id: number
  organizer_id: number
  category_id: number
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

export function EventManagement() {
  const { user } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizerEvents()
  }, [user])

  const fetchOrganizerEvents = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_categories(name),
          venues(venue_name, blocks(block_name))
        `)
        .eq('organizer_id', user.id)
        .order('event_date', { ascending: true })

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching organizer events:', error)
      setError('Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-100 text-blue-800"
      case "cultural":
        return "bg-purple-100 text-purple-800"
      case "sports":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCreateEvent = () => {
    setShowCreateForm(true)
  }

  const handleViewEvent = (eventId: number) => {
    console.log(`[v0] Viewing event ${eventId}`)
    // Navigate to event details page
  }

  const handleEditEvent = (eventId: number) => {
    console.log(`[v0] Editing event ${eventId}`)
    router.push(`/dashboard/organizer/edit-event/${eventId}`)
  }

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((event) => event.id !== eventId))
      console.log(`[v0] Deleted event ${eventId}`)
    }
  }

  const handleSubmitForApproval = (eventId: number) => {
    setEvents(events.map((event) => (event.id === eventId ? { ...event, status: "pending" } : event)))
    console.log(`[v0] Submitted event ${eventId} for approval`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Event Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Event Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchOrganizerEvents}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create New Event</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
            className="cursor-pointer"
          >
            Back to Events
          </Button>
        </div>
        <EventCreationForm />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Event Management</CardTitle>
          <Button size="sm" className="bg-[#799EFF] hover:bg-[#6B8EFF] cursor-pointer" onClick={handleCreateEvent}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No events created yet</p>
            <Button onClick={handleCreateEvent}>Create Your First Event</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => {
              const categoryName = event.event_categories?.name || 'Unknown'
              const venueName = event.venues ? `${event.venues.venue_name}, ${event.venues.blocks?.block_name || 'Unknown Block'}` : 'TBA'
              const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
              const revenue = `₹${(event.current_participants * event.registration_fee).toLocaleString()}`
              
              return (
                <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(categoryName)}>{categoryName}</Badge>
                        <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{revenue}</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{venueName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>
                        {event.current_participants}/{event.max_participants} registered
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(event.current_participants / event.max_participants) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((event.current_participants / event.max_participants) * 100)}% capacity filled
                    </p>
                  </div>

                  <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 bg-transparent"
                  onClick={() => handleViewEvent(event.id)}
                >
                  <Eye className="w-3 h-3" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 bg-transparent"
                  onClick={() => handleEditEvent(event.id)}
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-transparent"
                  onClick={() => handleDeleteEvent(event.id)}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
                {event.status === "draft" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSubmitForApproval(event.id)}
                  >
                    Submit for Approval
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
