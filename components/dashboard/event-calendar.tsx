"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Clock, MapPin, Users, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
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
  const { user } = useAuth()

  useEffect(() => {
    fetchEvents()
  }, [user, showUserEventsOnly])

  const fetchEvents = async () => {
    try {
      const supabase = createBrowserClient()
      let query = supabase
        .from("events")
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(full_name, email),
          venue:venues(name),
          registrations(id, user_id)
        `)
        .eq("status", "approved")
        .order("event_date", { ascending: true })

      if (showUserEventsOnly && user) {
        if (userRole === "organizer") {
          query = query.eq("organizer_id", user.id)
        } else if (userRole === "student") {
          // Get events the student is registered for
          const { data: registrations } = await supabase.from("registrations").select("event_id").eq("user_id", user.id)

          const eventIds = registrations?.map((r) => r.event_id) || []
          if (eventIds.length > 0) {
            query = query.in("id", eventIds)
          } else {
            setEvents([])
            setLoading(false)
            return
          }
        }
      }

      const { data: eventsData, error } = await query

      if (error) throw error

      setEvents(eventsData || [])
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-100 text-blue-800"
      case "cultural":
        return "bg-purple-100 text-purple-800"
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
    // Create calendar event data
    const eventDate = new Date(event.event_date)
    const title = encodeURIComponent(event.title)
    const details = encodeURIComponent(event.description)
    const location = encodeURIComponent(event.venue?.name || "")

    // Format date for Google Calendar (YYYYMMDDTHHMMSSZ)
    const startDate = eventDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const endDate =
      new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

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
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasEvent: getEventDates(),
                }}
                modifiersStyles={{
                  hasEvent: {
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    fontWeight: "bold",
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
                          <p className="text-sm text-gray-600">by {event.organizer?.full_name}</p>
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
                          <span>{event.venue?.name}</span>
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
                <p className="text-sm text-gray-600">by {selectedEvent.organizer?.full_name}</p>
                <Badge className={getCategoryColor(selectedEvent.category)}>{selectedEvent.category}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm">{new Date(selectedEvent.event_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Venue</p>
                  <p className="text-sm">{selectedEvent.venue?.name}</p>
                </div>
                <div>
                  <p className="font-medium">Capacity</p>
                  <p className="text-sm">
                    {selectedEvent.current_participants}/{selectedEvent.max_participants}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Registration Fee</p>
                  <p className="text-sm">₹{selectedEvent.registration_fee || 0}</p>
                </div>
              </div>

              <div>
                <p className="font-medium">Description</p>
                <p className="text-sm mt-1">{selectedEvent.description}</p>
              </div>

              <div>
                <p className="font-medium">Requirements</p>
                <p className="text-sm mt-1">{selectedEvent.requirements || "None specified"}</p>
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
