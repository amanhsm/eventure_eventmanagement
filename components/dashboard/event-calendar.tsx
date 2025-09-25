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
        const { data: studentRow } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (!studentRow) {
          setEvents([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("event_registrations")
          .select(`
            events (
              id, title, description, category, event_date, start_time, end_time,
              current_participants, max_participants,
              venues (venue_name, blocks (block_name)),
              organizers (name, department)
            )
          `)
          .eq("student_id", studentRow.id)
          .order("registration_date", { ascending: false })

        if (error) throw error

        // Flatten to events
        const mapped = (data || [])
          .map((r: any) => r.events)
          .filter(Boolean)

        setEvents(mapped)
        setLoading(false)
        return
      }

      // Public/All approved upcoming events
      const { data, error } = await supabase
        .from("events")
        .select(`
          id, title, description, category, event_date, start_time, end_time, 
          current_participants, max_participants,
          venues (venue_name, blocks (block_name)),
          organizers (name)
        `)
        .eq("status", "approved")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })

      if (error) throw error
      setEvents(data || [])
      
      // Set event dates for calendar highlighting
      const dates = (data || []).map((event: any) => new Date(event.event_date))
      setEventDates(dates)
    } catch (error) {
      console.error("[v0] Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.event_date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getEventDates = () => {
    return events.map((event) => new Date(event.event_date))
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const eventsOnDate = getEventsForDate(date)
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
                  hasEvent: eventDates,
                }}
                modifiersStyles={{
                  hasEvent: {
                    backgroundColor: "#799EFF",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
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
                          <span>{new Date(event.event_date).toLocaleTimeString()}</span>
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
                          className="flex items-center gap-1 bg-transparent"
                          onClick={() => handleViewEvent(event)}
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 bg-transparent"
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
                <Button className="flex items-center gap-2" onClick={() => handleAddToCalendar(selectedEvent)}>
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
