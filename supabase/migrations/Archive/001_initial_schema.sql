-- =====================================================
-- MIGRATION 001 - Schéma Initial FinanceStages
-- =====================================================
-- Description: Création de toutes les tables, relations, index, RLS et triggers
-- Date: 2024-12-03
-- Auteur: Finance Internship Platform Team
-- =====================================================

-- ===================
-- 1. EXTENSIONS
-- ===================

-- Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================
-- 2. TYPES ENUM
-- ===================

-- Rôles utilisateurs (combinables pour entreprises)
CREATE TYPE user_role AS ENUM ('candidate', 'company', 'hr', 'manager', 'admin');

-- Niveaux d'études
CREATE TYPE study_level AS ENUM ('L3', 'M1', 'M2', 'MBA', 'Autre');

-- Types de contrat
CREATE TYPE contract_type AS ENUM ('stage', 'alternance', 'apprentissage');

-- Statuts d'offre
CREATE TYPE offer_status AS ENUM ('draft', 'active', 'filled', 'expired', 'archived');

-- Statuts de candidature
CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected');

-- Statuts d'entreprise
CREATE TYPE company_status AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- Types d'actions audit
CREATE TYPE audit_action AS ENUM (
  'login', 'logout', 'registration', 'profile_update',
  'application_created', 'application_status_changed',
  'offer_created', 'offer_updated', 'offer_deleted',
  'user_suspended', 'user_deleted', 'cv_uploaded',
  'export_data', 'search_saved'
);

-- Types de demandes RGPD
CREATE TYPE gdpr_request_type AS ENUM ('access', 'modify', 'delete', 'export');
CREATE TYPE gdpr_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');

-- Fréquence des alertes email
CREATE TYPE alert_frequency AS ENUM ('instant', 'daily', 'weekly');

-- ===================
-- 3. TABLE user_profiles (Extension de auth.users)
-- ===================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  roles user_role[] NOT NULL DEFAULT ARRAY['candidate']::user_role[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS 'Profils utilisateurs étendus avec rôles multiples';
COMMENT ON COLUMN user_profiles.roles IS 'Liste des rôles (combinables pour entreprises)';

-- ===================
-- 4. TABLE candidates
-- ===================

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  school VARCHAR(200),
  study_level study_level,
  specialization VARCHAR(200),
  alternance_rhythm VARCHAR(100),
  available_from DATE,
  preferred_locations JSONB DEFAULT '[]'::jsonb,
  cv_url TEXT,
  additional_cvs JSONB DEFAULT '[]'::jsonb,
  linkedin_url TEXT,
  portfolio_url TEXT,
  bio TEXT,
  skills TEXT[],
  languages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE candidates IS 'Profils candidats complets';
COMMENT ON COLUMN candidates.preferred_locations IS 'Array JSON: [{city, region, country}]';
COMMENT ON COLUMN candidates.additional_cvs IS 'Array JSON: [{id, name, url, uploadedAt}]';
COMMENT ON COLUMN candidates.languages IS 'Array JSON: [{language, level}]';

CREATE INDEX idx_candidates_user_id ON candidates(user_id);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_study_level ON candidates(study_level);
CREATE INDEX idx_candidates_school ON candidates(school);

-- ===================
-- 5. TABLE companies
-- ===================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  sector VARCHAR(100),
  size VARCHAR(50),
  description TEXT,
  website VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'France',
  logo_url TEXT,
  contact_name VARCHAR(100),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  status company_status DEFAULT 'active',
  recruitcrm_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Entreprises (liées aux users via company_users)';

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_city ON companies(city);
CREATE INDEX idx_companies_recruitcrm ON companies(recruitcrm_id);

-- ===================
-- 6. TABLE company_users (Liaison users ↔ companies)
-- ===================

CREATE TABLE company_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roles user_role[] NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

COMMENT ON TABLE company_users IS 'Liaison many-to-many entre users et companies avec rôles';
COMMENT ON COLUMN company_users.roles IS 'Rôles de l''utilisateur dans cette entreprise';
COMMENT ON COLUMN company_users.is_primary IS 'Contact principal de l''entreprise';

CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);

-- ===================
-- 7. TABLE company_contacts (Contacts secondaires)
-- ===================

CREATE TABLE company_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(100),
  department VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE company_contacts IS 'Contacts secondaires des entreprises (non-users)';

CREATE INDEX idx_company_contacts_company ON company_contacts(company_id);

-- ===================
-- 8. TABLE job_offers
-- ===================

CREATE TABLE job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  missions TEXT[],
  objectives TEXT,
  reporting TEXT,
  study_levels study_level[],
  skills TEXT[],
  contract_type contract_type NOT NULL,
  duration VARCHAR(100),
  start_date DATE,
  location JSONB,
  salary VARCHAR(100),
  application_process TEXT,
  status offer_status DEFAULT 'draft',
  posted_date TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  recruitcrm_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE job_offers IS 'Offres de stages et alternances';
COMMENT ON COLUMN job_offers.location IS 'JSON: {city, region, country, remote}';

CREATE INDEX idx_offers_company ON job_offers(company_id);
CREATE INDEX idx_offers_status ON job_offers(status);
CREATE INDEX idx_offers_contract_type ON job_offers(contract_type);
CREATE INDEX idx_offers_posted_date ON job_offers(posted_date DESC);
CREATE INDEX idx_offers_location ON job_offers USING GIN(location);

-- ===================
-- 9. TABLE applications
-- ===================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  cover_letter TEXT,
  cv_used_id VARCHAR(100),
  cv_url TEXT,
  notes JSONB DEFAULT '[]'::jsonb,
  status_history JSONB DEFAULT '[]'::jsonb,
  application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recruitcrm_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, offer_id)
);

COMMENT ON TABLE applications IS 'Candidatures des candidats aux offres';
COMMENT ON COLUMN applications.notes IS 'Array JSON: [{author, content, timestamp}]';
COMMENT ON COLUMN applications.status_history IS 'Array JSON: [{status, timestamp, changedBy}]';

CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_offer ON applications(offer_id);
CREATE INDEX idx_applications_company ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_date ON applications(application_date DESC);

-- ===================
-- 10. TABLE saved_offers (Offres favorites)
-- ===================

CREATE TABLE saved_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, offer_id)
);

COMMENT ON TABLE saved_offers IS 'Offres sauvegardées par les candidats';

CREATE INDEX idx_saved_offers_candidate ON saved_offers(candidate_id);
CREATE INDEX idx_saved_offers_offer ON saved_offers(offer_id);

-- ===================
-- 11. TABLE saved_searches (Recherches sauvegardées)
-- ===================

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  filters JSONB NOT NULL,
  alert_enabled BOOLEAN DEFAULT false,
  alert_frequency alert_frequency DEFAULT 'daily',
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE saved_searches IS 'Recherches sauvegardées avec alertes email';
COMMENT ON COLUMN saved_searches.filters IS 'JSON: {search, locations, studyLevels, contractTypes, cities}';

CREATE INDEX idx_saved_searches_candidate ON saved_searches(candidate_id);
CREATE INDEX idx_saved_searches_alerts ON saved_searches(alert_enabled, alert_frequency);

-- ===================
-- 12. TABLE audit_logs (Traçabilité)
-- ===================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action audit_action NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(200),
  user_email VARCHAR(200),
  user_role user_role,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details TEXT,
  ip_address INET,
  metadata JSONB,
  entity_type VARCHAR(50),
  entity_id UUID
);

COMMENT ON TABLE audit_logs IS 'Journal d''audit complet (RGPD)';

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ===================
-- 13. TABLE gdpr_requests (Demandes RGPD)
-- ===================

CREATE TABLE gdpr_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(200) NOT NULL,
  request_type gdpr_request_type NOT NULL,
  status gdpr_status DEFAULT 'pending',
  request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE gdpr_requests IS 'Demandes RGPD (accès, modification, suppression, export)';

CREATE INDEX idx_gdpr_requests_user ON gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);

-- ===================
-- 14. TABLE recruitcrm_sync (Synchronisation)
-- ===================

CREATE TABLE recruitcrm_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  recruitcrm_id VARCHAR(100) NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'synced',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

COMMENT ON TABLE recruitcrm_sync IS 'Mapping entre entités locales et RecruiteCRM';

CREATE INDEX idx_recruitcrm_sync_entity ON recruitcrm_sync(entity_type, entity_id);
CREATE INDEX idx_recruitcrm_sync_recruitcrm ON recruitcrm_sync(recruitcrm_id);

-- ===================
-- 15. TABLE email_notifications (Queue emails)
-- ===================

CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email VARCHAR(200) NOT NULL,
  recipient_name VARCHAR(200),
  subject VARCHAR(300) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_data JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE email_notifications IS 'Queue pour envoi d''emails via Resend';

CREATE INDEX idx_email_notifications_status ON email_notifications(status, scheduled_for);
CREATE INDEX idx_email_notifications_recipient ON email_notifications(recipient_email);

-- ===================
-- 16. TRIGGERS (updated_at automatique)
-- ===================

-- Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application aux tables concernées
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_offers_updated_at BEFORE UPDATE ON job_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_offers_updated_at BEFORE UPDATE ON saved_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================
-- 17. ROW LEVEL SECURITY (RLS)
-- ===================

-- Activer RLS sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

-- ===== POLITIQUES user_profiles =====

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ===== POLITIQUES candidates =====

CREATE POLICY "Candidates can view own profile"
  ON candidates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Candidates can update own profile"
  ON candidates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Candidates can insert own profile"
  ON candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can view candidates who applied"
  ON candidates FOR SELECT
  USING (
    id IN (
      SELECT candidate_id FROM applications
      WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can view all candidates"
  ON candidates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ===== POLITIQUES companies =====

CREATE POLICY "Anyone can view active companies"
  ON companies FOR SELECT
  USING (status = 'active' OR id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Company users can update their company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access companies"
  ON companies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ===== POLITIQUES job_offers =====

CREATE POLICY "Anyone can view active offers"
  ON job_offers FOR SELECT
  USING (status = 'active');

CREATE POLICY "Company users can view their offers"
  ON job_offers FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can create offers"
  ON job_offers FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can update their offers"
  ON job_offers FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access offers"
  ON job_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ===== POLITIQUES applications =====

CREATE POLICY "Candidates view own applications"
  ON applications FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates create applications"
  ON applications FOR INSERT
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies view applications for their offers"
  ON applications FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies update applications for their offers"
  ON applications FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access applications"
  ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ===== POLITIQUES saved_offers =====

CREATE POLICY "Candidates manage own saved offers"
  ON saved_offers FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- ===== POLITIQUES saved_searches =====

CREATE POLICY "Candidates manage own saved searches"
  ON saved_searches FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- ===== POLITIQUES audit_logs =====

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ===== POLITIQUES gdpr_requests =====

CREATE POLICY "Users can view own RGPD requests"
  ON gdpr_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create RGPD requests"
  ON gdpr_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins full access RGPD requests"
  ON gdpr_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ===================
-- 18. FONCTIONS UTILITAIRES
-- ===================

-- Fonction pour vérifier si un user est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND 'admin' = ANY(roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les rôles d'un user
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS user_role[] AS $$
BEGIN
  RETURN (
    SELECT roles FROM user_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter compteur de vues d'une offre
CREATE OR REPLACE FUNCTION increment_offer_views(offer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE job_offers
  SET views_count = views_count + 1
  WHERE id = offer_id;
END;
$$ LANGUAGE plpgsql;

-- ===================
-- 19. DONNÉES INITIALES (ADMIN)
-- ===================

-- Insertion d'un compte admin par défaut (à personnaliser)
-- Note: Le mot de passe sera défini via Supabase Auth Dashboard

-- INSERT INTO auth.users (id, email) VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'admin@financestages.fr');

-- INSERT INTO user_profiles (id, roles) VALUES
--   ('00000000-0000-0000-0000-000000000001', ARRAY['admin']::user_role[]);

-- ===================
-- FIN DE LA MIGRATION
-- ===================

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_initial_schema completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create admin user via Supabase Dashboard';
  RAISE NOTICE '2. Configure Storage buckets: cvs, company-logos';
  RAISE NOTICE '3. Configure Auth providers (Google, LinkedIn)';
  RAISE NOTICE '4. Test RLS policies';
END $$;
