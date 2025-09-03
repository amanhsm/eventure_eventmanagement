"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

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
    registrationFee: "",
    registrationDeadline: "",
    maxRegistrations: "",
    eligibility: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    organization: "",
    additionalNotes: "",
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "venueId") {
      const venue = venues.find((v) => v.id === value)
      setSelectedVenue(venue || null)
      if (venue) {
        setFormData((prev) => ({ ...prev, capacity: venue.capacity.toString() }))
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
        registration_deadline: formData.registrationDeadline ? `${formData.registrationDeadline}T23:59:59` : null,
        max_participants: formData.maxRegistrations ? Number.parseInt(formData.maxRegistrations) : null,
        registration_fee: formData.registrationFee ? Number.parseFloat(formData.registrationFee) : 0,
        requirements: formData.requirements,
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
        registration_deadline: formData.registrationDeadline ? `${formData.registrationDeadline}T23:59:59` : null,
        max_participants: formData.maxRegistrations ? Number.parseInt(formData.maxRegistrations) : null,
        registration_fee: formData.registrationFee ? Number.parseFloat(formData.registrationFee) : 0,
        requirements: formData.requirements,
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Event Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time *</Label>
              <Input
                id="start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time *</Label>
              <Input
                id="end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
              />
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
                max={selectedVenue?.capacity}
              />
              {selectedVenue && <p className="text-sm text-gray-600">Maximum capacity: {selectedVenue.capacity}</p>}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="registration-fee">Registration Fee</Label>
              <Input
                id="registration-fee"
                type="number"
                placeholder="₹0"
                value={formData.registrationFee}
                onChange={(e) => handleInputChange("registrationFee", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration-deadline">Registration Deadline *</Label>
              <Input
                id="registration-deadline"
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => handleInputChange("registrationDeadline", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-registrations">Max Registrations</Label>
              <Input
                id="max-registrations"
                type="number"
                placeholder="Leave empty for no limit"
                value={formData.maxRegistrations}
                onChange={(e) => handleInputChange("maxRegistrations", e.target.value)}
              />
            </div>
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
