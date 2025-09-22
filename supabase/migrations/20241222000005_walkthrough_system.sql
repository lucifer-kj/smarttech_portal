-- Create walkthrough_progress table
CREATE TABLE IF NOT EXISTS walkthrough_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  walkthrough_id TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  skipped BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  skipped_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create walkthrough_interactions table for analytics
CREATE TABLE IF NOT EXISTS walkthrough_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  walkthrough_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_user_id ON walkthrough_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_walkthrough_id ON walkthrough_progress(walkthrough_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_completed ON walkthrough_progress(completed);
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_skipped ON walkthrough_progress(skipped);
CREATE INDEX IF NOT EXISTS idx_walkthrough_progress_last_accessed ON walkthrough_progress(last_accessed_at);

CREATE INDEX IF NOT EXISTS idx_walkthrough_interactions_user_id ON walkthrough_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_interactions_walkthrough_id ON walkthrough_interactions(walkthrough_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_interactions_event_type ON walkthrough_interactions(event_type);
CREATE INDEX IF NOT EXISTS idx_walkthrough_interactions_timestamp ON walkthrough_interactions(timestamp);

-- Add updated_at trigger for walkthrough_progress table
DROP TRIGGER IF EXISTS update_walkthrough_progress_updated_at ON walkthrough_progress;
CREATE TRIGGER update_walkthrough_progress_updated_at BEFORE UPDATE ON walkthrough_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get user walkthrough recommendations
CREATE OR REPLACE FUNCTION get_user_walkthrough_recommendations(
  p_user_id UUID,
  p_role TEXT
)
RETURNS TABLE (
  walkthrough_id TEXT,
  priority INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_completed_walkthroughs TEXT[];
  v_skipped_walkthroughs TEXT[];
BEGIN
  -- Get completed walkthroughs
  SELECT ARRAY_AGG(walkthrough_id) INTO v_completed_walkthroughs
  FROM walkthrough_progress
  WHERE user_id = p_user_id AND completed = true;

  -- Get skipped walkthroughs
  SELECT ARRAY_AGG(walkthrough_id) INTO v_skipped_walkthroughs
  FROM walkthrough_progress
  WHERE user_id = p_user_id AND skipped = true;

  -- Return recommendations based on role and completion status
  IF p_role = 'client' THEN
    RETURN QUERY
    SELECT 
      'client-dashboard-intro'::TEXT as walkthrough_id,
      1 as priority,
      'Essential introduction to the client portal'::TEXT as reason
    WHERE NOT ('client-dashboard-intro' = ANY(v_completed_walkthroughs)) 
      AND NOT ('client-dashboard-intro' = ANY(v_skipped_walkthroughs))
    
    UNION ALL
    
    SELECT 
      'client-jobs-overview'::TEXT as walkthrough_id,
      2 as priority,
      'Learn how to manage your service jobs'::TEXT as reason
    WHERE 'client-dashboard-intro' = ANY(v_completed_walkthroughs)
      AND NOT ('client-jobs-overview' = ANY(v_completed_walkthroughs))
      AND NOT ('client-jobs-overview' = ANY(v_skipped_walkthroughs))
    
    UNION ALL
    
    SELECT 
      'client-quotes-workflow'::TEXT as walkthrough_id,
      3 as priority,
      'Understand the quote approval process'::TEXT as reason
    WHERE 'client-dashboard-intro' = ANY(v_completed_walkthroughs)
      AND NOT ('client-quotes-workflow' = ANY(v_completed_walkthroughs))
      AND NOT ('client-quotes-workflow' = ANY(v_skipped_walkthroughs));
      
  ELSIF p_role = 'admin' THEN
    RETURN QUERY
    SELECT 
      'admin-dashboard-intro'::TEXT as walkthrough_id,
      1 as priority,
      'Essential introduction to the admin portal'::TEXT as reason
    WHERE NOT ('admin-dashboard-intro' = ANY(v_completed_walkthroughs))
      AND NOT ('admin-dashboard-intro' = ANY(v_skipped_walkthroughs))
    
    UNION ALL
    
    SELECT 
      'admin-user-management'::TEXT as walkthrough_id,
      2 as priority,
      'Learn how to manage client accounts'::TEXT as reason
    WHERE 'admin-dashboard-intro' = ANY(v_completed_walkthroughs)
      AND NOT ('admin-user-management' = ANY(v_completed_walkthroughs))
      AND NOT ('admin-user-management' = ANY(v_skipped_walkthroughs))
    
    UNION ALL
    
    SELECT 
      'admin-system-monitoring'::TEXT as walkthrough_id,
      3 as priority,
      'Monitor system health and performance'::TEXT as reason
    WHERE 'admin-dashboard-intro' = ANY(v_completed_walkthroughs)
      AND NOT ('admin-system-monitoring' = ANY(v_completed_walkthroughs))
      AND NOT ('admin-system-monitoring' = ANY(v_skipped_walkthroughs));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get walkthrough analytics
CREATE OR REPLACE FUNCTION get_walkthrough_analytics(
  p_walkthrough_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  walkthrough_id TEXT,
  total_starts INTEGER,
  total_completions INTEGER,
  total_skips INTEGER,
  completion_rate NUMERIC,
  average_duration_minutes NUMERIC,
  common_drop_off_step INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wp.walkthrough_id,
    COUNT(*)::INTEGER as total_starts,
    COUNT(CASE WHEN wp.completed THEN 1 END)::INTEGER as total_completions,
    COUNT(CASE WHEN wp.skipped THEN 1 END)::INTEGER as total_skips,
    ROUND(
      (COUNT(CASE WHEN wp.completed THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as completion_rate,
    ROUND(
      AVG(
        CASE 
          WHEN wp.completed AND wp.completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (wp.completed_at - wp.started_at)) / 60
          ELSE NULL 
        END
      ), 
      2
    ) as average_duration_minutes,
    MODE() WITHIN GROUP (ORDER BY wp.current_step)::INTEGER as common_drop_off_step
  FROM walkthrough_progress wp
  WHERE (p_walkthrough_id IS NULL OR wp.walkthrough_id = p_walkthrough_id)
  GROUP BY wp.walkthrough_id
  ORDER BY total_starts DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for walkthrough tables
ALTER TABLE walkthrough_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkthrough_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own walkthrough progress
CREATE POLICY "Users can view their own walkthrough progress" ON walkthrough_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own walkthrough progress" ON walkthrough_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own walkthrough progress" ON walkthrough_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own walkthrough interactions
CREATE POLICY "Users can view their own walkthrough interactions" ON walkthrough_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own walkthrough interactions" ON walkthrough_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can see all walkthrough data
CREATE POLICY "Admins can view all walkthrough progress" ON walkthrough_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all walkthrough interactions" ON walkthrough_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
