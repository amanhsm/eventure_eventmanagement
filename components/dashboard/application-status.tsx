import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function ApplicationStatus() {
  const applications = [
    {
      id: 1,
      eventTitle: "Leadership Summit 2024",
      appliedDate: "Mar 8, 2024",
      status: "approved",
      deadline: "Mar 15, 2024",
    },
    {
      id: 2,
      eventTitle: "Research Symposium",
      appliedDate: "Mar 10, 2024",
      status: "pending",
      deadline: "Mar 18, 2024",
    },
    {
      id: 3,
      eventTitle: "International Conference",
      appliedDate: "Mar 5, 2024",
      status: "rejected",
      deadline: "Mar 12, 2024",
    },
    {
      id: 4,
      eventTitle: "Startup Pitch Competition",
      appliedDate: "Mar 12, 2024",
      status: "under_review",
      deadline: "Mar 20, 2024",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "under_review":
        return <AlertCircle className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "under_review":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      case "pending":
        return "Pending"
      case "under_review":
        return "Under Review"
      default:
        return "Unknown"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Application Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{app.eventTitle}</h4>
                <div className="flex items-center gap-1">{getStatusIcon(app.status)}</div>
              </div>
              <div className="space-y-2">
                <Badge className={getStatusColor(app.status)} size="sm">
                  {getStatusText(app.status)}
                </Badge>
                <div className="text-xs text-gray-600">
                  <p>Applied: {app.appliedDate}</p>
                  <p>Deadline: {app.deadline}</p>
                </div>
              </div>
              {app.status === "approved" && (
                <Button size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                  View Event Details
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
