"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface VenueCalendarProps {
  venueId: string
}

export function VenueCalendar({ venueId }: VenueCalendarProps) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVenueBookings()
  }, [venueId])

  const fetchVenueBookings = async () => {
    try {
      const supabase = createBrowserClient()
      const now = new Date().toISOString()

      const { data: events, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          event_date,
          current_participants,
          max_participants,
          status,
          organizer:profiles!events_organizer_id_fkey(full_name)
        `)
        .eq("venue_id", venueId)
        .gte("event_date", now)
        .order("event_date", { ascending: true })
        .limit(10)

      if (error) throw error

      setBookings(events || [])
    } catch (error) {
      console.error("[v0] Error fetching venue bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Booking Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading venue bookings...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Booking Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            <p>Showing upcoming bookings for this venue</p>
          </div>

          {bookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming bookings for this venue</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{booking.title}</h4>
                    <p className="text-sm text-gray-600">by {booking.organizer?.full_name}</p>
                  </div>
                  <Badge className={getStatusColor(booking.status)} size="sm">
                    {booking.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(booking.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(booking.event_date).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Expected Attendees:</span> {booking.current_participants}/
                  {booking.max_participants}
                </div>
              </div>
            ))
          )}

          <div className="text-center pt-4">
            <Button variant="outline" size="sm" className="bg-transparent">
              View Full Calendar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
