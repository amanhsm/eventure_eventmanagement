import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"

export function VenueBookingManagement() {
  const bookings = [
    {
      id: 1,
      venue: "Main Auditorium",
      eventName: "AI & Machine Learning Workshop",
      date: "Mar 15, 2024",
      time: "07:30 PM - 09:30 PM",
      status: "confirmed",
      attendees: 42,
      cost: "₹5,000",
      bookingDate: "Mar 1, 2024",
    },
    {
      id: 2,
      venue: "Lab Complex",
      eventName: "Web Development Bootcamp",
      date: "Mar 25, 2024",
      time: "09:00 AM - 06:00 PM",
      status: "pending",
      attendees: 28,
      cost: "₹7,200",
      bookingDate: "Mar 10, 2024",
    },
    {
      id: 3,
      venue: "Conference Hall B",
      eventName: "Startup Pitch Competition",
      date: "Mar 30, 2024",
      time: "10:00 AM - 04:00 PM",
      status: "requested",
      attendees: 100,
      cost: "₹10,800",
      bookingDate: "Mar 12, 2024",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "requested":
        return "bg-blue-100 text-blue-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/venues">
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Book New Venue
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">My Venue Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{booking.eventName}</h3>
                    <p className="text-sm text-gray-600">at {booking.venue}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(booking.status)} size="sm">
                      {booking.status}
                    </Badge>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{booking.cost}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{booking.attendees} attendees</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <p>Booking requested on {booking.bookingDate}</p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-1 bg-transparent">
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  {booking.status === "requested" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-transparent"
                    >
                      <Trash2 className="w-3 h-3" />
                      Cancel Request
                    </Button>
                  )}
                  {booking.status === "confirmed" && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      View Confirmation
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
