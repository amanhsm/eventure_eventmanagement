import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutRequest {
  eventId: number
  eventTitle: string
  amount: number // in paise (₹1 = 100 paise)
  currency: string
  userId: string
  userEmail: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Set the auth token for this request
    supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: '',
    })

    const { eventId, eventTitle, amount, currency, userId, userEmail }: CheckoutRequest = await req.json()

    // Validate the request
    if (!eventId || !eventTitle || !amount || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is already registered for this event
    const { data: existingRegistration } = await supabaseClient
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', userId)
      .single()

    if (existingRegistration) {
      return new Response(
        JSON.stringify({ error: 'Already registered for this event' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check event capacity
    const { data: event } = await supabaseClient
      .from('events')
      .select('max_participants, current_participants')
      .eq('id', eventId)
      .single()

    if (event && event.current_participants >= event.max_participants) {
      return new Response(
        JSON.stringify({ error: 'Event is full' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Stripe checkout session
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured')
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'mode': 'payment',
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][product_data][name]': `Event Registration: ${eventTitle}`,
        'line_items[0][price_data][unit_amount]': amount.toString(),
        'line_items[0][quantity]': '1',
        'success_url': `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}&event_id=${eventId}`,
        'cancel_url': `${req.headers.get('origin')}/events/${eventId}?payment=cancelled`,
        'customer_email': userEmail,
        'metadata[event_id]': eventId.toString(),
        'metadata[user_id]': userId,
        'metadata[event_title]': eventTitle,
      }).toString()
    })

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text()
      console.error('Stripe API error:', errorText)
      throw new Error(`Stripe API error: ${stripeResponse.status}`)
    }

    const session = await stripeResponse.json()

    // Store the pending payment in your database
    await supabaseClient
      .from('payment_sessions')
      .insert({
        session_id: session.id,
        event_id: eventId,
        user_id: userId,
        amount: amount,
        currency: currency,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
