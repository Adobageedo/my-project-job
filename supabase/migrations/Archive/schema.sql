-- =====================================================
-- SCHEMA SUPABASE - Finance Internship Platform
-- =====================================================
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- pour créer toutes les tables nécessaires
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE study_level AS ENUM ('L3', 'M1', 'M2', 'MBA');
CREATE TYPE contract_type AS ENUM ('stage', 'alternance', 'apprentissage');
CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'accepted', 'rejected');
CREATE TYPE offer_status AS ENUM ('active', 'filled', 'expired');
CREATE TYPE user_role AS ENUM ('candidate', 'company', 'hr', 'manager', 'admin');
CREATE TYPE gdpr_request_type AS ENUM ('access', 'modify', 'delete', 'export');
CREATE TYPE gdpr_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');
CREATE TYPE notification_frequency AS ENUM ('instant', 'daily', 'weekly');
CREATE TYPE audit_action AS ENUM (
  'login', 'logout', 'registration', 'profile_update',
  'application_created', 'application_status_changed',
  'offer_created', 'offer_updated', 'offer_deleted',
  'user_suspended', 'user_deleted', 'cv_uploaded', 'export_data'
);

-- =====================================================
-- TABLE: candidates
-- =====================================================

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  school VARCHAR(200) NOT NULL,
  study_level study_level NOT NULL,
  specialization VARCHAR(200) NOT NULL,
  alternance_rhythm VARCHAR(100),
  locations TEXT[] NOT NULL DEFAULT '{}',
  available_from DATE NOT NULL,
  cv_url TEXT,
  cv_parsed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_candidates_user_id ON candidates(user_id);
CREATE INDEX idx_candidates_study_level ON candidates(study_level);
CREATE INDEX idx_candidates_locations ON candidates USING GIN(locations);

-- =====================================================
-- TABLE: companies
-- =====================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  size VARCHAR(50) NOT NULL,
  contact_name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  logo_url TEXT,
  roles user_role[] NOT NULL DEFAULT '{company}',
  recruit_crm_id VARCHAR(100),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_sector ON companies(sector);

-- =====================================================
-- TABLE: job_offers
-- =====================================================

CREATE TABLE job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  missions TEXT[] NOT NULL DEFAULT '{}',
  objectives TEXT NOT NULL,
  reporting VARCHAR(200),
  study_level study_level[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  contract_type contract_type NOT NULL,
  duration VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  location VARCHAR(200) NOT NULL,
  salary VARCHAR(100),
  application_process TEXT NOT NULL,
  status offer_status DEFAULT 'active',
  posted_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_job_offers_company_id ON job_offers(company_id);
CREATE INDEX idx_job_offers_status ON job_offers(status);
CREATE INDEX idx_job_offers_contract_type ON job_offers(contract_type);
CREATE INDEX idx_job_offers_location ON job_offers(location);
CREATE INDEX idx_job_offers_posted_date ON job_offers(posted_date DESC);

-- =====================================================
-- TABLE: applications
-- =====================================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_date TIMESTAMPTZ DEFAULT NOW(),
  status application_status DEFAULT 'pending',
  cover_letter TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Empêcher les candidatures en double
  UNIQUE(candidate_id, offer_id)
);

-- Index
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_offer_id ON applications(offer_id);
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(status);

-- =====================================================
-- TABLE: audit_logs
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action audit_action NOT NULL,
  user_id UUID NOT NULL,
  user_name VARCHAR(200) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_role user_role NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details TEXT NOT NULL,
  ip_address INET,
  metadata JSONB
);

-- Index pour recherche rapide
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- =====================================================
-- TABLE: gdpr_requests
-- =====================================================

CREATE TABLE gdpr_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  request_type gdpr_request_type NOT NULL,
  status gdpr_status DEFAULT 'pending',
  request_date TIMESTAMPTZ DEFAULT NOW(),
  completed_date TIMESTAMPTZ,
  notes TEXT
);

-- Index
CREATE INDEX idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);

-- =====================================================
-- TABLE: notification_settings
-- =====================================================

CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  notify_new_applications BOOLEAN DEFAULT TRUE,
  notify_new_offers BOOLEAN DEFAULT TRUE,
  notify_status_change BOOLEAN DEFAULT TRUE,
  frequency notification_frequency DEFAULT 'instant',
  email_from VARCHAR(255) DEFAULT 'notifications@financestages.fr',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: recruit_crm_sync (pour tracking sync)
-- =====================================================

CREATE TABLE recruit_crm_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  recruit_crm_id VARCHAR(100),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT
);

-- Index
CREATE INDEX idx_recruit_crm_sync_entity ON recruit_crm_sync(entity_type, entity_id);
CREATE INDEX idx_recruit_crm_sync_status ON recruit_crm_sync(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: candidates
-- =====================================================

-- Les candidats peuvent voir et modifier leur propre profil
CREATE POLICY "Candidates can view own profile" ON candidates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Candidates can update own profile" ON candidates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Candidates can insert own profile" ON candidates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les entreprises peuvent voir les candidats qui ont postulé
CREATE POLICY "Companies can view applicants" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN companies c ON a.company_id = c.id
      WHERE a.candidate_id = candidates.id
      AND c.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLICIES: companies
-- =====================================================

-- Les entreprises peuvent voir et modifier leur propre profil
CREATE POLICY "Companies can view own profile" ON companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can update own profile" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert own profile" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tout le monde peut voir les entreprises (pour les offres)
CREATE POLICY "Anyone can view companies" ON companies
  FOR SELECT USING (true);

-- =====================================================
-- POLICIES: job_offers
-- =====================================================

-- Tout le monde peut voir les offres actives
CREATE POLICY "Anyone can view active offers" ON job_offers
  FOR SELECT USING (status = 'active');

-- Les entreprises peuvent voir toutes leurs offres
CREATE POLICY "Companies can view own offers" ON job_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = job_offers.company_id
      AND c.user_id = auth.uid()
    )
  );

-- Les entreprises peuvent créer des offres
CREATE POLICY "Companies can create offers" ON job_offers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = job_offers.company_id
      AND c.user_id = auth.uid()
    )
  );

-- Les entreprises peuvent modifier leurs offres
CREATE POLICY "Companies can update own offers" ON job_offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = job_offers.company_id
      AND c.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLICIES: applications
-- =====================================================

-- Les candidats peuvent voir leurs candidatures
CREATE POLICY "Candidates can view own applications" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = applications.candidate_id
      AND c.user_id = auth.uid()
    )
  );

-- Les candidats peuvent créer des candidatures
CREATE POLICY "Candidates can create applications" ON applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = applications.candidate_id
      AND c.user_id = auth.uid()
    )
  );

-- Les entreprises peuvent voir les candidatures pour leurs offres
CREATE POLICY "Companies can view applications for their offers" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = applications.company_id
      AND c.user_id = auth.uid()
    )
  );

-- Les entreprises peuvent modifier le statut des candidatures
CREATE POLICY "Companies can update application status" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = applications.company_id
      AND c.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLICIES: notification_settings
-- =====================================================

CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLICIES: audit_logs (admin only)
-- =====================================================

-- Seuls les admins peuvent voir les audit logs
-- Note: Vous devrez créer une fonction pour vérifier le rôle admin
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Tout le monde peut insérer des logs (pour le tracking)
CREATE POLICY "Anyone can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- POLICIES: gdpr_requests
-- =====================================================

-- Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view own GDPR requests" ON gdpr_requests
  FOR SELECT USING (user_id = auth.uid());

-- Les utilisateurs peuvent créer des demandes
CREATE POLICY "Users can create GDPR requests" ON gdpr_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TRIGGERS: updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_offers_updated_at
  BEFORE UPDATE ON job_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- À créer manuellement dans Supabase Dashboard > Storage
-- 
-- 1. Bucket "cvs" - Pour les CV des candidats
--    - Public: false
--    - Allowed MIME types: application/pdf
--    - Max file size: 5MB
--
-- 2. Bucket "logos" - Pour les logos des entreprises
--    - Public: true
--    - Allowed MIME types: image/png, image/jpeg, image/webp
--    - Max file size: 2MB
--
-- 3. Bucket "documents" - Pour les fiches de poste
--    - Public: false
--    - Allowed MIME types: application/pdf
--    - Max file size: 10MB

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- 1. Après avoir exécuté ce script, configurez les Storage Buckets
-- 2. Configurez les providers OAuth (Google, LinkedIn) dans Auth
-- 3. Ajoutez les variables d'environnement dans votre projet:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
-- 4. Pour les admins, définissez le rôle dans user_metadata lors de la création
