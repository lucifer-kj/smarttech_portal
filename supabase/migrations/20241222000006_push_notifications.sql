-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add last_used_at column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' 
    AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE push_subscriptions ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  job_updates BOOLEAN NOT NULL DEFAULT true,
  quote_approvals BOOLEAN NOT NULL DEFAULT true,
  technician_arrivals BOOLEAN NOT NULL DEFAULT true,
  job_completions BOOLEAN NOT NULL DEFAULT true,
  emergency_alerts BOOLEAN NOT NULL DEFAULT true,
  system_alerts BOOLEAN NOT NULL DEFAULT true,
  maintenance_reminders BOOLEAN NOT NULL DEFAULT true,
  feedback_responses BOOLEAN NOT NULL DEFAULT true,
  marketing BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to notification_preferences if they don't exist
DO $$ 
BEGIN
  -- Add timezone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_preferences' 
    AND column_name = 'timezone'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/New_York';
  END IF;
END $$;

-- Create notification_history table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  template_id TEXT,
  template_variables JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'clicked', 'dismissed'))
);

-- Add missing columns to notification_history if they don't exist
DO $$ 
BEGIN
  -- Add template_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_history' 
    AND column_name = 'template_id'
  ) THEN
    ALTER TABLE notification_history ADD COLUMN template_id TEXT;
  END IF;
  
  -- Add template_variables column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_history' 
    AND column_name = 'template_variables'
  ) THEN
    ALTER TABLE notification_history ADD COLUMN template_variables JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON push_subscriptions(enabled);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_used ON push_subscriptions(last_used_at);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_subscription_id ON notification_history(subscription_id);

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own push subscriptions
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own notification preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own notification history
CREATE POLICY "Users can view their own notification history" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification history" ON notification_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can see all push notification data
CREATE POLICY "Admins can view all push subscriptions" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all notification preferences" ON notification_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all notification history" ON notification_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert notification history" ON notification_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update notification history" ON notification_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create function to get user's active push subscriptions
CREATE OR REPLACE FUNCTION get_user_push_subscriptions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  p256dh_key TEXT,
  auth_key TEXT,
  user_agent TEXT,
  device_info JSONB,
  enabled BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.endpoint,
    ps.p256dh_key,
    ps.auth_key,
    ps.user_agent,
    ps.device_info,
    ps.enabled,
    ps.created_at,
    ps.last_used_at
  FROM push_subscriptions ps
  WHERE ps.user_id = p_user_id 
    AND ps.enabled = true
  ORDER BY ps.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log notification delivery
CREATE OR REPLACE FUNCTION log_notification_delivery(
  p_user_id UUID,
  p_subscription_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_template_id TEXT DEFAULT NULL,
  p_template_variables JSONB DEFAULT '{}',
  p_status TEXT DEFAULT 'sent'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notification_history (
    user_id,
    subscription_id,
    notification_type,
    title,
    body,
    template_id,
    template_variables,
    status
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_notification_type,
    p_title,
    p_body,
    p_template_id,
    p_template_variables,
    p_status
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update notification status
CREATE OR REPLACE FUNCTION update_notification_status(
  p_notification_id UUID,
  p_status TEXT,
  p_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  UPDATE notification_history 
  SET 
    status = p_status,
    delivered_at = CASE WHEN p_status = 'delivered' THEN p_timestamp ELSE delivered_at END,
    clicked_at = CASE WHEN p_status = 'clicked' THEN p_timestamp ELSE clicked_at END,
    dismissed_at = CASE WHEN p_status = 'dismissed' THEN p_timestamp ELSE dismissed_at END,
    error_message = CASE WHEN p_status = 'failed' THEN p_status ELSE error_message END
  WHERE id = p_notification_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get notification analytics
CREATE OR REPLACE FUNCTION get_notification_analytics(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  notification_type TEXT,
  total_sent BIGINT,
  total_delivered BIGINT,
  total_clicked BIGINT,
  total_dismissed BIGINT,
  total_failed BIGINT,
  delivery_rate NUMERIC,
  click_rate NUMERIC,
  dismissal_rate NUMERIC,
  failure_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nh.notification_type,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN nh.status = 'delivered' THEN 1 END) as total_delivered,
    COUNT(CASE WHEN nh.status = 'clicked' THEN 1 END) as total_clicked,
    COUNT(CASE WHEN nh.status = 'dismissed' THEN 1 END) as total_dismissed,
    COUNT(CASE WHEN nh.status = 'failed' THEN 1 END) as total_failed,
    ROUND(
      (COUNT(CASE WHEN nh.status = 'delivered' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as delivery_rate,
    ROUND(
      (COUNT(CASE WHEN nh.status = 'clicked' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as click_rate,
    ROUND(
      (COUNT(CASE WHEN nh.status = 'dismissed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as dismissal_rate,
    ROUND(
      (COUNT(CASE WHEN nh.status = 'failed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as failure_rate
  FROM notification_history nh
  WHERE nh.sent_at BETWEEN p_start_date AND p_end_date
  GROUP BY nh.notification_type
  ORDER BY total_sent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;