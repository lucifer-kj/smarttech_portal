-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (except role and is_banned)
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Admins can insert new users
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Clients table policies
-- Users can only see clients linked to their sm8_uuid
CREATE POLICY "Users can view own client" ON clients
  FOR SELECT USING (
    uuid IN (
      SELECT sm8_uuid FROM users 
      WHERE id = auth.uid() 
      AND sm8_uuid IS NOT NULL
    )
  );

-- Admins can see all clients
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Admins can manage all clients
CREATE POLICY "Admins can manage clients" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Jobs table policies
-- Users can only see jobs for their client
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (
    company_uuid IN (
      SELECT sm8_uuid FROM users 
      WHERE id = auth.uid() 
      AND sm8_uuid IS NOT NULL
    )
  );

-- Admins can see all jobs
CREATE POLICY "Admins can view all jobs" ON jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Admins can manage all jobs
CREATE POLICY "Admins can manage jobs" ON jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Quotes table policies
-- Users can only see quotes for their jobs
CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN users u ON j.company_uuid = u.sm8_uuid
      WHERE u.id = auth.uid() 
      AND u.sm8_uuid IS NOT NULL
    )
  );

-- Users can update quotes for their jobs (approve/reject)
CREATE POLICY "Users can update own quotes" ON quotes
  FOR UPDATE USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN users u ON j.company_uuid = u.sm8_uuid
      WHERE u.id = auth.uid() 
      AND u.sm8_uuid IS NOT NULL
    )
  );

-- Admins can see all quotes
CREATE POLICY "Admins can view all quotes" ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Admins can manage all quotes
CREATE POLICY "Admins can manage quotes" ON quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Feedback table policies
-- Users can only see feedback for their jobs
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN users u ON j.company_uuid = u.sm8_uuid
      WHERE u.id = auth.uid() 
      AND u.sm8_uuid IS NOT NULL
    )
  );

-- Users can insert feedback for their jobs
CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN users u ON j.company_uuid = u.sm8_uuid
      WHERE u.id = auth.uid() 
      AND u.sm8_uuid IS NOT NULL
    )
  );

-- Admins can see all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Admins can manage all feedback
CREATE POLICY "Admins can manage feedback" ON feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Audit logs policies
-- Admins can see all audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- System can insert audit logs (for API routes)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Webhook events policies
-- Admins can see all webhook events
CREATE POLICY "Admins can view webhook events" ON webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- System can manage webhook events (for API routes)
CREATE POLICY "System can manage webhook events" ON webhook_events
  FOR ALL WITH CHECK (true);

-- Push subscriptions policies
-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Admins can see all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON push_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_banned = false
    )
  );

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_banned = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND is_banned = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
