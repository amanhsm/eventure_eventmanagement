import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Users, DollarSign, Calendar } from "lucide-react"

export function VenueFilters() {
  const capacityRanges = ["1-50", "51-150", "151-300", "300+"]
  const priceRanges = ["₹0-1000", "₹1001-2000", "₹2001-3000", "₹3000+"]
  const availabilityOptions = ["Available Now", "Available Today", "Available This Week", "All Venues"]
  const facilityOptions = ["Projector", "Sound System", "AC", "Computers", "Stage", "Parking"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Venue Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search venues..." className="pl-10" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" />
              <h3 className="font-medium">Capacity</h3>
            </div>
            <div className="space-y-2">
              {capacityRanges.map((range) => (
                <Button key={range} variant="ghost" className="w-full justify-start" size="sm">
                  {range} people
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4" />
              <h3 className="font-medium">Price Range</h3>
            </div>
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <Button key={range} variant="ghost" className="w-full justify-start" size="sm">
                  {range} per hour
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              <h3 className="font-medium">Availability</h3>
            </div>
            <div className="space-y-2">
              {availabilityOptions.map((option) => (
                <Button key={option} variant="ghost" className="w-full justify-start" size="sm">
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4" />
              <h3 className="font-medium">Facilities</h3>
            </div>
            <div className="space-y-2">
              {facilityOptions.map((facility) => (
                <label key={facility} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span>{facility}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
