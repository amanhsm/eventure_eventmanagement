import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, Sarah! Here's what's happening with your events.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Calendar className="w-4 h-4" />
          View Calendar
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Find Events
        </Button>
      </div>
    </div>
  )
}
