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
  
  // Event details with ALL fields to prevent NULL values
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    max_participants: "",
    registration_deadline_date: "",
    registration_deadline_time: "23:59",
    hasRegistrationFee: false,
    registration_fee: "0",
    // NEW FIELDS to prevent NULL values
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
        
        const { data: organizerData, error: organizerError } = await supabase
          .from('organizers')
          .select('id, name')
          .eq('user_id', user.id)
          .single()

        if (organizerError) {
          console.error('Error fetching organizer:', organizerError)
          setOrganizerLoading(false)
          return
        }

        if (organizerData) {
          console.log('Found organizer:', organizerData)
          setOrganizerId(organizerData.id)
          
          // Pre-fill contact info
          setFormData(prev => ({
            ...prev,
            contact_person: organizerData.name,
            contact_email: (user as any)?.email || ""
          }))
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('event_categories')
          .select('id, name, color_code')
          .order('name')

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError)
        } else if (categoriesData) {
          setCategories(categoriesData)
        }

      } catch (error) {
        console.error('Error in fetchOrganizerId:', error)
      } finally {
        setOrganizerLoading(false)
      }
    }

    fetchOrganizerId()
  }, [user])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateStep1 = () => {
    return selectedVenue && eventDate && startTime && endTime
  }

  const validateStep2 = () => {
    return formData.title && formData.description && formData.category_id && formData.max_participants
  }

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!organizerId) {
      alert('Organizer information not found')
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
          (eventDate ? new Date(eventDate.getTime() - 24 * 60 * 60 * 1000).toISOString() : null),
        registration_fee: formData.hasRegistrationFee ? parseFloat(formData.registration_fee) : 0,
        status: isDraft ? 'draft' : 'pending_approval',
        approval_status: 'pending',
        cancellation_allowed: true,
        
        // Populate ALL missing fields to prevent NULL values
        requirements: formData.requirements.trim() || 'No special requirements',
        eligibility_criteria: formData.eligibility_criteria.trim() || 'Open to all students',
        contact_person: formData.contact_person.trim() || organizerData?.name || 'Event Organizer',
        contact_email: formData.contact_email.trim() || (organizerData?.users as any)?.email || (user as any)?.email || '',
        contact_phone: formData.contact_phone.trim() || null,
        priority: formData.priority || 'medium',
        additional_notes: formData.additional_notes.trim() || null
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
      <Card>
        <CardHeader>
          <CardTitle>Create New Event - Step {currentStep} of 2</CardTitle>
          <div className="flex space-x-2">
            <div className={`h-2 flex-1 rounded ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`h-2 flex-1 rounded ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Venue and Date</h3>
                <VenueSelector
                  selectedVenue={selectedVenue}
                  onVenueSelect={setSelectedVenue}
                  eventDate={eventDate}
                  startTime={startTime}
                  endTime={endTime}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={eventDate ? eventDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEventDate(e.target.value ? new Date(e.target.value) : null)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={nextStep}
                  disabled={!validateStep1()}
                  className="bg-[#799EFF] hover:bg-[#6B8EFF] cursor-pointer"
                >
                  Next: Event Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Basic Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                    <SelectTrigger>
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

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your event"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Maximum Participants *</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', e.target.value)}
                    placeholder="Enter maximum number of participants"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      placeholder="Primary contact person"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="Contact email for inquiries"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="Contact phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Event Requirements */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Event Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="Any special requirements for the event"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eligibility_criteria">Eligibility Criteria</Label>
                    <Textarea
                      id="eligibility_criteria"
                      value={formData.eligibility_criteria}
                      onChange={(e) => handleInputChange('eligibility_criteria', e.target.value)}
                      placeholder="Who can participate in this event"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Additional Notes</Label>
                  <Textarea
                    id="additional_notes"
                    value={formData.additional_notes}
                    onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                    placeholder="Any additional notes or information"
                    rows={3}
                  />
                </div>
              </div>

              {/* Registration Details */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Registration Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration_deadline_date">Registration Deadline</Label>
                    <Input
                      id="registration_deadline_date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      max={eventDate ? eventDate.toISOString().split('T')[0] : undefined}
                      value={formData.registration_deadline_date}
                      onChange={(e) => handleInputChange('registration_deadline_date', e.target.value)}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_deadline_time">Deadline Time</Label>
                    <Input
                      id="registration_deadline_time"
                      type="time"
                      value={formData.registration_deadline_time}
                      onChange={(e) => handleInputChange('registration_deadline_time', e.target.value)}
                      className="cursor-pointer"
                    />
                  </div>
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
                      <Label htmlFor="registration_fee">Registration Fee (₹)</Label>
                      <Input
                        id="registration_fee"
                        type="number"
                        step="0.01"
                        value={formData.registration_fee}
                        onChange={(e) => handleInputChange('registration_fee', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
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

                <div className="flex gap-4">
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
