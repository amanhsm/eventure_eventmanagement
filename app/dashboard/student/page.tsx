import { Navigation } from "@/components/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StudentStats } from "@/components/dashboard/student-stats"
import { RegisteredEvents } from "@/components/dashboard/registered-events"
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule"
import { ApplicationStatus } from "@/components/dashboard/application-status"
import { EventCalendar } from "@/components/dashboard/event-calendar"

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <DashboardHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <StudentStats />
            <RegisteredEvents />
            <EventCalendar userRole="student" showUserEventsOnly={true} />
          </div>
          <div className="space-y-8">
            <UpcomingSchedule />
            <ApplicationStatus />
          </div>
        </div>
      </main>
    </div>
  )
}
