import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface JobOffer {
  id: string;
  company_id: string;
  created_by: string | null;
  
  // Basic info
  title: string;
  slug: string | null;
  
  // Description
  description: string | null;
  missions: string | null;
  objectives: string | null;
  
  // Requirements
  required_skills: string[];
  preferred_skills: string[];
  education_level: string | null;
  min_education_level: string | null;
  specializations_accepted: string[];
  
  // Contract
  contract_type: 'stage' | 'alternance' | 'cdi' | 'cdd';
  duration_months: number | null;
  start_date: string | null;
  start_date_flexible: boolean;
  
  // Compensation
  remuneration_min: number | null;
  remuneration_max: number | null;
  remuneration_currency: string;
  remuneration_period: string;
  benefits: string[];
  
  // Location
  location_city: string | null;
  location_postal_code: string | null;
  location_country: string;
  remote_policy: string | null;
  remote_days_per_week: number | null;
  
  // Application settings
  application_method: string;
  application_email: string | null;
  application_url: string | null;
  requires_cover_letter: boolean;
  custom_questions: Array<{ id: string; question: string; required: boolean }>;
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'expired' | 'filled' | 'cancelled';
  is_featured: boolean;
  is_urgent: boolean;
  
  // Dates
  published_at: string | null;
  expires_at: string | null;
  filled_at: string | null;
  
  // Stats
  views_count: number;
  applications_count: number;
  
  // Source
  source_type: string;
  source_file_url: string | null;
  parsed_data: Record<string, unknown> | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    sector: string | null;
    size: string | null;
  };
}

export interface JobOfferFilters {
  search?: string;
  contract_types?: string[];
  education_levels?: string[];
  locations?: string[];
  remote_policy?: string;
  start_date_from?: string;
  start_date_to?: string;
  company_id?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'published_at' | 'start_date' | 'applications_count';
  sort_order?: 'asc' | 'desc';
}

export interface JobOfferCreateData {
  title: string;
  description?: string;
  missions?: string;
  objectives?: string;
  required_skills?: string[];
  preferred_skills?: string[];
  education_level?: string;
  min_education_level?: string;
  specializations_accepted?: string[];
  contract_type: 'stage' | 'alternance' | 'cdi' | 'cdd';
  duration_months?: number;
  start_date?: string;
  start_date_flexible?: boolean;
  remuneration_min?: number;
  remuneration_max?: number;
  remuneration_period?: string;
  benefits?: string[];
  location_city?: string;
  location_postal_code?: string;
  remote_policy?: string;
  remote_days_per_week?: number;
  application_method?: string;
  application_email?: string;
  application_url?: string;
  requires_cover_letter?: boolean;
  custom_questions?: Array<{ id: string; question: string; required: boolean }>;
  status?: 'draft' | 'active';
  is_featured?: boolean;
  is_urgent?: boolean;
  expires_at?: string;
}

export type JobOfferUpdateData = Partial<JobOfferCreateData>;

// =====================================================
// PUBLIC OFFER FUNCTIONS (for candidates)
// =====================================================

/**
 * Search active job offers (public)
 */
export async function searchOffers(
  filters: JobOfferFilters = {}
): Promise<{ offers: JobOffer[]; total: number }> {
  const {
    search,
    contract_types,
    education_levels,
    locations,
    remote_policy,
    start_date_from,
    start_date_to,
    page = 1,
    limit = 20,
    sort_by = 'published_at',
    sort_order = 'desc'
  } = filters;

  const offset = (page - 1) * limit;

  let query = supabase
    .from('job_offers')
    .select(`
      *,
      company:companies(id, name, logo_url, sector, size)
    `, { count: 'exact' })
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  // Text search
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,missions.ilike.%${search}%`);
  }

  // Contract type filter
  if (contract_types && contract_types.length > 0) {
    query = query.in('contract_type', contract_types);
  }

  // Education level filter
  if (education_levels && education_levels.length > 0) {
    query = query.in('education_level', education_levels);
  }

  // Location filter
  if (locations && locations.length > 0) {
    query = query.in('location_city', locations);
  }

  // Remote policy filter
  if (remote_policy) {
    query = query.eq('remote_policy', remote_policy);
  }

  // Start date range
  if (start_date_from) {
    query = query.gte('start_date', start_date_from);
  }
  if (start_date_to) {
    query = query.lte('start_date', start_date_to);
  }

  // Sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching offers:', error);
    return { offers: [], total: 0 };
  }

  return {
    offers: (data || []) as JobOffer[],
    total: count || 0
  };
}

/**
 * Get offer by ID (public)
 */
export async function getOfferById(id: string): Promise<JobOffer | null> {
  const { data, error } = await supabase
    .from('job_offers')
    .select(`
      *,
      company:companies(id, name, logo_url, sector, size, description, website)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching offer:', error);
    return null;
  }

  return data as JobOffer;
}

/**
 * Get offer by slug (public)
 */
export async function getOfferBySlug(slug: string): Promise<JobOffer | null> {
  const { data, error } = await supabase
    .from('job_offers')
    .select(`
      *,
      company:companies(id, name, logo_url, sector, size, description, website)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching offer:', error);
    return null;
  }

  return data as JobOffer;
}

/**
 * Increment view count
 */
export async function incrementOfferViews(offerId: string): Promise<void> {
  try {
    await supabase.rpc('increment_offer_views', { offer_id: offerId });
  } catch {
    // RPC doesn't exist, ignore - views tracking is optional
  }
}

/**
 * Get similar offers
 */
export async function getSimilarOffers(offerId: string, limit: number = 4): Promise<JobOffer[]> {
  // First get the current offer
  const offer = await getOfferById(offerId);
  if (!offer) return [];

  const { data, error } = await supabase
    .from('job_offers')
    .select(`
      *,
      company:companies(id, name, logo_url, sector)
    `)
    .eq('status', 'active')
    .neq('id', offerId)
    .or(`contract_type.eq.${offer.contract_type},location_city.eq.${offer.location_city}`)
    .limit(limit);

  if (error) {
    console.error('Error fetching similar offers:', error);
    return [];
  }

  return (data || []) as JobOffer[];
}

/**
 * Get featured offers
 */
export async function getFeaturedOffers(limit: number = 6): Promise<JobOffer[]> {
  const { data, error } = await supabase
    .from('job_offers')
    .select(`
      *,
      company:companies(id, name, logo_url, sector)
    `)
    .eq('status', 'active')
    .eq('is_featured', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured offers:', error);
    return [];
  }

  return (data || []) as JobOffer[];
}

/**
 * Get recent offers
 */
export async function getRecentOffers(limit: number = 10): Promise<JobOffer[]> {
  const { data, error } = await supabase
    .from('job_offers')
    .select(`
      *,
      company:companies(id, name, logo_url, sector)
    `)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent offers:', error);
    return [];
  }

  return (data || []) as JobOffer[];
}

// =====================================================
// COMPANY OFFER MANAGEMENT
// =====================================================

/**
 * Get company's offers
 */
export async function getCompanyOffers(
  companyId: string,
  filters: { status?: string; page?: number; limit?: number } = {}
): Promise<{ offers: JobOffer[]; total: number }> {
  const { status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('job_offers')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching company offers:', error);
    return { offers: [], total: 0 };
  }

  return {
    offers: (data || []) as JobOffer[],
    total: count || 0
  };
}

/**
 * Create job offer
 */
export async function createOffer(
  companyId: string,
  offerData: JobOfferCreateData
): Promise<{ success: boolean; offer?: JobOffer; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('job_offers')
    .insert({
      company_id: companyId,
      created_by: user?.id,
      ...offerData,
      published_at: offerData.status === 'active' ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating offer:', error);
    return { success: false, error: error.message };
  }

  return { success: true, offer: data as JobOffer };
}

/**
 * Update job offer
 */
export async function updateOffer(
  offerId: string,
  updates: JobOfferUpdateData
): Promise<{ success: boolean; error?: string }> {
  // If publishing for the first time, set published_at
  if (updates.status === 'active') {
    const { data: existingOffer } = await supabase
      .from('job_offers')
      .select('published_at')
      .eq('id', offerId)
      .single();

    if (!existingOffer?.published_at) {
      (updates as Record<string, unknown>).published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from('job_offers')
    .update(updates)
    .eq('id', offerId);

  if (error) {
    console.error('Error updating offer:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Publish offer
 */
export async function publishOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
  return updateOffer(offerId, { status: 'active' });
}

/**
 * Pause offer
 */
export async function pauseOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('job_offers')
    .update({ status: 'paused' })
    .eq('id', offerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Close offer (mark as filled)
 */
export async function closeOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('job_offers')
    .update({
      status: 'filled',
      filled_at: new Date().toISOString()
    })
    .eq('id', offerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete offer (only drafts)
 */
export async function deleteOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
  // First check if it's a draft
  const { data: offer } = await supabase
    .from('job_offers')
    .select('status')
    .eq('id', offerId)
    .single();

  if (offer?.status !== 'draft') {
    return { success: false, error: 'Seuls les brouillons peuvent être supprimés' };
  }

  const { error } = await supabase
    .from('job_offers')
    .delete()
    .eq('id', offerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Duplicate offer (as draft)
 */
export async function duplicateOffer(offerId: string): Promise<{ success: boolean; offer?: JobOffer; error?: string }> {
  const { data: original, error: fetchError } = await supabase
    .from('job_offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (fetchError || !original) {
    return { success: false, error: 'Offre introuvable' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Remove fields that shouldn't be duplicated
  const { id, slug, published_at, expires_at, filled_at, views_count, applications_count, created_at, updated_at, ...offerData } = original;

  const { data, error } = await supabase
    .from('job_offers')
    .insert({
      ...offerData,
      title: `${offerData.title} (copie)`,
      status: 'draft',
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, offer: data as JobOffer };
}

// =====================================================
// OFFER PARSING (from PDF)
// =====================================================

/**
 * Parse offer from PDF file
 * Note: This calls the backend API for AI parsing
 */
export async function parseOfferFromPdf(
  companyId: string,
  file: File
): Promise<{ success: boolean; offer?: Partial<JobOfferCreateData>; error?: string }> {
  // Upload file first
  const fileExt = file.name.split('.').pop();
  const fileName = `${companyId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('offer-pdfs')
    .upload(fileName, file);

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('offer-pdfs')
    .getPublicUrl(fileName);

  // Call backend for parsing (this would be your Railway API)
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: publicUrl })
    });

    if (!response.ok) {
      throw new Error('Parsing failed');
    }

    const parsedData = await response.json();

    return {
      success: true,
      offer: {
        ...parsedData,
        source_type: 'pdf_parsed',
        source_file_url: publicUrl
      }
    };
  } catch (error) {
    console.error('Error parsing offer:', error);
    return { success: false, error: 'Échec du parsing du PDF' };
  }
}

// =====================================================
// STATISTICS
// =====================================================

/**
 * Get offer statistics
 */
export async function getOfferStats(offerId: string) {
  const { data: applications, error } = await supabase
    .from('applications')
    .select('status, created_at')
    .eq('job_offer_id', offerId);

  if (error) {
    console.error('Error fetching offer stats:', error);
    return null;
  }

  const byStatus: Record<string, number> = {};
  const byDay: Record<string, number> = {};

  (applications || []).forEach(app => {
    // Count by status
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;

    // Count by day
    const day = app.created_at.split('T')[0];
    byDay[day] = (byDay[day] || 0) + 1;
  });

  return {
    total: applications?.length || 0,
    byStatus,
    byDay
  };
}

/**
 * Get filter options (for search filters)
 */
export async function getFilterOptions() {
  const [locationsResult, sectorsResult] = await Promise.all([
    supabase
      .from('job_offers')
      .select('location_city')
      .eq('status', 'active')
      .not('location_city', 'is', null),
    supabase
      .from('companies')
      .select('sector')
      .eq('status', 'active')
      .not('sector', 'is', null)
  ]);

  const locations = [...new Set((locationsResult.data || []).map(o => o.location_city).filter(Boolean))];
  const sectors = [...new Set((sectorsResult.data || []).map(c => c.sector).filter(Boolean))];

  return {
    locations,
    sectors,
    contractTypes: ['stage', 'alternance', 'cdi', 'cdd'],
    educationLevels: ['bac', 'bac+1', 'bac+2', 'bac+3', 'bac+4', 'bac+5', 'bac+6', 'doctorat'],
    remotePolicies: ['on-site', 'hybrid', 'remote']
  };
}

// =====================================================
// ALIASES FOR BACKWARD COMPATIBILITY
// =====================================================

/**
 * Get all offers (alias for searchOffers with no filters)
 */
export async function getAllOffers(): Promise<JobOffer[]> {
  const { offers } = await searchOffers({ limit: 100 });
  return offers;
}

/**
 * Parse job offer PDF (alias for parseOfferFromPdf)
 */
export const parseJobOfferPDF = parseOfferFromPdf;
