import { Navigation } from "@/components/navigation"
import { VenueDetails } from "@/components/venues/venue-details"
import { VenueBookingForm } from "@/components/venues/venue-booking-form"
import { VenueCalendar } from "@/components/venues/venue-calendar"

export default function VenueDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <VenueDetails venueId={params.id} />
            <VenueCalendar venueId={params.id} />
          </div>
          <div>
            <VenueBookingForm venueId={params.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
