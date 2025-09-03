"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft, TrendingUp, Users, Calendar, Download } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OrganizerAnalytics() {
  const router = useRouter()

  const analyticsData = {
    totalEvents: 12,
    totalAttendees: 450,
    upcomingEvents: 3,
    completedEvents: 9,
    averageRating: 4.6,
    totalRevenue: "₹25,000",
  }

  const eventPerformance = [
    { name: "AI Workshop", attendees: 45, rating: 4.8, revenue: "₹9,000" },
    { name: "Cultural Fest", attendees: 200, rating: 4.5, revenue: "₹10,000" },
    { name: "Sports Meet", attendees: 150, rating: 4.4, revenue: "₹6,000" },
  ]

  return (
    <ProtectedRoute allowedRoles={["organizer"]}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Analytics</h1>
              <p className="text-gray-600">Track your event performance and insights</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold">{analyticsData.totalEvents}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Attendees</p>
                    <p className="text-2xl font-bold">{analyticsData.totalAttendees}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold">{analyticsData.averageRating}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Event Performance</CardTitle>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={() => {
                    console.log("[v0] Exporting analytics report")
                    alert("Analytics report exported successfully!")
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventPerformance.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-gray-600">{event.attendees} attendees</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-green-100 text-green-800">⭐ {event.rating}</Badge>
                      <span className="font-semibold">{event.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
