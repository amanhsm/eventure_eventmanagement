import { Navigation } from "@/components/navigation"
import { CreateEventForm } from "@/components/dashboard/organizer/create-event-form"

export default function CreateEventPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="text-gray-600 mt-1">Fill in the details to create and submit your event for approval</p>
          </div>
          <CreateEventForm />
        </div>
      </main>
    </div>
  )
}
