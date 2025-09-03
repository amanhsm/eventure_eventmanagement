"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, MapPin, Users, Clock, Check, X, Eye, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export function EventApprovals() {
  const [pendingEvents, setPendingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  useEffect(() => {
    fetchPendingEvents()
  }, [])

  const fetchPendingEvents = async () => {
    try {
      const supabase = createBrowserClient()

      const { data: events, error } = await supabase
        .from("events")
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(full_name, email),
          venue:venues(name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error

      setPendingEvents(events || [])
    } catch (error) {
      console.error("[v0] Error fetching pending events:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-100 text-blue-800"
      case "cultural":
        return "bg-purple-100 text-purple-800"
      case "sports":
        return "bg-orange-100 text-orange-800"
      case "academic":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleViewDetails = (eventId: string) => {
    const event = pendingEvents.find((e) => e.id === eventId)
    setSelectedEvent(event)
    setShowDetailsModal(true)
    console.log(`[v0] Viewing details for event ${eventId}`)
  }

  const handleApprove = async (eventId: string) => {
    if (confirm("Are you sure you want to approve this event?")) {
      try {
        const supabase = createBrowserClient()

        const { error } = await supabase
          .from("events")
          .update({ status: "approved", approved_at: new Date().toISOString() })
          .eq("id", eventId)

        if (error) throw error

        setPendingEvents(pendingEvents.filter((event) => event.id !== eventId))
        console.log(`[v0] Approved event ${eventId}`)
        alert("Event approved successfully!")
      } catch (error) {
        console.error("[v0] Error approving event:", error)
        alert("Error approving event. Please try again.")
      }
    }
  }

  const handleReject = async (eventId: string) => {
    if (confirm("Are you sure you want to reject this event? This action cannot be undone.")) {
      try {
        const supabase = createBrowserClient()

        const { error } = await supabase
          .from("events")
          .update({ status: "rejected", rejected_at: new Date().toISOString() })
          .eq("id", eventId)

        if (error) throw error

        setPendingEvents(pendingEvents.filter((event) => event.id !== eventId))
        console.log(`[v0] Rejected event ${eventId}`)
        alert("Event rejected successfully!")
      } catch (error) {
        console.error("[v0] Error rejecting event:", error)
        alert("Error rejecting event. Please try again.")
      }
    }
  }

  const handleRequestChanges = (eventId: string) => {
    const event = pendingEvents.find((e) => e.id === eventId)
    setSelectedEvent(event)
    setFeedbackText("")
    setShowFeedbackModal(true)
    console.log(`[v0] Requesting changes for event ${eventId}`)
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      alert("Please provide feedback before submitting.")
      return
    }

    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("events")
        .update({
          status: "changes_requested",
          admin_feedback: feedbackText,
          feedback_at: new Date().toISOString(),
        })
        .eq("id", selectedEvent?.id)

      if (error) throw error

      console.log(`[v0] Submitting feedback for event ${selectedEvent?.id}: ${feedbackText}`)
      alert("Feedback sent to organizer successfully!")
      setShowFeedbackModal(false)
      setFeedbackText("")
      setSelectedEvent(null)
      fetchPendingEvents() // Refresh the list
    } catch (error) {
      console.error("[v0] Error submitting feedback:", error)
      alert("Error sending feedback. Please try again.")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Event Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading pending events...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Event Approvals</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800">{pendingEvents.length} Pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {pendingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending events for approval</p>
            ) : (
              pendingEvents.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <Badge className={getPriorityColor(event.priority || "medium")}>
                          {event.priority || "medium"} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">by {event.organizer?.full_name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">
                        Submitted on {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{event.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{event.venue?.name || event.venue_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Capacity: {event.max_participants}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Fee: ₹{event.registration_fee || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 bg-transparent"
                      onClick={() => handleViewDetails(event.id)}
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                      onClick={() => handleApprove(event.id)}
                    >
                      <Check className="w-3 h-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-transparent"
                      onClick={() => handleReject(event.id)}
                    >
                      <X className="w-3 h-3" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent flex items-center gap-1"
                      onClick={() => handleRequestChanges(event.id)}
                    >
                      <MessageSquare className="w-3 h-3" />
                      Request Changes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-600">by {selectedEvent.organizer?.full_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Date & Time</Label>
                  <p className="text-sm">{new Date(selectedEvent.event_date).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-medium">Venue</Label>
                  <p className="text-sm">{selectedEvent.venue?.name || selectedEvent.venue_id}</p>
                </div>
                <div>
                  <Label className="font-medium">Capacity</Label>
                  <p className="text-sm">{selectedEvent.max_participants} participants</p>
                </div>
                <div>
                  <Label className="font-medium">Registration Fee</Label>
                  <p className="text-sm">₹{selectedEvent.registration_fee || 0}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Full Description</Label>
                <p className="text-sm mt-1">{selectedEvent.description}</p>
              </div>

              <div>
                <Label className="font-medium">Requirements</Label>
                <p className="text-sm mt-1">{selectedEvent.requirements || "None specified"}</p>
              </div>

              <div>
                <Label className="font-medium">Contact</Label>
                <p className="text-sm mt-1">{selectedEvent.organizer?.email}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleApprove(selectedEvent.id)
                    setShowDetailsModal(false)
                  }}
                >
                  Approve Event
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 bg-transparent"
                  onClick={() => {
                    handleReject(selectedEvent.id)
                    setShowDetailsModal(false)
                  }}
                >
                  Reject Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleRequestChanges(selectedEvent.id)
                  }}
                >
                  Request Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-medium">Event: {selectedEvent?.title}</Label>
              <p className="text-sm text-gray-600">Provide feedback for the organizer</p>
            </div>

            <div>
              <Label htmlFor="feedback">Feedback & Suggestions</Label>
              <Textarea
                id="feedback"
                placeholder="Please provide specific feedback on what needs to be changed or improved..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitFeedback}>Send Feedback</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackText("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
