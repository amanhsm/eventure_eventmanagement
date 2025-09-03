"use client"

import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminHeader() {
  const router = useRouter()

  const handleReportsClick = () => {
    console.log("[v0] Navigating to reports")
    router.push("/dashboard/admin/reports")
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage events, approvals, and system reports</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={handleReportsClick}>
          <BarChart3 className="w-4 h-4" />
          Reports
        </Button>
      </div>
    </div>
  )
}
