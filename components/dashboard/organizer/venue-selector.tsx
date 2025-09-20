"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MapPin, Users, Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"

interface Block {
  id: number
  block_name: string
}

interface Venue {
  id: number
  block_id: number
  venue_name: string
  max_capacity: number
  availability: boolean
  blocks: {
    block_name: string
  }
}

interface VenueSelectorProps {
  onVenueSelect: (venue: Venue, eventDate: Date, startTime: string, endTime: string) => void
  selectedVenue?: Venue | null
  selectedDate?: Date | null
  selectedStartTime?: string
  selectedEndTime?: string
}

export default function VenueSelector({ 
  onVenueSelect, 
  selectedVenue, 
  selectedDate, 
  selectedStartTime, 
  selectedEndTime 
}: VenueSelectorProps) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string>("")
  const [eventDate, setEventDate] = useState<Date | undefined>(selectedDate || undefined)
  const [startTime, setStartTime] = useState(selectedStartTime || "")
  const [endTime, setEndTime] = useState(selectedEndTime || "")
  const [minCapacity, setMinCapacity] = useState("")
  const [availabilityStatus, setAvailabilityStatus] = useState<{[key: number]: boolean}>({})
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchBlocks()
    fetchVenues()
  }, [])

  useEffect(() => {
    filterVenues()
  }, [venues, selectedBlockId, minCapacity])

  useEffect(() => {
    if (eventDate && startTime && endTime && filteredVenues.length > 0) {
      checkVenueAvailability()
    }
  }, [eventDate, startTime, endTime, filteredVenues])

  const fetchBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .order('block_name')

      if (error) throw error
      setBlocks(data || [])
    } catch (error) {
      console.error('Error fetching blocks:', error)
    }
  }

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          blocks!inner(block_name)
        `)
        .eq('availability', true)
        .order('venue_name')

      if (error) throw error
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(venue => ({
        ...venue,
        blocks: Array.isArray(venue.blocks) ? venue.blocks[0] : venue.blocks
      }))
      
      setVenues(transformedData)
    } catch (error) {
      console.error('Error fetching venues:', error)
    }
  }

  const filterVenues = () => {
    let filtered = venues

    if (selectedBlockId && selectedBlockId !== "all") {
      filtered = filtered.filter(venue => venue.block_id === parseInt(selectedBlockId))
    }

    if (minCapacity) {
      filtered = filtered.filter(venue => venue.max_capacity >= parseInt(minCapacity))
    }

    setFilteredVenues(filtered)
  }

  const checkVenueAvailability = async () => {
    if (!eventDate || !startTime || !endTime) return

    setIsLoading(true)
    const availabilityMap: {[key: number]: boolean} = {}

    try {
      for (const venue of filteredVenues) {
        const { data, error } = await supabase.rpc('check_venue_availability', {
          p_venue_id: venue.id,
          p_event_date: format(eventDate, 'yyyy-MM-dd'),
          p_start_time: startTime,
          p_end_time: endTime
        })

        if (error) {
          console.error('Error checking availability for venue', venue.id, error)
          availabilityMap[venue.id] = false
        } else {
          availabilityMap[venue.id] = data
        }
      }

      setAvailabilityStatus(availabilityMap)
    } catch (error) {
      console.error('Error checking venue availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVenueSelect = (venue: Venue) => {
    if (!eventDate || !startTime || !endTime) {
      alert('Please select date and time first')
      return
    }

    if (!availabilityStatus[venue.id]) {
      alert('This venue is not available for the selected date and time')
      return
    }

    onVenueSelect(venue, eventDate, startTime, endTime)
  }

  const isFormValid = eventDate && startTime && endTime

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Select Venue & Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal cursor-pointer"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Venue Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Block</Label>
            <Select value={selectedBlockId} onValueChange={setSelectedBlockId}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Select block" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blocks</SelectItem>
                {blocks.map((block) => (
                  <SelectItem key={block.id} value={block.id.toString()}>
                    {block.block_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Minimum Capacity</Label>
            <Input
              type="number"
              placeholder="Enter minimum capacity"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Selected Venue Display */}
        {selectedVenue && (
          <div className="p-4 bg-[#799EFF]/10 border border-[#799EFF] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">Selected Venue</span>
            </div>
            <p className="text-sm text-gray-600">
              {selectedVenue.venue_name} - {selectedVenue.blocks.block_name} (Capacity: {selectedVenue.max_capacity})
            </p>
            {selectedDate && (
              <p className="text-sm text-gray-600">
                Date: {format(selectedDate, "PPP")} | Time: {selectedStartTime} - {selectedEndTime}
              </p>
            )}
          </div>
        )}

        {/* Available Venues */}
        {isFormValid && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Available Venues</h4>
              {isLoading && <span className="text-sm text-gray-500">Checking availability...</span>}
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {filteredVenues.map((venue) => {
                const isAvailable = availabilityStatus[venue.id]
                const isSelected = selectedVenue?.id === venue.id

                return (
                  <div
                    key={venue.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#799EFF] bg-[#799EFF]/10'
                        : isAvailable
                        ? 'border-gray-200 hover:border-[#799EFF] hover:bg-gray-50'
                        : 'border-red-200 bg-red-50 cursor-not-allowed'
                    }`}
                    onClick={() => isAvailable && handleVenueSelect(venue)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{venue.venue_name}</h5>
                          {isAvailable ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {venue.blocks.block_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {venue.max_capacity} capacity
                          </span>
                        </div>
                      </div>
                      <Badge variant={isAvailable ? "default" : "destructive"}>
                        {isAvailable ? "Available" : "Booked"}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredVenues.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No venues found matching your criteria
              </p>
            )}
          </div>
        )}

        {!isFormValid && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Please select date and time to view available venues</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
