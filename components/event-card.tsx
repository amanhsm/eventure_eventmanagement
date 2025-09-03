"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, Eye } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface Event {
  id: number
  title: string
  organizer: string
  description: string
  date: string
  location: string
  registered: number
  capacity: number
  deadline: string
  category: string
  status?: string
}

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleRegister = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (user.role !== "student") {
      alert("Only students can register for events")
      return
    }

    setIsRegistering(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("event_registrations").insert({
        student_id: user.id,
        event_id: event.id,
        status: "registered",
      })

      if (error) throw error

      setIsRegistered(true)
      console.log(`[v0] Successfully registered for event: ${event.title}`)
    } catch (error) {
      console.error("[v0] Registration error:", error)
      alert("Registration failed. Please try again.")
    } finally {
      setIsRegistering(false)
    }
  }

  const handleViewDetails = () => {
    setShowDetails(!showDetails)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "cultural":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "sports":
        return "bg-yellow-500 hover:bg-yellow-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getStatusColor = (status?: string) => {
    if (status === "Few spots left!") {
      return "bg-orange-500 hover:bg-orange-600"
    }
    return "bg-green-500 hover:bg-green-600"
  }

  const progressPercentage = (event.registered / event.capacity) * 100

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white relative">
        <div className="flex gap-2 mb-4">
          <Badge
            className={`${getCategoryColor(event.category)} text-black font-medium transition-colors cursor-pointer`}
          >
            {event.category}
          </Badge>
          {event.status && (
            <Badge
              className={`${getStatusColor(event.status)} text-white font-medium transition-colors cursor-pointer`}
            >
              {event.status}
            </Badge>
          )}
        </div>
        <h3 className="text-xl font-bold mb-2 text-balance hover:text-yellow-300 transition-colors">{event.title}</h3>
        <p className="text-blue-100 text-sm">by {event.organizer}</p>
      </div>

      <CardContent className="p-6">
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">{event.description}</p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <Users className="w-4 h-4 text-blue-600" />
            <span>
              {event.registered}/{event.capacity} registered
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Deadline: {event.deadline}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer bg-transparent"
          >
            <Eye className="w-4 h-4" />
            {showDetails ? "Hide Details" : "View Details"}
          </Button>

          {user?.role === "student" ? (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              onClick={handleRegister}
              disabled={isRegistering || isRegistered}
            >
              {isRegistering ? "Registering..." : isRegistered ? "Registered ✓" : "Register Now"}
            </Button>
          ) : user?.role === "organizer" || user?.role === "admin" ? (
            <Button
              variant="outline"
              className="flex-1 hover:bg-gray-50 transition-colors cursor-pointer bg-transparent"
              onClick={handleViewDetails}
            >
              View Event Details
            </Button>
          ) : (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
              onClick={() => router.push("/auth/login")}
            >
              Sign In to Register
            </Button>
          )}
        </div>

        {showDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border animate-in slide-in-from-top-2 duration-300">
            <h4 className="font-semibold text-gray-900 mb-2">Event Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Organizer:</strong> {event.organizer}
              </p>
              <p>
                <strong>Category:</strong> {event.category}
              </p>
              <p>
                <strong>Registration Deadline:</strong> {event.deadline}
              </p>
              <p>
                <strong>Available Spots:</strong> {event.capacity - event.registered}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
