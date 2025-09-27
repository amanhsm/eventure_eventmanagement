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
      <div className="relative h-48 w-full">
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
            <Badge className="bg-green-100 text-green-800">
              {event.status}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        <h3 className="font-bold text-xl mb-2 text-gray-900">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-2">by {event.organizer}</p>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{event.registered} / {event.capacity} registered</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Deadline: {event.deadline}</span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all" 
            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
          />
        </div>

        <Button 
          onClick={handleViewDetails}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}
