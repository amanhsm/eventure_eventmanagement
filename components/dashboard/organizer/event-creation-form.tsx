"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, ArrowLeft, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import VenueSelector from "./venue-selector"

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

interface EventCategory {
  id: number
  name: string
  color_code: string
}

export default function EventCreationForm() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<EventCategory[]>([])
  
  // Venue and schedule data
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [eventDate, setEventDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  
  // Event details
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    max_participants: "",
    registration_deadline: "",
    registration_fee: "0"
  })

  const supabase = createClient()

  const handleVenueSelect = (venue: Venue, date: Date, start: string, end: string) => {
    setSelectedVenue(venue)
    setEventDate(date)
    setStartTime(start)
    setEndTime(end)
    
    // Auto-set max participants to venue capacity if not set
    if (!formData.max_participants) {
      setFormData(prev => ({
        ...prev,
        max_participants: venue.max_capacity.toString()
      }))
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('event_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateStep1 = () => {
    return selectedVenue && eventDate && startTime && endTime
  }

  const validateStep2 = () => {
    return (
      formData.title.trim() &&
      formData.description.trim() &&
      formData.category_id &&
      formData.max_participants &&
      formData.registration_deadline &&
      parseInt(formData.max_participants) <= (selectedVenue?.max_capacity || 0)
    )
  }

  const handleSubmit = async () => {
    if (!user || !selectedVenue || !eventDate) return

    setIsSubmitting(true)
    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: parseInt(formData.category_id),
        event_date: eventDate.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        venue_id: selectedVenue.id,
        organizer_id: user.id,
        max_participants: parseInt(formData.max_participants),
        current_participants: 0,
        registration_deadline: formData.registration_deadline,
        registration_fee: parseFloat(formData.registration_fee),
        status: 'pending',
        cancellation_allowed: true
      }

      const { error } = await supabase
        .from('events')
        .insert([eventData])

      if (error) throw error

      alert('Event created successfully! It will be reviewed by administrators.')
      
      // Reset form
      setCurrentStep(1)
      setSelectedVenue(null)
      setEventDate(null)
      setStartTime("")
      setEndTime("")
      setFormData({
        title: "",
        description: "",
        category_id: "",
        max_participants: "",
        registration_deadline: "",
        registration_fee: "0"
      })

    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      fetchCategories()
      setCurrentStep(2)
    }
  }

  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-[#799EFF]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-[#799EFF] text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="font-medium">Venue & Schedule</span>
        </div>
        <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-[#799EFF]' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-[#799EFF]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#799EFF] text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="font-medium">Event Details</span>
        </div>
      </div>

      {/* Step 1: Venue Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <VenueSelector
            onVenueSelect={handleVenueSelect}
            selectedVenue={selectedVenue}
            selectedDate={eventDate}
            selectedStartTime={startTime}
            selectedEndTime={endTime}
          />
          
          <div className="flex justify-end">
            <Button
              onClick={nextStep}
              disabled={!validateStep1()}
              className="bg-[#799EFF] hover:bg-[#6B8EFF] text-white cursor-pointer"
            >
              Next: Event Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Event Details */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Venue Summary */}
            {selectedVenue && eventDate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Selected Venue & Schedule</h4>
                <p className="text-sm text-gray-600">
                  <strong>Venue:</strong> {selectedVenue.venue_name} - {selectedVenue.blocks.block_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {eventDate.toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Time:</strong> {startTime} - {endTime}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Capacity:</strong> {selectedVenue.max_capacity} participants
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter event title"
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Maximum Participants *</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', e.target.value)}
                    placeholder="Enter max participants"
                    max={selectedVenue?.max_capacity}
                    className="cursor-pointer"
                  />
                  {selectedVenue && (
                    <p className="text-xs text-gray-500">
                      Venue capacity: {selectedVenue.max_capacity}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_deadline">Registration Deadline *</Label>
                  <Input
                    id="registration_deadline"
                    type="datetime-local"
                    value={formData.registration_deadline}
                    onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_fee">Registration Fee (₹)</Label>
                  <Input
                    id="registration_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.registration_fee}
                    onChange={(e) => handleInputChange('registration_fee', e.target.value)}
                    placeholder="0.00"
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Event Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your event..."
                rows={4}
                className="cursor-pointer"
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                className="cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Venue
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!validateStep2() || isSubmitting}
                className="bg-[#799EFF] hover:bg-[#6B8EFF] text-white cursor-pointer"
              >
                {isSubmitting ? "Creating Event..." : "Create Event"}
                <Plus className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
