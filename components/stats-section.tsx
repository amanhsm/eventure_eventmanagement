import { Calendar, Users, TrendingUp, Building } from "lucide-react"

export function StatsSection() {
  const stats = [
    {
      icon: Calendar,
      value: "50+",
      label: "Events This Month",
      color: "text-blue-600",
    },
    {
      icon: Users,
      value: "2000+",
      label: "Active Students",
      color: "text-yellow-600",
    },
    {
      icon: TrendingUp,
      value: "95%",
      label: "Satisfaction Rate",
      color: "text-green-600",
    },
    {
      icon: Building,
      value: "15",
      label: "Active Clubs",
      color: "text-blue-600",
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
