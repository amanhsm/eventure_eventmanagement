"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { notificationService } from "@/lib/services/notification-service"

interface Venue {
  id: string
  name: string
  capacity: number
  location: string
  facilities: string[]
  hourly_rate: number
  is_available: boolean
}

export function CreateEventForm() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [venueBookingStatus, setVenueBookingStatus] = useState<"idle" | "checking" | "available" | "unavailable">(
    "idle",
  )

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    venueId: "",
    capacity: "",
    requirements: "",
    hasRegistrationFee: false,
    registrationFee: "",
    registrationDeadlineDate: "",
    registrationDeadlineTime: "23:59",
    maxRegistrations: "",
    eligibility: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    organization: "",
    additionalNotes: "",
    imageUrl: "",
  })

  useEffect(() => {
    const loadVenues = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("venues").select("*").eq("is_available", true).order("name")

      if (data && !error) {
        setVenues(data)
      }
    }

    loadVenues()
  }, [])

  useEffect(() => {
    if (formData.venueId && formData.date && formData.startTime && formData.endTime) {
      checkVenueAvailability()
    }
  }, [formData.venueId, formData.date, formData.startTime, formData.endTime])

  const checkVenueAvailability = async () => {
    if (!formData.venueId || !formData.date || !formData.startTime || !formData.endTime) return

    setVenueBookingStatus("checking")

    const supabase = createClient()
    const startDateTime = `${formData.date}T${formData.startTime}:00`
    const endDateTime = `${formData.date}T${formData.endTime}:00`

    // Check for conflicting bookings
    const { data: conflicts, error } = await supabase
      .from("venue_bookings")
      .select("*")
      .eq("venue_id", formData.venueId)
      .eq("status", "approved")
      .or(
        `and(start_time.lte.${startDateTime},end_time.gt.${startDateTime}),and(start_time.lt.${endDateTime},end_time.gte.${endDateTime}),and(start_time.gte.${startDateTime},end_time.lte.${endDateTime})`,
      )

    if (error) {
      console.error("Error checking venue availability:", error)
      setVenueBookingStatus("idle")
      return
    }

    setVenueBookingStatus(conflicts && conflicts.length > 0 ? "unavailable" : "available")
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "venueId") {
      const venue = venues.find((v) => v.id === value)
      setSelectedVenue(venue || null)
      if (venue) {
        setFormData((prev) => ({ ...prev, capacity: Math.min(venue.capacity, 500).toString() }))
      }
    }
    
    // Validate capacity doesn't exceed 500
    if (field === "capacity" && typeof value === "string") {
      const numValue = parseInt(value)
      if (numValue > 500) {
        setFormData((prev) => ({ ...prev, capacity: "500" }))
      }
    }
  }

  const handleSaveAsDraft = async () => {
    if (!user || !profile) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()

      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        organizer_id: user.id,
        venue_id: formData.venueId || null,
        start_date: `${formData.date}T${formData.startTime}:00`,
        end_date: `${formData.date}T${formData.endTime}:00`,
        registration_deadline: formData.registrationDeadlineDate ? `${formData.registrationDeadlineDate}T${formData.registrationDeadlineTime}:00` : null,
        max_participants: formData.maxRegistrations ? Number.parseInt(formData.maxRegistrations) : null,
        registration_fee: formData.hasRegistrationFee && formData.registrationFee ? Number.parseFloat(formData.registrationFee) : 0,
        requirements: formData.requirements,
        image_url: formData.imageUrl || null,
        status: "draft",
      }

      const { error } = await supabase.from("events").insert([eventData])

      if (error) throw error

      console.log("[v0] Event saved as draft")
      router.push("/dashboard/organizer")
    } catch (error) {
      console.error("Error saving draft:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!user || !profile) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()

      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        organizer_id: user.id,
        venue_id: formData.venueId || null,
        start_date: `${formData.date}T${formData.startTime}:00`,
        end_date: `${formData.date}T${formData.endTime}:00`,
        registration_deadline: formData.registrationDeadlineDate ? `${formData.registrationDeadlineDate}T${formData.registrationDeadlineTime}:00` : null,
        max_participants: formData.maxRegistrations ? Number.parseInt(formData.maxRegistrations) : null,
        registration_fee: formData.hasRegistrationFee && formData.registrationFee ? Number.parseFloat(formData.registrationFee) : 0,
        requirements: formData.requirements,
        image_url: formData.imageUrl || null,
        status: "pending_approval",
        approval_status: "pending",
      }

      const { data: eventResult, error: eventError } = await supabase
        .from("events")
        .insert([eventData])
        .select()
        .single()

      if (eventError) throw eventError

      // Create venue booking if venue is selected
      if (formData.venueId && selectedVenue) {
        const bookingData = {
          venue_id: formData.venueId,
          event_id: eventResult.id,
          organizer_id: user.id,
          start_time: `${formData.date}T${formData.startTime}:00`,
          end_time: `${formData.date}T${formData.endTime}:00`,
          booking_purpose: formData.title,
          special_requirements: formData.requirements,
          status: "pending",
          total_cost:
            selectedVenue.hourly_rate *
            ((new Date(`${formData.date}T${formData.endTime}:00`).getTime() -
              new Date(`${formData.date}T${formData.startTime}:00`).getTime()) /
              (1000 * 60 * 60)),
        }

        const { error: bookingError } = await supabase.from("venue_bookings").insert([bookingData])

        if (bookingError) throw bookingError
      }

      // Notify admins about new event submission
      try {
        const organizerName = profile?.name || user.usernumber || 'Unknown Organizer'
        await notificationService.notifyAdminNewEventSubmission(
          eventResult.id,
          formData.title,
          organizerName
        )
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError)
        // Don't fail the whole process if notification fails
      }

      console.log("[v0] Event submitted for approval with venue booking")
      router.push("/dashboard/organizer")
    } catch (error) {
      console.error("Error submitting event:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="Enter event title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your event in detail"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Event Image</Label>
            <ImageUpload
              onImageUpload={(imageUrl) => handleInputChange("imageUrl", imageUrl)}
              onImageRemove={() => handleInputChange("imageUrl", "")}
              currentImage={formData.imageUrl}
              eventId={formData.title ? formData.title.replace(/\s+/g, '-').toLowerCase() : undefined}
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500">
              Upload an image to make your event more attractive. Supported formats: JPG, PNG, WebP (max 5MB)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Event Date *</Label>
              <Input
                id="date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time *</Label>
              <Select value={formData.startTime} onValueChange={(value) => handleInputChange("startTime", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
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
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time *</Label>
              <Select value={formData.endTime} onValueChange={(value) => handleInputChange("endTime", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Venue Selection & Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="venue">Select Venue *</Label>
              <Select value={formData.venueId} onValueChange={(value) => handleInputChange("venueId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name} - {venue.location} (Capacity: {venue.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Expected Attendees *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="Number of attendees"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                max={selectedVenue ? Math.min(selectedVenue.capacity, 500) : 500}
                min="1"
              />
              {selectedVenue && (
                <p className="text-sm text-gray-600">
                  Maximum capacity: {Math.min(selectedVenue.capacity, 500)} people
                  {selectedVenue.capacity > 500 && " (Limited to 500 for this form)"}
                </p>
              )}
              {!selectedVenue && <p className="text-sm text-gray-600">Maximum allowed: 500 people</p>}
            </div>
          </div>

          {venueBookingStatus !== "idle" && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                venueBookingStatus === "available"
                  ? "bg-green-50 text-green-700"
                  : venueBookingStatus === "unavailable"
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {venueBookingStatus === "checking" && <Clock className="w-4 h-4" />}
              {venueBookingStatus === "available" && <CheckCircle className="w-4 h-4" />}
              {venueBookingStatus === "unavailable" && <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {venueBookingStatus === "checking" && "Checking availability..."}
                {venueBookingStatus === "available" && "Venue is available for selected time slot"}
                {venueBookingStatus === "unavailable" && "Venue is not available for selected time slot"}
              </span>
            </div>
          )}

          {selectedVenue && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Venue Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Location:</strong> {selectedVenue.location}
                  </p>
                  <p>
                    <strong>Capacity:</strong> {selectedVenue.capacity} people
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Hourly Rate:</strong> ₹{selectedVenue.hourly_rate}
                  </p>
                  <p>
                    <strong>Facilities:</strong> {selectedVenue.facilities.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="requirements">Special Requirements</Label>
            <Textarea
              id="requirements"
              placeholder="Any special equipment, setup, or requirements for the venue"
              rows={3}
              value={formData.requirements}
              onChange={(e) => handleInputChange("requirements", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Registration & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="has-registration-fee"
                checked={formData.hasRegistrationFee}
                onCheckedChange={(checked) => handleInputChange("hasRegistrationFee", checked)}
              />
              <Label htmlFor="has-registration-fee">This event has a registration fee</Label>
            </div>
            
            {formData.hasRegistrationFee && (
              <div className="space-y-2">
                <Label htmlFor="registration-fee">Registration Fee Amount *</Label>
                <Input
                  id="registration-fee"
                  type="number"
                  placeholder="₹0"
                  value={formData.registrationFee}
                  onChange={(e) => handleInputChange("registrationFee", e.target.value)}
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="registration-deadline-date">Registration Deadline Date *</Label>
              <Input
                id="registration-deadline-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                max={formData.date || undefined}
                value={formData.registrationDeadlineDate}
                onChange={(e) => handleInputChange("registrationDeadlineDate", e.target.value)}
              />
              {formData.date && (
                <p className="text-sm text-gray-600">
                  Must be before event date ({formData.date})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration-deadline-time">Registration Deadline Time *</Label>
              <Select value={formData.registrationDeadlineTime} onValueChange={(value) => handleInputChange("registrationDeadlineTime", value)}>
                <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-registrations">Max Registrations</Label>
            <Input
              id="max-registrations"
              type="number"
              placeholder="Leave empty for no limit"
              value={formData.maxRegistrations}
              onChange={(e) => handleInputChange("maxRegistrations", e.target.value)}
              max="500"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eligibility">Eligibility Criteria</Label>
            <Textarea
              id="eligibility"
              placeholder="Who can register for this event?"
              rows={2}
              value={formData.eligibility}
              onChange={(e) => handleInputChange("eligibility", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contact-person">Contact Person *</Label>
              <Input
                id="contact-person"
                placeholder="Name of contact person"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email *</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="contact@example.com"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange("contactPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organizing Committee/Club</Label>
              <Input
                id="organization"
                placeholder="Name of organizing body"
                value={formData.organization}
                onChange={(e) => handleInputChange("organization", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-notes">Additional Notes</Label>
            <Textarea
              id="additional-notes"
              placeholder="Any other information for the admin team"
              rows={3}
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button variant="outline" size="lg" onClick={handleSaveAsDraft} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save as Draft"}
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
          onClick={handleSubmitForApproval}
          disabled={isSubmitting || venueBookingStatus === "unavailable"}
        >
          {isSubmitting ? "Submitting..." : "Submit for Approval"}
        </Button>
      </div>
    </div>
  )
}
