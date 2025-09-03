"use client"

import { Navigation } from "@/components/navigation"
import { AdminHeader } from "@/components/dashboard/admin/admin-header"
import { AdminStats } from "@/components/dashboard/admin/admin-stats"
import { EventApprovals } from "@/components/dashboard/admin/event-approvals"
import { VenueManagement } from "@/components/dashboard/admin/venue-management"
import { SystemOverview } from "@/components/dashboard/admin/system-overview"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <AdminHeader />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-8">
              <AdminStats />
              <EventApprovals />
            </div>
            <div className="space-y-8">
              <VenueManagement />
              <SystemOverview />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
