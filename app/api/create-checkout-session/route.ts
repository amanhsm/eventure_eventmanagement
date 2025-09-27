import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { eventId, eventTitle, amount, currency, userId, userEmail } = await request.json()

    // Validate required fields
    if (!eventId || !eventTitle || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for server operations
    const supabase = await createClient()

    // For now, we'll trust the client-side authentication
    // In production, you'd want stronger server-side validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify the user exists in our database
    const { data: userExists, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userCheckError || !userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already registered for this event
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', userId)
      .single()

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      )
    }

    // Check event capacity
    const { data: event } = await supabase
      .from('events')
      .select('max_participants, current_participants, title')
      .eq('id', eventId)
      .single()

    if (event && event.current_participants >= event.max_participants) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency || 'inr',
            product_data: {
              name: `Event Registration: ${eventTitle}`,
            },
            unit_amount: amount, // Amount in paise
          },
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}&event_id=${eventId}`,
      cancel_url: `${request.headers.get('origin')}/events/${eventId}?payment=cancelled`,
      // Only set customer_email if it's a valid email format
      ...(userEmail && userEmail.includes('@') ? { customer_email: userEmail } : {}),
      metadata: {
        event_id: eventId.toString(),
        user_id: userId,
        event_title: eventTitle,
      },
    })

    // Store the pending payment in database (optional - continue if it fails)
    try {
      const { error: insertError } = await supabase
        .from('payment_sessions')
        .insert({
          session_id: session.id,
          event_id: eventId,
          user_id: userId,
          amount: amount,
          currency: currency || 'inr',
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error storing payment session:', insertError)
        // Continue anyway, as the Stripe session is created
      }
    } catch (error) {
      console.error('Payment sessions table may not exist yet:', error)
      // Continue anyway - the Stripe session is still created
    }

    return NextResponse.json({ sessionId: session.id })

  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
