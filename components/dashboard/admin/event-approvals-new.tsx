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
import { useCustomToast } from "@/hooks/use-toast-custom"

export function EventApprovals() {
  const { showToast, ToastContainer } = useCustomToast()
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
          organizers!events_organizer_id_fkey(name, user_id, users!organizers_user_id_fkey(email)),
          venues(venue_name, block_id, blocks!venues_block_id_fkey(block_name))
        `)
        .eq("status", "pending_approval")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error

      setPendingEvents(events || [])
    } catch (error) {
      console.error("Error fetching pending events:", error)
      showToast("Error", "Failed to load pending events", "error")
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
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
    switch (category?.toLowerCase()) {
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
  }

  const handleApprove = async (eventId: string) => {
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("events")
        .update({
          status: "approved",
          approval_status: "approved"
        })
        .eq("id", eventId)

      if (error) throw error

      showToast("Success", "Event approved successfully!", "success")
      fetchPendingEvents()
    } catch (error) {
      console.error("Error approving event:", error)
      showToast("Error", "Failed to approve event. Please try again.", "error")
    }
  }

  const handleReject = async (eventId: string) => {
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("events")
        .update({ 
          status: "rejected", 
          approval_status: "rejected",
          rejected_at: new Date().toISOString() 
        })
        .eq("id", eventId)

      if (error) throw error

      showToast("Success", "Event rejected successfully!", "success")
      fetchPendingEvents()
    } catch (error) {
      console.error("Error rejecting event:", error)
      showToast("Error", "Failed to reject event. Please try again.", "error")
    }
  }

  const handleRequestChanges = (eventId: string) => {
    const event = pendingEvents.find((e) => e.id === eventId)
    setSelectedEvent(event)
    setFeedbackText("")
    setShowFeedbackModal(true)
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      showToast("Warning", "Please provide feedback before submitting.", "warning")
      return
    }

    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("events")
        .update({
          status: "changes_requested",
          approval_status: "changes_requested",
          admin_feedback: feedbackText.trim()
        })
        .eq("id", selectedEvent.id)

      if (error) throw error

      setShowFeedbackModal(false)
      setFeedbackText("")
      setSelectedEvent(null)
      showToast("Success", "Feedback sent successfully!", "success")
      fetchPendingEvents()
    } catch (error) {
      console.error("Error submitting feedback:", error)
      showToast("Error", "Failed to send feedback. Please try again.", "error")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading pending events...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Event Approvals</CardTitle>
          <p className="text-sm text-gray-600">
            Review and approve events submitted by organizers
          </p>
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
                      <p className="text-sm text-gray-600 mb-1">by {event.organizers?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">
                        Submitted on {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{event.description}</p>

                  {event.image_url && (
                    <div className="mb-4">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>
                        {event.venues?.venue_name || event.venue_id}
                        {event.venues?.blocks?.block_name ? `, ${event.venues.blocks.block_name}` : ""}
                      </span>
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
                      className="flex items-center gap-1 bg-transparent cursor-pointer"
                      onClick={() => handleViewDetails(event.id)}
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1 cursor-pointer"
                      onClick={() => handleApprove(event.id)}
                    >
                      <Check className="w-3 h-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-transparent cursor-pointer"
                      onClick={() => handleReject(event.id)}
                    >
                      <X className="w-3 h-3" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent flex items-center gap-1 cursor-pointer"
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
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <p className="text-gray-600">{selectedEvent.description}</p>
              
              {selectedEvent.image_url && (
                <div>
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Date:</strong> {new Date(selectedEvent.event_date).toLocaleDateString()}
                </div>
                <div>
                  <strong>Time:</strong> {selectedEvent.start_time} - {selectedEvent.end_time}
                </div>
                <div>
                  <strong>Venue:</strong> {selectedEvent.venues?.venue_name}
                </div>
                <div>
                  <strong>Capacity:</strong> {selectedEvent.max_participants}
                </div>
                <div>
                  <strong>Fee:</strong> ₹{selectedEvent.registration_fee || 0}
                </div>
                <div>
                  <strong>Organizer:</strong> {selectedEvent.organizers?.name}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="bg-green-600 hover:bg-green-700 cursor-pointer"
                  onClick={() => {
                    handleApprove(selectedEvent.id)
                    setShowDetailsModal(false)
                  }}
                >
                  Approve Event
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 bg-transparent cursor-pointer"
                  onClick={() => {
                    handleReject(selectedEvent.id)
                    setShowDetailsModal(false)
                  }}
                >
                  Reject Event
                </Button>
                <Button
                  variant="outline"
                  className="cursor-pointer"
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
            <p className="text-sm text-gray-600">
              Provide feedback to the organizer about what changes are needed for this event.
            </p>
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Please specify what changes are needed..."
                rows={4}
                className="cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitFeedback} className="cursor-pointer">
                Send Feedback
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
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
      
      <ToastContainer />
    </>
  )
}
