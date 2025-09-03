import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Users, AlertCircle, TrendingUp } from "lucide-react"

export function SystemOverview() {
  const systemMetrics = [
    {
      label: "Server Status",
      value: "Operational",
      status: "good",
      icon: Activity,
    },
    {
      label: "Database",
      value: "99.9% Uptime",
      status: "good",
      icon: TrendingUp,
    },
    {
      label: "Active Sessions",
      value: "1,247",
      status: "normal",
      icon: Users,
    },
    {
      label: "Error Rate",
      value: "0.02%",
      status: "good",
      icon: AlertCircle,
    },
  ]

  const recentActivity = [
    {
      id: 1,
      action: "Event Approved",
      details: "AI Workshop by Tech Club",
      time: "5 minutes ago",
      type: "approval",
    },
    {
      id: 2,
      action: "New User Registration",
      details: "Sarah Johnson joined",
      time: "12 minutes ago",
      type: "user",
    },
    {
      id: 3,
      action: "Venue Booking",
      details: "Main Auditorium reserved",
      time: "1 hour ago",
      type: "venue",
    },
    {
      id: 4,
      action: "System Backup",
      details: "Daily backup completed",
      time: "2 hours ago",
      type: "system",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "approval":
        return "text-green-600"
      case "user":
        return "text-blue-600"
      case "venue":
        return "text-purple-600"
      case "system":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          System Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">System Health</h4>
            <div className="space-y-3">
              {systemMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{metric.value}</span>
                    <Badge className={getStatusColor(metric.status)} size="sm">
                      {metric.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)} bg-current`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.details}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              View Full System Logs
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
