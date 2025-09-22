-- Create scheduled_notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB DEFAULT '{}',
  template_id TEXT,
  template_variables JSONB DEFAULT '{}',
  sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_type ON scheduled_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_created_at ON scheduled_notifications(created_at);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_scheduled_notifications_updated_at ON scheduled_notifications;
CREATE TRIGGER update_scheduled_notifications_updated_at BEFORE UPDATE ON scheduled_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scheduled notifications
CREATE POLICY "Users can view their own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled notifications" ON scheduled_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled notifications" ON scheduled_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled notifications" ON scheduled_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can see all scheduled notifications
CREATE POLICY "Admins can view all scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert scheduled notifications" ON scheduled_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update scheduled notifications" ON scheduled_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete scheduled notifications" ON scheduled_notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create function to get due notifications
CREATE OR REPLACE FUNCTION get_due_notifications()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  notification_type TEXT,
  title TEXT,
  body TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  data JSONB,
  template_id TEXT,
  template_variables JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sn.id,
    sn.user_id,
    sn.notification_type,
    sn.title,
    sn.body,
    sn.scheduled_for,
    sn.data,
    sn.template_id,
    sn.template_variables
  FROM scheduled_notifications sn
  WHERE sn.sent = false 
    AND sn.scheduled_for <= NOW()
  ORDER BY sn.scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  UPDATE scheduled_notifications 
  SET 
    sent = true,
    sent_at = NOW(),
    updated_at = NOW()
  WHERE id = p_notification_id 
    AND sent = false;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_scheduled_notifications(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  DELETE FROM scheduled_notifications 
  WHERE sent = true 
    AND sent_at < NOW() - INTERVAL '1 day' * p_days_old;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
