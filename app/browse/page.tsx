"use client"
import { Navigation } from "@/components/navigation"
import BrowseHeader from "@/components/browse-header"
import EventFilters from "@/components/event-filters"
import EventGrid from "@/components/event-grid"
import { Footer } from "@/components/footer"
import { useState } from "react"

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("upcoming")

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedQuickFilter("")
    setSortBy("upcoming")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <BrowseHeader />
        <div className="flex gap-8 mt-8">
          <aside className="w-80 flex-shrink-0">
            <EventFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedQuickFilter={selectedQuickFilter}
              onQuickFilterChange={setSelectedQuickFilter}
              onClearFilters={clearAllFilters}
            />
          </aside>
          <div className="flex-1">
            <EventGrid
              searchQuery={searchQuery}
              categoryFilter={selectedCategory}
              quickFilter={selectedQuickFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
