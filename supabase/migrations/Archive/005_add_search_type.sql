-- =====================================================
-- Migration: Ajouter le champ search_type à la table candidates
-- =====================================================

-- Créer un ENUM pour le type de recherche
CREATE TYPE search_type AS ENUM ('stage', 'alternance', 'both');

-- Ajouter la colonne search_type
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS search_type search_type DEFAULT 'stage';

-- Créer un index pour faciliter les recherches
CREATE INDEX IF NOT EXISTS idx_candidates_search_type ON candidates(search_type);
