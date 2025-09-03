import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const upcomingEvents = [
    {
      id: 1,
      title: "Tech Talk: AI in Education",
      time: "2:00 PM",
      location: "Auditorium A",
      initials: "TK",
      bgColor: "bg-blue-600",
    },
    {
      id: 2,
      title: "Cultural Club Meet",
      time: "4:00 PM",
      location: "Main Lawn",
      initials: "CC",
      bgColor: "bg-yellow-500",
    },
    {
      id: 3,
      title: "Web Dev Workshop",
      time: "6:00 PM",
      location: "Lab 203",
      initials: "WS",
      bgColor: "bg-green-600",
    },
  ]

  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-2xl opacity-100">
            <h1 className="text-5xl font-bold mb-4 text-balance">
              Discover Amazing <span className="text-yellow-400">Campus Events</span>
            </h1>
            <p className="text-xl mb-8 text-blue-100 leading-relaxed">
              Join exciting events, workshops, and activities happening across Christ University. Connect with your
              community and make lasting memories.
            </p>

            <div className="flex gap-4 mb-12">
              <Link href="/browse">
                <Button
                  size="lg"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-all duration-300 hover:scale-105 cursor-pointer group"
                >
                  Browse Events
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                Learn More
              </Button>
            </div>

            <div className="flex items-center gap-8 text-blue-100">
              <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                <Users className="w-5 h-5" />
                <span>2000+ Students</span>
              </div>
              <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                <Calendar className="w-5 h-5" />
                <span>50+ Events Monthly</span>
              </div>
              <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                <span>⭐</span>
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>

          <div className="w-96 ml-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-4 text-blue-200">Upcoming Today</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 hover:bg-white/10 p-2 rounded-lg transition-all duration-200 cursor-pointer group"
                  >
                    <div
                      className={`w-10 h-10 ${event.bgColor} rounded-lg flex items-center justify-center text-white font-semibold text-sm group-hover:scale-110 transition-transform`}
                    >
                      {event.initials}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white group-hover:text-yellow-300 transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-sm text-blue-200">
                        {event.time} • {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/browse">
                <Button
                  variant="ghost"
                  className="w-full mt-4 text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  View All Events
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
