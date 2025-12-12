-- Migration: Create platform_stats table for dynamic homepage statistics
-- Date: 2024-12-12

-- Create the platform_stats table
CREATE TABLE IF NOT EXISTS platform_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    label VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_stats_key ON platform_stats(key);

-- Insert default statistics
INSERT INTO platform_stats (key, value, label, display_order) VALUES
    ('partner_companies', 50, 'Entreprises partenaires', 1),
    ('qualified_candidates', 500, 'Candidats qualifiés', 2),
    ('active_opportunities', 200, 'Opportunités actives', 3)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read stats (public data)
CREATE POLICY "Anyone can read platform stats" ON platform_stats
    FOR SELECT USING (true);

-- Policy: Only admins can update stats
CREATE POLICY "Only admins can update platform stats" ON platform_stats
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can insert stats
CREATE POLICY "Only admins can insert platform stats" ON platform_stats
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can delete stats
CREATE POLICY "Only admins can delete platform stats" ON platform_stats
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_platform_stats_updated_at ON platform_stats;
CREATE TRIGGER trigger_platform_stats_updated_at
    BEFORE UPDATE ON platform_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_stats_updated_at();

-- Comment on table
COMMENT ON TABLE platform_stats IS 'Stores platform statistics displayed on the homepage';
COMMENT ON COLUMN platform_stats.key IS 'Unique identifier for the stat (e.g., partner_companies)';
COMMENT ON COLUMN platform_stats.value IS 'The actual numeric value';
COMMENT ON COLUMN platform_stats.label IS 'Display label in French';
COMMENT ON COLUMN platform_stats.display_order IS 'Order in which stats appear on homepage';
