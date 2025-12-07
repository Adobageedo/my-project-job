-- =====================================================
-- MIGRATION 002: Tables Techniques Backend
-- =====================================================
-- Tables pour logging et état des services backend
-- (AI Parsing, Email, RecruitCRM Sync, Circuit Breaker)
-- =====================================================

-- =====================================================
-- AI PARSING LOGS
-- =====================================================

CREATE TABLE ai_parsing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(20) NOT NULL, -- 'cv' | 'offer'
  entity_id UUID, -- ID du candidat ou de l'offre (optionnel)
  input_type VARCHAR(10) NOT NULL, -- 'text' | 'pdf'
  input_size INTEGER, -- Taille en bytes
  model VARCHAR(50) NOT NULL, -- Modèle OpenAI utilisé
  prompt_tokens INTEGER,
  response_tokens INTEGER,
  total_cost DECIMAL(10, 6), -- Coût en USD
  status VARCHAR(20) NOT NULL, -- 'success' | 'error'
  error_message TEXT,
  duration INTEGER, -- Durée en ms
  parsed_data JSONB, -- Résultat du parsing
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_parsing_logs_entity ON ai_parsing_logs(entity_type, entity_id);
CREATE INDEX idx_ai_parsing_logs_status ON ai_parsing_logs(status, created_at);

COMMENT ON TABLE ai_parsing_logs IS 'Logs de parsing IA (OpenAI) - CV et offres';

-- =====================================================
-- EMAIL LOGS
-- =====================================================

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template_name VARCHAR(100),
  status VARCHAR(20) NOT NULL, -- 'sent' | 'failed' | 'delivered' | 'bounced'
  resend_message_id VARCHAR(100),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_status ON email_logs(status, created_at);
CREATE INDEX idx_email_logs_resend_id ON email_logs(resend_message_id);

COMMENT ON TABLE email_logs IS 'Logs d''envoi d''emails via Resend';

-- =====================================================
-- RECRUITCRM SYNC
-- =====================================================

CREATE TABLE recruitcrm_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(20) NOT NULL, -- 'candidate' | 'company' | 'offer' | 'application'
  entity_id UUID NOT NULL, -- ID de l'entité dans Supabase
  recruitcrm_id VARCHAR(100) NOT NULL, -- ID dans RecruitCRM
  sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced' | 'pending' | 'error'
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_recruitcrm_sync_entity ON recruitcrm_sync(entity_type, sync_status);
CREATE INDEX idx_recruitcrm_sync_last_sync ON recruitcrm_sync(last_synced_at);

COMMENT ON TABLE recruitcrm_sync IS 'État de synchronisation avec RecruitCRM';

-- =====================================================
-- RECRUITCRM WEBHOOKS
-- =====================================================

CREATE TABLE recruitcrm_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recruitcrm_webhooks_processed ON recruitcrm_webhooks(processed, created_at);

COMMENT ON TABLE recruitcrm_webhooks IS 'Webhooks entrants de RecruitCRM';

-- =====================================================
-- CRON JOBS STATE
-- =====================================================

CREATE TABLE cron_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  schedule VARCHAR(100) NOT NULL, -- Expression cron
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_status VARCHAR(20), -- 'success' | 'error'
  next_run_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cron_jobs_enabled ON cron_jobs(enabled, next_run_at);

COMMENT ON TABLE cron_jobs IS 'État des cron jobs (sync CRM, digest emails, etc.)';

-- =====================================================
-- JOB EXECUTIONS
-- =====================================================

CREATE TABLE job_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'running' | 'success' | 'failed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration INTEGER, -- Durée en ms
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX idx_job_executions_job ON job_executions(job_name, started_at);
CREATE INDEX idx_job_executions_status ON job_executions(status);

COMMENT ON TABLE job_executions IS 'Historique d''exécution des jobs async';

-- =====================================================
-- CIRCUIT BREAKER STATE
-- =====================================================

CREATE TABLE circuit_breaker_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name VARCHAR(100) UNIQUE NOT NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'closed', -- 'closed' | 'open' | 'half_open'
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  metadata JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE circuit_breaker_states IS 'État des circuit breakers pour services externes';

-- =====================================================
-- TRIGGERS pour updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recruitcrm_sync_updated_at
  BEFORE UPDATE ON recruitcrm_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cron_jobs_updated_at
  BEFORE UPDATE ON cron_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_breaker_states_updated_at
  BEFORE UPDATE ON circuit_breaker_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Les tables techniques sont accessibles uniquement via service role
-- Pas d'accès direct depuis le frontend

ALTER TABLE ai_parsing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitcrm_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitcrm_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker_states ENABLE ROW LEVEL SECURITY;

-- Admin peut tout voir
CREATE POLICY "Admins can view all technical logs"
  ON ai_parsing_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Admins can view all sync states"
  ON recruitcrm_sync FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Admins can view all cron jobs"
  ON cron_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- =====================================================
-- INDEXES pour Performance
-- =====================================================

-- Recherche logs par date
CREATE INDEX idx_ai_parsing_logs_created_at ON ai_parsing_logs(created_at DESC);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX idx_job_executions_created_at ON job_executions(started_at DESC);

-- Monitoring coûts AI
CREATE INDEX idx_ai_parsing_logs_cost ON ai_parsing_logs(total_cost) WHERE total_cost IS NOT NULL;

-- Stats emails
CREATE INDEX idx_email_logs_by_status ON email_logs(status, created_at DESC);

-- =====================================================
-- STATS VIEWS (optionnel - pour dashboard admin)
-- =====================================================

CREATE OR REPLACE VIEW ai_parsing_stats AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  entity_type,
  COUNT(*) AS total_parses,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_parses,
  COUNT(*) FILTER (WHERE status = 'error') AS failed_parses,
  SUM(total_cost) AS total_cost_usd,
  AVG(duration) AS avg_duration_ms,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(response_tokens) AS total_response_tokens
FROM ai_parsing_logs
GROUP BY DATE_TRUNC('day', created_at), entity_type
ORDER BY date DESC;

CREATE OR REPLACE VIEW email_stats AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS total_emails,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'bounced') AS bounced
FROM email_logs
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

COMMENT ON VIEW ai_parsing_stats IS 'Statistiques quotidiennes de parsing IA';
COMMENT ON VIEW email_stats IS 'Statistiques quotidiennes d''envoi d''emails';

-- =====================================================
-- FIN DE LA MIGRATION 002
-- =====================================================
