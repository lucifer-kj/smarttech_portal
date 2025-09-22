-- Create audit logging function
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    p_metadata
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync ServiceM8 client data
CREATE OR REPLACE FUNCTION sync_sm8_client(
  p_uuid UUID,
  p_name TEXT,
  p_address TEXT DEFAULT NULL,
  p_contact_info JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  client_id UUID;
BEGIN
  INSERT INTO clients (uuid, name, address, contact_info)
  VALUES (p_uuid, p_name, p_address, p_contact_info)
  ON CONFLICT (uuid) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    contact_info = EXCLUDED.contact_info,
    updated_at = NOW()
  RETURNING id INTO client_id;
  
  RETURN client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync ServiceM8 job data
CREATE OR REPLACE FUNCTION sync_sm8_job(
  p_uuid UUID,
  p_company_uuid UUID,
  p_status TEXT,
  p_description TEXT DEFAULT NULL,
  p_scheduled_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_quote_sent BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  INSERT INTO jobs (
    uuid, 
    company_uuid, 
    status, 
    description, 
    scheduled_date, 
    address, 
    quote_sent
  )
  VALUES (
    p_uuid, 
    p_company_uuid, 
    p_status, 
    p_description, 
    p_scheduled_date, 
    p_address, 
    p_quote_sent
  )
  ON CONFLICT (uuid) 
  DO UPDATE SET 
    status = EXCLUDED.status,
    description = EXCLUDED.description,
    scheduled_date = EXCLUDED.scheduled_date,
    address = EXCLUDED.address,
    quote_sent = EXCLUDED.quote_sent,
    updated_at = NOW()
  RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process quote approval
CREATE OR REPLACE FUNCTION approve_quote(
  p_quote_id UUID,
  p_approved BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  quote_exists BOOLEAN;
  job_uuid UUID;
BEGIN
  -- Check if quote exists and user has access
  SELECT EXISTS(
    SELECT 1 FROM quotes q
    JOIN jobs j ON q.job_id = j.id
    JOIN users u ON j.company_uuid = u.sm8_uuid
    WHERE q.id = p_quote_id 
    AND u.id = auth.uid()
    AND u.sm8_uuid IS NOT NULL
  ) INTO quote_exists;
  
  IF NOT quote_exists THEN
    RETURN false;
  END IF;
  
  -- Update quote status
  IF p_approved THEN
    UPDATE quotes 
    SET 
      status = 'approved',
      approved_at = NOW(),
      rejected_at = NULL,
      updated_at = NOW()
    WHERE id = p_quote_id;
  ELSE
    UPDATE quotes 
    SET 
      status = 'rejected',
      rejected_at = NOW(),
      approved_at = NULL,
      updated_at = NOW()
    WHERE id = p_quote_id;
  END IF;
  
  -- Log the action
  PERFORM log_audit_event(
    CASE WHEN p_approved THEN 'quote_approved' ELSE 'quote_rejected' END,
    'quote',
    p_quote_id::TEXT,
    jsonb_build_object('reason', p_reason)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to submit feedback
CREATE OR REPLACE FUNCTION submit_feedback(
  p_job_id UUID,
  p_rating INTEGER,
  p_comment TEXT,
  p_private_feedback BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  feedback_id UUID;
  job_access BOOLEAN;
BEGIN
  -- Check if user has access to this job
  SELECT EXISTS(
    SELECT 1 FROM jobs j
    JOIN users u ON j.company_uuid = u.sm8_uuid
    WHERE j.id = p_job_id 
    AND u.id = auth.uid()
    AND u.sm8_uuid IS NOT NULL
  ) INTO job_access;
  
  IF NOT job_access THEN
    RAISE EXCEPTION 'Access denied to job';
  END IF;
  
  -- Insert feedback
  INSERT INTO feedback (
    job_id,
    rating,
    comment,
    private_feedback,
    google_review_requested
  ) VALUES (
    p_job_id,
    p_rating,
    p_comment,
    p_private_feedback,
    CASE WHEN p_rating >= 4 AND NOT p_private_feedback THEN true ELSE false END
  ) RETURNING id INTO feedback_id;
  
  -- Log the action
  PERFORM log_audit_event(
    'feedback_submitted',
    'feedback',
    feedback_id::TEXT,
    jsonb_build_object(
      'rating', p_rating,
      'private_feedback', p_private_feedback,
      'job_id', p_job_id
    )
  );
  
  RETURN feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's jobs with pagination
CREATE OR REPLACE FUNCTION get_user_jobs(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  uuid UUID,
  status TEXT,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  address TEXT,
  quote_sent BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.uuid,
    j.status,
    j.description,
    j.scheduled_date,
    j.address,
    j.quote_sent,
    j.created_at,
    j.updated_at
  FROM jobs j
  JOIN users u ON j.company_uuid = u.sm8_uuid
  WHERE u.id = auth.uid()
    AND u.sm8_uuid IS NOT NULL
    AND (p_status IS NULL OR j.status = p_status)
  ORDER BY j.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's quotes with pagination
CREATE OR REPLACE FUNCTION get_user_quotes(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  amount DECIMAL(10,2),
  items JSONB,
  status TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.job_id,
    q.amount,
    q.items,
    q.status,
    q.approved_at,
    q.rejected_at,
    q.created_at,
    q.updated_at
  FROM quotes q
  JOIN jobs j ON q.job_id = j.id
  JOIN users u ON j.company_uuid = u.sm8_uuid
  WHERE u.id = auth.uid()
    AND u.sm8_uuid IS NOT NULL
    AND (p_status IS NULL OR q.status = p_status)
  ORDER BY q.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
