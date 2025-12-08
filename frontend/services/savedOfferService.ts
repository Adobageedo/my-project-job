import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface SavedOfferCompany {
  id: string;
  name: string;
  logo_url: string | null;
  sector?: string | null;
  size?: string | null;
}

export interface SavedOfferJob {
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
  required_skills: string[];
  company: SavedOfferCompany;
}

export interface DBSavedOffer {
  id: string;
  user_id: string;
  job_offer_id: string;
  notes: string | null;
  created_at: string;
  job_offer: SavedOfferJob;
}

// Frontend-compatible saved offer format
export interface FrontendSavedOffer {
  id: string;
  offerId: string;
  savedAt: string;
  notes: string | null;
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
    skills: string[];
    company: {
      id: string;
      name: string;
      logoUrl: string | null;
      sector: string | null;
      size: string | null;
    };
  };
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

function mapSavedOfferToFrontend(dbSaved: any): FrontendSavedOffer {
  // Supabase can return arrays for relations, handle both cases
  const offer = Array.isArray(dbSaved.job_offer) ? dbSaved.job_offer[0] : dbSaved.job_offer;
  const company = offer?.company ? (Array.isArray(offer.company) ? offer.company[0] : offer.company) : null;

  return {
    id: dbSaved.id,
    offerId: dbSaved.job_offer_id,
    savedAt: dbSaved.created_at,
    notes: dbSaved.notes,
    offer: {
      id: offer?.id || dbSaved.job_offer_id,
      title: offer?.title || 'Offre non disponible',
      description: offer?.description || '',
      contractType: offer?.contract_type || '',
      location: offer?.location_city || '',
      duration: formatDuration(offer?.duration_months || null),
      startDate: offer?.start_date || null,
      salary: formatSalary(offer?.remuneration_min || null, offer?.remuneration_max || null),
      status: offer?.status || 'unknown',
      skills: offer?.required_skills || [],
      company: {
        id: company?.id || '',
        name: company?.name || 'Entreprise',
        logoUrl: company?.logo_url || null,
        sector: company?.sector || null,
        size: company?.size || null,
      },
    },
  };
}

// =====================================================
// SAVED OFFER FUNCTIONS
// =====================================================

/**
 * Get all saved offers for a candidate
 */
export async function getSavedOffers(
  candidateId: string
): Promise<FrontendSavedOffer[]> {
  if (!candidateId || typeof candidateId !== 'string') {
    console.error('getSavedOffers: Invalid candidateId:', candidateId);
    return [];
  }

  const { data, error } = await supabase
    .from('saved_offers')
    .select(`
      id,
      user_id,
      job_offer_id,
      notes,
      created_at,
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
        status,
        required_skills,
        company:companies(
          id,
          name,
          logo_url,
          sector,
          size
        )
      )
    `)
    .eq('user_id', candidateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved offers:', error);
    return [];
  }

  return (data || []).map(mapSavedOfferToFrontend);
}

/**
 * Save an offer
 */
export async function saveOffer(
  candidateId: string,
  jobOfferId: string,
  notes?: string
): Promise<{ success: boolean; savedOfferId?: string; error?: string }> {
  if (!candidateId || !jobOfferId) {
    console.error('saveOffer: Invalid IDs', { candidateId, jobOfferId });
    return { success: false, error: 'IDs invalides' };
  }

  const { data, error } = await supabase
    .from('saved_offers')
    .insert({ 
      user_id: candidateId, 
      job_offer_id: jobOfferId,
      notes: notes || null
    })
    .select('id')
    .single();

  if (error) {
    console.error('saveOffer: Error', error);
    if (error.code === '23505') {
      // Already saved - get existing ID
      const { data: existing } = await supabase
        .from('saved_offers')
        .select('id')
        .eq('user_id', candidateId)
        .eq('job_offer_id', jobOfferId)
        .single();
      return { success: true, savedOfferId: existing?.id };
    }
    return { success: false, error: error.message };
  }

  return { success: true, savedOfferId: data?.id };
}

/**
 * Remove a saved offer
 */
export async function unsaveOffer(
  candidateId: string,
  jobOfferId: string
): Promise<{ success: boolean; error?: string }> {
  if (!candidateId || !jobOfferId) {
    return { success: false, error: 'IDs invalides' };
  }

  const { error } = await supabase
    .from('saved_offers')
    .delete()
    .eq('user_id', candidateId)
    .eq('job_offer_id', jobOfferId);

  if (error) {
    console.error('Error removing saved offer:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update notes for a saved offer
 */
export async function updateSavedOfferNotes(
  candidateId: string,
  jobOfferId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  if (!candidateId || !jobOfferId) {
    return { success: false, error: 'IDs invalides' };
  }

  const { error } = await supabase
    .from('saved_offers')
    .update({ notes })
    .eq('user_id', candidateId)
    .eq('job_offer_id', jobOfferId);

  if (error) {
    console.error('Error updating saved offer notes:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if an offer is saved
 */
export async function isOfferSaved(
  candidateId: string,
  jobOfferId: string
): Promise<boolean> {
  if (!candidateId || !jobOfferId) {
    return false;
  }

  const { data, error } = await supabase
    .from('saved_offers')
    .select('id')
    .eq('user_id', candidateId)
    .eq('job_offer_id', jobOfferId)
    .maybeSingle();

  if (error) {
    console.error('Error checking saved offer:', error);
    return false;
  }

  return !!data;
}

/**
 * Toggle save status for an offer
 */
export async function toggleSaveOffer(
  candidateId: string,
  jobOfferId: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  const currentlySaved = await isOfferSaved(candidateId, jobOfferId);
  
  if (currentlySaved) {
    const result = await unsaveOffer(candidateId, jobOfferId);
    return { ...result, isSaved: false };
  } else {
    const result = await saveOffer(candidateId, jobOfferId);
    return { success: result.success, isSaved: true, error: result.error };
  }
}

/**
 * Get count of saved offers
 */
export async function getSavedOffersCount(
  candidateId: string
): Promise<number> {
  if (!candidateId) {
    return 0;
  }

  const { count, error } = await supabase
    .from('saved_offers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', candidateId);

  if (error) {
    console.error('Error counting saved offers:', error);
    return 0;
  }

  return count || 0;
}
