-- =====================================================
-- HOMEPAGE CONFIGURATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS homepage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero JSONB NOT NULL DEFAULT '{}',
  stats JSONB NOT NULL DEFAULT '{}',
  offers JSONB NOT NULL DEFAULT '{}',
  alternance JSONB NOT NULL DEFAULT '{}',
  services JSONB NOT NULL DEFAULT '{}',
  formations JSONB NOT NULL DEFAULT '{}',
  about JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_homepage_config_updated_at ON homepage_config(updated_at DESC);

-- RLS Policies
ALTER TABLE homepage_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read the homepage config (public page)
CREATE POLICY "Anyone can read homepage config"
  ON homepage_config FOR SELECT
  USING (true);

-- Only admins can update homepage config
CREATE POLICY "Admins can update homepage config"
  ON homepage_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can insert homepage config
CREATE POLICY "Admins can insert homepage config"
  ON homepage_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default config
INSERT INTO homepage_config (hero, stats, offers, alternance, services, formations, about)
VALUES (
  '{"title": "Créateur de rencontres professionnelles", "subtitle": "Conception et déploiement de solutions innovantes en ressources humaines", "description": "Chaque histoire est différente, construisons-en une qui vous ressemble.", "showCandidateButton": true, "showCompanyButton": true, "candidateButtonText": "Je suis candidat", "companyButtonText": "Je suis entreprise"}'::jsonb,
  '{"visible": true}'::jsonb,
  '{"visible": true, "title": "Opportunités professionnelles", "subtitle": "Découvrez les opportunités les plus récentes dans les meilleures entreprises de finance", "showCount": 5}'::jsonb,
  '{"visible": true, "title": "Recrutez vos alternants et stagiaires en 3 clics", "subtitle": "Spécialistes du recrutement de profils juniors en finance d''entreprise et de marché", "benefits": ["Profils pré-qualifiés des meilleures écoles", "Recrutement en moins de 2 semaines", "Accompagnement personnalisé"]}'::jsonb,
  '{"visible": true, "title": "Services aux entreprises", "subtitle": "Des solutions personnalisables pour répondre à tous vos besoins en recrutement et gestion des talents."}'::jsonb,
  '{"visible": true, "title": "Formations & accompagnement", "subtitle": "Vous recherchez une nouvelle opportunité ? Vous avez besoin d''accompagnement dans la gestion de votre carrière ? Découvrez nos offres !"}'::jsonb,
  '{"visible": true, "title": "Qui sommes-nous ?", "description": "Berthois Conseils propose des solutions de conseil en ressources humaines pour les profils en finance d''entreprise et de marché."}'::jsonb
)
ON CONFLICT DO NOTHING;
