"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Clock, MapPin, Users, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatTimeWithoutSeconds } from "@/lib/utils/time-format"
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

      if (showUserEventsOnly && user && userRole === "organizer") {
        // Get organizer events
        const { data: organizerData, error: organizerError } = await supabase
          .from("organizers")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (organizerError || !organizerData) {
          setEvents([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("events")
          .select(`
            id, title, description, event_date, start_time, end_time, 
            current_participants, max_participants, status,
            venues (venue_name, blocks (block_name)),
            organizers (name),
            event_categories (name, color_code)
          `)
          .eq("organizer_id", organizerData.id)
          .order("event_date", { ascending: true })

        if (error) throw error
        setEvents(data || [])
        
        const dates = (data || []).map((event: any) => new Date(event.event_date))
        setEventDates(dates)
      } else {
        // Get public events
        const { data, error } = await supabase
          .from("events")
          .select(`
            id, title, description, event_date, start_time, end_time, 
            current_participants, max_participants,
            venues (venue_name, blocks (block_name)),
            organizers (name),
            event_categories (name, color_code)
          `)
          .eq("status", "approved")
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })

        if (error) throw error
        setEvents(data || [])
        
        const dates = (data || []).map((event: any) => new Date(event.event_date))
        setEventDates(dates)
      }
    } catch (error) {
      setEvents([])
      setEventDates([])
    } finally {
      setLoading(false)
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.event_date)
      const normalizedEventDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      const normalizedSelectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return normalizedEventDate.getTime() === normalizedSelectedDate.getTime()
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            My Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            My Events
            {showUserEventsOnly && (
              <Badge variant="outline" className="ml-2 text-xs">
                {userRole === "student" ? "Registered" : "Organized"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Compact Calendar */}
            <div className="bg-gray-50 rounded-lg p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                modifiers={{
                  hasEvent: (date: Date) => {
                    return eventDates.some(eventDate => {
                      const normalizedEventDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
                      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                      return normalizedEventDate.getTime() === normalizedDate.getTime()
                    })
                  },
                }}
                modifiersStyles={{
                  hasEvent: { 
                    backgroundColor: '#3B82F6', 
                    color: 'white', 
                    fontWeight: 'bold',
                    borderRadius: '6px'
                  }
                }}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center text-sm font-medium mb-2",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 cursor-pointer rounded-md hover:bg-gray-200",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-2",
                  head_row: "flex mb-2",
                  head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-3 justify-between",
                  cell: "text-center text-sm p-1 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-200 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold border-2 border-blue-300",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
            
            {/* Event List for Selected Date */}
            {selectedDate && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {getEventsForDate(selectedDate).length} event{getEventsForDate(selectedDate).length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getEventsForDate(selectedDate).map((event) => (
                      <div key={event.id} className="group p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                           onClick={() => {
                             setSelectedEvent(event)
                             setShowEventModal(true)
                           }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-700">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeWithoutSeconds(event.start_time)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Users className="w-3 h-3" />
                                <span>{event.current_participants}/{event.max_participants}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">
                                {event.venues?.venue_name || 'TBA'}
                                {event.venues?.blocks?.block_name && `, ${event.venues.blocks.block_name}`}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events on this date</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simplified Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span>{new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{formatTimeWithoutSeconds(selectedEvent.start_time)} - {formatTimeWithoutSeconds(selectedEvent.end_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedEvent.venues?.venue_name || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{selectedEvent.current_participants}/{selectedEvent.max_participants} registered</span>
                </div>
              </div>
              
              {selectedEvent.description && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  onClick={() => window.open(`/dashboard/organizer/events/${selectedEvent.id}`, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
