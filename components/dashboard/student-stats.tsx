"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

export function StudentStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    registered: 0,
    attended: 0,
    upcoming: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchStudentStats = async () => {
      try {
        const supabase = createClient()

        // Get student profile first
        const { data: studentProfile, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (studentError) {
          console.error("[STATS] Error fetching student profile:", studentError)
          return
        }

        const today = new Date().toISOString().split("T")[0]
        const oneWeekFromNow = new Date()
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

        // Get total registered events count
        const { count: registeredCount } = await supabase
          .from("event_registrations")
          .select("id", { count: "exact" })
          .eq("student_id", studentProfile.id)
          .eq("status", "registered")

        // Get attended events count (events in the past)
        const { count: attendedCount } = await supabase
          .from("event_registrations")
          .select("id, events!inner(event_date)", { count: "exact" })
          .eq("student_id", studentProfile.id)
          .eq("status", "attended")
          .lt("events.event_date", today)

        // Get upcoming events count (events in next 7 days)
        const { count: upcomingCount } = await supabase
          .from("event_registrations")
          .select("id, events!inner(event_date)", { count: "exact" })
          .eq("student_id", studentProfile.id)
          .eq("status", "registered")
          .gte("events.event_date", today)
          .lte("events.event_date", oneWeekFromNow.toISOString().split("T")[0])

        const statsData = {
          registered: registeredCount || 0,
          attended: attendedCount || 0,
          upcoming: upcomingCount || 0,
        }

        console.log("[STATS] Fetched student stats:", statsData)
        setStats(statsData)
      } catch (error) {
        console.error("[STATS] Error fetching student stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudentStats()

    // Set up real-time subscription for stats updates
    const supabase = createClient()
    const channel = supabase
      .channel("student-stats-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_registrations",
        },
        (payload) => {
          console.log("[STATS] Real-time update received:", payload)
          fetchStudentStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.registered}</div>
            <div className="text-sm text-muted-foreground">Registered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.attended}</div>
            <div className="text-sm text-muted-foreground">Attended</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{stats.upcoming}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
