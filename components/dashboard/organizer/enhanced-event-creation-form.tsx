"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, MapPin, Tag, Phone, Mail, Star, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface Category {
  id: number
  name: string
}

interface Venue {
  id: number
  venue_name: string
  max_capacity: number
  blocks: {
    block_name: string
  }
}

export function EnhancedEventCreationForm() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [organizerId, setOrganizerId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  
  // Enhanced form data with all fields
  const [formData, setFormData] = useState({
    // Basic Info
    title: "",
    description: "",
    category_id: "",
    
    // Date & Time
    event_date: "",
    start_time: "",
    end_time: "",
    
    // Participants & Registration
    max_participants: "",
    registration_fee: "0",
    hasRegistrationFee: false,
    registration_deadline_date: "",
    registration_deadline_time: "23:59",
    external_registration_url: "",
    
    // Contact Info
    contact_email: "",
    contact_phone: "",
    
    // Event Details
    requirements: "",
    priority: "normal",
    tags: [] as string[],
    
    // Visibility & Features
    is_public: true,
    is_featured: false,
    cancellation_allowed: true,
    
    // Media
    event_image_url: ""
  })

  const [newTag, setNewTag] = useState("")
  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return

      try {
        // Get organizer ID
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('id, name')
          .eq('user_id', user.id)
          .single()

        if (organizerData) {
          setOrganizerId(organizerData.id)
          // Set default contact email from user
          setFormData(prev => ({
            ...prev,
            contact_email: user.email || ""
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
          .select(`
            id,
            venue_name,
            max_capacity,
            blocks(block_name)
          `)
          .order('venue_name')

        if (venuesData) {
          setVenues(venuesData)
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      }
    }

    fetchInitialData()
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!organizerId) {
      alert('Organizer information not found')
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        organizer_id: organizerId,
        venue_id: selectedVenue?.id || null,
        category_id: parseInt(formData.category_id),
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_participants: parseInt(formData.max_participants),
        current_participants: 0,
        registration_fee: formData.hasRegistrationFee ? parseFloat(formData.registration_fee) : 0,
        registration_deadline: formData.registration_deadline_date ? 
          `${formData.registration_deadline_date}T${formData.registration_deadline_time}:00` : null,
        external_registration_url: formData.external_registration_url || null,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone || null,
        requirements: formData.requirements || null,
        priority: formData.priority,
        tags: formData.tags.length > 0 ? formData.tags : null,
        is_public: formData.is_public,
        is_featured: formData.is_featured,
        cancellation_allowed: formData.cancellation_allowed,
        event_image_url: formData.event_image_url || null,
        status: isDraft ? 'draft' : 'pending_approval',
        approval_status: 'pending'
      }

      const { error } = await supabase
        .from('events')
        .insert([eventData])

      if (error) throw error

      alert(isDraft ? 'Event saved as draft!' : 'Event submitted for approval!')
      
      // Reset form or redirect
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Error creating event:', error)
      alert('Error creating event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter event title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your event"
          rows={4}
          required
        />
      </div>

      <div>
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

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="event_date">Event Date *</Label>
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => handleInputChange('event_date', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="start_time">Start Time *</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => handleInputChange('start_time', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_time">End Time *</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => handleInputChange('end_time', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label>Select Venue</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedVenue?.id === venue.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedVenue(venue)}
            >
              <h4 className="font-medium">{venue.venue_name}</h4>
              <p className="text-sm text-gray-600">{venue.blocks?.block_name}</p>
              <p className="text-sm text-gray-600">Capacity: {venue.max_capacity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="max_participants">Maximum Participants *</Label>
        <Input
          id="max_participants"
          type="number"
          value={formData.max_participants}
          onChange={(e) => handleInputChange('max_participants', e.target.value)}
          placeholder="Enter maximum number of participants"
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasRegistrationFee"
            checked={formData.hasRegistrationFee}
            onCheckedChange={(checked) => handleInputChange('hasRegistrationFee', checked)}
          />
          <Label htmlFor="hasRegistrationFee">This event has a registration fee</Label>
        </div>

        {formData.hasRegistrationFee && (
          <div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="registration_deadline_date">Registration Deadline</Label>
          <Input
            id="registration_deadline_date"
            type="date"
            value={formData.registration_deadline_date}
            onChange={(e) => handleInputChange('registration_deadline_date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="registration_deadline_time">Deadline Time</Label>
          <Input
            id="registration_deadline_time"
            type="time"
            value={formData.registration_deadline_time}
            onChange={(e) => handleInputChange('registration_deadline_time', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="external_registration_url">External Registration URL</Label>
        <Input
          id="external_registration_url"
          type="url"
          value={formData.external_registration_url}
          onChange={(e) => handleInputChange('external_registration_url', e.target.value)}
          placeholder="https://example.com/register"
        />
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_email">Contact Email *</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleInputChange('contact_email', e.target.value)}
            placeholder="contact@example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
            placeholder="+91 9876543210"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="requirements">Special Requirements</Label>
        <Textarea
          id="requirements"
          value={formData.requirements}
          onChange={(e) => handleInputChange('requirements', e.target.value)}
          placeholder="Any special requirements or notes"
          rows={3}
        />
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} variant="outline">
            <Tag className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="event_image_url">Event Image URL</Label>
        <Input
          id="event_image_url"
          type="url"
          value={formData.event_image_url}
          onChange={(e) => handleInputChange('event_image_url', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_public"
            checked={formData.is_public}
            onCheckedChange={(checked) => handleInputChange('is_public', checked)}
          />
          <Label htmlFor="is_public">Make this event public</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
          />
          <Label htmlFor="is_featured">Feature this event</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="cancellation_allowed"
            checked={formData.cancellation_allowed}
            onCheckedChange={(checked) => handleInputChange('cancellation_allowed', checked)}
          />
          <Label htmlFor="cancellation_allowed">Allow cancellations</Label>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Event - Step {currentStep} of 4</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Basic Info</span>
            <span>Date & Venue</span>
            <span>Registration</span>
            <span>Details & Settings</span>
          </div>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 4 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting || !formData.title}
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || !formData.title || !formData.description}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </>
            )}
            
            {currentStep < 4 && (
              <Button
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
