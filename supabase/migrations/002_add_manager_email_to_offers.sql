-- =====================================================
-- ADD MANAGER EMAIL TO JOB OFFERS
-- This field stores the hiring manager's email for internal use
-- It is NOT visible to candidates
-- =====================================================

ALTER TABLE job_offers 
ADD COLUMN IF NOT EXISTS manager_email VARCHAR(255);

-- Add comment to clarify the field's purpose
COMMENT ON COLUMN job_offers.manager_email IS 'Email du responsable hiérarchique - usage interne uniquement, non visible par les candidats';
