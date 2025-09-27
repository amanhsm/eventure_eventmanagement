"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutProps {
  eventId: number
  eventTitle: string
  registrationFee: number
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function StripeCheckout({
  eventId,
  eventTitle,
  registrationFee,
  onSuccess,
  onError
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const handleCheckout = async () => {
    if (!user) {
      onError?.("Please log in to register for events")
      return
    }

    if (registrationFee === 0) {
      // Free event - register directly without Stripe
      await handleFreeRegistration()
      return
    }

    setIsLoading(true)

    try {
      const stripe = await stripePromise

      if (!stripe) {
        throw new Error("Stripe failed to initialize")
      }

      // Call Next.js API route to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          eventId,
          eventTitle,
          amount: registrationFee * 100, // Convert to cents/paise
          currency: 'inr',
          userId: user.id,
          userEmail: `${user.usernumber || user.id}@student.example.com`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error creating checkout session:', data.error)
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (!data?.sessionId) {
        throw new Error('No session ID received from server')
      }

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

    } catch (error: any) {
      console.error('Checkout error:', error)
      onError?.(error.message || 'Payment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFreeRegistration = async () => {
    setIsLoading(true)

    try {
      // Register for free event directly
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          student_id: user!.id,
          status: 'registered',
          payment_status: 'paid', // Free events are considered "paid"
          payment_amount: 0
        })

      if (error) {
        throw new Error(error.message)
      }

      onSuccess?.()
    } catch (error: any) {
      console.error('Free registration error:', error)
      onError?.(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full bg-[#799EFF] hover:bg-[#6B8EFF] text-white"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {registrationFee > 0 
            ? `Pay ₹${registrationFee} & Register` 
            : 'Register (Free)'
          }
        </>
      )}
    </Button>
  )
}
