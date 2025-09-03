import { VenueCard } from "@/components/venues/venue-card"

export function VenueGrid() {
  const venues = [
    {
      id: 1,
      name: "Main Auditorium",
      capacity: 500,
      hourlyRate: 2500,
      facilities: ["Projector", "Sound System", "AC", "Stage Lighting", "Green Room"],
      availability: "available",
      nextAvailable: "Today",
      image: "/university-auditorium-interior.png",
      description: "Our largest venue perfect for conferences, cultural events, and major presentations.",
      bookings: 15,
    },
    {
      id: 2,
      name: "Computer Science Lab A",
      capacity: 50,
      hourlyRate: 800,
      facilities: ["Computers", "Projector", "Whiteboard", "AC", "High-Speed Internet"],
      availability: "booked",
      nextAvailable: "Mar 16",
      image: "/computer-lab-with-modern-workstations.png",
      description: "Modern computer lab equipped with latest technology for technical workshops.",
      bookings: 8,
    },
    {
      id: 3,
      name: "Central Lawn",
      capacity: 1000,
      hourlyRate: 1500,
      facilities: ["Open Space", "Stage Setup", "Power Supply", "Parking"],
      availability: "available",
      nextAvailable: "Today",
      image: "/university-lawn-with-stage-setup.png",
      description: "Large outdoor space ideal for festivals, sports events, and large gatherings.",
      bookings: 5,
    },
    {
      id: 4,
      name: "Sports Complex",
      capacity: 200,
      hourlyRate: 1200,
      facilities: ["Changing Rooms", "Equipment Storage", "Scoreboard", "Seating"],
      availability: "maintenance",
      nextAvailable: "Mar 25",
      image: "/indoor-sports-complex-basketball-court.png",
      description: "Indoor sports facility with professional equipment for tournaments and competitions.",
      bookings: 12,
    },
    {
      id: 5,
      name: "Conference Hall B",
      capacity: 150,
      hourlyRate: 1800,
      facilities: ["Video Conferencing", "Projector", "AC", "Catering Setup"],
      availability: "available",
      nextAvailable: "Today",
      image: "/modern-conference-room-with-presentation-setup.png",
      description: "Professional conference space perfect for seminars and business meetings.",
      bookings: 6,
    },
    {
      id: 6,
      name: "Art Studio",
      capacity: 25,
      hourlyRate: 600,
      facilities: ["Art Supplies", "Natural Light", "Storage", "Sink"],
      availability: "available",
      nextAvailable: "Today",
      image: "/art-studio-with-easels-and-natural-lighting.png",
      description: "Creative space with excellent lighting for workshops and artistic activities.",
      bookings: 3,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">{venues.length} venues available</p>
        <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
          <option>Sort: Availability</option>
          <option>Sort: Capacity</option>
          <option>Sort: Price</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </div>
  )
}
