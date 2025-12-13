import { supabase } from '@/lib/supabase';

export interface PendingCompany {
  id: string;
  name: string;
  siret: string | null;
  sector: string | null;
  size: string | null;
  description: string | null;
  website: string | null;
  linkedin_url: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    is_company_owner: boolean;
    is_primary_company_contact: boolean;
  };
  primary_contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  pending_offers_count: number;
}

/**
 * Get all companies with status 'pending' (for admin validation)
 */
export async function getAllPendingCompanies(): Promise<PendingCompany[]> {
  // Get pending companies
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending companies:', error);
    throw error;
  }

  if (!companies || companies.length === 0) {
    return [];
  }

  // Get creators (company owners) for each company
  const companyIds = companies.map(c => c.id);
  
  const { data: owners } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, company_id, is_company_owner, is_primary_company_contact')
    .in('company_id', companyIds)
    .eq('is_company_owner', true);

  // Get primary contacts if different from owner
  const { data: primaryContacts } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, company_id, is_primary_company_contact')
    .in('company_id', companyIds)
    .eq('is_primary_company_contact', true)
    .eq('is_company_owner', false);

  // Get pending offers count for each company
  const { data: offerCounts } = await supabase
    .from('job_offers')
    .select('company_id')
    .in('company_id', companyIds)
    .eq('status', 'pending_validation');

  // Build the result
  const result: PendingCompany[] = companies.map(company => {
    const creator = owners?.find(o => o.company_id === company.id);
    const primaryContact = primaryContacts?.find(pc => pc.company_id === company.id);
    const pendingOffersCount = offerCounts?.filter(o => o.company_id === company.id).length || 0;

    return {
      ...company,
      creator: creator ? {
        id: creator.id,
        first_name: creator.first_name,
        last_name: creator.last_name,
        email: creator.email,
        is_company_owner: creator.is_company_owner,
        is_primary_company_contact: creator.is_primary_company_contact,
      } : undefined,
      primary_contact: primaryContact ? {
        id: primaryContact.id,
        first_name: primaryContact.first_name,
        last_name: primaryContact.last_name,
        email: primaryContact.email,
      } : null,
      pending_offers_count: pendingOffersCount,
    };
  });

  return result;
}

/**
 * Approve a company - change status to active and activate all pending offers
 */
export async function approveCompany(
  companyId: string
): Promise<{ success: boolean; error?: string; offersActivated?: number }> {
  try {
    // 1. Update company status to active
    const { error: companyError } = await supabase
      .from('companies')
      .update({
        status: 'active',
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (companyError) throw companyError;

    // 2. Activate all pending_validation offers for this company
    const { data: updatedOffers, error: offersError } = await supabase
      .from('job_offers')
      .update({
        status: 'active',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('status', 'pending_validation')
      .select('id');

    if (offersError) {
      console.error('Error activating offers:', offersError);
      // Don't fail the whole operation if offers update fails
    }

    return { 
      success: true, 
      offersActivated: updatedOffers?.length || 0 
    };
  } catch (error) {
    console.error('Error approving company:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Reject a company - change status to suspended with reason
 */
export async function rejectCompany(
  companyId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('companies')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (error) throw error;

    // Also cancel all pending offers
    await supabase
      .from('job_offers')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('status', 'pending_validation');

    // TODO: Send rejection email to company owner with reason

    return { success: true };
  } catch (error) {
    console.error('Error rejecting company:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get count of pending companies (for admin dashboard badge)
 */
export async function getPendingCompaniesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    console.error('Error counting pending companies:', error);
    return 0;
  }

  return count || 0;
}
