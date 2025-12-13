import { supabase } from '@/lib/supabase';

export interface PendingJobOffer {
  id: string;
  company_id: string;
  created_by: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  missions: string | null;
  objectives: string | null;
  required_skills: string[];
  preferred_skills: string[];
  education_level: string | null;
  min_education_level: string | null;
  specializations_accepted: string[];
  contract_type: string;
  duration_months: number | null;
  start_date: string | null;
  start_date_flexible: boolean;
  remuneration_min: number | null;
  remuneration_max: number | null;
  remuneration_currency: string;
  remuneration_period: string;
  benefits: string[];
  location_city: string | null;
  location_postal_code: string | null;
  location_country: string;
  remote_policy: string | null;
  remote_days_per_week: number | null;
  application_method: string;
  application_email: string | null;
  application_url: string | null;
  requires_cover_letter: boolean;
  custom_questions: unknown[];
  status: string;
  is_featured: boolean;
  is_urgent: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    status: string;
  };
  creator?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

/**
 * Get all offers with status 'pending_validation' (for admin validation)
 */
export async function getAllPendingOffers(): Promise<PendingJobOffer[]> {
  const { data, error } = await supabase
    .from('job_offers')
    .select(`
      *,
      company:companies(id, name, logo_url, status),
      creator:users!job_offers_created_by_fkey(id, first_name, last_name, email)
    `)
    .eq('status', 'pending_validation')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending offers:', error);
    throw error;
  }

  return (data || []) as PendingJobOffer[];
}

/**
 * Approve a draft offer - change status to active and publish
 */
export async function approvePendingOffer(
  offerId: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('job_offers')
      .update({
        status: 'active',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (error) throw error;

    // Optionally log the admin action
    if (adminNotes) {
      console.log(`Offer ${offerId} approved with notes: ${adminNotes}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error approving offer:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Reject a draft offer - change status to cancelled with reason
 */
export async function rejectPendingOffer(
  offerId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('job_offers')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        // Store rejection reason in parsed_data for now (or add a dedicated column)
        parsed_data: { rejection_reason: rejectionReason, rejected_at: new Date().toISOString() },
      })
      .eq('id', offerId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error rejecting offer:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get count of pending offers (for admin dashboard badge)
 */
export async function getPendingOffersCount(): Promise<number> {
  const { count, error } = await supabase
    .from('job_offers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_validation');

  if (error) {
    console.error('Error counting pending offers:', error);
    return 0;
  }

  return count || 0;
}
