-- =============================================
-- CREATE PAYMENT SESSIONS TABLE
-- Run this in Supabase SQL Editor
-- =============================================

-- Create payment_sessions table to track Stripe checkout sessions
CREATE TABLE IF NOT EXISTS payment_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in paise (₹1 = 100 paise)
    currency VARCHAR(3) DEFAULT 'inr',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_sessions_session_id ON payment_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_event_id ON payment_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(status);

-- Add comments for documentation
COMMENT ON TABLE payment_sessions IS 'Tracks Stripe checkout sessions for event registrations';
COMMENT ON COLUMN payment_sessions.session_id IS 'Stripe checkout session ID';
COMMENT ON COLUMN payment_sessions.amount IS 'Payment amount in paise (₹1 = 100 paise)';
COMMENT ON COLUMN payment_sessions.status IS 'Payment session status: pending, completed, failed, cancelled';

-- Create RLS (Row Level Security) policies
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payment sessions
CREATE POLICY "Users can view own payment sessions" ON payment_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own payment sessions
CREATE POLICY "Users can create own payment sessions" ON payment_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all payment sessions
CREATE POLICY "Service role can manage payment sessions" ON payment_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON payment_sessions TO authenticated;
GRANT ALL ON payment_sessions TO service_role;

-- Success message
SELECT 'Payment sessions table created successfully!' as result;
