"use client"

import { Navigation } from "@/components/navigation"
import { OrganizerHeader } from "@/components/dashboard/organizer/organizer-header"
import { OrganizerStats } from "@/components/dashboard/organizer/organizer-stats"
import { EventManagement } from "@/components/dashboard/organizer/event-management"
import { VenueBooking } from "@/components/dashboard/organizer/venue-booking"
import { EventAnalytics } from "@/components/dashboard/organizer/event-analytics"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function OrganizerDashboard() {
  return (
    <ProtectedRoute allowedRoles={["organizer"]}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <OrganizerHeader />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-8">
              <OrganizerStats />
              <EventManagement />
            </div>
            <div className="space-y-8">
              <VenueBooking />
              <EventAnalytics />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
