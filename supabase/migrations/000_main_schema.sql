-- =====================================================
-- JOBTEASER - MAIN DATABASE SCHEMA
-- Version: 1.0.0
-- Description: Unified schema for finance internship/alternance platform
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles: candidate, company, admin
CREATE TYPE user_role AS ENUM ('candidate', 'company', 'admin');

-- Company-specific roles (for company users only)
CREATE TYPE company_role AS ENUM ('company', 'rh', 'manager');

-- Education levels
CREATE TYPE education_level AS ENUM (
  'bac',
  'bac+1',
  'bac+2',
  'bac+3',
  'bac+4',
  'bac+5',
  'bac+6',
  'doctorat'
);

-- Contract types
CREATE TYPE contract_type AS ENUM ('stage', 'alternance', 'cdi', 'cdd');

-- Job offer status
CREATE TYPE offer_status AS ENUM ('draft', 'active', 'paused', 'expired', 'filled', 'cancelled');

-- Application status
CREATE TYPE application_status AS ENUM ('pending', 'in_progress', 'interview', 'rejected', 'accepted', 'withdrawn');

-- Company status
CREATE TYPE company_status AS ENUM ('pending', 'active', 'suspended', 'inactive');

-- GDPR request types
CREATE TYPE gdpr_request_type AS ENUM ('access', 'modification', 'deletion', 'export');

-- GDPR request status
CREATE TYPE gdpr_request_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

-- Audit action types
CREATE TYPE audit_action AS ENUM (
  'create', 'update', 'delete', 'login', 'logout',
  'password_change', 'role_change', 'suspension',
  'offer_publish', 'offer_close', 'application_submit',
  'application_status_change', 'data_export', 'sync_recruitcrm'
);

-- =====================================================
-- COMPANIES TABLE
-- =====================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  name VARCHAR(200) NOT NULL,
  siret VARCHAR(14) UNIQUE,
  
  -- Company info
  sector VARCHAR(100),
  size VARCHAR(50), -- e.g., '1-10', '11-50', '51-200', '201-500', '500+'
  description TEXT,
  website VARCHAR(255),
  logo_url VARCHAR(500),
  
  -- Primary contact
  contact_name VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_postal_code VARCHAR(10),
  address_country VARCHAR(100) DEFAULT 'France',
  
  -- Status & metadata
  status company_status DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- RecruitCRM sync
  recruitcrm_id VARCHAR(100),
  recruitcrm_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for companies
CREATE INDEX idx_companies_siret ON companies(siret);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_sector ON companies(sector);
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);

-- =====================================================
-- USERS TABLE (Unified: candidates, company users, admins)
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic identity
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  
  -- Role management
  role user_role NOT NULL,
  company_roles company_role[] DEFAULT '{}', -- Only for company users: can be {company, rh, manager}
  
  -- Company association (NULL for candidates and admins)
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  is_primary_company_contact BOOLEAN DEFAULT false,
  
  -- ===== CANDIDATE-SPECIFIC FIELDS =====
  -- Education
  institution VARCHAR(200),
  education_level education_level,
  specialization VARCHAR(200),
  graduation_year INTEGER,
  
  -- Alternance rhythm (if applicable)
  alternance_rhythm VARCHAR(100), -- e.g., "3 jours entreprise / 2 jours école"
  
  -- Availability
  available_from DATE,
  contract_types_sought contract_type[] DEFAULT '{}',
  
  -- Location preferences (multiple choices)
  target_locations TEXT[] DEFAULT '{}', -- e.g., ['Paris', 'Lyon', 'Remote']
  remote_preference VARCHAR(50), -- 'on-site', 'hybrid', 'remote', 'flexible'
  
  -- CV
  cv_url VARCHAR(500),
  cv_filename VARCHAR(255),
  cv_uploaded_at TIMESTAMP WITH TIME ZONE,
  cv_parsed BOOLEAN DEFAULT false,
  cv_parsed_data JSONB, -- Extracted data from CV parsing
  
  -- Professional info
  headline VARCHAR(255), -- Short professional tagline
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  languages JSONB DEFAULT '[]', -- [{language: 'French', level: 'native'}, ...]
  experiences JSONB DEFAULT '[]', -- Parsed work experiences
  education_history JSONB DEFAULT '[]', -- Parsed education
  certifications JSONB DEFAULT '[]',
  
  -- Social links
  linkedin_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  github_url VARCHAR(500),
  
  -- ===== PROFILE STATUS =====
  profile_completed BOOLEAN DEFAULT false,
  profile_completion_percentage INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  
  -- ===== ACCOUNT STATUS =====
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspension_reason TEXT,
  
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  
  -- ===== RECRUITCRM SYNC =====
  recruitcrm_id VARCHAR(100),
  recruitcrm_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- ===== TIMESTAMPS =====
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_available_from ON users(available_from) WHERE role = 'candidate';
CREATE INDEX idx_users_education_level ON users(education_level) WHERE role = 'candidate';
CREATE INDEX idx_users_specialization ON users(specialization) WHERE role = 'candidate';
CREATE INDEX idx_users_name_trgm ON users USING gin((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_users_skills ON users USING gin(skills) WHERE role = 'candidate';
CREATE INDEX idx_users_target_locations ON users USING gin(target_locations) WHERE role = 'candidate';

-- =====================================================
-- JOB OFFERS TABLE
-- =====================================================

CREATE TABLE job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Basic info
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(300) UNIQUE,
  
  -- Job description
  description TEXT,
  missions TEXT, -- Detailed missions
  objectives TEXT, -- Learning objectives
  
  -- Requirements
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  education_level education_level,
  min_education_level education_level,
  specializations_accepted TEXT[] DEFAULT '{}',
  
  -- Contract details
  contract_type contract_type NOT NULL,
  duration_months INTEGER,
  start_date DATE,
  start_date_flexible BOOLEAN DEFAULT false,
  
  -- Compensation
  remuneration_min DECIMAL(10, 2),
  remuneration_max DECIMAL(10, 2),
  remuneration_currency VARCHAR(3) DEFAULT 'EUR',
  remuneration_period VARCHAR(20) DEFAULT 'monthly', -- 'hourly', 'monthly', 'yearly'
  benefits TEXT[] DEFAULT '{}', -- e.g., ['Tickets restaurant', 'Transport', 'Télétravail']
  
  -- Location
  location_city VARCHAR(100),
  location_postal_code VARCHAR(10),
  location_country VARCHAR(100) DEFAULT 'France',
  remote_policy VARCHAR(50), -- 'on-site', 'hybrid', 'remote'
  remote_days_per_week INTEGER,
  
  -- Application requirements
  application_method VARCHAR(50) DEFAULT 'platform', -- 'platform', 'email', 'external'
  application_email VARCHAR(255),
  application_url VARCHAR(500),
  requires_cover_letter BOOLEAN DEFAULT false,
  custom_questions JSONB DEFAULT '[]',
  
  -- Status & visibility
  status offer_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  
  -- Dates
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  filled_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  
  -- Source (for parsed offers)
  source_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'pdf_parsed', 'api'
  source_file_url VARCHAR(500),
  parsed_data JSONB,
  
  -- RecruitCRM sync
  recruitcrm_id VARCHAR(100),
  recruitcrm_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for job_offers
CREATE INDEX idx_job_offers_company_id ON job_offers(company_id);
CREATE INDEX idx_job_offers_status ON job_offers(status);
CREATE INDEX idx_job_offers_contract_type ON job_offers(contract_type);
CREATE INDEX idx_job_offers_education_level ON job_offers(education_level);
CREATE INDEX idx_job_offers_location_city ON job_offers(location_city);
CREATE INDEX idx_job_offers_start_date ON job_offers(start_date);
CREATE INDEX idx_job_offers_published_at ON job_offers(published_at);
CREATE INDEX idx_job_offers_title_trgm ON job_offers USING gin(title gin_trgm_ops);
CREATE INDEX idx_job_offers_required_skills ON job_offers USING gin(required_skills);

-- =====================================================
-- APPLICATIONS TABLE
-- =====================================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Application content
  cover_letter TEXT,
  custom_answers JSONB DEFAULT '{}', -- Answers to custom questions
  cv_snapshot_url VARCHAR(500), -- Snapshot of CV at application time
  
  -- Status tracking
  status application_status DEFAULT 'pending',
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_updated_by UUID REFERENCES users(id),
  
  -- Interview scheduling
  interview_scheduled_at TIMESTAMP WITH TIME ZONE,
  interview_type VARCHAR(50), -- 'phone', 'video', 'in-person'
  interview_notes TEXT,
  
  -- Evaluation
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  internal_notes TEXT,
  rejection_reason TEXT,
  
  -- Kanban organization
  kanban_position INTEGER DEFAULT 0,
  
  -- Source tracking
  source VARCHAR(100) DEFAULT 'direct', -- 'direct', 'saved_search', 'recommendation'
  
  -- RecruitCRM sync
  recruitcrm_id VARCHAR(100),
  recruitcrm_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate applications
  UNIQUE(candidate_id, job_offer_id)
);

-- Indexes for applications
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_job_offer_id ON applications(job_offer_id);
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);

-- =====================================================
-- APPLICATION TAGS (for Kanban/shortlists)
-- =====================================================

CREATE TABLE application_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, name)
);

-- =====================================================
-- APPLICATION TAG ASSIGNMENTS
-- =====================================================

CREATE TABLE application_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES application_tags(id) ON DELETE CASCADE,
  
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(application_id, tag_id)
);

-- =====================================================
-- APPLICATION NOTES (for collaboration)
-- =====================================================

CREATE TABLE application_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false, -- Private to the author only
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_application_notes_application_id ON application_notes(application_id);

-- =====================================================
-- SAVED OFFERS (Bookmarks)
-- =====================================================

CREATE TABLE saved_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, job_offer_id)
);

CREATE INDEX idx_saved_offers_user_id ON saved_offers(user_id);

-- =====================================================
-- SAVED SEARCHES
-- =====================================================

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  filters JSONB NOT NULL, -- Search criteria
  
  -- Notifications
  notify_new_matches BOOLEAN DEFAULT false,
  notification_frequency VARCHAR(20) DEFAULT 'daily', -- 'instant', 'daily', 'weekly'
  last_notified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);

-- =====================================================
-- NOTIFICATION SETTINGS
-- =====================================================

CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Email notifications
  email_new_application BOOLEAN DEFAULT true,
  email_application_status BOOLEAN DEFAULT true,
  email_new_offers_matching BOOLEAN DEFAULT true,
  email_offer_expiring BOOLEAN DEFAULT true,
  email_newsletter BOOLEAN DEFAULT false,
  
  -- Notification frequency
  digest_frequency VARCHAR(20) DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role user_role,
  
  -- Action details
  action audit_action NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'user', 'company', 'job_offer', 'application'
  entity_id UUID,
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- GDPR REQUESTS
-- =====================================================

CREATE TABLE gdpr_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  
  request_type gdpr_request_type NOT NULL,
  status gdpr_request_status DEFAULT 'pending',
  
  -- Request details
  description TEXT,
  
  -- Processing
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_notes TEXT,
  
  -- Data export
  export_url VARCHAR(500),
  export_expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);

-- =====================================================
-- RECRUITCRM SYNC LOG
-- =====================================================

CREATE TABLE recruitcrm_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'entity'
  entity_type VARCHAR(50), -- 'company', 'candidate', 'job_offer', 'application'
  entity_id UUID,
  
  direction VARCHAR(10) NOT NULL, -- 'push', 'pull'
  status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
  
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  error_message TEXT,
  error_details JSONB,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_recruitcrm_sync_log_sync_type ON recruitcrm_sync_log(sync_type);
CREATE INDEX idx_recruitcrm_sync_log_status ON recruitcrm_sync_log(status);
CREATE INDEX idx_recruitcrm_sync_log_started_at ON recruitcrm_sync_log(started_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate URL-friendly slug
CREATE OR REPLACE FUNCTION generate_slug(title TEXT, table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM job_offers WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_record users)
RETURNS INTEGER AS $$
DECLARE
  completion INTEGER := 0;
  total_fields INTEGER := 0;
  filled_fields INTEGER := 0;
BEGIN
  IF user_record.role = 'candidate' THEN
    total_fields := 12;
    
    IF user_record.first_name IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.last_name IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.phone IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.institution IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.education_level IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.specialization IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.available_from IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(user_record.target_locations, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.cv_url IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.headline IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(user_record.skills, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF user_record.bio IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    
    completion := (filled_fields * 100) / total_fields;
  END IF;
  
  RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_offers_updated_at
  BEFORE UPDATE ON job_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_requests_updated_at
  BEFORE UPDATE ON gdpr_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_notes_updated_at
  BEFORE UPDATE ON application_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate slug for job offers
CREATE OR REPLACE FUNCTION generate_job_offer_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title, 'job_offers');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_offer_slug_trigger
  BEFORE INSERT ON job_offers
  FOR EACH ROW EXECUTE FUNCTION generate_job_offer_slug();

-- Update applications count on job_offers
CREATE OR REPLACE FUNCTION update_job_offer_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE job_offers SET applications_count = applications_count + 1 WHERE id = NEW.job_offer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE job_offers SET applications_count = applications_count - 1 WHERE id = OLD.job_offer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_count_trigger
  AFTER INSERT OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_job_offer_applications_count();

-- =====================================================
-- VIEWS
-- =====================================================

-- Candidates view (for easier querying)
CREATE VIEW candidates_view AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.phone,
  u.avatar_url,
  u.institution,
  u.education_level,
  u.specialization,
  u.graduation_year,
  u.alternance_rhythm,
  u.available_from,
  u.contract_types_sought,
  u.target_locations,
  u.remote_preference,
  u.cv_url,
  u.cv_filename,
  u.headline,
  u.bio,
  u.skills,
  u.languages,
  u.experiences,
  u.linkedin_url,
  u.portfolio_url,
  u.profile_completed,
  u.profile_completion_percentage,
  u.is_active,
  u.created_at,
  u.updated_at,
  (SELECT COUNT(*) FROM applications WHERE candidate_id = u.id) as applications_count
FROM users u
WHERE u.role = 'candidate';

-- Company users view
CREATE VIEW company_users_view AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.phone,
  u.avatar_url,
  u.company_id,
  u.company_roles,
  u.is_primary_company_contact,
  u.is_active,
  u.created_at,
  c.name as company_name,
  c.sector as company_sector,
  c.status as company_status
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.role = 'company';

-- Active job offers view
CREATE VIEW active_job_offers_view AS
SELECT 
  jo.*,
  c.name as company_name,
  c.logo_url as company_logo,
  c.sector as company_sector,
  c.size as company_size
FROM job_offers jo
JOIN companies c ON jo.company_id = c.id
WHERE jo.status = 'active'
  AND (jo.expires_at IS NULL OR jo.expires_at > NOW());

-- Admin dashboard stats view
CREATE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'candidate' AND is_active = true) as active_candidates,
  (SELECT COUNT(*) FROM users WHERE role = 'company' AND is_active = true) as active_company_users,
  (SELECT COUNT(*) FROM companies WHERE status = 'active') as active_companies,
  (SELECT COUNT(*) FROM job_offers WHERE status = 'active') as active_offers,
  (SELECT COUNT(*) FROM job_offers WHERE status = 'expired') as expired_offers,
  (SELECT COUNT(*) FROM job_offers WHERE status = 'filled') as filled_offers,
  (SELECT COUNT(*) FROM applications) as total_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications,
  (SELECT COUNT(*) FROM applications WHERE created_at > NOW() - INTERVAL '7 days') as applications_last_week,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_last_week;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (policies added separately)
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitcrm_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter_file_url TEXT;

-- Add is_company_owner field to users table for owner/referent management
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_company_owner BOOLEAN DEFAULT false;

-- Add linkedin_url to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);

-- =====================================================
-- COMPANY INVITATIONS TABLE
-- For inviting managers and team members with granular permissions
-- =====================================================

CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Invitation details
  email VARCHAR(255) NOT NULL,
  role company_role NOT NULL DEFAULT 'manager',
  
  -- Permissions (granular access control)
  permissions JSONB DEFAULT '{
    "can_view_applications": true,
    "can_edit_applications": false,
    "can_send_emails": false,
    "can_change_status": false,
    "can_add_notes": true,
    "can_create_offers": false,
    "can_edit_offers": false,
    "can_view_all_offers": true,
    "kanban_stages_access": ["pending", "in_progress", "interview"]
  }'::jsonb,
  
  -- Offer-specific access (NULL = all offers)
  offer_ids UUID[] DEFAULT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token VARCHAR(100) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one pending invitation per email per company
  UNIQUE(company_id, email, status)
);

CREATE INDEX idx_company_invitations_company ON company_invitations(company_id);
CREATE INDEX idx_company_invitations_email ON company_invitations(email);
CREATE INDEX idx_company_invitations_token ON company_invitations(token);
CREATE INDEX idx_company_invitations_status ON company_invitations(status);

-- =====================================================
-- USER PERMISSIONS TABLE
-- Stores accepted permissions for company team members
-- =====================================================

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Permissions (inherited from invitation, can be modified)
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Offer-specific access (NULL = all offers)
  offer_ids UUID[] DEFAULT NULL,
  
  -- Granted by
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_company ON user_permissions(company_id);

ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;