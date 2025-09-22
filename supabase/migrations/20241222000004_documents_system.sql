-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('quote', 'invoice', 'warranty', 'certificate', 'photo', 'other')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  requires_signature BOOLEAN NOT NULL DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by TEXT, -- User who signed
  version INTEGER NOT NULL DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE CASCADE, -- For versioning
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_access_logs table for audit trail
CREATE TABLE IF NOT EXISTS document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'download', 'sign', 'delete')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_signatures table for digital signatures
CREATE TABLE IF NOT EXISTS document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL, -- Base64 encoded signature
  signature_type TEXT NOT NULL CHECK (signature_type IN ('electronic', 'digital')),
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_job_id ON documents(job_id);
CREATE INDEX IF NOT EXISTS idx_documents_quote_id ON documents(quote_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_requires_signature ON documents(requires_signature);
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_action ON document_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_created_at ON document_access_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_user_id ON document_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_signed_at ON document_signatures(signed_at);

-- Add updated_at trigger for documents table
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
  p_document_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO document_access_logs (document_id, user_id, action, ip_address, user_agent)
  VALUES (p_document_id, p_user_id, p_action, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user accessible documents
CREATE OR REPLACE FUNCTION get_user_documents(
  p_user_id UUID,
  p_job_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  quote_id UUID,
  title TEXT,
  description TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  category TEXT,
  is_public BOOLEAN,
  requires_signature BOOLEAN,
  signed_at TIMESTAMP WITH TIME ZONE,
  version INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.job_id,
    d.quote_id,
    d.title,
    d.description,
    d.file_name,
    d.file_size,
    d.mime_type,
    d.category,
    d.is_public,
    d.requires_signature,
    d.signed_at,
    d.version,
    d.created_at,
    d.updated_at
  FROM documents d
  WHERE 
    d.user_id = p_user_id
    AND (p_job_id IS NULL OR d.job_id = p_job_id)
    AND (p_category IS NULL OR d.category = p_category)
  ORDER BY d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create document version
CREATE OR REPLACE FUNCTION create_document_version(
  p_parent_document_id UUID,
  p_file_path TEXT,
  p_file_name TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_document_id UUID;
  v_parent_doc RECORD;
BEGIN
  -- Get parent document details
  SELECT * INTO v_parent_doc FROM documents WHERE id = p_parent_document_id;
  
  -- Create new version
  INSERT INTO documents (
    job_id,
    quote_id,
    user_id,
    title,
    description,
    file_path,
    file_name,
    file_size,
    mime_type,
    category,
    is_public,
    requires_signature,
    version,
    parent_document_id,
    metadata
  ) VALUES (
    v_parent_doc.job_id,
    v_parent_doc.quote_id,
    v_parent_doc.user_id,
    v_parent_doc.title,
    v_parent_doc.description,
    p_file_path,
    p_file_name,
    p_file_size,
    p_mime_type,
    v_parent_doc.category,
    v_parent_doc.is_public,
    v_parent_doc.requires_signature,
    v_parent_doc.version + 1,
    p_parent_document_id,
    v_parent_doc.metadata
  ) RETURNING id INTO v_new_document_id;
  
  RETURN v_new_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
