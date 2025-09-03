"use client"

import { Button } from "@/components/ui/button"
import { Plus, Calendar, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EventCalendar } from "@/components/dashboard/event-calendar"

export function OrganizerHeader() {
  const router = useRouter()
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  const handleCreateEvent = () => {
    console.log("[v0] Navigating to create event page")
    router.push("/dashboard/organizer/create-event")
  }

  const handleEventCalendar = () => {
    console.log("[v0] Opening event calendar")
    setShowCalendarModal(true)
  }

  const handleSettings = () => {
    console.log("[v0] Navigating to organizer settings")
    router.push("/dashboard/organizer/settings")
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your events, venues, and registrations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={handleEventCalendar}>
            <Calendar className="w-4 h-4" />
            Event Calendar
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={handleSettings}>
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2" onClick={handleCreateEvent}>
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>
      </div>

      <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Event Calendar</DialogTitle>
          </DialogHeader>
          <EventCalendar userRole="organizer" showUserEventsOnly={true} />
        </DialogContent>
      </Dialog>
    </>
  )
}
