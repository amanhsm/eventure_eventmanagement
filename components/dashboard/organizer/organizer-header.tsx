"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export function OrganizerHeader() {
  const router = useRouter()

  const handleSettings = () => {
    console.log("[v0] Navigating to organizer settings")
    router.push("/dashboard/organizer/settings")
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your events, venues, and registrations</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 cursor-pointer" onClick={handleSettings}>
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </div>
  )
}
