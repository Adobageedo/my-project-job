-- =====================================================
-- KPI Snapshots & Admin Notification Settings
-- =====================================================

-- Table to store KPI snapshots for historical tracking
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Registration metrics
  companies_registered INTEGER NOT NULL DEFAULT 0,
  candidates_registered INTEGER NOT NULL DEFAULT 0,
  offers_created INTEGER NOT NULL DEFAULT 0,
  
  -- Application metrics
  total_applications INTEGER NOT NULL DEFAULT 0,
  offers_filled INTEGER NOT NULL DEFAULT 0,
  
  -- Activity metrics
  active_company_users INTEGER NOT NULL DEFAULT 0,
  active_candidates INTEGER NOT NULL DEFAULT 0,
  avg_applications_per_user DECIMAL(10,2) NOT NULL DEFAULT 0,
  companies_with_active_users INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique snapshot per date and period type
  UNIQUE(snapshot_date, period_type)
);

-- Create indexes for efficient querying
CREATE INDEX idx_kpi_snapshots_date ON kpi_snapshots(snapshot_date DESC);
CREATE INDEX idx_kpi_snapshots_period ON kpi_snapshots(period_type);

-- Table to store admin notification preferences
CREATE TABLE IF NOT EXISTS admin_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification frequency
  frequency VARCHAR(20) NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'none')),
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- KPI toggles
  kpi_companies_registered BOOLEAN NOT NULL DEFAULT true,
  kpi_candidates_registered BOOLEAN NOT NULL DEFAULT true,
  kpi_offers_created BOOLEAN NOT NULL DEFAULT true,
  kpi_applications BOOLEAN NOT NULL DEFAULT true,
  kpi_offers_filled BOOLEAN NOT NULL DEFAULT true,
  kpi_active_company_users BOOLEAN NOT NULL DEFAULT true,
  kpi_active_candidates BOOLEAN NOT NULL DEFAULT true,
  kpi_avg_applications BOOLEAN NOT NULL DEFAULT true,
  kpi_companies_with_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(admin_id)
);

-- RLS Policies
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- KPI snapshots: readable by admins only
CREATE POLICY "Admins can read KPI snapshots"
  ON kpi_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admin notification settings: admins can manage their own
CREATE POLICY "Admins can manage their notification settings"
  ON admin_notification_settings FOR ALL
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Function to log daily KPI snapshot (can be called by cron)
CREATE OR REPLACE FUNCTION log_daily_kpi_snapshot()
RETURNS void AS $$
DECLARE
  v_companies_registered INTEGER;
  v_candidates_registered INTEGER;
  v_offers_created INTEGER;
  v_total_applications INTEGER;
  v_offers_filled INTEGER;
  v_active_company_users INTEGER;
  v_active_candidates INTEGER;
  v_avg_applications DECIMAL(10,2);
  v_companies_with_active INTEGER;
  v_last_month TIMESTAMPTZ;
BEGIN
  v_last_month := NOW() - INTERVAL '30 days';
  
  -- Get counts
  SELECT COUNT(*) INTO v_companies_registered FROM companies;
  SELECT COUNT(*) INTO v_candidates_registered FROM users WHERE role = 'candidate';
  SELECT COUNT(*) INTO v_offers_created FROM job_offers;
  SELECT COUNT(*) INTO v_total_applications FROM applications;
  SELECT COUNT(*) INTO v_offers_filled FROM job_offers WHERE status = 'filled';
  
  -- Active users (signed in within last 30 days)
  SELECT COUNT(*) INTO v_active_company_users 
  FROM users 
  WHERE role = 'company' AND last_sign_in_at >= v_last_month;
  
  SELECT COUNT(*) INTO v_active_candidates 
  FROM users 
  WHERE role = 'candidate' AND last_sign_in_at >= v_last_month;
  
  -- Average applications per active candidate
  IF v_active_candidates > 0 THEN
    SELECT COALESCE(COUNT(a.id)::DECIMAL / v_active_candidates, 0)
    INTO v_avg_applications
    FROM applications a
    JOIN users u ON a.user_id = u.id
    WHERE u.role = 'candidate' AND u.last_sign_in_at >= v_last_month;
  ELSE
    v_avg_applications := 0;
  END IF;
  
  -- Companies with at least 1 active user
  SELECT COUNT(DISTINCT company_id) INTO v_companies_with_active
  FROM users
  WHERE role = 'company' AND company_id IS NOT NULL AND last_sign_in_at >= v_last_month;
  
  -- Insert snapshot (upsert to handle duplicate runs)
  INSERT INTO kpi_snapshots (
    snapshot_date,
    period_type,
    companies_registered,
    candidates_registered,
    offers_created,
    total_applications,
    offers_filled,
    active_company_users,
    active_candidates,
    avg_applications_per_user,
    companies_with_active_users
  ) VALUES (
    CURRENT_DATE,
    'daily',
    v_companies_registered,
    v_candidates_registered,
    v_offers_created,
    v_total_applications,
    v_offers_filled,
    v_active_company_users,
    v_active_candidates,
    v_avg_applications,
    v_companies_with_active
  )
  ON CONFLICT (snapshot_date, period_type) 
  DO UPDATE SET
    companies_registered = EXCLUDED.companies_registered,
    candidates_registered = EXCLUDED.candidates_registered,
    offers_created = EXCLUDED.offers_created,
    total_applications = EXCLUDED.total_applications,
    offers_filled = EXCLUDED.offers_filled,
    active_company_users = EXCLUDED.active_company_users,
    active_candidates = EXCLUDED.active_candidates,
    avg_applications_per_user = EXCLUDED.avg_applications_per_user,
    companies_with_active_users = EXCLUDED.companies_with_active_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION log_daily_kpi_snapshot() TO service_role;

-- Create a view for easy KPI querying
CREATE OR REPLACE VIEW current_platform_kpis AS
SELECT
  (SELECT COUNT(*) FROM companies) as companies_registered,
  (SELECT COUNT(*) FROM users WHERE role = 'candidate') as candidates_registered,
  (SELECT COUNT(*) FROM job_offers) as offers_created,
  (SELECT COUNT(*) FROM applications) as total_applications,
  (SELECT COUNT(*) FROM job_offers WHERE status = 'filled') as offers_filled,
  (SELECT COUNT(*) FROM users WHERE role = 'company' AND last_sign_in_at >= NOW() - INTERVAL '30 days') as active_company_users,
  (SELECT COUNT(*) FROM users WHERE role = 'candidate' AND last_sign_in_at >= NOW() - INTERVAL '30 days') as active_candidates,
  (SELECT COUNT(DISTINCT company_id) FROM users WHERE role = 'company' AND company_id IS NOT NULL AND last_sign_in_at >= NOW() - INTERVAL '30 days') as companies_with_active_users,
  NOW() as last_updated;
