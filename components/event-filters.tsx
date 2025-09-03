import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Calendar, MapPin } from 'lucide-react'

export function EventFilters() {
  const categories = ["All Events", "Technical", "Cultural", "Sports", "Other"]
  const quickFilters = ["Today", "This Week", "Free Events", "Available Spots"]
  const venues = ["Main Auditorium", "Central Lawn", "Lab Complex", "Sports Ground"]

  return (
    // <CHANGE> Added responsive spacing and mobile-first design
    <div className="space-y-4 md:space-y-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            {/* <CHANGE> Added responsive padding and focus states */}
            <Input 
              placeholder="Search events..." 
              className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300" 
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-sm md:text-base">Categories</h3>
            </div>
            {/* <CHANGE> Added responsive grid layout for mobile */}
            <div className="grid grid-cols-2 gap-2 md:space-y-2 md:grid-cols-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "All Events" ? "default" : "ghost"}
                  className="justify-start text-xs md:text-sm w-full hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-sm md:text-base">Quick Filters</h3>
            </div>
            {/* <CHANGE> Added responsive grid layout for mobile */}
            <div className="grid grid-cols-2 gap-2 md:space-y-2 md:grid-cols-1">
              {quickFilters.map((filter) => (
                <Button 
                  key={filter} 
                  variant="ghost" 
                  className="justify-start text-xs md:text-sm w-full hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200" 
                  size="sm"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-sm md:text-base">Popular Venues</h3>
            </div>
            {/* <CHANGE> Added responsive layout and hover effects */}
            <div className="space-y-2">
              {venues.map((venue) => (
                <Button 
                  key={venue} 
                  variant="ghost" 
                  className="justify-start text-xs md:text-sm w-full hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 cursor-pointer" 
                  size="sm"
                >
                  {venue}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
