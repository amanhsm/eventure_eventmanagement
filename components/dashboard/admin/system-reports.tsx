"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, Calendar, Users, TrendingUp, DollarSign } from "lucide-react"

export function SystemReports() {
  const reportMetrics = [
    {
      title: "Event Statistics",
      icon: Calendar,
      metrics: [
        { label: "Total Events", value: "156", change: "+23%" },
        { label: "Events This Month", value: "47", change: "+12%" },
        { label: "Average Attendance", value: "89%", change: "+5%" },
        { label: "Cancelled Events", value: "3", change: "-50%" },
      ],
    },
    {
      title: "User Engagement",
      icon: Users,
      metrics: [
        { label: "Active Users", value: "2,847", change: "+18%" },
        { label: "New Registrations", value: "234", change: "+25%" },
        { label: "Event Registrations", value: "1,456", change: "+15%" },
        { label: "User Retention", value: "78%", change: "+3%" },
      ],
    },
    {
      title: "Revenue Analytics",
      icon: DollarSign,
      metrics: [
        { label: "Total Revenue", value: "₹2,45,600", change: "+32%" },
        { label: "This Month", value: "₹67,800", change: "+28%" },
        { label: "Average per Event", value: "₹1,574", change: "+8%" },
        { label: "Pending Payments", value: "₹12,400", change: "-15%" },
      ],
    },
  ]

  const popularEvents = [
    { name: "AI & ML Workshop", registrations: 387, revenue: "₹1,16,100" },
    { name: "Cultural Fest 2024", registrations: 456, revenue: "₹45,600" },
    { name: "Basketball Tournament", registrations: 234, revenue: "₹23,400" },
    { name: "Photography Workshop", registrations: 156, revenue: "₹15,600" },
  ]

  const handleExportReport = (reportType: string) => {
    console.log(`[v0] Exporting ${reportType} report`)
    // Export report logic here
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reportMetrics.map((report, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <report.icon className="w-5 h-5 text-blue-600" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.metrics.map((metric, metricIndex) => (
                  <div key={metricIndex} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{metric.label}</span>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{metric.value}</p>
                      <p className="text-xs text-green-600">{metric.change}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Popular Events</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleExportReport("popular-events")}>
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-600">{event.registrations} registrations</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{event.revenue}</p>
                    <p className="text-xs text-gray-600">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Growth Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Monthly Growth</h4>
                <p className="text-sm text-blue-700">
                  User registrations increased by 25% this month, with technical events showing the highest engagement.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Revenue Growth</h4>
                <p className="text-sm text-green-700">
                  Revenue is up 32% compared to last month, driven by premium workshop offerings.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Venue Utilization</h4>
                <p className="text-sm text-yellow-700">
                  Main Auditorium is at 89% capacity utilization, consider expanding venue options.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Export Reports
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => handleExportReport("event-analytics")}
            >
              <Download className="w-4 h-4" />
              Event Analytics
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => handleExportReport("user-reports")}
            >
              <Download className="w-4 h-4" />
              User Reports
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => handleExportReport("financial-summary")}
            >
              <Download className="w-4 h-4" />
              Financial Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
