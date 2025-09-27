"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface Event {
  id: number
  title: string
  organizer: string
  description: string
  date: string
  location: string
  registered: number
  capacity: number
  deadline: string
  category: string
  status?: string
  image_url?: string
}

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter()

  const handleViewDetails = () => {
    router.push(`/events/${event.id}`)
  }

  const getCategoryImage = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical':
        return '/computer-lab-with-modern-workstations.png'
      case 'cultural':
        return '/auditorium-stage-with-lighting.png'
      case 'sports':
        return '/outdoor-sports-complex.png'
      default:
        return '/auditorium-seating-area.png'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical':
        return 'bg-blue-100 text-blue-800'
      case 'cultural':
        return 'bg-purple-100 text-purple-800'
      case 'sports':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
      {/* Image Section */}
      <div className="relative h-40 w-full">
        <Image
          src={event.image_url || getCategoryImage(event.category)}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-4 left-4">
          <Badge className={`${getCategoryColor(event.category)} font-medium`}>
            {event.category}
          </Badge>
        </div>
        {event.status && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary/10 text-primary">
              {event.status}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2 text-foreground">{event.title}</h3>
        <p className="text-muted-foreground text-xs mb-2">by {event.organizer}</p>
        <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 text-primary" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3 text-primary" />
            <span>{event.registered} / {event.capacity} registered</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 text-primary" />
            <span>Deadline: {event.deadline}</span>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-1.5 mb-3">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all" 
            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
          />
        </div>

        <Button 
          onClick={handleViewDetails}
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
        >
          <Eye className="w-3 h-3 mr-1" />
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}
