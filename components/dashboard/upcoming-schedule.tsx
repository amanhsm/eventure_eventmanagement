"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export function UpcomingSchedule() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchUpcomingEvents()
    }
  }, [user])

  const fetchUpcomingEvents = async () => {
    try {
      const supabase = createBrowserClient()
      const now = new Date().toISOString()

      const { data: registrations, error } = await supabase
        .from("registrations")
        .select(`
          event:events(
            id,
            title,
            event_date,
            venue:venues(name),
            category,
            status
          )
        `)
        .eq("user_id", user?.id)
        .gte("event.event_date", now)
        .order("event.event_date", { ascending: true })
        .limit(4)

      if (error) throw error

      const events = registrations?.map((r) => r.event).filter(Boolean) || []
      setUpcomingEvents(events)
    } catch (error) {
      console.error("[v0] Error fetching upcoming events:", error)
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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatEventDate = (dateString: string) => {
    const eventDate = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (eventDate.toDateString() === today.toDateString()) {
      return "Today"
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return eventDate.toLocaleDateString()
    }
  }

  const formatEventTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Upcoming Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading upcoming events...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Upcoming Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming events</p>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.id} className="border-l-4 border-blue-600 pl-4 py-2">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <Badge className={getStatusColor(event.status)} size="sm">
                    {event.status === "approved" ? "confirmed" : event.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatEventDate(event.event_date)} at {formatEventTime(event.event_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{event.venue?.name}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
