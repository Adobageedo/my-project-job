-- =====================================================
-- OFFER MANAGERS TABLE
-- For assigning managers/collaborators to specific job offers
-- =====================================================

CREATE TABLE IF NOT EXISTS offer_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Permissions for this manager on this offer
  permissions JSONB DEFAULT '{"can_view_applications": true, "can_change_status": false, "can_add_notes": false, "can_send_emails": false}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one user per offer
  UNIQUE(offer_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offer_managers_offer_id ON offer_managers(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_managers_user_id ON offer_managers(user_id);

-- Enable RLS
ALTER TABLE offer_managers ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can see managers for offers they have access to
CREATE POLICY "Users can view offer managers for their company offers" ON offer_managers
  FOR SELECT USING (
    offer_id IN (
      SELECT jo.id FROM job_offers jo
      JOIN users u ON u.company_id = jo.company_id
      WHERE u.id = auth.uid()
    )
  );

-- Company users can manage offer managers
CREATE POLICY "Company users can manage offer managers" ON offer_managers
  FOR ALL USING (
    offer_id IN (
      SELECT jo.id FROM job_offers jo
      JOIN users u ON u.company_id = jo.company_id
      WHERE u.id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to offer managers" ON offer_managers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
