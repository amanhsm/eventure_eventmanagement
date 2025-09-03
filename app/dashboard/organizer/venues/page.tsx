"use client"

import { Navigation } from "@/components/navigation"
import { VenueBookingManagement } from "@/components/dashboard/organizer/venue-booking-management"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function OrganizerVenuesPage() {
  return (
    <ProtectedRoute allowedRoles={["organizer"]}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Venue Bookings</h1>
            <p className="text-gray-600 mt-1">Manage your venue reservations and requests</p>
          </div>
          <VenueBookingManagement />
        </main>
      </div>
    </ProtectedRoute>
  )
}
