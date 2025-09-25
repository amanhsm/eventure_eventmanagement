"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Shield, ArrowLeft, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface PaymentEvent {
  id: number
  title: string
  registration_fee: number
  event_date: string
  venues: {
    venue_name: string
    blocks?: { block_name: string } | null
  } | null
}

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<PaymentEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eventId = searchParams.get("event_id")
  const amount = searchParams.get("amount")

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("Event ID is required")
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()

        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(`
            id,
            title,
            registration_fee,
            event_date,
            venues (
              venue_name,
              blocks ( block_name )
            )
          `)
          .eq("id", eventId)
          .single()

        if (eventError) {
          throw new Error(`Failed to fetch event: ${eventError.message}`)
        }

        const unifiedVenue = Array.isArray(eventData.venues) ? eventData.venues[0] : eventData.venues
        const unifiedBlocks = unifiedVenue && Array.isArray((unifiedVenue as any).blocks)
          ? (unifiedVenue as any).blocks[0]
          : unifiedVenue?.blocks || null

        const transformedEvent = {
          ...eventData,
          venues: unifiedVenue ? { ...unifiedVenue, blocks: unifiedBlocks } : null,
        }

        setEvent(transformedEvent)
      } catch (error: any) {
        console.error("[PAYMENT] Error fetching event:", error)
        setError(error.message || "Failed to fetch event details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const handlePayment = async () => {
    if (!user || user.role !== "student" || !event) {
      setError("Invalid user or event")
      return
    }

    setIsProcessing(true)
    try {
      const supabase = createClient()

      // Get student profile
      const { data: studentProfile, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (studentError) {
        throw new Error("Student profile not found")
      }

      // Simulate payment processing (replace with actual payment gateway)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Register the student after successful payment
      const { error: registrationError } = await supabase
        .from("event_registrations")
        .insert({
          student_id: studentProfile.id,
          event_id: event.id,
          status: "registered",
          registration_date: new Date().toISOString(),
        })

      if (registrationError) {
        throw new Error(`Registration failed: ${registrationError.message}`)
      }

      setPaymentComplete(true)
    } catch (error: any) {
      console.error("[PAYMENT] Error:", error)
      setError(error.message || "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error || "Event not found"}</p>
              <Button onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (paymentComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                You have successfully registered for <strong>{event.title}</strong>
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push("/dashboard/student")} className="w-full">
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/events")} 
                  className="w-full"
                >
                  Browse More Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Event Details */}
              <div>
                <h3 className="font-semibold mb-2">Event Details</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-600">
                    {event.venues?.venue_name}
                    {event.venues?.blocks?.block_name ? `, ${event.venues.blocks.block_name}` : ""}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(event.event_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Payment Summary */}
              <div>
                <h3 className="font-semibold mb-2">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Registration Fee</span>
                    <span>₹{event.registration_fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee</span>
                    <span>₹0</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{event.registration_fee}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Method (Dummy) */}
              <div>
                <h3 className="font-semibold mb-2">Payment Method</h3>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Demo Payment</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    This is a demo payment portal. No actual payment will be processed.
                  </p>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 p-3 rounded-lg">
                <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Secure Payment</p>
                  <p className="text-xs text-green-600">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>

              {/* Payment Button */}
              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-[#799EFF] hover:bg-[#6B8EFF] text-white cursor-pointer"
              >
                {isProcessing ? "Processing Payment..." : `Pay ₹${event.registration_fee}`}
              </Button>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <p className="text-xs text-gray-500 text-center">
                By proceeding, you agree to the terms and conditions of event registration
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
