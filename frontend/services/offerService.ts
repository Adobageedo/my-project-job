import { supabase } from '@/lib/supabase';
import { 
  getFromCache, 
  setInCache, 
  invalidateOffersCache,
  cacheKeys 
} from '@/lib/cache';

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
  // Email du responsable hiérarchique (usage interne, non visible par les candidats)
  manager_email: string | null;
  
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
  // Email du responsable hiérarchique (usage interne, non visible par les candidats)
  manager_email?: string;
}

export type JobOfferUpdateData = Partial<JobOfferCreateData>;

// =====================================================
// FRONTEND-COMPATIBLE OFFER TYPE (for candidate pages)
// =====================================================

export interface FrontendJobOffer {
  id: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    logo_url?: string | null;
    sector?: string | null;
    size?: string | null;
    description?: string | null;
    website?: string | null;
  };
  title: string;
  description: string;
  missions: string | string[];
  objectives: string;
  reporting: string;
  studyLevel: string[];
  skills: string[];
  required_skills: string[];
  contractType: string;
  duration: string;
  startDate: string | null;
  location: string;
  salary: string;
  applicationProcess: string;
  postedDate: string | null;
  status: string;
  requiresCoverLetter: boolean;
  // Also include raw DB fields for compatibility
  contract_type?: string;
  location_city?: string | null;
  start_date?: string | null;
  published_at?: string | null;
  education_level?: string | null;
  remuneration_min?: number | null;
  remuneration_max?: number | null;
  duration_months?: number | null;
}

/**
 * Map Supabase job offer to frontend-compatible format
 */
function mapOfferToFrontend(dbOffer: JobOffer): FrontendJobOffer {
  // Format duration
  const formatDuration = (months?: number | null): string => {
    if (!months) return '';
    if (months === 1) return '1 mois';
    if (months < 12) return `${months} mois`;
    if (months === 12) return '1 an';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  };

  // Format salary
  const formatSalary = (min?: number | null, max?: number | null, period?: string): string => {
    if (!min && !max) return '';
    const periodLabel = period === 'monthly' ? '/mois' : period === 'yearly' ? '/an' : '';
    if (min && max && min !== max) {
      return `${min}€ - ${max}€${periodLabel}`;
    }
    return `${min || max}€${periodLabel}`;
  };

  // Format education level for display
  const formatEducationLevel = (level?: string | null): string[] => {
    if (!level) return [];
    // Map database enum to display format
    const levelMap: Record<string, string> = {
      'bac': 'Bac',
      'bac+1': 'Bac+1',
      'bac+2': 'Bac+2',
      'bac+3': 'Bac+3 (Licence)',
      'bac+4': 'Bac+4 (M1)',
      'bac+5': 'Bac+5 (M2)',
      'bac+6': 'Bac+6+',
      'doctorat': 'Doctorat'
    };
    return [levelMap[level] || level];
  };

  return {
    id: dbOffer.id,
    companyId: dbOffer.company_id,
    company: dbOffer.company || {
      id: dbOffer.company_id,
      name: 'Entreprise',
      logo_url: null,
      sector: null,
      size: null,
    },
    title: dbOffer.title,
    description: dbOffer.description || '',
    missions: dbOffer.missions || '',
    objectives: dbOffer.objectives || '',
    reporting: '', // Not in DB schema, will be empty
    studyLevel: formatEducationLevel(dbOffer.education_level),
    skills: dbOffer.required_skills || [],
    required_skills: dbOffer.required_skills || [],
    contractType: dbOffer.contract_type,
    duration: formatDuration(dbOffer.duration_months),
    startDate: dbOffer.start_date,
    location: dbOffer.location_city || '',
    salary: formatSalary(dbOffer.remuneration_min, dbOffer.remuneration_max, dbOffer.remuneration_period),
    applicationProcess: dbOffer.application_method === 'platform' 
      ? 'Postulez directement via cette plateforme' 
      : 'CV + Lettre de motivation',
    postedDate: dbOffer.published_at,
    status: dbOffer.status,
    requiresCoverLetter: dbOffer.requires_cover_letter ?? false,
    // Raw DB fields for compatibility
    contract_type: dbOffer.contract_type,
    location_city: dbOffer.location_city,
    start_date: dbOffer.start_date,
    published_at: dbOffer.published_at,
    education_level: dbOffer.education_level,
    remuneration_min: dbOffer.remuneration_min,
    remuneration_max: dbOffer.remuneration_max,
    duration_months: dbOffer.duration_months,
  };
}

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
 * Get offer by ID (public) - returns raw Supabase data
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
 * Get offer by ID for candidate view - returns frontend-compatible format
 */
export async function getOfferForCandidate(id: string): Promise<FrontendJobOffer | null> {
  const offer = await getOfferById(id);
  if (!offer) return null;
  return mapOfferToFrontend(offer);
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

interface ParsedJobOfferData {
  title?: string;
  description?: string;
  missions?: string[];
  objectives?: string;
  studyLevel?: string[];
  skills?: string[];
  contractType?: string;
  duration?: string;
  startDate?: string;
  location?: string;
  salary?: string;
}

const normalizeParsedDate = (value?: string): string | undefined => {
  if (!value) return undefined;

  const trimmed = value.trim();
  // Already ISO-8601 date
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return undefined;
};

/**
 * Parse offer from PDF file using backend AI
 */
export async function parseOfferFromPdf(
  file: File
): Promise<ParsedJobOfferData> {
  // Get current session for auth token
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/ai-parsing/job-offer/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Échec du parsing de la fiche de poste');
  }

  const parsedData = await response.json();

  // Map backend response to frontend format
  return {
    title: parsedData.title,
    description: parsedData.description,
    missions: parsedData.missions,
    objectives: parsedData.objectives,
    studyLevel: parsedData.studyLevels,
    skills: parsedData.skills,
    duration: parsedData.duration,
    startDate: normalizeParsedDate(parsedData.startDate),
    location: parsedData.location,
    salary: parsedData.salary,
  };
}

// =====================================================
// OFFER APPLICATIONS
// =====================================================

export interface OfferApplication {
  id: string;
  job_offer_id: string;
  candidate_id: string;
  status: 'pending' | 'in_progress' | 'interview' | 'rejected' | 'accepted' | 'withdrawn';
  cover_letter: string | null;
  cv_url: string | null;
  answers: Record<string, unknown> | null;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  candidate?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    headline: string | null;
    education_level: string | null;
    specialization: string | null;
    cv_url: string | null;
  };
}

/**
 * Get applications for a specific offer
 */
export async function getOfferApplications(
  offerId: string
): Promise<{ applications: OfferApplication[]; total: number }> {
  const { data, error, count } = await supabase
    .from('applications')
    .select(`
      *,
      candidate:users!applications_candidate_id_fkey(
        id, first_name, last_name, email, avatar_url, headline, education_level, specialization, cv_url
      )
    `, { count: 'exact' })
    .eq('job_offer_id', offerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching offer applications:', error);
    return { applications: [], total: 0 };
  }

  return {
    applications: (data || []) as OfferApplication[],
    total: count || 0
  };
}

/**
 * Get applications for an offer grouped by status
 */
export async function getOfferApplicationsByStatus(
  offerId: string
): Promise<Record<string, OfferApplication[]>> {
  const { applications } = await getOfferApplications(offerId);
  
  const grouped: Record<string, OfferApplication[]> = {
    pending: [],
    in_progress: [],
    interview: [],
    accepted: [],
    rejected: [],
    withdrawn: [],
  };

  applications.forEach(app => {
    if (grouped[app.status]) {
      grouped[app.status].push(app);
    }
  });

  return grouped;
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
 * Get all offers (alias for searchOffers with no filters) - returns raw DB format
 */
export async function getAllOffers(): Promise<JobOffer[]> {
  const { offers } = await searchOffers({ limit: 100 });
  return offers;
}

/**
 * Get all offers for candidate view - returns frontend-compatible format
 */
export async function getAllOffersForCandidate(): Promise<FrontendJobOffer[]> {
  const { offers } = await searchOffers({ limit: 100 });
  return offers.map(mapOfferToFrontend);
}

/**
 * Get recent offers from different companies for homepage
 * Uses the denormalized homepage_offers table for fast, RLS-free access
 * Falls back to offers table if homepage_offers is empty
 * Results are cached for 5 minutes
 */
export async function getRecentOffersForHomepage(limit: number = 5): Promise<{
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  startDate: string | null;
}[]> {
  // Vérifier le cache d'abord
  const cacheKey = cacheKeys.homepageOffers();
  const cached = getFromCache<{
    id: string;
    title: string;
    company: string;
    location: string;
    contractType: string;
    startDate: string | null;
  }[]>(cacheKey, 'HOMEPAGE_OFFERS');
  
  if (cached) {
    return cached;
  }

  // Try the optimized homepage_offers table first
  const { data: homepageData, error: homepageError } = await supabase
    .from('homepage_offers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!homepageError && homepageData && homepageData.length > 0) {
    const result = homepageData.map(offer => ({
      id: offer.id,
      title: offer.title,
      company: offer.company_name,
      location: offer.location_city || 'France',
      contractType: offer.contract_type === 'stage' ? 'Stage' : offer.contract_type === 'alternance' ? 'Alternance' : offer.contract_type,
      startDate: offer.start_date,
    }));
    
    // Mettre en cache
    setInCache(cacheKey, 'HOMEPAGE_OFFERS', result);
    return result;
  }

  // Fallback to offers table if homepage_offers is empty or doesn't exist
  const { data, error } = await supabase
    .from('job_offers')
    .select(`
      id,
      title,
      location_city,
      contract_type,
      start_date,
      company_id,
      companies!inner(name)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error('Error fetching recent offers:', error);
    return [];
  }

  // Filter to get one offer per company
  const seenCompanies = new Set<string>();
  const uniqueOffers: typeof data = [];
  
  for (const offer of data) {
    if (!seenCompanies.has(offer.company_id) && uniqueOffers.length < limit) {
      seenCompanies.add(offer.company_id);
      uniqueOffers.push(offer);
    }
  }

  return uniqueOffers.map(offer => {
    const company = offer.companies as unknown as { name: string } | null;
    return {
      id: offer.id,
      title: offer.title,
      company: company?.name || 'Entreprise',
      location: offer.location_city || 'France',
      contractType: offer.contract_type === 'stage' ? 'Stage' : offer.contract_type === 'alternance' ? 'Alternance' : offer.contract_type,
      startDate: offer.start_date,
    };
  });
}

/**
 * Parse job offer PDF (alias for parseOfferFromPdf)
 */
export const parseJobOfferPDF = parseOfferFromPdf;
