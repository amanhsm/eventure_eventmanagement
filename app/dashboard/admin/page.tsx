"use client"

import { Navigation } from "@/components/navigation"
import { AdminHeader } from "@/components/dashboard/admin/admin-header"
import { AdminStats } from "@/components/dashboard/admin/admin-stats"
import { EventApprovals } from "@/components/dashboard/admin/event-approvals-fixed"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <AdminHeader />
          <div className="space-y-8 mt-8">
            <AdminStats />
            <EventApprovals />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
