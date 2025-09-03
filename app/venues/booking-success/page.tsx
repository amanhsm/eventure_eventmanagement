import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Booking Request Submitted!</CardTitle>
              <p className="text-gray-600 mt-2">
                Your venue booking request has been successfully submitted and is now under review.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">What happens next?</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    <span>Admin team will review your request within 24 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    <span>You'll receive an email confirmation once approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    <span>Track your booking status in your dashboard</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Link href="/dashboard/organizer/venues" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">View My Bookings</Button>
                </Link>
                <Link href="/venues" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Book Another Venue
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
