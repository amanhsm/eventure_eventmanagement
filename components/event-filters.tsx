"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Calendar, X } from 'lucide-react'

interface EventFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  selectedQuickFilter: string
  onQuickFilterChange: (value: string) => void
  onClearFilters: () => void
}

export default function EventFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedQuickFilter,
  onQuickFilterChange,
  onClearFilters,
}: EventFiltersProps) {
  
  const categories = [
    { label: "All Events", value: "all" },
    { label: "Technical", value: "technical" },
    { label: "Cultural", value: "cultural" },
    { label: "Sports", value: "sports" },
    { label: "Other", value: "other" },
  ]
  const quickFilters = ["Today", "This Week", "Free Events", "Available Spots"]

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

        </CardContent>
      </Card>
    </div>
  )
}
