import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, DollarSign, Star, Wifi, Car, Projector, Volume2 } from "lucide-react"
import Image from "next/image"

interface VenueDetailsProps {
  venueId: string
}

export function VenueDetails({ venueId }: VenueDetailsProps) {
  // Mock venue data - in real app, this would be fetched based on venueId
  const venue = {
    id: 1,
    name: "Main Auditorium",
    capacity: 500,
    hourlyRate: 2500,
    facilities: ["Projector", "Sound System", "AC", "Stage Lighting", "Green Room", "Parking"],
    availability: "available",
    description:
      "Our premier venue featuring state-of-the-art audio-visual equipment and comfortable seating for 500 guests. Perfect for conferences, cultural events, graduation ceremonies, and major presentations.",
    images: ["/university-auditorium-main-hall.png", "/auditorium-stage-with-lighting.png", "/auditorium-seating-area.png"],
    rating: 4.8,
    reviews: 24,
    location: "Block A, Ground Floor",
    rules: [
      "No food or drinks allowed inside",
      "Setup must be completed 1 hour before event",
      "All equipment must be returned in original condition",
      "Maximum occupancy strictly enforced",
    ],
  }

  const getFacilityIcon = (facility: string) => {
    const facilityLower = facility.toLowerCase()
    if (facilityLower.includes("projector")) return <Projector className="w-4 h-4" />
    if (facilityLower.includes("sound") || facilityLower.includes("audio")) return <Volume2 className="w-4 h-4" />
    if (facilityLower.includes("wifi") || facilityLower.includes("internet")) return <Wifi className="w-4 h-4" />
    if (facilityLower.includes("parking")) return <Car className="w-4 h-4" />
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <div className="relative h-64">
            <Image
              src={venue.images[0] || "/placeholder.svg"}
              alt={venue.name}
              fill
              className="object-cover rounded-t-lg"
            />
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-100 text-green-800">{venue.availability}</Badge>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{venue.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{venue.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>
                      {venue.rating} ({venue.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">₹{venue.hourlyRate}</p>
                <p className="text-sm text-gray-600">per hour</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">{venue.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Capacity</p>
                  <p className="text-sm text-gray-600">{venue.capacity} people</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Pricing</p>
                  <p className="text-sm text-gray-600">₹{venue.hourlyRate} per hour</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Available Facilities</h3>
              <div className="grid grid-cols-2 gap-2">
                {venue.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    {getFacilityIcon(facility) || <div className="w-4 h-4" />}
                    <span>{facility}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Venue Rules & Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {venue.rules.map((rule, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
