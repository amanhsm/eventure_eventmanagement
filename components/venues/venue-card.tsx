import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, DollarSign, Calendar, Wifi, Car } from "lucide-react"
import Image from "next/image"

interface Venue {
  id: number
  name: string
  capacity: number
  hourlyRate: number
  facilities: string[]
  availability: string
  nextAvailable: string
  image: string
  description: string
  bookings: number
}

interface VenueCardProps {
  venue: Venue
}

export function VenueCard({ venue }: VenueCardProps) {
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "bg-green-100 text-green-800"
      case "booked":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFacilityIcon = (facility: string) => {
    if (facility.toLowerCase().includes("internet") || facility.toLowerCase().includes("wifi")) {
      return <Wifi className="w-3 h-3" />
    }
    if (facility.toLowerCase().includes("parking")) {
      return <Car className="w-3 h-3" />
    }
    return null
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <Image src={venue.image || "/placeholder.svg"} alt={venue.name} fill className="object-cover" />
        <div className="absolute top-4 right-4">
          <Badge className={getAvailabilityColor(venue.availability)}>{venue.availability}</Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{venue.name}</h3>
            <p className="text-sm text-gray-600">{venue.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Capacity: {venue.capacity}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span>₹{venue.hourlyRate}/hour</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Next: {venue.nextAvailable}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{venue.bookings} bookings</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Facilities:</p>
          <div className="flex flex-wrap gap-1">
            {venue.facilities.map((facility, index) => (
              <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                {getFacilityIcon(facility)}
                {facility}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            View Details
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={venue.availability !== "available"}
          >
            {venue.availability === "available" ? "Book Now" : "Unavailable"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
