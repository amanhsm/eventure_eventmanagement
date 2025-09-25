"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Clock, X, CheckCircle, XCircle, Download, Bell } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface EventRegistration {
  id: number
  status: string
  registration_date: string
  events: {
    id: number
    title: string
    description: string
    category: string
    category_id: number
    event_date: string
    start_time: string
    end_time: string
    registration_fee: number
    venues: {
      id: number
      venue_name: string
      block_id: number
      max_capacity: number
      blocks: {
        block_name: string
      }
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
}

export function RegisteredEvents() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventRegistration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState<number | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchRegistrations = async () => {
      try {
        const supabase = createClient()

        // Get student profile first
        const { data: studentProfile, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (studentError) {
          console.error("[REGISTRATIONS] Error fetching student profile:", studentError)
          return
        }

        // Fetch registered events with full details
        const { data: registrationsData, error: registrationsError } = await supabase
          .from("event_registrations")
          .select(`
            id,
            status,
            registration_date,
            events (
              id,
              title,
              description,
              category_id,
              event_date,
              start_time,
              end_time,
              registration_fee,
              venues (
                id,
                venue_name,
                block_id,
                max_capacity,
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
            )
          `)
          .eq("student_id", studentProfile.id)
          .order("registration_date", { ascending: false })

        if (registrationsError) {
          console.error("[REGISTRATIONS] Error fetching registrations:", registrationsError)
          throw new Error(`Failed to fetch registrations: ${registrationsError.message}`)
        }

        // Transform data to match interface structure
        const transformedRegistrations = (registrationsData || []).map((reg: any) => ({
          ...reg,
          events: {
            ...(reg.events as any),
            category: (reg.events as any).event_categories?.name || "Unknown",
            venues: Array.isArray((reg.events as any).venues) ? (reg.events as any).venues[0] : (reg.events as any).venues,
            organizers: Array.isArray((reg.events as any).organizers) ? (reg.events as any).organizers[0] : (reg.events as any).organizers,
            event_categories: Array.isArray((reg.events as any).event_categories) ? (reg.events as any).event_categories[0] : (reg.events as any).event_categories,
          }
        }))

        console.log("[REGISTRATIONS] Fetched registrations:", transformedRegistrations)
        setRegistrations(transformedRegistrations)
      } catch (error: any) {
        console.error("[REGISTRATIONS] Error fetching registrations:", error)
        setRegistrations([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRegistrations()
  }, [user?.id])

  const handleCancelRegistration = async (registrationId: number) => {
    setIsCancelling(registrationId)
    try {
      const supabase = createClient()

      // Update registration status to cancelled
      const { error: updateError } = await supabase
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", registrationId)

      if (updateError) {
        console.error("[REGISTRATIONS] Error cancelling registration:", updateError)
        throw new Error(`Failed to cancel registration: ${updateError.message}`)
      }

      // Remove registration from local state
      setRegistrations((prev) => prev.filter((reg) => reg.id !== registrationId))
      setSelectedEvent(null)
      setNotification("Registration cancelled successfully!")
      setTimeout(() => setNotification(null), 3000)
      console.log("[REGISTRATIONS] Registration cancelled successfully")
    } catch (error: any) {
      console.error("[REGISTRATIONS] Error cancelling registration:", error)
      alert("Failed to cancel registration. Please try again.")
    } finally {
      setIsCancelling(null)
    }
  }

  const handleDownloadTicket = (event: EventRegistration) => {
    const ticketData = `
EVENT TICKET
-----------
Event: ${event.events.title}
Date: ${new Date(event.events.event_date).toLocaleDateString()}
Time: ${event.events.start_time} - ${event.events.end_time}
Venue: ${event.events.venues?.venue_name || "TBA"}${event.events.venues?.blocks ? `, ${event.events.venues.blocks.block_name}` : ""}
Registration ID: ${event.id}
Status: ${event.status}
    `

    const blob = new Blob([ticketData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ticket-${event.events.title.replace(/\s+/g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Registered Events</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Registered Events</h2>
          <p className="text-gray-500 mb-4">You haven't registered for any events yet.</p>
          <Button onClick={() => (window.location.href = "/browse")}>Browse Events</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notification && (
        <Card className="border-blue-200 bg-blue-50 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-blue-800">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">{notification}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-semibold">Registered Events</h2>
      {registrations.map((reg) => (
        <Card
          key={reg.id}
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
          onClick={() => setSelectedEvent(reg)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-lg">{reg.events.title}</h3>
                  <Badge variant={reg.status === "registered" ? "default" : "secondary"}>{reg.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(reg.events.event_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {reg.events.start_time} - {reg.events.end_time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {reg.events.venues?.venue_name || "TBA"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {reg.status === "registered" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedEvent.events.title}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Badge
                className={`${
                  selectedEvent.events.category === "technical"
                    ? "bg-blue-100 text-blue-800"
                    : selectedEvent.events.category === "cultural"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-green-100 text-green-800"
                }`}
              >
                {selectedEvent.events.category}
              </Badge>

              <p className="text-muted-foreground">{selectedEvent.events.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{new Date(selectedEvent.events.event_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>
                    {selectedEvent.events.start_time} - {selectedEvent.events.end_time}
                  </span>
                </div>
                {selectedEvent.events.venues && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>
                      {selectedEvent.events.venues.venue_name}, {selectedEvent.events.venues.blocks.block_name}
                    </span>
                  </div>
                )}
                {selectedEvent.events.organizers && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>
                      Organized by {selectedEvent.events.organizers.name}, {selectedEvent.events.organizers.department}
                    </span>
                  </div>
                )}
              </div>

              {selectedEvent.events.venues && (
                <div className="space-y-2">
                  <h4 className="font-medium">Venue Details</h4>
                  <p className="text-sm">
                    Capacity: {selectedEvent.events.venues.max_capacity} people
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadTicket(selectedEvent)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Ticket
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCancelRegistration(selectedEvent.id)}
                  disabled={isCancelling === selectedEvent.id}
                  className="flex items-center gap-2"
                >
                  {isCancelling === selectedEvent.id ? "Cancelling..." : "Cancel Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
