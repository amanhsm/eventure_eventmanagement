"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, DollarSign, User, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface EventDetail {
  id: number
  title: string
  description: string
  category: string
  event_date: string
  start_time: string
  end_time: string
  max_participants: number
  current_participants: number
  registration_deadline: string
  registration_fee: number
  status: string
  venues: {
    venue_name: string
    blocks?: { block_name: string } | null
    max_capacity?: number
    facilities?: string[] | null
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

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const supabase = createClient()
        const eventId = params.id

        // Fetch event details (normalized schema)
        const { data: eventData, error: eventError } = await supabase
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
            venues (
              venue_name,
              blocks ( block_name ),
              max_capacity
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
          .eq("id", eventId)
          .single()

        if (eventError) {
          throw new Error(`Failed to fetch event: ${eventError.message}`)
        }

        // Transform data: normalize nested arrays to single objects
        const unifiedVenue = Array.isArray(eventData.venues) ? eventData.venues[0] : eventData.venues
        const unifiedBlocks = unifiedVenue && Array.isArray((unifiedVenue as any).blocks)
          ? (unifiedVenue as any).blocks[0]
          : unifiedVenue?.blocks || null

        const transformedEvent = {
          ...eventData,
          category: (Array.isArray(eventData.event_categories)
            ? eventData.event_categories[0]?.name
            : (eventData.event_categories as any)?.name) || "Unknown",
          venues: unifiedVenue ? { ...unifiedVenue, blocks: unifiedBlocks } : null,
          organizers: Array.isArray(eventData.organizers) ? eventData.organizers[0] : eventData.organizers,
          event_categories: Array.isArray(eventData.event_categories) ? eventData.event_categories[0] : eventData.event_categories,
        }

        setEvent(transformedEvent)

        // Check if user is already registered (for students)
        if (user?.role === "student") {
          const { data: studentProfile } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", user.id)
            .single()

          if (studentProfile) {
            const { data: registration } = await supabase
              .from("event_registrations")
              .select("id, status")
              .eq("student_id", studentProfile.id)
              .eq("event_id", eventId)
              .single()

            if (registration) {
              setIsRegistered(registration.status === "registered")
              setIsCancelled(registration.status === "cancelled")
            }
          }
        }
      } catch (error: any) {
        console.error("[EVENT] Error fetching event:", error)
        setError(error.message || "Failed to fetch event details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [params.id, user])

  const handleRegister = async () => {
    if (!user || user.role !== "student") {
      setError("Only students can register for events")
      return
    }

    setIsRegistering(true)
    try {
      const supabase = createClient()

      // Get student profile
      const { data: studentProfile, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (studentError) {
        throw new Error("Student profile not found")
      }

      // Check if already registered or previously cancelled
      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id, status")
        .eq("student_id", studentProfile.id)
        .eq("event_id", event?.id)
        .single()

      if (existingRegistration) {
        if (existingRegistration.status === "registered") {
          setError("You are already registered for this event")
          return
        } else if (existingRegistration.status === "cancelled") {
          setError("You have previously cancelled your registration for this event. Once cancelled, re-registration is not allowed. For more information, please contact the event coordinator or your respective teacher.")
          return
        }
      }

      // If event has a fee, redirect to payment portal
      if (event?.registration_fee && event.registration_fee > 0) {
        router.push(`/payment?event_id=${event.id}&amount=${event.registration_fee}`)
        return
      }

      // For free events, register directly
      const { data: insertData, error: registrationError } = await supabase
        .from("event_registrations")
        .insert({
          student_id: studentProfile.id,
          event_id: event?.id,
          status: "registered",
          registration_date: new Date().toISOString(),
        })
        .select()

      // If direct insert fails due to RLS, try RPC function
      if (registrationError || !insertData || insertData.length === 0) {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('register_for_event', {
            p_event_id: event?.id,
            p_student_user_id: user.id
          })

        if (rpcError || !rpcResult?.success) {
          throw new Error(rpcError?.message || rpcResult?.error || 'Registration failed')
        }
      }

      setIsRegistered(true)
      // Update current participants count
      if (event) {
        setEvent({
          ...event,
          current_participants: event.current_participants + 1
        })
      }
    } catch (error: any) {
      console.error("[REGISTRATION] Error:", error)
      setError(error.message || "Registration failed")
    } finally {
      setIsRegistering(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || "Event not found"}</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isEventFull = event.current_participants >= event.max_participants
  const isRegistrationClosed = new Date() > new Date(event.registration_deadline)

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Event Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: event.event_categories?.color_code + "20",
                        color: event.event_categories?.color_code 
                      }}
                    >
                      {event.category}
                    </Badge>
                    <Badge variant={event.status === "approved" ? "default" : "secondary"}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6 leading-relaxed">{event.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-gray-600">{format(new Date(event.event_date), "MMMM d, yyyy")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-gray-600">
                      {event.start_time} - {event.end_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p className="text-gray-600">
                      {event.venues?.venue_name}
                      {event.venues?.blocks?.block_name ? `, ${event.venues.blocks.block_name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Organizer</p>
                    <p className="text-gray-600">
                      {event.organizers?.name} ({event.organizers?.department})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Participants</p>
                    <p className="text-gray-600">
                      {event.current_participants} / {event.max_participants}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Registration Fee</p>
                    <p className="text-gray-600">
                      {event.registration_fee > 0 ? `₹${event.registration_fee}` : "Free"}
                    </p>
                  </div>
                </div>
              </div>

              
            </CardContent>
          </Card>
        </div>

        {/* Registration Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Registration Deadline</p>
                  <p className="font-medium">
                    {format(new Date(event.registration_deadline), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Available Spots</p>
                  <p className="font-medium">
                    {event.max_participants - event.current_participants} remaining
                  </p>
                </div>

                {user?.role === "student" && (
                  <div className="pt-4">
                    {isRegistered ? (
                      <div className="text-center">
                        <Badge variant="default" className="mb-2">
                          ✓ Registered
                        </Badge>
                        <p className="text-sm text-gray-600">
                          You are registered for this event
                        </p>
                      </div>
                    ) : isCancelled ? (
                      <div className="text-center">
                        <Badge variant="destructive" className="mb-2">
                          ✗ Registration Cancelled
                        </Badge>
                        <p className="text-sm text-gray-600 mb-2">
                          You previously cancelled your registration for this event.
                        </p>
                        <p className="text-xs text-gray-500">
                          Re-registration is not allowed. For more information, contact the event coordinator or your respective teacher.
                        </p>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleRegister}
                        disabled={isRegistering || isRegistered || isCancelled || isEventFull}
                        className="w-full bg-[#799EFF] hover:bg-[#6B8EFF] text-white cursor-pointer"
                      >
                        {isRegistering ? "Registering..." : isRegistered ? "Already Registered" : isCancelled ? "Registration Cancelled" : isEventFull ? "Event Full" : `Register ${event.registration_fee > 0 ? `(₹${event.registration_fee})` : "(Free)"}`}
                      </Button>
                    )}
                  </div>
                )}

                {user?.role !== "student" && (
                  <p className="text-sm text-gray-600 text-center">
                    Only students can register for events
                  </p>
                )}

                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
