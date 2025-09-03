import { EventCard } from "@/components/event-card"
import { Button } from "@/components/ui/button"

export function FeaturedEvents() {
  const featuredEvents = [
    {
      id: 1,
      title: "AI & Machine Learning Workshop",
      organizer: "Tech Club",
      description:
        "Learn the fundamentals of AI and ML with hands-on coding sessions. Perfect for beginners and intermediate developers.",
      date: "Fri, Mar 15, 07:30 PM",
      location: "Computer Science Lab A",
      registered: 42,
      capacity: 50,
      deadline: "15/03/2024",
      category: "technical",
      status: "Few spots left!",
    },
    {
      id: 2,
      title: "Annual Cultural Fest - Expressions 2024",
      organizer: "Cultural Committee",
      description:
        "Join us for a spectacular evening of music, dance, drama, and art performances by talented students.",
      date: "Wed, Mar 20, 11:30 PM",
      location: "Main Auditorium",
      registered: 387,
      capacity: 500,
      deadline: "19/03/2024",
      category: "cultural",
      status: "Few spots left!",
    },
    {
      id: 3,
      title: "Inter-College Basketball Tournament",
      organizer: "Sports Committee",
      description:
        "Compete with the best teams from colleges across the city. Registration includes team organization and refreshments.",
      date: "Fri, Mar 22, 02:30 PM",
      location: "Sports Complex",
      registered: 14,
      capacity: 16,
      deadline: "21/03/2024",
      category: "sports",
      status: "Few spots left!",
    },
  ]

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Events</h2>
            <p className="text-gray-600">Don't miss these popular upcoming events</p>
          </div>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
            View All →
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}
