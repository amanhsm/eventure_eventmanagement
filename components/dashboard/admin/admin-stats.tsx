"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, CheckCircle, AlertTriangle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function AdminStats() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    systemUptime: "94%",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createBrowserClient()

        const [eventsResult, pendingResult, usersResult] = await Promise.all([
          supabase.from("events").select("id", { count: "exact" }),
          supabase.from("events").select("id", { count: "exact" }).eq("status", "pending"),
          supabase.from("profiles").select("id", { count: "exact" }).eq("status", "active"),
        ])

        setStats({
          totalEvents: eventsResult.count || 0,
          pendingApprovals: pendingResult.count || 0,
          activeUsers: usersResult.count || 0,
          systemUptime: "94%",
        })
      } catch (error) {
        console.error("[v0] Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statsData = [
    {
      icon: Calendar,
      value: loading ? "..." : stats.totalEvents.toString(),
      label: "Total Events",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12 this month",
      trend: "up",
    },
    {
      icon: AlertTriangle,
      value: loading ? "..." : stats.pendingApprovals.toString(),
      label: "Pending Approvals",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: "3 urgent",
      trend: "neutral",
    },
    {
      icon: Users,
      value: loading ? "..." : stats.activeUsers.toLocaleString(),
      label: "Active Users",
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+234 this week",
      trend: "up",
    },
    {
      icon: CheckCircle,
      value: stats.systemUptime,
      label: "System Uptime",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "99.9% target",
      trend: "up",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <p className="text-xs text-gray-500">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
