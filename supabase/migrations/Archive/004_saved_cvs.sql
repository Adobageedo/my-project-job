-- =====================================================
-- MIGRATION 003: Table saved_cvs
-- =====================================================
-- Stockage des CV multiples pour chaque candidat
-- =====================================================

CREATE TABLE saved_cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,           -- Nom donné par le candidat (ex: "CV Finance 2024")
  url TEXT NOT NULL,                     -- URL complète du fichier dans Storage
  filename VARCHAR(255) NOT NULL,        -- Nom du fichier original
  storage_path TEXT NOT NULL,            -- Chemin dans le bucket (ex: "user-id/file.pdf")
  is_default BOOLEAN DEFAULT FALSE,      -- CV par défaut pour les candidatures
  size INTEGER,                          -- Taille en bytes
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par candidat
CREATE INDEX idx_saved_cvs_candidate ON saved_cvs(candidate_id);
CREATE INDEX idx_saved_cvs_default ON saved_cvs(candidate_id, is_default) WHERE is_default = TRUE;

-- Trigger pour updated_at
CREATE TRIGGER update_saved_cvs_updated_at
  BEFORE UPDATE ON saved_cvs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE saved_cvs ENABLE ROW LEVEL SECURITY;

-- Un candidat peut voir uniquement ses propres CV
CREATE POLICY "candidates_view_own_cvs"
  ON saved_cvs FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Un candidat peut insérer des CV pour lui-même
CREATE POLICY "candidates_insert_own_cvs"
  ON saved_cvs FOR INSERT
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Un candidat peut modifier ses propres CV
CREATE POLICY "candidates_update_own_cvs"
  ON saved_cvs FOR UPDATE
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Un candidat peut supprimer ses propres CV
CREATE POLICY "candidates_delete_own_cvs"
  ON saved_cvs FOR DELETE
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Les recruteurs peuvent voir les CV des candidats qui ont postulé à leurs offres
CREATE POLICY "recruiters_view_applicant_cvs"
  ON saved_cvs FOR SELECT
  USING (
    candidate_id IN (
      SELECT DISTINCT a.candidate_id
      FROM applications a
      JOIN job_offers jo ON a.offer_id = jo.id
      JOIN companies c ON jo.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

COMMENT ON TABLE saved_cvs IS 'CV multiples sauvegardés par les candidats';

-- =====================================================
-- FIN DE LA MIGRATION 003
-- =====================================================
