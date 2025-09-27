"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatTimeWithoutSeconds } from "@/lib/utils/time-format"
import { Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface UpcomingEvent {
  id: number
  title: string
  start_time: string
  venue_name: string
  block_name?: string
  category_color: string
  initials: string
}

export function HeroSection() {
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const supabase = createClient()
        
        // Get today's date in local timezone
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        const localISO = `${yyyy}-${mm}-${dd}`

        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            start_time,
            venues (
              venue_name,
              blocks (
                block_name
              )
            ),
            event_categories (
              name,
              color_code
            )
          `)
          .eq('status', 'approved')
          .gte('event_date', localISO)
          .order('event_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(3)

        if (error) {
          console.error('Error fetching upcoming events:', error)
          return
        }

        // Transform the data
        const transformedEvents: UpcomingEvent[] = (data || []).map((event) => {
          const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues
          const block = venue && Array.isArray((venue as any).blocks) 
            ? (venue as any).blocks[0] 
            : venue?.blocks
          const category = Array.isArray(event.event_categories) 
            ? event.event_categories[0] 
            : event.event_categories
          
          // Generate initials from title
          const words = event.title.split(' ')
          const initials = words.length >= 2 
            ? words[0][0] + words[1][0] 
            : words[0].substring(0, 2)

          return {
            id: event.id,
            title: event.title,
            start_time: event.start_time,
            venue_name: venue?.venue_name || 'TBA',
            block_name: block?.block_name,
            category_color: category?.color_code || '#3B82F6',
            initials: initials.toUpperCase()
          }
        })

        setUpcomingEvents(transformedEvents)
      } catch (error) {
        console.error('Error fetching upcoming events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUpcomingEvents()
  }, [])

  return (
    <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-2xl opacity-100">
            <h1 className="text-5xl font-bold mb-4 text-balance">
              Discover Amazing <span className="text-accent">Campus Events</span>
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/80 leading-relaxed">
              Join exciting events, workshops, and activities happening across Christ University. Connect with your
              community and make lasting memories.
            </p>

            <div className="flex gap-4 mb-12">
              <Link href="/browse">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold transition-all duration-300 hover:scale-105 cursor-pointer group"
                >
                  Browse Events
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="w-96 ml-8">
            <Card className="bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/20 p-6 hover:bg-primary-foreground/15 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-4 text-primary-foreground/80">Upcoming Events</h3>
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-primary-foreground/20 rounded mb-2 animate-pulse"></div>
                          <div className="h-3 bg-primary-foreground/20 rounded w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className="flex items-center gap-3 hover:bg-primary-foreground/10 p-2 rounded-lg transition-all duration-200 cursor-pointer group">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: event.category_color }}
                        >
                          {event.initials}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-primary-foreground group-hover:text-accent transition-colors">
                            {event.title}
                          </h4>
                          <p className="text-sm text-primary-foreground/80">
                            {formatTimeWithoutSeconds(event.start_time)} • {event.venue_name}{event.block_name ? `, ${event.block_name}` : ''}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-primary-foreground/80 text-sm">No upcoming events found</p>
                  </div>
                )}
              </div>
              <Link href="/browse">
                <Button
                  variant="ghost"
                  className="w-full mt-4 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-all duration-200 cursor-pointer"
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
