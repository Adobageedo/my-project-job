-- =====================================================
-- ADD MANAGER EMAIL TO JOB OFFERS
-- This field stores the hiring manager's email for internal use
-- It is NOT visible to candidates
-- =====================================================

ALTER TABLE job_offers 
ADD COLUMN IF NOT EXISTS manager_email VARCHAR(255);

-- Add comment to clarify the field's purpose
COMMENT ON COLUMN job_offers.manager_email IS 'Email du responsable hiérarchique - usage interne uniquement, non visible par les candidats';

-- Migration: Simplifier les paramètres de notification
-- Date: 2024-12-09
-- 
-- Structure simplifiée:
-- - email_matching_offers: Alertes pour les offres correspondant au profil
-- - email_application_updates: Notifications pour les changements de statut de candidatures

-- Ajouter les colonnes simplifiées
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS email_matching_offers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_application_updates BOOLEAN DEFAULT true;

-- Commentaires sur les colonnes
COMMENT ON COLUMN notification_settings.email_matching_offers IS 'Alertes email pour les offres correspondant au profil';
COMMENT ON COLUMN notification_settings.email_application_updates IS 'Notifications email pour les changements de statut de candidatures';

-- Migration: Ajouter les options de fréquence avancées pour les recherches sauvegardées
-- Date: 2024-12-09

-- Modifier la colonne notification_frequency pour accepter plus de valeurs
ALTER TABLE saved_searches 
ALTER COLUMN notification_frequency TYPE VARCHAR(30);

-- Ajouter les nouvelles colonnes pour les options de fréquence avancées
ALTER TABLE saved_searches 
ADD COLUMN IF NOT EXISTS preferred_day VARCHAR(20) DEFAULT 'monday', -- 'monday', 'tuesday', etc.
ADD COLUMN IF NOT EXISTS preferred_hour INTEGER DEFAULT 9, -- 0-23
ADD COLUMN IF NOT EXISTS biweekly_week INTEGER DEFAULT 1; -- 1 ou 2 pour les semaines paires/impaires

-- Commentaires sur les colonnes
COMMENT ON COLUMN saved_searches.notification_frequency IS 'Fréquence: instant, daily, weekly, biweekly';
COMMENT ON COLUMN saved_searches.preferred_day IS 'Jour préféré pour les alertes hebdomadaires/bi-hebdomadaires';
COMMENT ON COLUMN saved_searches.preferred_hour IS 'Heure préférée pour les alertes (0-23)';
COMMENT ON COLUMN saved_searches.biweekly_week IS 'Semaine pour bi-hebdomadaire (1=impaire, 2=paire)';

-- Mettre à jour les valeurs par défaut existantes
UPDATE saved_searches 
SET preferred_day = 'monday', preferred_hour = 9 
WHERE preferred_day IS NULL;
