import { Navigation } from "@/components/navigation"
import { VenueGrid } from "@/components/venues/venue-grid"
import { VenueFilters } from "@/components/venues/venue-filters"

export default function VenuesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Venue Booking</h1>
          <p className="text-gray-600 mt-1">Browse and book venues for your events</p>
        </div>
        <div className="flex gap-8">
          <aside className="w-80 flex-shrink-0">
            <VenueFilters />
          </aside>
          <div className="flex-1">
            <VenueGrid />
          </div>
        </div>
      </main>
    </div>
  )
}
