"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "admin":
          router.push("/dashboard/admin")
          break
        case "organizer":
          router.push("/dashboard/organizer")
          break
        case "student":
        default:
          router.push("/dashboard/student")
          break
      }
    }
  }, [user, router])

  return (
    <ProtectedRoute allowedRoles={["student", "organizer", "admin"]}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
