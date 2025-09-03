"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Edit, Trash2, Eye } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function EventManagement() {
  const router = useRouter()
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "AI & Machine Learning Workshop",
      date: "Fri, Mar 15, 07:30 PM",
      location: "Computer Science Lab A",
      category: "technical",
      status: "approved",
      registrations: 42,
      capacity: 50,
      revenue: "₹12,600",
    },
    {
      id: 2,
      title: "Annual Cultural Fest - Expressions 2024",
      date: "Wed, Mar 20, 11:30 PM",
      location: "Main Auditorium",
      category: "cultural",
      status: "approved",
      registrations: 387,
      capacity: 500,
      revenue: "₹1,16,100",
    },
    {
      id: 3,
      title: "Web Development Bootcamp",
      date: "Mon, Mar 25, 09:00 AM",
      location: "Lab Complex",
      category: "technical",
      status: "pending",
      registrations: 28,
      capacity: 30,
      revenue: "₹8,400",
    },
    {
      id: 4,
      title: "Photography Workshop",
      date: "Thu, Mar 28, 02:00 PM",
      location: "Art Studio",
      category: "cultural",
      status: "draft",
      registrations: 0,
      capacity: 25,
      revenue: "₹0",
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-100 text-blue-800"
      case "cultural":
        return "bg-purple-100 text-purple-800"
      case "sports":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCreateEvent = () => {
    router.push("/dashboard/organizer/create-event")
  }

  const handleViewEvent = (eventId: number) => {
    console.log(`[v0] Viewing event ${eventId}`)
    // Navigate to event details page
  }

  const handleEditEvent = (eventId: number) => {
    console.log(`[v0] Editing event ${eventId}`)
    router.push(`/dashboard/organizer/edit-event/${eventId}`)
  }

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((event) => event.id !== eventId))
      console.log(`[v0] Deleted event ${eventId}`)
    }
  }

  const handleSubmitForApproval = (eventId: number) => {
    setEvents(events.map((event) => (event.id === eventId ? { ...event, status: "pending" } : event)))
    console.log(`[v0] Submitted event ${eventId} for approval`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Event Management</CardTitle>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateEvent}>
            Create New Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
                    <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{event.revenue}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>
                    {event.registrations}/{event.capacity} registered
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(event.registrations / event.capacity) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((event.registrations / event.capacity) * 100)}% capacity filled
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 bg-transparent"
                  onClick={() => handleViewEvent(event.id)}
                >
                  <Eye className="w-3 h-3" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 bg-transparent"
                  onClick={() => handleEditEvent(event.id)}
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-transparent"
                  onClick={() => handleDeleteEvent(event.id)}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
                {event.status === "draft" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSubmitForApproval(event.id)}
                  >
                    Submit for Approval
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
