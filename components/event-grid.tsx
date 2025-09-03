"use client"

import { useEffect, useState } from "react"
import { EventCard } from "@/components/event-card"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Event {
  id: number
  title: string
  description: string
  category: string
  event_date: string
  start_time: string
  end_time: string
  current_participants: number
  max_participants: number
  registration_deadline: string
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
}

export function EventGrid() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState("upcoming")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("events")
          .select(`
            id,
            title,
            description,
            category,
            event_date,
            start_time,
            end_time,
            current_participants,
            max_participants,
            registration_deadline,
            status,
            venue_id,
            organizer_id,
            venues!events_venue_id_fkey (name, block),
            organizers!events_organizer_id_fkey (name, department)
          `)
          .eq("status", "approved")
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })

        if (error) {
          console.error("[v0] Error fetching events:", error)
          return
        }

        setEvents(data || [])
        setFilteredEvents(data || [])
      } catch (error) {
        console.error("[v0] Error fetching events:", error)
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
    date: new Date(event.event_date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    location: event.venues ? `${event.venues.name}, ${event.venues.block}` : "TBA",
    registered: event.current_participants || 0,
    capacity: event.max_participants || 0,
    deadline: new Date(event.registration_deadline).toLocaleDateString(),
    category: event.category,
    status: event.max_participants - (event.current_participants || 0) <= 5 ? "Few spots left!" : undefined,
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
