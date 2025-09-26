"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

export function DashboardHeader() {
  const router = useRouter()

  const handleViewCalendar = () => {
    // Scroll to calendar section on the same page
    const calendarElement = document.querySelector('[data-calendar-section]')
    if (calendarElement) {
      calendarElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your events.</p>
      </div>
      <div className="flex gap-3">
        <NotificationsDropdown />
        <Button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleViewCalendar}
        >
          <Calendar className="w-4 h-4" />
          View Calendar
        </Button>
      </div>
    </div>
  )
}
