-- =====================================================
-- HOMEPAGE OFFERS - Table dénormalisée pour la page d'accueil
-- Version: 1.1.0
-- Description: Table légère sans RLS pour afficher les 5 offres récentes
-- Référence: job_offers table from 000_main_schema.sql
-- =====================================================

-- Drop existing objects if they exist (for clean migration)
DROP TRIGGER IF EXISTS trigger_update_homepage_offers ON job_offers;
DROP TRIGGER IF EXISTS trigger_update_homepage_offers_company ON companies;
DROP FUNCTION IF EXISTS update_homepage_offers();
DROP POLICY IF EXISTS "Anyone can read homepage offers" ON homepage_offers;
DROP TABLE IF EXISTS homepage_offers;

-- Table pour les offres affichées sur la page d'accueil
-- Cette table est mise à jour automatiquement par un trigger
CREATE TABLE homepage_offers (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  company_id UUID NOT NULL,
  company_logo_url VARCHAR(500),
  company_sector VARCHAR(100),
  location_city VARCHAR(100),
  location_country VARCHAR(100) DEFAULT 'France',
  contract_type VARCHAR(20) NOT NULL,
  start_date DATE,
  start_date_flexible BOOLEAN DEFAULT false,
  duration_months INTEGER,
  remote_policy VARCHAR(50),
  is_featured BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour le tri par date et les filtres
CREATE INDEX idx_homepage_offers_created_at ON homepage_offers(created_at DESC);
CREATE INDEX idx_homepage_offers_published_at ON homepage_offers(published_at DESC);
CREATE INDEX idx_homepage_offers_contract_type ON homepage_offers(contract_type);

-- Activer RLS mais permettre lecture publique
ALTER TABLE homepage_offers ENABLE ROW LEVEL SECURITY;

-- Politique permettant à tous de lire (données publiques)
CREATE POLICY "Public read access for homepage offers"
  ON homepage_offers FOR SELECT
  TO public
  USING (true);

-- Fonction pour mettre à jour homepage_offers
-- Utilise TRUNCATE + INSERT pour une mise à jour atomique et rapide
CREATE OR REPLACE FUNCTION update_homepage_offers()
RETURNS TRIGGER AS $$
BEGIN
  -- Vider la table (plus rapide que DELETE pour petites tables)
  TRUNCATE homepage_offers;
  
  -- Insérer les 5 offres les plus récentes (une par entreprise)
  INSERT INTO homepage_offers (
    id, title, company_name, company_id, company_logo_url, company_sector,
    location_city, location_country, contract_type, start_date, start_date_flexible,
    duration_months, remote_policy, is_featured, is_urgent, published_at, created_at, updated_at
  )
  SELECT 
    id, title, company_name, company_id, company_logo_url, company_sector,
    location_city, location_country, contract_type, start_date, start_date_flexible,
    duration_months, remote_policy, is_featured, is_urgent, published_at, created_at, NOW()
  FROM (
    SELECT 
      o.id,
      o.title,
      c.name as company_name,
      o.company_id,
      c.logo_url as company_logo_url,
      c.sector as company_sector,
      o.location_city,
      o.location_country,
      o.contract_type::text,
      o.start_date,
      o.start_date_flexible,
      o.duration_months,
      o.remote_policy,
      o.is_featured,
      o.is_urgent,
      o.published_at,
      o.created_at,
      ROW_NUMBER() OVER (PARTITION BY o.company_id ORDER BY o.published_at DESC NULLS LAST, o.created_at DESC) as rn
    FROM job_offers o
    JOIN companies c ON o.company_id = c.id
    WHERE o.status = 'active'
      AND c.status = 'active'
  ) ranked
  WHERE rn = 1
  ORDER BY published_at DESC NULLS LAST, created_at DESC
  LIMIT 5;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur la table job_offers pour mettre à jour homepage_offers
-- Se déclenche sur INSERT, UPDATE (status, published_at, title, etc.) et DELETE
CREATE TRIGGER trigger_update_homepage_offers
  AFTER INSERT OR UPDATE OF status, published_at, title, location_city, start_date, contract_type, is_featured, is_urgent
  OR DELETE ON job_offers
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_homepage_offers();

-- Trigger sur la table companies pour mettre à jour si le nom ou logo change
CREATE TRIGGER trigger_update_homepage_offers_company
  AFTER UPDATE OF name, logo_url, sector, status ON companies
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_homepage_offers();

-- Fonction séparée pour initialiser la table (non-trigger)
CREATE OR REPLACE FUNCTION init_homepage_offers()
RETURNS void AS $$
BEGIN
  -- Vider la table
  TRUNCATE homepage_offers;
  
  -- Insérer les 5 offres les plus récentes (une par entreprise)
  INSERT INTO homepage_offers (
    id, title, company_name, company_id, company_logo_url, company_sector,
    location_city, location_country, contract_type, start_date, start_date_flexible,
    duration_months, remote_policy, is_featured, is_urgent, published_at, created_at, updated_at
  )
  SELECT 
    id, title, company_name, company_id, company_logo_url, company_sector,
    location_city, location_country, contract_type, start_date, start_date_flexible,
    duration_months, remote_policy, is_featured, is_urgent, published_at, created_at, NOW()
  FROM (
    SELECT 
      o.id,
      o.title,
      c.name as company_name,
      o.company_id,
      c.logo_url as company_logo_url,
      c.sector as company_sector,
      o.location_city,
      o.location_country,
      o.contract_type::text,
      o.start_date,
      o.start_date_flexible,
      o.duration_months,
      o.remote_policy,
      o.is_featured,
      o.is_urgent,
      o.published_at,
      o.created_at,
      ROW_NUMBER() OVER (PARTITION BY o.company_id ORDER BY o.published_at DESC NULLS LAST, o.created_at DESC) as rn
    FROM job_offers o
    JOIN companies c ON o.company_id = c.id
    WHERE o.status = 'active'
      AND c.status = 'active'
  ) ranked
  WHERE rn = 1
  ORDER BY published_at DESC NULLS LAST, created_at DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialiser la table avec les données actuelles
SELECT init_homepage_offers();

-- Commentaires
COMMENT ON TABLE homepage_offers IS 'Table dénormalisée pour afficher les 5 offres récentes sur la page d''accueil. Mise à jour automatiquement par trigger. Pas de RLS restrictif pour un accès rapide.';
COMMENT ON FUNCTION update_homepage_offers() IS 'Met à jour homepage_offers avec les 5 offres actives les plus récentes, une par entreprise. Appelée automatiquement par trigger.';
