"use client"

import { useEffect, useMemo, useState } from "react"
import { EventCard } from "@/components/event-card"
import { createClient } from "@/lib/supabase/client"
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
  image_url?: string
  venues: {
    venue_name: string
    blocks?: {
      block_name: string
    } | null
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

interface EventGridProps {
  searchQuery: string
  categoryFilter: string
  quickFilter: string
  venueId: number | null
  sortBy: string
  onSortByChange: (value: string) => void
}

export default function EventGrid({
  searchQuery,
  categoryFilter,
  quickFilter,
  venueId,
  sortBy,
  onSortByChange,
}: EventGridProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient()

        // Helper to get local YYYY-MM-DD (not UTC)
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        const localISO = `${yyyy}-${mm}-${dd}`

        // Build base query
        let query = supabase
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
            image_url,
            venues (
              venue_name,
              blocks (
                block_name
              )
            ),
            organizers (
              name,
              department
            ),
            event_categories (
              name,
              color_code
            )
          `)
          .eq("status", "approved")

        if (quickFilter === "Today") {
          // Only events happening today; order by start_time so it's not random
          query = query.eq("event_date", localISO).order("start_time", { ascending: true })
        } else {
          // Upcoming and later
          query = query.gte("event_date", localISO).order("event_date", { ascending: true })
        }

        const { data: eventsData, error: eventsError } = await query

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

            const unifiedVenue = Array.isArray(event.venues) ? event.venues[0] : event.venues
            const unifiedBlocks = unifiedVenue && Array.isArray((unifiedVenue as any).blocks)
              ? (unifiedVenue as any).blocks[0]
              : unifiedVenue?.blocks || null

            return {
              ...event,
              category: (Array.isArray(event.event_categories)
                ? event.event_categories[0]?.name
                : (event.event_categories as any)?.name) || "Unknown",
              current_participants: participantCount || 0,
              venues: unifiedVenue ? { ...unifiedVenue, blocks: unifiedBlocks } : null,
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
  }, [quickFilter])

  // Apply filters whenever dependencies change
  useEffect(() => {
    let filtered = [...events]

    // Category filter
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((event) => event.category?.toLowerCase() === categoryFilter.toLowerCase())
    }

    // Search filter (title, description, organizer, venue)
    if (searchQuery?.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((e) => {
        const inTitle = e.title?.toLowerCase().includes(q)
        const inDesc = e.description?.toLowerCase().includes(q)
        const inOrg = e.organizers?.name?.toLowerCase().includes(q)
        const inVenue = e.venues?.venue_name?.toLowerCase().includes(q) || e.venues?.blocks?.block_name?.toLowerCase().includes(q)
        return inTitle || inDesc || inOrg || inVenue
      })
    }

    // Venue filter
    if (venueId) {
      filtered = filtered.filter((e) => e.venue_id === venueId)
    }

    // Quick filters
    const today = new Date()
    if (quickFilter === "Today") {
      const isoToday = today.toISOString().split("T")[0]
      filtered = filtered.filter((e) => e.event_date === isoToday)
    } else if (quickFilter === "This Week") {
      const start = new Date(today)
      const end = new Date(today)
      end.setDate(end.getDate() + 7)
      filtered = filtered.filter((e) => {
        const d = new Date(e.event_date)
        return d >= start && d <= end
      })
    } else if (quickFilter === "Free Events") {
      filtered = filtered.filter((e) => (e.registration_fee || 0) === 0)
    } else if (quickFilter === "Available Spots") {
      filtered = filtered.filter((e) => (e.current_participants || 0) < (e.max_participants || 0))
    }

    // Sorting
    const sorted = [...filtered]
    switch (sortBy) {
      case "popular":
        sorted.sort((a, b) => b.current_participants - a.current_participants)
        break
      case "deadline":
        sorted.sort((a, b) => new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime())
        break
      case "upcoming":
      default:
        sorted.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        break
    }

    setFilteredEvents(sorted)
  }, [events, categoryFilter, searchQuery, venueId, quickFilter, sortBy])

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
    location: event.venues ? `${event.venues.venue_name}${event.venues.blocks?.block_name ? ", " + event.venues.blocks.block_name : ""}` : "TBA",
    registered: event.current_participants || 0,
    capacity: event.max_participants || 0,
    deadline: new Date(event.registration_deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    registrationFee: event.registration_fee || 0,
    image_url: event.image_url,
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
          <Select value={sortBy} onValueChange={onSortByChange}>
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
