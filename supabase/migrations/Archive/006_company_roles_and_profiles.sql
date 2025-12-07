-- Migration 004: Company Roles and Enhanced Profiles
-- Ajout des rôles multiples pour les entreprises (Entreprise, RH, Manager)
-- Et amélioration du profil entreprise

-- Table pour les rôles disponibles
CREATE TABLE IF NOT EXISTS company_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les rôles disponibles
INSERT INTO company_roles (name, display_name, description) VALUES
  ('company', 'Entreprise', 'Représentant général de l''entreprise'),
  ('hr', 'RH', 'Responsable Ressources Humaines'),
  ('manager', 'Manager', 'Manager opérationnel')
ON CONFLICT (name) DO NOTHING;

-- Table de liaison entre users et company_roles (pour les rôles multiples)
CREATE TABLE IF NOT EXISTS user_company_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_name VARCHAR(50) NOT NULL REFERENCES company_roles(name) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, company_id, role_name)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_company_roles_user ON user_company_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_company ON user_company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_role ON user_company_roles(role_name);

-- Amélioration de la table companies
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS sector VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'France',
  ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS siret VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_siret_unique ON companies(siret);

-- Amélioration de la table job_offers pour liaison avec les rôles
ALTER TABLE job_offers
  ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50) REFERENCES company_roles(name),
  ADD COLUMN IF NOT EXISTS hiring_manager_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS hr_contact_id UUID REFERENCES auth.users(id);

-- Table pour les membres d'équipe d'une entreprise
CREATE TABLE IF NOT EXISTS company_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  job_title VARCHAR(150),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_team_company ON company_team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_team_user ON company_team_members(user_id);

-- Table pour les tags/shortlists des candidatures
CREATE TABLE IF NOT EXISTS application_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_application_tags_company ON application_tags(company_id);

-- Table de liaison tags-candidatures
CREATE TABLE IF NOT EXISTS application_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES application_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(application_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_application_tag_assign_app ON application_tag_assignments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_tag_assign_tag ON application_tag_assignments(tag_id);

-- Table pour les notes internes sur les candidatures
CREATE TABLE IF NOT EXISTS application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_notes_app ON application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_user ON application_notes(user_id);

-- RLS Policies

-- company_roles: lecture publique, écriture admin uniquement
ALTER TABLE company_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company roles are viewable by everyone" ON company_roles;
CREATE POLICY "Company roles are viewable by everyone"
  ON company_roles FOR SELECT
  USING (true);

-- user_company_roles: un utilisateur peut voir ses propres rôles
ALTER TABLE user_company_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company roles" ON user_company_roles;
CREATE POLICY "Users can view their own company roles"
  ON user_company_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view roles in their company" ON user_company_roles;
CREATE POLICY "Users can view roles in their company"
  ON user_company_roles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_roles WHERE user_id = auth.uid()
    )
  );

-- company_team_members: membres peuvent voir leur équipe
ALTER TABLE company_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view their company team" ON company_team_members;
CREATE POLICY "Team members can view their company team"
  ON company_team_members FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
      UNION
      SELECT company_id FROM company_team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company admins can manage team" ON company_team_members;
CREATE POLICY "Company admins can manage team"
  ON company_team_members FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- application_tags: visible par l'entreprise
ALTER TABLE application_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies can manage leur tags" ON application_tags;
CREATE POLICY "Companies can manage leur tags"
  ON application_tags FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
      UNION
      SELECT company_id FROM company_team_members WHERE user_id = auth.uid()
    )
  );

-- application_tag_assignments
ALTER TABLE application_tag_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can manage application tags" ON application_tag_assignments;
CREATE POLICY "Company members can manage application tags"
  ON application_tag_assignments FOR ALL
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN job_offers o ON a.offer_id = o.id
      WHERE o.company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
        UNION
        SELECT company_id FROM company_team_members WHERE user_id = auth.uid()
      )
    )
  );

-- application_notes
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view notes on applications they can access" ON application_notes;
CREATE POLICY "Users can view notes on applications they can access"
  ON application_notes FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN job_offers o ON a.offer_id = o.id
      WHERE o.company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
        UNION
        SELECT company_id FROM company_team_members WHERE user_id = auth.uid()
      )
    )
    AND (is_private = FALSE OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create notes on accessible applications" ON application_notes;
CREATE POLICY "Users can create notes on accessible applications"
  ON application_notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND application_id IN (
      SELECT a.id FROM applications a
      JOIN job_offers o ON a.offer_id = o.id
      WHERE o.company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
        UNION
        SELECT company_id FROM company_team_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own notes" ON application_notes;
CREATE POLICY "Users can update their own notes"
  ON application_notes FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notes" ON application_notes;
CREATE POLICY "Users can delete their own notes"
  ON application_notes FOR DELETE
  USING (user_id = auth.uid());

-- Fonction pour attribuer automatiquement le rôle "company" lors de la création d'une entreprise
CREATE OR REPLACE FUNCTION assign_default_company_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_company_roles (user_id, company_id, role_name)
  VALUES (NEW.user_id, NEW.company_id, 'company')
  ON CONFLICT (user_id, company_id, role_name) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_assign_default_company_role
  AFTER INSERT ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_company_role();

-- Vues utiles

-- Vue pour obtenir tous les rôles d'un utilisateur dans une entreprise
CREATE OR REPLACE VIEW user_company_role_summary AS
SELECT 
  ucr.user_id,
  ucr.company_id,
  c.name as company_name,
  array_agg(cr.display_name ORDER BY cr.name) as roles,
  array_agg(cr.name ORDER BY cr.name) as role_names
FROM user_company_roles ucr
JOIN company_roles cr ON ucr.role_name = cr.name
JOIN companies c ON ucr.company_id = c.id
GROUP BY ucr.user_id, ucr.company_id, c.name;

-- Commentaires pour la documentation
COMMENT ON TABLE company_roles IS 'Définition des rôles disponibles pour les entreprises';
COMMENT ON TABLE user_company_roles IS 'Attribution des rôles aux utilisateurs d''une entreprise (support multi-rôles)';
COMMENT ON TABLE company_team_members IS 'Membres de l''équipe d''une entreprise';
COMMENT ON TABLE application_tags IS 'Tags personnalisés pour organiser les candidatures';
COMMENT ON TABLE application_tag_assignments IS 'Attribution des tags aux candidatures';
COMMENT ON TABLE application_notes IS 'Notes internes sur les candidatures';
