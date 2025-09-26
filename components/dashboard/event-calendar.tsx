"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Clock, MapPin, Users, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface EventCalendarProps {
  userRole?: "student" | "organizer" | "admin"
  showUserEventsOnly?: boolean
}

export function EventCalendar({ userRole = "student", showUserEventsOnly = false }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [eventDates, setEventDates] = useState<Date[]>([])
  const { user } = useAuth()

  useEffect(() => {
    console.log('[CALENDAR] Component mounted/updated:', { 
      userRole, 
      showUserEventsOnly, 
      userId: user?.id,
      userExists: !!user 
    })
    fetchEvents()
  }, [user, showUserEventsOnly])

  const fetchEvents = async () => {
    try {
      const supabase = createClient()

      if (showUserEventsOnly && user) {
        if (userRole === "organizer") {
          // Organizer: events they created
          const { data, error } = await supabase
            .from("events")
            .select(`
              id, title, description, category, event_date, start_time, end_time, 
              current_participants, max_participants,
              venues (venue_name, blocks (block_name)),
              organizers (name)
            `)
            .eq("organizer_id", (
              await supabase.from("organizers").select("id").eq("user_id", user.id).single()
            ).data?.id || -1)
            .order("event_date", { ascending: true })

          if (error) throw error
          setEvents(data || [])
          setLoading(false)
          return
        }

        // Student: events they are registered for
        const { data: studentRow, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single()

        console.log('[CALENDAR] Student lookup:', { studentRow, studentError, userId: user.id })

        if (!studentRow) {
          console.log('[CALENDAR] No student profile found')
          setEvents([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("event_registrations")
          .select(`
            events (
              id, title, description, category_id, event_date, start_time, end_time,
              current_participants, max_participants,
              venues (venue_name, blocks (block_name)),
              organizers (name, department),
              event_categories (name, color_code)
            )
          `)
          .eq("student_id", studentRow.id)
          .eq("status", "registered")
          .order("registration_date", { ascending: false })

        if (error) {
          console.log('[CALENDAR] Registration query error:', error)
          throw error
        }

        console.log('[CALENDAR] Raw registration data:', data)

        // Flatten to events and normalize data
        const mapped = (data || [])
          .map((r: any) => r.events)
          .filter(Boolean)
          .map((event: any) => ({
            ...event,
            category: Array.isArray(event.event_categories) 
              ? event.event_categories[0]?.name 
              : event.event_categories?.name || "Unknown",
            venues: Array.isArray(event.venues) ? event.venues[0] : event.venues,
            organizers: Array.isArray(event.organizers) ? event.organizers[0] : event.organizers
          }))

        setEvents(mapped)
        
        // Set event dates for calendar highlighting
        const dates = mapped.map((event: any) => {
          const eventDate = new Date(event.event_date)
          // Normalize to local date to avoid timezone issues
          return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
        })
        setEventDates(dates)
        
        // Debug logging
        console.log('[CALENDAR] Student registered events:', mapped.length)
        console.log('[CALENDAR] Event dates for highlighting:', dates)
        console.log('[CALENDAR] Mapped events:', mapped)
        
        setLoading(false)
        return
      }

      // Public/All approved upcoming events
      const { data, error } = await supabase
        .from("events")
        .select(`
          id, title, description, category_id, event_date, start_time, end_time, 
          current_participants, max_participants,
          venues (venue_name, blocks (block_name)),
          organizers (name),
          event_categories (name, color_code)
        `)
        .eq("status", "approved")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })

      if (error) throw error
      
      // Normalize public events data
      const normalizedEvents = (data || []).map((event: any) => ({
        ...event,
        category: Array.isArray(event.event_categories) 
          ? event.event_categories[0]?.name 
          : event.event_categories?.name || "Unknown",
        venues: Array.isArray(event.venues) ? event.venues[0] : event.venues,
        organizers: Array.isArray(event.organizers) ? event.organizers[0] : event.organizers
      }))
      
      setEvents(normalizedEvents)
      
      // Set event dates for calendar highlighting
      const dates = normalizedEvents.map((event: any) => {
        const eventDate = new Date(event.event_date)
        // Normalize to local date to avoid timezone issues
        return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      })
      setEventDates(dates)
    } catch (error) {
      // Handle error silently or show user-friendly message
      setEvents([])
      setEventDates([])
    } finally {
      setLoading(false)
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.event_date)
      // Normalize both dates to avoid timezone issues
      const normalizedEventDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      const normalizedSelectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return normalizedEventDate.getTime() === normalizedSelectedDate.getTime()
    })
  }

  const getEventDates = () => {
    return events.map((event) => new Date(event.event_date))
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const handleDateSelect = (date: Date | undefined) => {
    console.log('[CALENDAR] Date selected:', date)
    setSelectedDate(date)
    if (date) {
      const eventsOnDate = getEventsForDate(date)
      console.log('[CALENDAR] Events found for selected date:', eventsOnDate.length, eventsOnDate)
      if (eventsOnDate.length > 0) {
        // Show first event details if there are events on this date
        setSelectedEvent(eventsOnDate[0])
        setShowEventModal(true)
      }
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-[#799EFF] text-white"
      case "cultural":
        return "bg-[#FFDE63] text-gray-900"
      case "sports":
        return "bg-orange-100 text-orange-800"
      case "academic":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleAddToCalendar = (event: any) => {
    const eventDate = new Date(event.event_date)
    const title = encodeURIComponent(event.title)
    const details = encodeURIComponent(event.description)
    const location = encodeURIComponent(
      (event.venues?.venue_name || event.venues?.name || event.venue?.venue_name || event.venue?.name || "") +
      (event.venues?.blocks?.block_name ? ", " + event.venues.blocks.block_name : "")
    )

    const startDate = eventDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z"

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`

    window.open(googleCalendarUrl, "_blank")
    console.log(`[v0] Adding event ${event.id} to calendar`)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Event Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading calendar...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Event Calendar
            {showUserEventsOnly && (
              <Badge variant="outline" className="ml-2">
                {userRole === "student" ? "My Events" : "My Organized Events"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border cursor-pointer"
                modifiers={{
                  hasEvent: (date) => {
                    return eventDates.some(eventDate => {
                      const normalizedEventDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
                      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                      return normalizedEventDate.getTime() === normalizedDate.getTime()
                    })
                  },
                }}
                modifiersStyles={{
                  hasEvent: {
                    backgroundColor: "#3B82F6",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    borderRadius: "6px",
                  },
                }}
              />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">
                {selectedDate ? `Events on ${selectedDate.toLocaleDateString()}` : "Select a date"}
              </h3>

              {selectedDateEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {selectedDate ? "No events scheduled for this date" : "Select a date to view events"}
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">by {event.organizers?.name || event.organizer?.name}</p>
                        </div>
                        <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{event.start_time} - {event.end_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {event.venues?.venue_name || event.venues?.name || event.venue?.venue_name || event.venue?.name}
                            {event.venues?.blocks?.block_name ? `, ${event.venues.blocks.block_name}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          <span>
                            {event.current_participants}/{event.max_participants} registered
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white hover:text-white"
                          onClick={() => handleViewEvent(event)}
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAddToCalendar(event)}
                        >
                          <CalendarIcon className="w-3 h-3" />
                          Add to Calendar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-600">by {selectedEvent.organizers?.name || selectedEvent.organizer?.name}</p>
                <Badge className={getCategoryColor(selectedEvent.category)}>{selectedEvent.category}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm">{new Date(selectedEvent.event_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Venue</p>
                  <p className="text-sm">
                    {selectedEvent.venues?.venue_name || selectedEvent.venues?.name || selectedEvent.venue?.venue_name || selectedEvent.venue?.name}
                    {selectedEvent.venues?.blocks?.block_name ? `, ${selectedEvent.venues.blocks.block_name}` : ""}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Capacity</p>
                  <p className="text-sm">
                    {selectedEvent.current_participants}/{selectedEvent.max_participants}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-medium">Description</p>
                <p className="text-sm mt-1">{selectedEvent.description}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white" 
                  onClick={() => handleAddToCalendar(selectedEvent)}
                >
                  <CalendarIcon className="w-4 h-4" />
                  Add to Calendar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
