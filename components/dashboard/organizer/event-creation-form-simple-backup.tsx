"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Save } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface Category {
  id: number
  name: string
}

export default function EventCreationForm() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [organizerId, setOrganizerId] = useState<number | null>(null)
  const [organizerLoading, setOrganizerLoading] = useState(true)
  
  // Form data with all fields to prevent NULL values
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    max_participants: "",
    event_date: "",
    start_time: "",
    end_time: "",
    venue_id: "",
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

  const [categories, setCategories] = useState<Category[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const supabase = createClient()

  // Fetch organizer ID and initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) {
        setOrganizerLoading(false)
        return
      }
      
      try {
        // Get organizer ID
        const { data: organizerData, error: organizerError } = await supabase
          .from('organizers')
          .select('id, name')
          .eq('user_id', user.id)
          .single()

        if (organizerData) {
          setOrganizerId(organizerData.id)
          
          // Pre-fill contact info
          setFormData(prev => ({
            ...prev,
            contact_person: organizerData.name,
            contact_email: (user as any)?.email || ""
          }))
        }

        // Get categories
        const { data: categoriesData } = await supabase
          .from('event_categories')
          .select('id, name')
          .order('name')

        if (categoriesData) {
          setCategories(categoriesData)
        }

        // Get venues
        const { data: venuesData } = await supabase
          .from('venues')
          .select('id, venue_name, max_capacity')
          .order('venue_name')

        if (venuesData) {
          setVenues(venuesData)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setOrganizerLoading(false)
      }
    }

    fetchInitialData()
  }, [user])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!organizerId) {
      alert('Organizer information not found')
      return
    }

    if (!isDraft && (!formData.title || !formData.description || !formData.category_id)) {
      alert('Please fill in all required fields')
      return
    }

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
        event_date: formData.event_date || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        venue_id: formData.venue_id ? parseInt(formData.venue_id) : null,
        organizer_id: organizerId,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        current_participants: 0,
        registration_deadline: formData.registration_deadline_date ? 
          `${formData.registration_deadline_date}T${formData.registration_deadline_time}:00` : null,
        registration_fee: formData.hasRegistrationFee ? parseFloat(formData.registration_fee) : 0,
        status: isDraft ? 'draft' : 'pending_approval',
        approval_status: 'pending',
        cancellation_allowed: true,
        
        // Populate all fields to prevent NULL values
        requirements: formData.requirements.trim() || 'No special requirements',
        eligibility_criteria: formData.eligibility_criteria.trim() || 'Open to all students',
        contact_person: formData.contact_person.trim() || organizerData?.name || 'Event Organizer',
        contact_email: formData.contact_email.trim() || (organizerData?.users as any)?.email || (user as any)?.email || '',
        contact_phone: formData.contact_phone.trim() || null,
        priority: formData.priority || 'medium',
        additional_notes: formData.additional_notes.trim() || null
      }

      const { error } = await supabase
        .from('events')
        .insert([eventData])

      if (error) throw error

      alert(isDraft ? 'Event saved as draft!' : 'Event submitted successfully!')
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category_id: "",
        max_participants: "",
        event_date: "",
        start_time: "",
        end_time: "",
        venue_id: "",
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
              <p>Loading...</p>
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
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_id">Venue</Label>
              <Select value={formData.venue_id} onValueChange={(value) => handleInputChange('venue_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id.toString()}>
                      {venue.venue_name} (Capacity: {venue.max_capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => handleInputChange('max_participants', e.target.value)}
                placeholder="Enter maximum participants"
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
                placeholder="Contact email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="Contact phone"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Any special requirements"
                rows={3}
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="eligibility_criteria">Eligibility Criteria</Label>
              <Textarea
                id="eligibility_criteria"
                value={formData.eligibility_criteria}
                onChange={(e) => handleInputChange('eligibility_criteria', e.target.value)}
                placeholder="Who can participate"
                rows={3}
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                value={formData.additional_notes}
                onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                placeholder="Any additional information"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={!formData.title || isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save as Draft"}
              <Save className="w-4 h-4 ml-2" />
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={!formData.title || !formData.description || !formData.category_id || isSubmitting}
              className="bg-[#799EFF] hover:bg-[#6B8EFF] text-white cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Submit for Approval"}
              <Plus className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
