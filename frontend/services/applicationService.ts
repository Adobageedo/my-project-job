import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export type ApplicationStatus = 'pending' | 'in_progress' | 'interview' | 'rejected' | 'accepted' | 'withdrawn';

export interface ApplicationOffer {
  id: string;
  title: string;
  description: string | null;
  contract_type: string;
  location_city: string | null;
  duration_months: number | null;
  start_date: string | null;
  remuneration_min: number | null;
  remuneration_max: number | null;
  status: string;
}

export interface ApplicationCompany {
  id: string;
  name: string;
  logo_url: string | null;
  sector: string | null;
  size: string | null;
}

export interface DBApplication {
  id: string;
  candidate_id: string;
  job_offer_id: string;
  company_id: string;
  cover_letter: string | null;
  cover_letter_file_url: string | null;
  custom_answers: Record<string, unknown>;
  cv_snapshot_url: string | null;
  status: ApplicationStatus;
  status_updated_at: string;
  status_updated_by: string | null;
  interview_scheduled_at: string | null;
  interview_type: string | null;
  interview_notes: string | null;
  rating: number | null;
  internal_notes: string | null;
  rejection_reason: string | null;
  kanban_position: number;
  source: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  job_offer?: ApplicationOffer;
  company?: ApplicationCompany;
}

// Frontend-compatible application format
export interface FrontendApplication {
  id: string;
  candidateId: string;
  offerId: string;
  companyId: string;
  applicationDate: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  coverLetterFileUrl: string | null;
  cvUrl: string | null;
  // Offer details (mapped to frontend format)
  offer: {
    id: string;
    title: string;
    description: string;
    contractType: string;
    location: string;
    duration: string;
    startDate: string | null;
    salary: string;
    status: string;
    company: {
      id: string;
      name: string;
      logo_url: string | null;
      sector: string | null;
      size: string | null;
    };
  };
  // Interview info
  interviewScheduledAt: string | null;
  interviewType: string | null;
  // Status history
  statusUpdatedAt: string;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function formatDuration(months: number | null): string {
  if (!months) return '';
  if (months === 1) return '1 mois';
  if (months < 12) return `${months} mois`;
  if (months === 12) return '1 an';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} an${years > 1 ? 's' : ''}`;
  return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return '';
  if (min && max && min !== max) {
    return `${min}€ - ${max}€/mois`;
  }
  return `${min || max}€/mois`;
}

function mapApplicationToFrontend(dbApp: DBApplication): FrontendApplication {
  const offer = dbApp.job_offer;
  const company = dbApp.company;

  return {
    id: dbApp.id,
    candidateId: dbApp.candidate_id,
    offerId: dbApp.job_offer_id,
    companyId: dbApp.company_id,
    applicationDate: dbApp.created_at,
    status: dbApp.status,
    coverLetter: dbApp.cover_letter,
    coverLetterFileUrl: dbApp.cover_letter_file_url || null,
    cvUrl: dbApp.cv_snapshot_url,
    offer: {
      id: offer?.id || dbApp.job_offer_id,
      title: offer?.title || 'Offre non disponible',
      description: offer?.description || '',
      contractType: offer?.contract_type || '',
      location: offer?.location_city || '',
      duration: formatDuration(offer?.duration_months || null),
      startDate: offer?.start_date || null,
      salary: formatSalary(offer?.remuneration_min || null, offer?.remuneration_max || null),
      status: offer?.status || 'unknown',
      company: {
        id: company?.id || dbApp.company_id,
        name: company?.name || 'Entreprise',
        logo_url: company?.logo_url || null,
        sector: company?.sector || null,
        size: company?.size || null,
      },
    },
    interviewScheduledAt: dbApp.interview_scheduled_at,
    interviewType: dbApp.interview_type,
    statusUpdatedAt: dbApp.status_updated_at,
  };
}

// =====================================================
// CANDIDATE APPLICATION FUNCTIONS
// =====================================================

/**
 * Get all applications for a candidate
 */
export async function getCandidateApplications(
  candidateId: string
): Promise<FrontendApplication[]> {
  if (!candidateId || typeof candidateId !== 'string') {
    console.error('getCandidateApplications: Invalid candidateId:', candidateId);
    return [];
  }

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job_offer:job_offers(
        id,
        title,
        description,
        contract_type,
        location_city,
        duration_months,
        start_date,
        remuneration_min,
        remuneration_max,
        status
      ),
      company:companies(
        id,
        name,
        logo_url,
        sector,
        size
      )
    `)
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching candidate applications:', error);
    return [];
  }

  return (data || []).map(mapApplicationToFrontend);
}

/**
 * Get a single application by ID
 */
export async function getApplicationById(
  applicationId: string,
  candidateId: string
): Promise<FrontendApplication | null> {
  if (!applicationId || !candidateId) {
    console.error('getApplicationById: Invalid IDs:', { applicationId, candidateId });
    return null;
  }

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job_offer:job_offers(
        id,
        title,
        description,
        contract_type,
        location_city,
        duration_months,
        start_date,
        remuneration_min,
        remuneration_max,
        status
      ),
      company:companies(
        id,
        name,
        logo_url,
        sector,
        size
      )
    `)
    .eq('id', applicationId)
    .eq('candidate_id', candidateId)
    .single();

  if (error) {
    console.error('Error fetching application:', error);
    return null;
  }

  return mapApplicationToFrontend(data);
}

/**
 * Withdraw (delete) an application
 * Supprime physiquement la candidature pour permettre de re-candidater
 * Only pending applications can be withdrawn
 */
export async function withdrawApplication(
  applicationId: string,
  candidateId: string
): Promise<{ success: boolean; error?: string }> {
  if (!applicationId || !candidateId) {
    return { success: false, error: 'IDs invalides' };
  }

  // First check if application exists and is pending
  const { data: app, error: fetchError } = await supabase
    .from('applications')
    .select('id, status')
    .eq('id', applicationId)
    .eq('candidate_id', candidateId)
    .single();

  if (fetchError || !app) {
    return { success: false, error: 'Candidature non trouvée' };
  }

  if (app.status !== 'pending') {
    return { success: false, error: 'Seules les candidatures en attente peuvent être retirées' };
  }

  // Supprimer physiquement la candidature pour permettre de re-candidater
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)
    .eq('candidate_id', candidateId);

  if (error) {
    console.error('Error withdrawing application:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete an application completely (only for withdrawn applications)
 */
export async function deleteApplication(
  applicationId: string,
  candidateId: string
): Promise<{ success: boolean; error?: string }> {
  if (!applicationId || !candidateId) {
    return { success: false, error: 'IDs invalides' };
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)
    .eq('candidate_id', candidateId);

  if (error) {
    console.error('Error deleting application:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get application statistics for a candidate
 */
export async function getCandidateApplicationStats(
  candidateId: string
): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  interview: number;
  accepted: number;
  rejected: number;
}> {
  if (!candidateId) {
    return { total: 0, pending: 0, inProgress: 0, interview: 0, accepted: 0, rejected: 0 };
  }

  const { data, error } = await supabase
    .from('applications')
    .select('status')
    .eq('candidate_id', candidateId)
    .neq('status', 'withdrawn');

  if (error) {
    console.error('Error fetching application stats:', error);
    return { total: 0, pending: 0, inProgress: 0, interview: 0, accepted: 0, rejected: 0 };
  }

  const stats = {
    total: data.length,
    pending: data.filter(a => a.status === 'pending').length,
    inProgress: data.filter(a => a.status === 'in_progress').length,
    interview: data.filter(a => a.status === 'interview').length,
    accepted: data.filter(a => a.status === 'accepted').length,
    rejected: data.filter(a => a.status === 'rejected').length,
  };

  return stats;
}

/**
 * Check if candidate has already applied to an offer
 */
export async function hasAppliedToOffer(
  candidateId: string,
  jobOfferId: string
): Promise<boolean> {
  if (!candidateId || !jobOfferId) {
    return false;
  }

  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('job_offer_id', jobOfferId)
    .neq('status', 'withdrawn')
    .maybeSingle();

  if (error) {
    console.error('Error checking application:', error);
    return false;
  }

  return !!data;
}

/**
 * Get application for a specific offer (if exists)
 */
export async function getApplicationForOffer(
  candidateId: string,
  jobOfferId: string
): Promise<FrontendApplication | null> {
  if (!candidateId || !jobOfferId) {
    return null;
  }

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job_offer:job_offers(
        id,
        title,
        description,
        contract_type,
        location_city,
        duration_months,
        start_date,
        remuneration_min,
        remuneration_max,
        status
      ),
      company:companies(
        id,
        name,
        logo_url,
        sector,
        size
      )
    `)
    .eq('candidate_id', candidateId)
    .eq('job_offer_id', jobOfferId)
    .neq('status', 'withdrawn')
    .maybeSingle();

  if (error) {
    console.error('Error fetching application for offer:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapApplicationToFrontend(data);
}
