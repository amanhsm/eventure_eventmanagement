"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useCustomToast } from "@/hooks/use-toast-custom"

interface Event {
  id: number
  title: string
  description: string
  category_id: number
  max_participants: number
  requirements: string
  eligibility_criteria: string
  contact_person: string
  contact_email: string
  contact_phone: string
  priority: string
  additional_notes: string
  admin_feedback: string
}

interface Category {
  id: number
  name: string
}

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast, ToastContainer } = useCustomToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const eventId = params?.id as string

  useEffect(() => {
    const fetchEventAndCategories = async () => {
      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (eventError) throw eventError
        setEvent(eventData)

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('event_categories')
          .select('id, name')
          .order('name')

        if (categoriesError) throw categoriesError
        setCategories(categoriesData || [])

      } catch (error) {
        console.error('Error fetching data:', error)
        showToast('Error', 'Failed to load event details', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId) {
      fetchEventAndCategories()
    }
  }, [eventId])

  const handleInputChange = (field: string, value: string) => {
    if (event) {
      setEvent({ ...event, [field]: value })
    }
  }

  const handleSave = async () => {
    if (!event) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: event.title,
          description: event.description,
          category_id: event.category_id,
          max_participants: event.max_participants,
          requirements: event.requirements || 'No special requirements',
          eligibility_criteria: event.eligibility_criteria || 'Open to all students',
          contact_person: event.contact_person,
          contact_email: event.contact_email,
          contact_phone: event.contact_phone,
          priority: event.priority,
          additional_notes: event.additional_notes,
          status: 'pending_approval', // Change status back to pending after edit
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)

      if (error) throw error

      showToast('Success!', 'Event updated and resubmitted for approval', 'success')
      
      setTimeout(() => {
        router.push('/dashboard/organizer')
      }, 2000)

    } catch (error) {
      console.error('Error updating event:', error)
      showToast('Error', 'Failed to update event', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">Event not found</p>
            <Button onClick={() => router.push('/dashboard/organizer')} className="mt-4">
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <ToastContainer />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/organizer')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold">Edit Event</h1>
        </div>

        {/* Admin Feedback Section */}
        {event.admin_feedback && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Admin Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700">{event.admin_feedback}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={event.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={event.category_id.toString()} 
                  onValueChange={(value) => handleInputChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={event.description}
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
                  value={event.max_participants}
                  onChange={(e) => handleInputChange('max_participants', e.target.value)}
                  placeholder="Enter maximum participants"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={event.priority} onValueChange={(value) => handleInputChange('priority', value)}>
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
                  value={event.contact_person || ''}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  placeholder="Primary contact person"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={event.contact_email || ''}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="Contact email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={event.contact_phone || ''}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="Contact phone"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={event.requirements || ''}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="Any special requirements"
                  rows={3}
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="eligibility_criteria">Eligibility Criteria</Label>
                <Textarea
                  id="eligibility_criteria"
                  value={event.eligibility_criteria || ''}
                  onChange={(e) => handleInputChange('eligibility_criteria', e.target.value)}
                  placeholder="Who can participate"
                  rows={3}
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={event.additional_notes || ''}
                  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                  placeholder="Any additional information"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/organizer')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !event.title || !event.description}
                className="bg-[#799EFF] hover:bg-[#6B8EFF] text-white"
              >
                {isSaving ? "Saving..." : "Save & Resubmit"}
                <Save className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
