"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, Clock, Users, MapPin, Mail, Phone, Tag, 
  CheckCircle, XCircle, Eye, Edit, Star, Globe, Shield 
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Event {
  id: number
  title: string
  description: string
  organizer_name: string
  organizer_email: string
  venue_name: string
  block_name: string
  category_name: string
  event_date: string
  start_time: string
  end_time: string
  max_participants: number
  current_participants: number
  registration_fee: number
  registration_deadline: string
  status: string
  approval_status: string
  contact_email: string
  contact_phone: string
  requirements: string
  priority: string
  tags: string[]
  is_featured: boolean
  is_public: boolean
  cancellation_allowed: boolean
  event_image_url: string
  created_at: string
  updated_at: string
}

export function EnhancedEventApprovals() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [filter, setFilter] = useState("pending_approval")
  
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [filter])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizers(name, user_id),
          users(email),
          venues(venue_name, blocks(block_name)),
          event_categories(name)
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to match interface
      const transformedEvents = data?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        organizer_name: event.organizers?.name || 'Unknown',
        organizer_email: event.users?.email || 'Unknown',
        venue_name: event.venues?.venue_name || 'TBA',
        block_name: event.venues?.blocks?.block_name || 'Unknown',
        category_name: event.event_categories?.name || 'Unknown',
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        max_participants: event.max_participants,
        current_participants: event.current_participants,
        registration_fee: event.registration_fee || 0,
        registration_deadline: event.registration_deadline,
        status: event.status,
        approval_status: event.approval_status,
        contact_email: event.contact_email || event.users?.email,
        contact_phone: event.contact_phone,
        requirements: event.requirements,
        priority: event.priority || 'normal',
        tags: event.tags || [],
        is_featured: event.is_featured || false,
        is_public: event.is_public !== false,
        cancellation_allowed: event.cancellation_allowed !== false,
        event_image_url: event.event_image_url,
        created_at: event.created_at,
        updated_at: event.updated_at
      })) || []

      setEvents(transformedEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproval = async (eventId: number, action: 'approve' | 'reject') => {
    try {
      setIsProcessing(true)
      
      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      }

      if (action === 'reject' && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)

      if (error) throw error

      alert(`Event ${action === 'approve' ? 'approved' : 'rejected'} successfully!`)
      setSelectedEvent(null)
      setRejectionReason("")
      fetchEvents()
    } catch (error) {
      console.error(`Error ${action}ing event:`, error)
      alert(`Error ${action}ing event. Please try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "normal": return "bg-blue-100 text-blue-800"
      case "low": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800"
      case "rejected": return "bg-red-100 text-red-800"
      case "pending_approval": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Event Approvals</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No events found for the selected filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {event.is_featured && <Star className="w-4 h-4 text-yellow-500" />}
                        {!event.is_public && <Shield className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{event.category_name}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.venue_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{event.max_participants} max</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">₹{event.registration_fee}</p>
                      <p className="text-sm text-gray-600">Registration Fee</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>By: {event.organizer_name}</span>
                      <span>•</span>
                      <span>{formatDate(event.created_at)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {selectedEvent?.title}
                              {selectedEvent?.is_featured && <Star className="w-5 h-5 text-yellow-500" />}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedEvent && (
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="details">Event Details</TabsTrigger>
                                <TabsTrigger value="contact">Contact & Settings</TabsTrigger>
                                <TabsTrigger value="registration">Registration</TabsTrigger>
                                <TabsTrigger value="actions">Actions</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Title</Label>
                                    <p className="font-medium">{selectedEvent.title}</p>
                                  </div>
                                  <div>
                                    <Label>Category</Label>
                                    <p>{selectedEvent.category_name}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <Label>Description</Label>
                                    <p className="text-gray-700">{selectedEvent.description}</p>
                                  </div>
                                  <div>
                                    <Label>Event Date</Label>
                                    <p>{formatDate(selectedEvent.event_date)}</p>
                                  </div>
                                  <div>
                                    <Label>Time</Label>
                                    <p>{formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}</p>
                                  </div>
                                  <div>
                                    <Label>Venue</Label>
                                    <p>{selectedEvent.venue_name}, {selectedEvent.block_name}</p>
                                  </div>
                                  <div>
                                    <Label>Priority</Label>
                                    <Badge className={getPriorityColor(selectedEvent.priority)}>
                                      {selectedEvent.priority.toUpperCase()}
                                    </Badge>
                                  </div>
                                  {selectedEvent.requirements && (
                                    <div className="col-span-2">
                                      <Label>Special Requirements</Label>
                                      <p className="text-gray-700">{selectedEvent.requirements}</p>
                                    </div>
                                  )}
                                  {selectedEvent.tags.length > 0 && (
                                    <div className="col-span-2">
                                      <Label>Tags</Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedEvent.tags.map((tag, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="contact" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Organizer</Label>
                                    <p>{selectedEvent.organizer_name}</p>
                                  </div>
                                  <div>
                                    <Label>Organizer Email</Label>
                                    <p>{selectedEvent.organizer_email}</p>
                                  </div>
                                  <div>
                                    <Label>Contact Email</Label>
                                    <p>{selectedEvent.contact_email}</p>
                                  </div>
                                  <div>
                                    <Label>Contact Phone</Label>
                                    <p>{selectedEvent.contact_phone || 'Not provided'}</p>
                                  </div>
                                  <div>
                                    <Label>Public Event</Label>
                                    <p>{selectedEvent.is_public ? 'Yes' : 'No'}</p>
                                  </div>
                                  <div>
                                    <Label>Featured Event</Label>
                                    <p>{selectedEvent.is_featured ? 'Yes' : 'No'}</p>
                                  </div>
                                  <div>
                                    <Label>Cancellation Allowed</Label>
                                    <p>{selectedEvent.cancellation_allowed ? 'Yes' : 'No'}</p>
                                  </div>
                                  {selectedEvent.event_image_url && (
                                    <div>
                                      <Label>Event Image</Label>
                                      <a 
                                        href={selectedEvent.event_image_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View Image
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="registration" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Maximum Participants</Label>
                                    <p>{selectedEvent.max_participants}</p>
                                  </div>
                                  <div>
                                    <Label>Current Registrations</Label>
                                    <p>{selectedEvent.current_participants}</p>
                                  </div>
                                  <div>
                                    <Label>Registration Fee</Label>
                                    <p>₹{selectedEvent.registration_fee}</p>
                                  </div>
                                  <div>
                                    <Label>Registration Deadline</Label>
                                    <p>{selectedEvent.registration_deadline ? 
                                      formatDate(selectedEvent.registration_deadline) : 'Not set'}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="actions" className="space-y-4">
                                {selectedEvent.status === 'pending_approval' && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="rejection_reason">Rejection Reason (if rejecting)</Label>
                                      <Textarea
                                        id="rejection_reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Enter reason for rejection..."
                                        rows={3}
                                      />
                                    </div>
                                    
                                    <div className="flex gap-4">
                                      <Button
                                        onClick={() => handleApproval(selectedEvent.id, 'approve')}
                                        disabled={isProcessing}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {isProcessing ? 'Processing...' : 'Approve Event'}
                                      </Button>
                                      
                                      <Button
                                        onClick={() => handleApproval(selectedEvent.id, 'reject')}
                                        disabled={isProcessing}
                                        variant="destructive"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        {isProcessing ? 'Processing...' : 'Reject Event'}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {selectedEvent.status !== 'pending_approval' && (
                                  <div className="text-center py-4">
                                    <p className="text-gray-600">
                                      This event has already been {selectedEvent.status.replace('_', ' ')}.
                                    </p>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {event.status === 'pending_approval' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproval(event.id, 'approve')}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedEvent(event)
                              // You could open a modal here for rejection reason
                            }}
                            disabled={isProcessing}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
