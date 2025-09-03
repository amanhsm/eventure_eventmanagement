import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, Users } from "lucide-react"

export function VenueBooking() {
  const venueBookings = [
    {
      id: 1,
      venue: "Main Auditorium",
      date: "Mar 20, 2024",
      time: "11:30 PM - 01:30 AM",
      event: "Cultural Fest",
      capacity: 500,
      status: "confirmed",
      cost: "₹15,000",
    },
    {
      id: 2,
      venue: "Computer Science Lab A",
      date: "Mar 15, 2024",
      time: "07:30 PM - 09:30 PM",
      event: "AI Workshop",
      capacity: 50,
      status: "confirmed",
      cost: "₹3,000",
    },
    {
      id: 3,
      venue: "Lab Complex",
      date: "Mar 25, 2024",
      time: "09:00 AM - 06:00 PM",
      event: "Web Dev Bootcamp",
      capacity: 30,
      status: "pending",
      cost: "₹8,000",
    },
    {
      id: 4,
      venue: "Sports Complex",
      date: "Mar 30, 2024",
      time: "02:00 PM - 06:00 PM",
      event: "Basketball Tournament",
      capacity: 200,
      status: "requested",
      cost: "₹5,000",
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Venue Bookings
          </CardTitle>
          <Button size="sm" variant="outline">
            Book Venue
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {venueBookings.map((booking) => (
            <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{booking.venue}</h4>
                  <p className="text-sm text-gray-600">{booking.event}</p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(booking.status)} size="sm">
                    {booking.status}
                  </Badge>
                  <p className="text-sm font-medium text-gray-900 mt-1">{booking.cost}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{booking.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <span>Capacity: {booking.capacity}</span>
                </div>
              </div>

              {booking.status === "requested" && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
                    Cancel Request
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
