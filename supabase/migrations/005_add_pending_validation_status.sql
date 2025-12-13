-- =====================================================
-- ADD PENDING_VALIDATION STATUS TO OFFER_STATUS ENUM
-- For offers from non-validated companies awaiting admin approval
-- =====================================================

-- Add new value to offer_status enum
-- This must be run outside a transaction block
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'pending_validation';
