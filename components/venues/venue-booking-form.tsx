"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface VenueBookingFormProps {
  venueId: string
}

export function VenueBookingForm({ venueId }: VenueBookingFormProps) {
  const [bookingData, setBookingData] = useState({
    eventName: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    expectedAttendees: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    specialRequirements: "",
    setupTime: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Mock booking submission
    setTimeout(() => {
      alert("Booking request submitted successfully! You will receive a confirmation email shortly.")
      setIsSubmitting(false)
    }, 1000)
  }

  const handleInputChange = (field: string, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateDuration = () => {
    if (bookingData.startTime && bookingData.endTime) {
      const start = new Date(`2024-01-01 ${bookingData.startTime}`)
      const end = new Date(`2024-01-01 ${bookingData.endTime}`)
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return diffHours > 0 ? diffHours : 0
    }
    return 0
  }

  const estimatedCost = calculateDuration() * 2500 // Mock hourly rate

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Book This Venue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name *</Label>
            <Input
              id="eventName"
              value={bookingData.eventName}
              onChange={(e) => handleInputChange("eventName", e.target.value)}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date *</Label>
            <Input
              id="eventDate"
              type="date"
              value={bookingData.eventDate}
              onChange={(e) => handleInputChange("eventDate", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={bookingData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={bookingData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedAttendees">Expected Attendees *</Label>
            <Input
              id="expectedAttendees"
              type="number"
              value={bookingData.expectedAttendees}
              onChange={(e) => handleInputChange("expectedAttendees", e.target.value)}
              placeholder="Number of attendees"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setupTime">Setup Time Required</Label>
            <Select value={bookingData.setupTime} onValueChange={(value) => handleInputChange("setupTime", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select setup time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30min">30 minutes</SelectItem>
                <SelectItem value="1hour">1 hour</SelectItem>
                <SelectItem value="2hours">2 hours</SelectItem>
                <SelectItem value="3hours">3+ hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person *</Label>
            <Input
              id="contactPerson"
              value={bookingData.contactPerson}
              onChange={(e) => handleInputChange("contactPerson", e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={bookingData.contactEmail}
              onChange={(e) => handleInputChange("contactEmail", e.target.value)}
              placeholder="your.email@christuniversity.in"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={bookingData.contactPhone}
              onChange={(e) => handleInputChange("contactPhone", e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequirements">Special Requirements</Label>
            <Textarea
              id="specialRequirements"
              value={bookingData.specialRequirements}
              onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
              placeholder="Any special setup, equipment, or requirements"
              rows={3}
            />
          </div>

          {calculateDuration() > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Duration: {calculateDuration()} hours</p>
                <p>Estimated Cost: ₹{estimatedCost.toLocaleString()}</p>
                <p className="text-xs text-blue-600">*Final cost may vary based on additional services</p>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? "Submitting Request..." : "Submit Booking Request"}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Your booking request will be reviewed by the admin team within 24 hours.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
