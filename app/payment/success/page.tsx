"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(true)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventDetails, setEventDetails] = useState<any>(null)

  const sessionId = searchParams.get('session_id')
  const eventId = searchParams.get('event_id')

  useEffect(() => {
    if (!sessionId || !eventId || !user) {
      setError("Invalid payment session")
      setIsProcessing(false)
      return
    }

    processPaymentSuccess()
  }, [sessionId, eventId, user])

  const processPaymentSuccess = async () => {
    try {
      const supabase = createClient()

      // Verify the payment session exists and is valid
      const { data: paymentSession, error: sessionError } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single()

      if (sessionError || !paymentSession) {
        throw new Error('Payment session not found or invalid')
      }

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          start_time,
          registration_fee,
          venues (venue_name)
        `)
        .eq('id', eventId)
        .single()

      if (eventError) {
        throw new Error('Event not found')
      }

      setEventDetails(event)

      // Check if registration already exists
      const { data: existingRegistration } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('student_id', user.id)
        .single()

      if (!existingRegistration) {
        // Create the registration record
        const { error: registrationError } = await supabase
          .from('event_registrations')
          .insert({
            event_id: parseInt(eventId),
            student_id: user.id,
            status: 'registered',
            payment_status: 'paid',
            payment_amount: paymentSession.amount / 100, // Convert from paise to rupees
            registration_date: new Date().toISOString()
          })

        if (registrationError) {
          throw new Error(`Registration failed: ${registrationError.message}`)
        }
      }

      // Update payment session status
      await supabase
        .from('payment_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      setRegistrationComplete(true)

    } catch (error: any) {
      console.error('Payment processing error:', error)
      setError(error.message || 'Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your registration...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push(`/events/${eventId}`)}
                className="w-full"
              >
                Back to Event
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">
              You have successfully registered for:
            </p>
            <p className="text-lg font-semibold text-green-900 mt-1">
              {eventDetails?.title}
            </p>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Event Date:</strong> {new Date(eventDetails?.event_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {eventDetails?.start_time}</p>
            <p><strong>Venue:</strong> {eventDetails?.venues?.venue_name || 'TBA'}</p>
            <p><strong>Amount Paid:</strong> ₹{eventDetails?.registration_fee}</p>
          </div>

          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => router.push(`/events/${eventId}`)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              View Event Details
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/student')}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            A confirmation email will be sent to your registered email address.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
