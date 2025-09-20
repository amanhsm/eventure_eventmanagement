"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { EventCard } from "@/components/event-card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Clock } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Event {
  id: number
  title: string
  description: string
  category: string
  category_id: number
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
  venues: {
    name: string
    block: string
  } | null
  organizers: {
    name: string
    department: string
  } | null
  event_categories: {
    name: string
    color_code: string
  } | null
}

export default function EventGrid() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState("upcoming")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient()

        // Fetch events with venue, organizer, and category details
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select(`
            id,
            title,
            description,
            category_id,
            event_date,
            start_time,
            end_time,
            max_participants,
            current_participants,
            registration_deadline,
            registration_fee,
            status,
            venue_id,
            organizer_id,
            venues!inner (
              name,
              block
            ),
            organizers!inner (
              name,
              department
            ),
            event_categories!inner (
              name,
              color_code
            )
          `)
          .eq("status", "approved")
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })

        if (eventsError) {
          console.error("[EVENTS] Error fetching events:", eventsError)
          throw new Error(`Failed to fetch events: ${eventsError.message}`)
        }

        // Transform data to match Event interface
        const eventsWithCounts = await Promise.all(
          (eventsData || []).map(async (event) => {
            const { count: participantCount } = await supabase
              .from("event_registrations")
              .select("id", { count: "exact" })
              .eq("event_id", event.id)
              .eq("status", "registered")

            return {
              ...event,
              category: (event.event_categories as any)?.name || "Unknown",
              current_participants: participantCount || 0,
              venues: Array.isArray(event.venues) ? event.venues[0] : event.venues,
              organizers: Array.isArray(event.organizers) ? event.organizers[0] : event.organizers,
              event_categories: Array.isArray(event.event_categories) ? event.event_categories[0] : event.event_categories,
            }
          })
        )

        console.log("[EVENTS] Fetched events:", eventsWithCounts)
        setEvents(eventsWithCounts)
        setFilteredEvents(eventsWithCounts)
      } catch (error: any) {
        console.error("[EVENTS] Error fetching events:", error)
        setError(error.message || "Failed to fetch events")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    let filtered = [...events]

    if (categoryFilter !== "all") {
      filtered = filtered.filter((event) => event.category === categoryFilter)
    }

    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.current_participants - a.current_participants)
        break
      case "deadline":
        filtered.sort(
          (a, b) => new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime(),
        )
        break
      case "upcoming":
      default:
        filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        break
    }

    setFilteredEvents(filtered)
  }, [events, sortBy, categoryFilter])

  const transformEventForCard = (event: Event) => ({
    id: event.id,
    title: event.title,
    organizer: event.organizers?.name || "Unknown Organizer",
    description: event.description,
    category: event.category,
    date: new Date(event.event_date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    location: event.venues ? `${event.venues.name}, ${event.venues.block}` : "TBA",
    registered: event.current_participants || 0,
    capacity: event.max_participants || 0,
    deadline: new Date(event.registration_deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    registrationFee: event.registration_fee || 0,
  })

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-800 font-medium mb-2">Error Loading Events</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">{filteredEvents.length} events found</p>
        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="cultural">Cultural</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Sort: Upcoming</SelectItem>
              <SelectItem value="popular">Sort: Popular</SelectItem>
              <SelectItem value="deadline">Sort: Deadline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No events found matching your criteria</p>
          <p className="text-gray-400">Try adjusting your filters or check back later for new events</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={transformEventForCard(event)} />
          ))}
        </div>
      )}
    </div>
  )
}
