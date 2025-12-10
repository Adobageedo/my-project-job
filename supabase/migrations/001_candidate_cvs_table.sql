-- =====================================================
-- Migration 001: Create candidate_cvs table
-- Allows candidates to have up to 5 CVs
-- =====================================================

-- Create candidate_cvs table
CREATE TABLE candidate_cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL, -- Display name for the CV
  filename VARCHAR(255) NOT NULL, -- Original filename
  storage_path VARCHAR(500) NOT NULL, -- Path in Supabase Storage
  url VARCHAR(500) NOT NULL, -- Public or signed URL
  
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  file_size INTEGER, -- Size in bytes
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  
  -- Parsing
  parsed BOOLEAN DEFAULT false,
  parsed_data JSONB, -- Extracted data from CV parsing
  parsed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_candidate_cvs_user_id ON candidate_cvs(user_id);
CREATE INDEX idx_candidate_cvs_is_default ON candidate_cvs(user_id, is_default) WHERE is_default = true;

-- Ensure only one default CV per user
CREATE UNIQUE INDEX idx_candidate_cvs_unique_default 
ON candidate_cvs(user_id) 
WHERE is_default = true;

-- Trigger to limit CVs to 5 per candidate
CREATE OR REPLACE FUNCTION check_cv_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM candidate_cvs WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Un candidat ne peut pas avoir plus de 5 CV';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_cv_limit
BEFORE INSERT ON candidate_cvs
FOR EACH ROW
EXECUTE FUNCTION check_cv_limit();

-- Trigger to update updated_at
CREATE TRIGGER update_candidate_cvs_updated_at
BEFORE UPDATE ON candidate_cvs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS Policies for candidate_cvs
-- =====================================================

ALTER TABLE candidate_cvs ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own CVs
CREATE POLICY "Candidates can view own CVs"
ON candidate_cvs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Candidates can insert their own CVs
CREATE POLICY "Candidates can insert own CVs"
ON candidate_cvs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Candidates can update their own CVs
CREATE POLICY "Candidates can update own CVs"
ON candidate_cvs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Candidates can delete their own CVs
CREATE POLICY "Candidates can delete own CVs"
ON candidate_cvs
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Companies can view CVs of candidates who applied to their offers
CREATE POLICY "Companies can view applicant CVs"
ON candidate_cvs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN job_offers jo ON a.job_offer_id = jo.id
    JOIN users u ON u.company_id = jo.company_id
    WHERE a.candidate_id = candidate_cvs.user_id
    AND u.id = auth.uid()
  )
);

-- Admins can view all CVs
CREATE POLICY "Admins can view all CVs"
ON candidate_cvs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- Migrate existing CV data from users table
-- =====================================================

INSERT INTO candidate_cvs (user_id, name, filename, storage_path, url, is_default, parsed, parsed_data, created_at)
SELECT 
  id,
  COALESCE(cv_filename, 'CV'),
  COALESCE(cv_filename, 'cv.pdf'),
  COALESCE(cv_url, ''),
  COALESCE(cv_url, ''),
  true,
  COALESCE(cv_parsed, false),
  cv_parsed_data,
  COALESCE(cv_uploaded_at, NOW())
FROM users
WHERE cv_url IS NOT NULL AND role = 'candidate';

-- =====================================================
-- Storage policies for cvs bucket
-- =====================================================

-- Note: Run these separately in Supabase dashboard if storage policies
-- are not managed via migrations

-- INSERT policy for authenticated users
-- CREATE POLICY "Allow authenticated uploads to cvs"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'cvs');

-- SELECT policy for authenticated users  
-- CREATE POLICY "Allow authenticated read cvs"
-- ON storage.objects
-- FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'cvs');

-- DELETE policy for own files
-- CREATE POLICY "Allow authenticated delete own cvs"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'cvs' AND owner = auth.uid());
-- Allow authenticated users to upload to 'cvs' bucket
create policy "Allow authenticated uploads to cvs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'cvs');

-- Allow authenticated users to read objects in 'cvs'
create policy "Allow authenticated read cvs"
on storage.objects
for select
to authenticated
using (bucket_id = 'cvs');

-- (Optional) allow updates/deletes of own objects
create policy "Allow authenticated update own cvs"
on storage.objects
for update
to authenticated
using (bucket_id = 'cvs' and owner = auth.uid())
with check (bucket_id = 'cvs' and owner = auth.uid());

create policy "Allow authenticated delete own cvs"
on storage.objects
for delete
to authenticated
using (bucket_id = 'cvs' and owner = auth.uid());