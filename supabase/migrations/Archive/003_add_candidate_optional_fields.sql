-- =====================================================
-- Migration: Ajouter des champs optionnels à la table candidates
-- =====================================================

-- Ajouter les champs LinkedIn, Portfolio, Bio et Skills
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Créer un index GIN pour recherche sur les compétences
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN(skills);
