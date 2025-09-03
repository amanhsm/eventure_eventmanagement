import { Navigation } from "@/components/navigation"
import { SystemReports } from "@/components/dashboard/admin/system-reports"

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
          <p className="text-gray-600 mt-1">Analytics and insights for the EventNest platform</p>
        </div>
        <SystemReports />
      </main>
    </div>
  )
}
