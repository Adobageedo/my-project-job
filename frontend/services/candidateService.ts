import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface Candidate {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  
  // Education
  institution: string | null;
  education_level: string | null;
  specialization: string | null;
  graduation_year: number | null;
  
  // Alternance
  alternance_rhythm: string | null;
  
  // Availability
  available_from: string | null;
  contract_types_sought: string[];
  target_locations: string[];
  remote_preference: string | null;
  
  // CV
  cv_url: string | null;
  cv_filename: string | null;
  cv_uploaded_at: string | null;
  cv_parsed: boolean;
  cv_parsed_data: Record<string, unknown> | null;
  
  // Professional
  headline: string | null;
  bio: string | null;
  skills: string[];
  languages: Array<{ language: string; level: string }>;
  experiences: Array<Record<string, unknown>>;
  education_history: Array<Record<string, unknown>>;
  certifications: Array<Record<string, unknown>>;
  
  // Links
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  
  // Status
  profile_completed: boolean;
  profile_completion_percentage: number;
  onboarding_completed: boolean;
  onboarding_step: number;
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CandidateFilters {
  search?: string;
  education_level?: string;
  specialization?: string;
  available_from?: string;
  target_locations?: string[];
  contract_types?: string[];
  skills?: string[];
  page?: number;
  limit?: number;
}

export interface CandidateUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  institution?: string;
  education_level?: string;
  specialization?: string;
  graduation_year?: number;
  alternance_rhythm?: string;
  available_from?: string;
  contract_types_sought?: string[];
  target_locations?: string[];
  remote_preference?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  languages?: Array<{ language: string; level: string }>;
  experiences?: Array<Record<string, unknown>>;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  onboarding_step?: number;
  onboarding_completed?: boolean;
}

// Map UI study level values (e.g. L3, M1, M2, MBA or bac+X) to Supabase enum education_level
const mapStudyLevelToEducationEnum = (level?: string | null): string | undefined => {
  if (!level) return undefined;

  switch (level) {
    case 'L3':
      return 'bac+3';
    case 'M1':
      return 'bac+4';
    case 'M2':
      return 'bac+5';
    case 'MBA':
      return 'bac+6';
    default:
      // Assume it's already one of: 'bac','bac+1',...,'bac+6','doctorat'
      return level;
  }
};

// =====================================================
// SERVICE FUNCTIONS
// =====================================================

/**
 * Get current candidate profile
 */
export async function getCurrentCandidate(): Promise<Candidate | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .eq('role', 'candidate')
    .single();

  if (error) {
    console.error('Error fetching candidate:', error);
    return null;
  }

  return data as Candidate;
}

/**
 * Get candidate by ID
 */
export async function getCandidateById(id: string): Promise<Candidate | null> {
  // Validate ID is a string
  if (typeof id !== 'string' || !id) {
    console.error('getCandidateById: Invalid ID provided:', id);
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('role', 'candidate')
    .single();

  if (error) {
    console.error('Error fetching candidate:', error);
    return null;
  }

  return data as Candidate;
}

/**
 * Update candidate profile
 */
export async function updateCandidateProfile(
  id: string,
  updates: CandidateUpdateData
): Promise<{ success: boolean; error?: string }> {
  const mappedUpdates: CandidateUpdateData = {
    ...updates,
    education_level: mapStudyLevelToEducationEnum(updates.education_level),
  };

  const { error } = await supabase
    .from('users')
    .update(mappedUpdates)
    .eq('id', id)
    .eq('role', 'candidate');

  if (error) {
    console.error('Error updating candidate:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Complete candidate onboarding
 */
export interface OnboardingData {
  firstName: string;
  lastName: string;
  phone?: string;
  school?: string;
  studyLevel?: string;
  specialization?: string;
  alternanceRhythm?: string;
  availableFrom?: string;
  locations?: string[];
  // cvUrl removed - CVs are now stored in candidate_cvs table
  linkedinUrl?: string;
  portfolioUrl?: string;
  bio?: string;
  skills?: string[];
}

export async function completeOnboarding(
  userId: string,
  data: OnboardingData
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || null,
      institution: data.school || null,
      education_level: mapStudyLevelToEducationEnum(data.studyLevel),
      specialization: data.specialization || null,
      alternance_rhythm: data.alternanceRhythm || null,
      available_from: data.availableFrom || null,
      target_locations: data.locations || [],
      // cv_url removed - CVs are now stored in candidate_cvs table
      linkedin_url: data.linkedinUrl || null,
      portfolio_url: data.portfolioUrl || null,
      bio: data.bio || null,
      skills: data.skills || [],
      onboarding_completed: true,
      profile_completed: true,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if candidate needs onboarding (first_name is null)
 */
export async function needsOnboarding(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('first_name, onboarding_completed')
    .eq('id', userId)
    .eq('role', 'candidate')
    .single();

  if (error || !data) return true;
  return !data.first_name || !data.onboarding_completed;
}

/**
 * Search candidates (for companies/admins)
 */
export async function searchCandidates(
  filters: CandidateFilters
): Promise<{ candidates: Candidate[]; total: number }> {
  const { page = 1, limit = 20, search, education_level, specialization, available_from, target_locations, contract_types, skills } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('role', 'candidate')
    .eq('is_active', true);

  // Text search
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,headline.ilike.%${search}%,specialization.ilike.%${search}%`);
  }

  // Filters
  if (education_level) {
    query = query.eq('education_level', education_level);
  }

  if (specialization) {
    query = query.ilike('specialization', `%${specialization}%`);
  }

  if (available_from) {
    query = query.lte('available_from', available_from);
  }

  if (target_locations && target_locations.length > 0) {
    query = query.overlaps('target_locations', target_locations);
  }

  if (contract_types && contract_types.length > 0) {
    query = query.overlaps('contract_types_sought', contract_types);
  }

  if (skills && skills.length > 0) {
    query = query.overlaps('skills', skills);
  }

  // Pagination
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching candidates:', error);
    return { candidates: [], total: 0 };
  }

  return {
    candidates: (data || []) as Candidate[],
    total: count || 0
  };
}

/**
 * Upload CV and create entry in candidate_cvs table
 * Maximum 5 CVs per candidate
 */
export async function uploadCV(
  candidateId: string,
  file: File,
  name?: string,
  setAsDefault: boolean = false
): Promise<{ success: boolean; url?: string; cvId?: string; error?: string }> {
  if (!file) {
    console.error('Erreur upload CV: fichier non fourni');
    return { success: false, error: 'Fichier non fourni' };
  }

  // Check CV count limit
  const { count, error: countError } = await supabase
    .from('candidate_cvs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', candidateId);

  if (countError) {
    console.error('Error checking CV count:', countError);
    return { success: false, error: countError.message };
  }

  if (count && count >= 5) {
    return { success: false, error: 'Vous avez atteint la limite de 5 CV. Supprimez un CV existant pour en ajouter un nouveau.' };
  }
  
  const fileExt = file.name.split('.').pop();
  const storagePath = `${candidateId}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('cvs')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('Error uploading CV:', uploadError);
    return { success: false, error: uploadError.message };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('cvs')
    .getPublicUrl(storagePath);

  // If setting as default, unset other defaults first
  if (setAsDefault) {
    await supabase
      .from('candidate_cvs')
      .update({ is_default: false })
      .eq('user_id', candidateId);
  }

  // Check if this is the first CV (make it default automatically)
  const isFirstCV = !count || count === 0;

  // Create CV entry in candidate_cvs table
  const { data: cvData, error: insertError } = await supabase
    .from('candidate_cvs')
    .insert({
      user_id: candidateId,
      name: name || file.name.replace(/\.[^/.]+$/, ''), // Remove extension for display name
      filename: file.name,
      storage_path: storagePath,
      url: publicUrl,
      is_default: setAsDefault || isFirstCV,
      file_size: file.size,
      mime_type: file.type || 'application/pdf',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating CV entry:', insertError);
    // Try to delete uploaded file on error
    await supabase.storage.from('cvs').remove([storagePath]);
    return { success: false, error: insertError.message };
  }

  return { success: true, url: publicUrl, cvId: cvData.id };
}

/**
 * Get candidate applications
 */
export async function getCandidateApplications(candidateId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job_offer:job_offers(
        id,
        title,
        company_id,
        contract_type,
        location_city,
        start_date,
        company:companies(id, name, logo_url)
      )
    `)
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return data || [];
}

/**
 * Get saved offers for candidate
 */
export async function getSavedOffers(candidateId: string) {
  const { data, error } = await supabase
    .from('saved_offers')
    .select(`
      *,
      job_offer:job_offers(
        *,
        company:companies(id, name, logo_url)
      )
    `)
    .eq('user_id', candidateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved offers:', error);
    return [];
  }

  return data || [];
}

/**
 * Save an offer
 */
export async function saveOffer(
  candidateId: string,
  jobOfferId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('saved_offers')
    .insert({ user_id: candidateId, job_offer_id: jobOfferId });

  if (error) {
    if (error.code === '23505') {
      return { success: true }; // Already saved
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove saved offer
 */
export async function removeSavedOffer(
  candidateId: string,
  jobOfferId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('saved_offers')
    .delete()
    .eq('user_id', candidateId)
    .eq('job_offer_id', jobOfferId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Apply to a job offer
 */
export async function applyToOffer(
  candidateId: string,
  jobOfferId: string,
  companyId: string,
  coverLetter?: string,
  cvUrl?: string,
  customAnswers?: Record<string, unknown>
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  // Validate UUIDs are strings
  if (typeof candidateId !== 'string' || !candidateId) {
    console.error('Invalid candidateId:', candidateId);
    return { success: false, error: 'ID candidat invalide' };
  }
  if (typeof jobOfferId !== 'string' || !jobOfferId) {
    console.error('Invalid jobOfferId:', jobOfferId);
    return { success: false, error: 'ID offre invalide' };
  }
  if (typeof companyId !== 'string' || !companyId) {
    console.error('Invalid companyId:', companyId);
    return { success: false, error: 'ID entreprise invalide' };
  }

  // Use provided CV URL or fallback to candidate's default CV
  let cvSnapshotUrl: string | null = cvUrl || null;
  if (!cvSnapshotUrl) {
    try {
      const candidate = await getCandidateById(candidateId);
      cvSnapshotUrl = candidate?.cv_url || null;
    } catch (e) {
      console.warn('Could not get candidate CV snapshot:', e);
    }
  }
  
  const { data, error } = await supabase
    .from('applications')
    .insert({
      candidate_id: candidateId,
      job_offer_id: jobOfferId,
      company_id: companyId,
      cover_letter: coverLetter,
      custom_answers: customAnswers || {},
      cv_snapshot_url: cvSnapshotUrl
    })
    .select('id')
    .single();

  if (error) {
    console.error('Application insert error:', error);
    if (error.code === '23505') {
      return { success: false, error: 'Vous avez déjà postulé à cette offre' };
    }
    return { success: false, error: error.message };
  }

  return { success: true, applicationId: data.id };
}

/**
 * Withdraw application
 */
export async function withdrawApplication(
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =====================================================
// CV MANAGEMENT
// CVs are stored in candidate_cvs table (max 5 per candidate)
// =====================================================

export interface SavedCV {
  id: string;
  userId: string;
  name: string;
  filename: string;
  url: string;
  storagePath: string;
  isDefault: boolean;
  fileSize?: number;
  mimeType?: string;
  parsed?: boolean;
  parsedData?: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get saved CVs for a candidate (max 5)
 */
export async function getSavedCVs(userId: string): Promise<SavedCV[]> {
  const { data, error } = await supabase
    .from('candidate_cvs')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching CVs:', error);
    return [];
  }

  return (data || []).map(cv => ({
    id: cv.id,
    userId: cv.user_id,
    name: cv.name,
    filename: cv.filename,
    url: cv.url,
    storagePath: cv.storage_path,
    isDefault: cv.is_default,
    fileSize: cv.file_size,
    mimeType: cv.mime_type,
    parsed: cv.parsed,
    parsedData: cv.parsed_data,
    createdAt: cv.created_at,
    updatedAt: cv.updated_at,
  }));
}

/**
 * Get default CV for a candidate
 */
export async function getDefaultCV(userId: string): Promise<SavedCV | null> {
  const { data, error } = await supabase
    .from('candidate_cvs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();

  if (error || !data) {
    // Try to get any CV if no default
    const { data: anyCV } = await supabase
      .from('candidate_cvs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!anyCV) return null;
    
    return {
      id: anyCV.id,
      userId: anyCV.user_id,
      name: anyCV.name,
      filename: anyCV.filename,
      url: anyCV.url,
      storagePath: anyCV.storage_path,
      isDefault: anyCV.is_default,
      fileSize: anyCV.file_size,
      mimeType: anyCV.mime_type,
      parsed: anyCV.parsed,
      parsedData: anyCV.parsed_data,
      createdAt: anyCV.created_at,
      updatedAt: anyCV.updated_at,
    };
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    filename: data.filename,
    url: data.url,
    storagePath: data.storage_path,
    isDefault: data.is_default,
    fileSize: data.file_size,
    mimeType: data.mime_type,
    parsed: data.parsed,
    parsedData: data.parsed_data,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create a CV entry (without uploading - for manual entries)
 */
export async function createSavedCV(
  userId: string,
  name: string,
  url: string,
  storagePath: string,
  filename: string,
  isDefault: boolean = false
): Promise<{ success: boolean; cv?: SavedCV; error?: string }> {
  // If setting as default, unset other defaults first
  if (isDefault) {
    await supabase
      .from('candidate_cvs')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('candidate_cvs')
    .insert({
      user_id: userId,
      name,
      filename,
      storage_path: storagePath,
      url,
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { 
    success: true, 
    cv: {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      filename: data.filename,
      url: data.url,
      storagePath: data.storage_path,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  };
}

/**
 * Update CV name
 */
export async function updateCVName(
  cvId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('candidate_cvs')
    .update({ name })
    .eq('id', cvId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Set a CV as default
 */
export async function setDefaultCV(
  userId: string,
  cvId: string
): Promise<{ success: boolean; error?: string }> {
  // Unset all other defaults for this user
  await supabase
    .from('candidate_cvs')
    .update({ is_default: false })
    .eq('user_id', userId);

  // Set this one as default
  const { error } = await supabase
    .from('candidate_cvs')
    .update({ is_default: true })
    .eq('id', cvId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a saved CV
 */
export async function deleteSavedCV(cvId: string): Promise<{ success: boolean; error?: string }> {
  // Get the CV to find storage path
  const { data: cv, error: fetchError } = await supabase
    .from('candidate_cvs')
    .select('storage_path, user_id, is_default')
    .eq('id', cvId)
    .single();

  if (fetchError || !cv) {
    return { success: false, error: fetchError?.message || 'CV not found' };
  }

  // Delete from storage
  if (cv.storage_path) {
    await supabase.storage.from('cvs').remove([cv.storage_path]);
  }

  // Delete from database
  const { error } = await supabase
    .from('candidate_cvs')
    .delete()
    .eq('id', cvId);

  if (error) {
    return { success: false, error: error.message };
  }

  // If this was the default, set another one as default
  if (cv.is_default) {
    const { data: otherCV } = await supabase
      .from('candidate_cvs')
      .select('id')
      .eq('user_id', cv.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otherCV) {
      await supabase
        .from('candidate_cvs')
        .update({ is_default: true })
        .eq('id', otherCV.id);
    }
  }

  return { success: true };
}

/**
 * Get CV count for a candidate
 */
export async function getCVCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('candidate_cvs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error getting CV count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Update CV parsed data
 */
export async function updateCVParsedData(
  cvId: string,
  parsedData: any
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('candidate_cvs')
    .update({
      parsed: true,
      parsed_data: parsedData,
      parsed_at: new Date().toISOString(),
    })
    .eq('id', cvId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get signed URL for CV download
 */
export async function getSignedCVUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('cvs')
    .createSignedUrl(path, 3600);

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Allowed file types and size limit for CV upload
const CV_ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];
const CV_ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
const CV_MAX_SIZE_MB = 10;
const CV_MAX_SIZE_BYTES = CV_MAX_SIZE_MB * 1024 * 1024;

/**
 * Parse CV using AI (calls backend API with file upload)
 */
export async function parseCV(file: File): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!CV_ALLOWED_TYPES.includes(file.type) && !CV_ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return { success: false, error: 'Format non supporté. Seuls les fichiers PDF et DOCX sont acceptés.' };
    }

    // Validate file size
    if (file.size > CV_MAX_SIZE_BYTES) {
      return { success: false, error: `Fichier trop volumineux. Taille maximale: ${CV_MAX_SIZE_MB}MB` };
    }

    // Get current session for auth token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      return { success: false, error: 'Non authentifié. Veuillez vous reconnecter.' };
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = process.env.NEXT_PUBLIC_API_URL + '/v1/ai-parsing/cv';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    // Read body ONCE
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      console.error('[parseCV] Backend returned error status', {
        status: response.status,
        statusText: response.statusText,
        errorData: data,
      });
      throw new Error(data?.message || 'Échec de l\'analyse du CV');
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('[parseCV] Error while calling backend', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// SAVED SEARCHES
// =====================================================

export type AlertFrequency = 'instant' | 'daily' | 'weekly' | 'never';

export interface SearchFilters {
  search?: string;
  contract_types?: string[];
  education_levels?: string[];
  locations?: string[];
  remote_policy?: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  notify_new_matches: boolean;
  notification_frequency: string;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get saved searches for a candidate (user_id in unified schema)
 */
export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved searches:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a saved search
 */
export async function createSavedSearch(
  userId: string,
  name: string,
  filters: SearchFilters,
  alertFrequency: AlertFrequency = 'never'
): Promise<{ success: boolean; search?: SavedSearch; error?: string }> {
  const notifyMatches = alertFrequency !== 'never';
  const frequency = alertFrequency === 'never' ? 'daily' : alertFrequency;
  
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: userId,
      name,
      filters,
      notify_new_matches: notifyMatches,
      notification_frequency: frequency,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, search: data };
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(
  searchId: string,
  updates: Partial<{
    name: string;
    filters: SearchFilters;
    alert_frequency: AlertFrequency;
    is_active: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('saved_searches')
    .update(updates)
    .eq('id', searchId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(searchId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', searchId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =====================================================
// SAVED OFFERS
// =====================================================

export interface SavedOffer {
  id: string;
  user_id: string;
  job_offer_id: string;
  notes: string | null;
  created_at: string;
  job_offer?: {
    id: string;
    title: string;
    company: {
      name: string;
      logo_url: string | null;
    };
    location_city: string | null;
    contract_type: string;
    start_date: string | null;
  };
}

/**
 * Update notes on a saved offer
 */
export async function updateSavedOfferNotes(
  savedOfferId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('saved_offers')
    .update({ notes })
    .eq('id', savedOfferId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Unsave an offer
 */
export async function unsaveOffer(savedOfferId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('saved_offers')
    .delete()
    .eq('id', savedOfferId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =====================================================
// ALIASES FOR BACKWARD COMPATIBILITY
// =====================================================

export const getApplicationsByCandidate = getCandidateApplications;
export const createApplication = applyToOffer;

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<{
    email_new_application: boolean;
    email_application_status: boolean;
    email_new_offers_matching: boolean;
    digest_frequency: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: userId, ...settings });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
