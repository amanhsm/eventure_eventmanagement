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
    approvalRate: 0,
    venuesBooked: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchOrganizerStats = async () => {
      try {
        const supabase = createClient()

        const { data: organizerProfile, error: organizerError } = await supabase
          .from("organizers")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (organizerError) {
          console.error("[v0] Error fetching organizer profile:", organizerError)
          return
        }

        const today = new Date().toISOString().split("T")[0]

        const { count: activeEventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("organizer_id", organizerProfile.id)
          .gte("event_date", today)

        const { data: registrationData } = await supabase
          .from("events")
          .select("current_participants")
          .eq("organizer_id", organizerProfile.id)

        const totalRegistrations =
          registrationData?.reduce((sum, event) => sum + (event.current_participants || 0), 0) || 0

        const { count: totalEventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("organizer_id", organizerProfile.id)

        const { count: approvedEventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("organizer_id", organizerProfile.id)
          .eq("status", "approved")

        const approvalRate = totalEventsCount ? Math.round((approvedEventsCount / totalEventsCount) * 100) : 0

        const { count: venuesBookedCount } = await supabase
          .from("events")
          .select("venue_id", { count: "exact" })
          .eq("organizer_id", organizerProfile.id)
          .not("venue_id", "is", null)

        setStats({
          activeEvents: activeEventsCount || 0,
          totalRegistrations,
          approvalRate,
          venuesBooked: venuesBookedCount || 0,
        })
      } catch (error) {
        console.error("[v0] Error fetching organizer stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizerStats()
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
      icon: TrendingUp,
      value: isLoading ? "..." : `${stats.approvalRate}%`,
      label: "Approval Rate",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: "+5% from last month",
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
