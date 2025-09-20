"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, TrendingUp, MapPin } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

export function OrganizerStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    activeEvents: 0,
    totalRegistrations: 0,
    venuesBooked: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchOrganizerStats = async () => {
      try {
        const supabase = createClient()

        // Get organizer profile first
        const { data: organizerProfile, error: organizerError } = await supabase
          .from("organizers")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (organizerError) {
          console.error("[STATS] Error fetching organizer profile:", organizerError)
          return
        }

        const today = new Date().toISOString().split("T")[0]

        // Get active events count (approved events in the future)
        const { count: activeEventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("organizer_id", organizerProfile.id)
          .eq("status", "approved")
          .gte("event_date", today)

        // Get total registrations across all organizer's events
        const { count: totalRegistrationsCount } = await supabase
          .from("event_registrations")
          .select("id, events!inner(organizer_id)", { count: "exact" })
          .eq("events.organizer_id", organizerProfile.id)

        // Get approval rate (approved events / total submitted events)
        const { count: totalEventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("organizer_id", organizerProfile.id)

        const { count: approvedEventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("organizer_id", organizerProfile.id)
          .eq("status", "approved")

        // Get venues booked count (distinct venues used by organizer)
        const { data: venuesData } = await supabase
          .from("events")
          .select("venue_id")
          .eq("organizer_id", organizerProfile.id)
          .not("venue_id", "is", null)

        const uniqueVenues = new Set(venuesData?.map(event => event.venue_id) || [])

        const statsData = {
          activeEvents: activeEventsCount || 0,
          totalRegistrations: totalRegistrationsCount || 0,
          venuesBooked: uniqueVenues.size,
        }

        console.log("[STATS] Fetched organizer stats:", statsData)
        setStats(statsData)
      } catch (error) {
        console.error("[STATS] Error fetching organizer stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizerStats()

    // Set up real-time subscription for stats updates
    const supabase = createClient()
    const channel = supabase
      .channel("organizer-stats-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          console.log("[STATS] Real-time update received for events")
          fetchOrganizerStats()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_registrations",
        },
        () => {
          console.log("[STATS] Real-time update received for registrations")
          fetchOrganizerStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const statsData = [
    {
      icon: Calendar,
      value: isLoading ? "..." : stats.activeEvents.toString(),
      label: "Active Events",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+3 this month",
    },
    {
      icon: Users,
      value: isLoading ? "..." : stats.totalRegistrations.toLocaleString(),
      label: "Total Registrations",
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+156 this week",
    },
    {
      icon: MapPin,
      value: isLoading ? "..." : stats.venuesBooked.toString(),
      label: "Venues Booked",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "2 pending approval",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
