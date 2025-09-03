import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react"

export function EventAnalytics() {
  const analytics = [
    {
      title: "This Month",
      metrics: [
        { label: "Events Created", value: "8", change: "+2" },
        { label: "Total Registrations", value: "456", change: "+89" },
        { label: "Revenue Generated", value: "₹1,37,100", change: "+₹23,400" },
        { label: "Approval Rate", value: "89%", change: "+5%" },
      ],
    },
  ]

  const recentActivity = [
    {
      id: 1,
      action: "Event Approved",
      event: "AI Workshop",
      time: "2 hours ago",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      id: 2,
      action: "New Registration",
      event: "Cultural Fest",
      time: "4 hours ago",
      icon: Users,
      color: "text-blue-600",
    },
    {
      id: 3,
      action: "Venue Confirmed",
      event: "Web Dev Bootcamp",
      time: "1 day ago",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      id: 4,
      action: "Payment Received",
      event: "Photography Workshop",
      time: "2 days ago",
      icon: DollarSign,
      color: "text-green-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Analytics & Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              {analytics[0].metrics.map((metric, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
                    <span className="text-xs text-green-600 bg-green-100 px-1 rounded">{metric.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}
                  >
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">
                      {activity.event} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
