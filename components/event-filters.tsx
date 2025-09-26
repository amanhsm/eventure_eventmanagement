"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Calendar, MapPin, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Venue {
  id: number
  venue_name: string
  blocks: {
    block_name: string
  } | null
}

interface EventFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  selectedQuickFilter: string
  onQuickFilterChange: (value: string) => void
  selectedVenueId: number | null
  onVenueSelect: (venueId: number | null) => void
  onClearFilters: () => void
}

export default function EventFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedQuickFilter,
  onQuickFilterChange,
  selectedVenueId,
  onVenueSelect,
  onClearFilters,
}: EventFiltersProps) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  
  const categories = [
    { label: "All Events", value: "all" },
    { label: "Technical", value: "technical" },
    { label: "Cultural", value: "cultural" },
    { label: "Sports", value: "sports" },
    { label: "Other", value: "other" },
  ]
  const quickFilters = ["Today", "This Week", "Free Events", "Available Spots"]

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          id,
          venue_name,
          blocks!inner(block_name)
        `)
        .eq('availability', true)
        .order('venue_name')

      if (error) throw error
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(venue => ({
        id: venue.id,
        venue_name: venue.venue_name,
        blocks: Array.isArray(venue.blocks) ? venue.blocks[0] : venue.blocks
      }))
      
      setVenues(transformedData)
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // <CHANGE> Added responsive spacing and mobile-first design
    <div className="space-y-4 md:space-y-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3 md:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            {/* <CHANGE> Added responsive padding and focus states */}
            <Input 
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  variant={selectedCategory === category.value ? "default" : "ghost"}
                  className="justify-start text-xs md:text-sm w-full hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  size="sm"
                >
                  {category.label}
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
                  onClick={() => onQuickFilterChange(selectedQuickFilter === filter ? "" : filter)}
                  variant={selectedQuickFilter === filter ? "default" : "ghost"}
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
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                venues.map((venue) => (
                  <Button 
                    key={venue.id} 
                    onClick={() => onVenueSelect(selectedVenueId === venue.id ? null : venue.id)}
                    variant={selectedVenueId === venue.id ? "default" : "ghost"}
                    className="justify-start text-xs md:text-sm w-full hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 cursor-pointer" 
                    size="sm"
                  >
                    {venue.venue_name} - {venue.blocks?.block_name || 'Unknown Block'}
                  </Button>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
