-- =====================================================
-- MIGRATION 003 - Fix RLS Policies & Add Notifications Table
-- =====================================================
-- Description: Corrige les policies RLS récursives et ajoute la table notifications_settings
-- Date: 2024-12-04
-- =====================================================

-- ===================
-- 1. DROP PROBLEMATIC POLICIES
-- ===================

-- Drop les policies qui causent la récursion
DROP POLICY IF EXISTS "Companies can view candidates who applied" ON candidates;
DROP POLICY IF EXISTS "Admins can view all candidates" ON candidates;
DROP POLICY IF EXISTS "Candidates view own applications" ON applications;
DROP POLICY IF EXISTS "Companies view applications for their offers" ON applications;
DROP POLICY IF EXISTS "Companies update applications for their offers" ON applications;
DROP POLICY IF EXISTS "Admins full access applications" ON applications;
DROP POLICY IF EXISTS "Candidates manage own saved offers" ON saved_offers;
DROP POLICY IF EXISTS "Candidates manage own saved searches" ON saved_searches;

-- ===================
-- 2. RECREATE SIMPLER POLICIES (sans récursion)
-- ===================

-- ===== CANDIDATES =====

-- Candidats peuvent voir leur propre profil (déjà existant, on le garde)
-- CREATE POLICY "Candidates can view own profile" ON candidates FOR SELECT USING (auth.uid() = user_id);

-- Entreprises peuvent voir les candidats (simplifié - pas de récursion)
CREATE POLICY "Companies can view candidates"
  ON candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND 'company' = ANY(user_profiles.roles)
    )
  );

-- Admins peuvent tout voir sur candidates
CREATE POLICY "Admins full access candidates"
  ON candidates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND 'admin' = ANY(user_profiles.roles)
    )
  );

-- ===== APPLICATIONS =====

-- Candidats voient leurs propres candidatures (via user_id direct)
CREATE POLICY "Candidates view own applications v2"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM candidates 
      WHERE candidates.id = applications.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

-- Candidats créent leurs propres candidatures
CREATE POLICY "Candidates create applications v2"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM candidates 
      WHERE candidates.id = candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

-- Entreprises voient les candidatures pour leurs offres (via company_users)
CREATE POLICY "Companies view applications v2"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_users 
      WHERE company_users.company_id = applications.company_id 
      AND company_users.user_id = auth.uid()
    )
  );

-- Entreprises mettent à jour les candidatures
CREATE POLICY "Companies update applications v2"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_users 
      WHERE company_users.company_id = applications.company_id 
      AND company_users.user_id = auth.uid()
    )
  );

-- Admins full access applications
CREATE POLICY "Admins full access applications v2"
  ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND 'admin' = ANY(user_profiles.roles)
    )
  );

-- ===== SAVED_OFFERS =====

CREATE POLICY "Candidates manage saved offers v2"
  ON saved_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM candidates 
      WHERE candidates.id = saved_offers.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

-- ===== SAVED_SEARCHES =====

CREATE POLICY "Candidates manage saved searches v2"
  ON saved_searches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM candidates 
      WHERE candidates.id = saved_searches.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

-- ===================
-- 3. CREATE NOTIFICATIONS_SETTINGS TABLE
-- ===================

CREATE TABLE IF NOT EXISTS notifications_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_on_new_offer BOOLEAN DEFAULT true,
  email_on_application_status BOOLEAN DEFAULT true,
  email_on_new_application BOOLEAN DEFAULT true,
  frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('immediate', 'instant', 'daily', 'weekly', 'never')),
  pause_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notifications_settings IS 'Paramètres de notification par utilisateur';

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_settings_user_id ON notifications_settings(user_id);

-- RLS
ALTER TABLE notifications_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification settings"
  ON notifications_settings FOR ALL
  USING (user_id = auth.uid());

-- Trigger updated_at
CREATE TRIGGER update_notifications_settings_updated_at
  BEFORE UPDATE ON notifications_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================
-- 4. CREATE CV STORAGE BUCKET (if not exists)
-- ===================

-- Note: Les buckets doivent être créés via le Dashboard Supabase ou l'API Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false) ON CONFLICT DO NOTHING;

-- ===================
-- 5. ADD PUBLIC READ POLICY FOR ANONYMOUS USERS (pour les tests)
-- ===================

-- Permettre la lecture publique des offres actives (sans auth)
DROP POLICY IF EXISTS "Anyone can view active offers" ON job_offers;
CREATE POLICY "Anyone can view active offers"
  ON job_offers FOR SELECT
  USING (status = 'active');

-- Permettre la lecture publique des entreprises actives (sans auth)
DROP POLICY IF EXISTS "Anyone can view active companies" ON companies;
CREATE POLICY "Anyone can view active companies"
  ON companies FOR SELECT
  USING (status = 'active');

-- Permettre aux utilisateurs authentifiés de créer une entreprise
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===================
-- 6. FIX: Allow anon to read for testing
-- ===================

-- Pour les tests sans auth, on ajoute une policy temporaire
-- À SUPPRIMER EN PRODUCTION si vous voulez restreindre l'accès

CREATE POLICY "Anon can read candidates for testing"
  ON candidates FOR SELECT
  USING (true);

CREATE POLICY "Anon can read applications for testing"
  ON applications FOR SELECT
  USING (true);

-- ===================
-- DONE
-- ===================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 003 completed:';
  RAISE NOTICE '  - Fixed RLS policies (no more recursion)';
  RAISE NOTICE '  - Created notifications_settings table';
  RAISE NOTICE '  - Added anon read policies for testing';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Remember to:';
  RAISE NOTICE '  1. Create storage bucket "cvs" via Supabase Dashboard';
  RAISE NOTICE '  2. Remove anon policies in production';
END $$;
