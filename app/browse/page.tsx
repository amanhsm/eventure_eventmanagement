import { Navigation } from "@/components/navigation"
import { BrowseHeader } from "@/components/browse-header"
import { EventFilters } from "@/components/event-filters"
import { EventGrid } from "@/components/event-grid"
import { Footer } from "@/components/footer"

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <BrowseHeader />
        <div className="flex gap-8 mt-8">
          <aside className="w-80 flex-shrink-0">
            <EventFilters />
          </aside>
          <div className="flex-1">
            <EventGrid />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
