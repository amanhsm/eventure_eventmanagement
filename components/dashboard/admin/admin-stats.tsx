"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, AlertTriangle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

export function AdminStats() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingApprovals: 0,
    activeUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()

        // Get total events count
        const { count: totalEventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })

        // Get pending approvals count
        const { count: pendingApprovalsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("status", "pending")

        // Get active users count (users who logged in within last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { count: activeUsersCount } = await supabase
          .from("users")
          .select("id", { count: "exact" })
          .gte("last_login", thirtyDaysAgo.toISOString())

        const statsData = {
          totalEvents: totalEventsCount || 0,
          pendingApprovals: pendingApprovalsCount || 0,
          activeUsers: activeUsersCount || 0,
        }

        console.log("[STATS] Fetched admin stats:", statsData)
        setStats(statsData)
      } catch (error) {
        console.error("[STATS] Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Set up real-time subscription for stats updates
    const supabase = createClient()
    const channel = supabase
      .channel("admin-stats-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          console.log("[STATS] Real-time update received for events")
          fetchStats()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          console.log("[STATS] Real-time update received for users")
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const statsData = [
    {
      icon: Calendar,
      value: loading ? "..." : stats.totalEvents.toString(),
      label: "Total Events",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: AlertTriangle,
      value: loading ? "..." : stats.pendingApprovals.toString(),
      label: "Pending Approvals",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      icon: Users,
      value: loading ? "..." : stats.activeUsers.toLocaleString(),
      label: "Active Users",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statsData.map((stat, index) => (
        <Card key={index}>
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
