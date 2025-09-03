import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Users, Settings } from "lucide-react"

export function VenueManagement() {
  const venues = [
    {
      id: 1,
      name: "Main Auditorium",
      capacity: 500,
      status: "available",
      upcomingBookings: 3,
      nextBooking: "Mar 20, 11:30 PM",
      facilities: ["Projector", "Sound System", "AC"],
      pendingApprovals: 2,
    },
    {
      id: 2,
      name: "Lab Complex",
      capacity: 100,
      status: "booked",
      upcomingBookings: 2,
      nextBooking: "Mar 15, 07:30 PM",
      facilities: ["Computers", "Projector", "Whiteboard"],
      pendingApprovals: 1,
    },
    {
      id: 3,
      name: "Sports Complex",
      capacity: 200,
      status: "maintenance",
      upcomingBookings: 1,
      nextBooking: "Mar 30, 02:00 PM",
      facilities: ["Changing Rooms", "Equipment Storage"],
      pendingApprovals: 0,
    },
    {
      id: 4,
      name: "Central Lawn",
      capacity: 1000,
      status: "available",
      upcomingBookings: 0,
      nextBooking: "No bookings",
      facilities: ["Open Space", "Stage Setup Available"],
      pendingApprovals: 0,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "booked":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
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
            Venue Management
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Pending Approvals (4)
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="w-3 h-3 mr-1" />
              Manage
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {venues.map((venue) => (
            <div key={venue.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{venue.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(venue.status)} size="sm">
                      {venue.status}
                    </Badge>
                    <span className="text-xs text-gray-500">Capacity: {venue.capacity}</span>
                    {venue.pendingApprovals > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800" size="sm">
                        {venue.pendingApprovals} pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>Next: {venue.nextBooking}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <span>{venue.upcomingBookings} upcoming bookings</span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Facilities:</p>
                <div className="flex flex-wrap gap-1">
                  {venue.facilities.map((facility, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {facility}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                  View Schedule
                </Button>
                {venue.pendingApprovals > 0 && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                    Review Bookings
                  </Button>
                )}
                {venue.status === "maintenance" && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs">
                    Mark Available
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
