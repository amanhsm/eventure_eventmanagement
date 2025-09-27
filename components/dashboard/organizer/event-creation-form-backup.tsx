"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock, Users, MapPin, Plus, ArrowLeft, ArrowRight, Save } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
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
  const [organizerId, setOrganizerId] = useState<number | null>(null)
  const [organizerLoading, setOrganizerLoading] = useState(true)
  
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
    registration_deadline_date: "",
    registration_deadline_time: "23:59",
    hasRegistrationFee: false,
    registration_fee: "0",
    requirements: "",
    eligibility_criteria: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    priority: "medium",
    additional_notes: ""
  })

  const supabase = createClient()

  // Fetch organizer ID on component mount
  useEffect(() => {
    const fetchOrganizerId = async () => {
      if (!user) {
        setOrganizerLoading(false)
        return
      }
      
      try {
        console.log('Fetching organizer for user ID:', user.id)
        const { data, error } = await supabase
          .from('organizers')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching organizer:', error)
          alert('Error: Organizer profile not found. Please contact administrator to set up your organizer profile.')
          setOrganizerLoading(false)
          return
        }
        
        setOrganizerId(data.id)
        console.log('Organizer ID fetched successfully:', data.id)
        setOrganizerLoading(false)
      } catch (error) {
        console.error('Error fetching organizer ID:', error)
        alert('Error: Could not fetch organizer profile. Please try refreshing the page.')
        setOrganizerLoading(false)
      }
    }

    fetchOrganizerId()
  }, [user, supabase])

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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateStep1 = () => {
    return selectedVenue && eventDate && startTime && endTime && organizerId
  }

  const validateStep2 = () => {
    return (
      formData.title.trim() &&
      formData.description.trim() &&
      formData.category_id &&
      formData.max_participants &&
      formData.registration_deadline_date &&
      parseInt(formData.max_participants) <= (selectedVenue?.max_capacity || 0)
    )
  }

  const handleSubmit = async (isDraft = false) => {
    if (!organizerId) {
      alert('Organizer ID not found. Please refresh and try again.')
      return
    }

    // For drafts, we need at least a title
    if (isDraft && !formData.title.trim()) {
      alert('Please enter a title to save as draft.')
      return
    }

    // For submission, we need all required fields
    if (!isDraft && (!user || !selectedVenue || !eventDate || !validateStep2())) {
      console.log('Submit validation failed:', { user: !!user, selectedVenue: !!selectedVenue, eventDate: !!eventDate, formValid: validateStep2() })
      alert('Please fill in all required fields before submitting.')
      return
    }

    console.log(`${isDraft ? 'Saving draft' : 'Submitting event'} with organizer ID:`, organizerId)
    setIsSubmitting(true)
    try {
      // Get organizer details for auto-population
      const { data: organizerData } = await supabase
        .from('organizers')
        .select('name, user_id, users(email)')
        .eq('id', organizerId)
        .single()

      const eventData = {
        title: formData.title.trim() || 'Untitled Event',
        description: formData.description.trim() || '',
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        event_date: eventDate ? eventDate.toISOString().split('T')[0] : null,
        start_time: startTime || null,
        end_time: endTime || null,
        venue_id: selectedVenue?.id || null,
        organizer_id: organizerId,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        current_participants: 0,
        registration_deadline: formData.registration_deadline_date ? 
          `${formData.registration_deadline_date}T${formData.registration_deadline_time}:00` : 
          (eventDate ? new Date(eventDate.getTime() - 24 * 60 * 60 * 1000).toISOString() : null), // Default to 1 day before event
        registration_fee: formData.hasRegistrationFee ? parseFloat(formData.registration_fee) : 0,
        status: isDraft ? 'draft' : 'pending_approval',
        approval_status: 'pending',
        cancellation_allowed: true,
        
        // Populate missing fields
        requirements: formData.requirements.trim() || null,
        eligibility_criteria: formData.eligibility_criteria.trim() || null,
        contact_person: formData.contact_person.trim() || organizerData?.name || null,
        contact_email: formData.contact_email.trim() || (organizerData?.users as any)?.email || (user as any)?.email || null,
        contact_phone: formData.contact_phone.trim() || null,
        priority: formData.priority || 'medium',
        additional_notes: formData.additional_notes.trim() || null,
        admin_feedback: null,
        approved_by: null,
        approved_at: null,
        rejected_at: null,
        feedback_at: null
      }

      console.log('Event data to be inserted:', eventData)
      
      const { error } = await supabase
        .from('events')
        .insert([eventData])

      if (error) throw error

      alert(isDraft ? 'Event saved as draft!' : 'Event submitted successfully! It will be reviewed by administrators.')
      
      // Refresh the page to show the new event
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
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
        registration_deadline_date: "",
        registration_deadline_time: "23:59",
        hasRegistrationFee: false,
        registration_fee: "0",
        requirements: "",
        eligibility_criteria: "",
        contact_person: "",
        contact_email: "",
        contact_phone: "",
        priority: "medium",
        additional_notes: ""
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

  if (organizerLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading organizer information...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
                          {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
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
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value <= 500 || e.target.value === "") {
                        handleInputChange('max_participants', e.target.value);
                      }
                    }}
                    placeholder="Enter max participants"
                    max={selectedVenue ? Math.min(selectedVenue.max_capacity, 500) : 500}
                    min="1"
                    className="cursor-pointer"
                  />
                  {selectedVenue && (
                    <p className="text-xs text-gray-500">
                      Venue capacity: {Math.min(selectedVenue.max_capacity, 500)} (Limited to 500 max)
                      {selectedVenue.max_capacity > 500 && " - Venue capacity exceeds limit"}
                    </p>
                  )}
                  {!selectedVenue && <p className="text-xs text-gray-500">Maximum allowed: 500 participants</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_deadline_date">Registration Deadline Date *</Label>
                  <Input
                    id="registration_deadline_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    max={eventDate ? eventDate.toISOString().split('T')[0] : undefined}
                    value={formData.registration_deadline_date}
                    onChange={(e) => handleInputChange('registration_deadline_date', e.target.value)}
                    className="cursor-pointer"
                  />
                  {eventDate && (
                    <p className="text-xs text-gray-500">
                      Must be before event date ({eventDate.toLocaleDateString()})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_deadline_time">Registration Deadline Time *</Label>
                  <Select value={formData.registration_deadline_time} onValueChange={(value) => handleInputChange('registration_deadline_time', value)}>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select deadline time" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = Math.floor(i / 2) + 6; // Start from 6 AM (06:00)
                        const minute = i % 2 === 0 ? "00" : "30";
                        const time = `${hour.toString().padStart(2, "0")}:${minute}`;
                        return (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has-registration-fee"
                      checked={formData.hasRegistrationFee}
                      onCheckedChange={(checked) => handleInputChange('hasRegistrationFee', checked)}
                    />
                    <Label htmlFor="has-registration-fee">This event has a registration fee</Label>
                  </div>
                  
                  {formData.hasRegistrationFee && (
                    <div className="space-y-2">
                      <Label htmlFor="registration_fee">Registration Fee Amount (₹) *</Label>
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
                  )}
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
                onClick={() => setCurrentStep(1)}
                className="cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Venue
              </Button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={!formData.title || isSubmitting || organizerLoading}
              className="cursor-pointer"
            >
              {organizerLoading ? "Loading..." : isSubmitting ? "Saving..." : "Save as Draft"}
              <Save className="w-4 h-4 ml-2" />
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={!validateStep2() || isSubmitting || organizerLoading}
              className="bg-[#799EFF] hover:bg-[#6B8EFF] text-white cursor-pointer"
            >
              {organizerLoading ? "Loading..." : isSubmitting ? "Creating Event..." : "Submit for Approval"}
              <Plus className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
