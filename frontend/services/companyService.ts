import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface Company {
  id: string;
  name: string;
  siret: string | null;
  sector: string | null;
  size: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  
  // Contact
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  
  // Address
  address_street: string | null;
  address_city: string | null;
  address_postal_code: string | null;
  address_country: string;
  
  // Status
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  is_verified: boolean;
  verified_at: string | null;
  
  // Sync
  recruitcrm_id: string | null;
  recruitcrm_synced_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  company_id: string;
  company_roles: ('company' | 'rh' | 'manager')[];
  is_primary_company_contact: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CompanyWithUsers extends Company {
  users: CompanyUser[];
}

export interface Application {
  id: string;
  candidate_id: string;
  job_offer_id: string;
  company_id: string;
  cover_letter: string | null;
  cv_snapshot_url: string | null;
  status: 'pending' | 'in_progress' | 'interview' | 'rejected' | 'accepted' | 'withdrawn';
  status_updated_at: string;
  interview_scheduled_at: string | null;
  rating: number | null;
  internal_notes: string | null;
  kanban_position: number;
  created_at: string;
  updated_at: string;
  
  // Relations
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
  job_offer?: {
    id: string;
    title: string;
  };
  tags?: Array<{ id: string; name: string; color: string }>;
}

export interface ApplicationFilters {
  job_offer_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CompanyUpdateData {
  name?: string;
  sector?: string;
  size?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
}

// =====================================================
// COMPANY PROFILE FUNCTIONS
// =====================================================

/**
 * Get current user's company
 */
export async function getCurrentCompany(): Promise<Company | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's company_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .eq('role', 'company')
    .single();

  if (userError || !userData?.company_id) {
    console.error('Error fetching user company:', userError);
    return null;
  }

  // Get company details
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', userData.company_id)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return null;
  }

  return data as Company;
}

/**
 * Get company by ID
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return null;
  }

  return data as Company;
}

/**
 * Get company with team members
 */
export async function getCompanyWithUsers(companyId: string): Promise<CompanyWithUsers | null> {
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (companyError) {
    console.error('Error fetching company:', companyError);
    return null;
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone, avatar_url, company_id, company_roles, is_primary_company_contact, is_active, created_at')
    .eq('company_id', companyId)
    .eq('role', 'company');

  if (usersError) {
    console.error('Error fetching company users:', usersError);
    return null;
  }

  return {
    ...company,
    users: users || []
  } as CompanyWithUsers;
}

/**
 * Update company profile
 */
export async function updateCompanyProfile(
  companyId: string,
  updates: CompanyUpdateData
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId);

  if (error) {
    console.error('Error updating company:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Upload company logo
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${companyId}/logo.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('company-logos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('Error uploading logo:', uploadError);
    return { success: false, error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('company-logos')
    .getPublicUrl(fileName);

  // Update company record
  const { error: updateError } = await supabase
    .from('companies')
    .update({ logo_url: publicUrl })
    .eq('id', companyId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, url: publicUrl };
}

// =====================================================
// TEAM MANAGEMENT
// =====================================================

/**
 * Get company team members
 */
export async function getCompanyTeam(companyId: string): Promise<CompanyUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone, avatar_url, company_id, company_roles, is_primary_company_contact, is_active, created_at')
    .eq('company_id', companyId)
    .eq('role', 'company')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching team:', error);
    return [];
  }

  return data as CompanyUser[];
}

/**
 * Update team member roles
 */
export async function updateTeamMemberRoles(
  userId: string,
  roles: ('company' | 'rh' | 'manager')[]
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({ company_roles: roles })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove team member
 */
export async function removeTeamMember(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({
      company_id: null,
      company_roles: [],
      is_active: false
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =====================================================
// APPLICATIONS MANAGEMENT (Kanban)
// =====================================================

/**
 * Get applications for company
 */
export async function getCompanyApplications(
  companyId: string,
  filters: ApplicationFilters = {}
): Promise<{ applications: Application[]; total: number }> {
  const { job_offer_id, status, search, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('applications')
    .select(`
      *,
      candidate:users!applications_candidate_id_fkey(
        id, first_name, last_name, email, avatar_url, headline, 
        education_level, specialization, cv_url
      ),
      job_offer:job_offers(id, title)
    `, { count: 'exact' })
    .eq('company_id', companyId);

  if (job_offer_id) {
    query = query.eq('job_offer_id', job_offer_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching applications:', error);
    return { applications: [], total: 0 };
  }

  return {
    applications: (data || []) as Application[],
    total: count || 0
  };
}

/**
 * Get applications grouped by status (for Kanban)
 */
export async function getApplicationsByStatus(
  companyId: string,
  jobOfferId?: string
): Promise<Record<string, Application[]>> {
  let query = supabase
    .from('applications')
    .select(`
      *,
      candidate:users!applications_candidate_id_fkey(
        id, first_name, last_name, email, avatar_url, headline, 
        education_level, specialization, cv_url
      ),
      job_offer:job_offers(id, title)
    `)
    .eq('company_id', companyId)
    .order('kanban_position', { ascending: true });

  if (jobOfferId) {
    query = query.eq('job_offer_id', jobOfferId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching applications:', error);
    return {};
  }

  // Group by status
  const grouped: Record<string, Application[]> = {
    pending: [],
    in_progress: [],
    interview: [],
    rejected: [],
    accepted: [],
    withdrawn: []
  };

  (data || []).forEach((app) => {
    if (grouped[app.status]) {
      grouped[app.status].push(app as Application);
    }
  });

  return grouped;
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: Application['status'],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  const updateData: Record<string, unknown> = {
    status,
    status_updated_at: new Date().toISOString(),
    status_updated_by: user?.id
  };

  if (notes !== undefined) {
    updateData.internal_notes = notes;
  }

  const { error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update application kanban position
 */
export async function updateApplicationPosition(
  applicationId: string,
  newStatus: Application['status'],
  newPosition: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('applications')
    .update({
      status: newStatus,
      kanban_position: newPosition,
      status_updated_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Rate application
 */
export async function rateApplication(
  applicationId: string,
  rating: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('applications')
    .update({ rating })
    .eq('id', applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Add note to application
 */
export async function addApplicationNote(
  applicationId: string,
  content: string,
  isPrivate: boolean = false
): Promise<{ success: boolean; noteId?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('application_notes')
    .insert({
      application_id: applicationId,
      author_id: user.id,
      content,
      is_private: isPrivate
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, noteId: data.id };
}

/**
 * Get application notes
 */
export async function getApplicationNotes(applicationId: string) {
  const { data, error } = await supabase
    .from('application_notes')
    .select(`
      *,
      author:users(id, first_name, last_name, avatar_url)
    `)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// TAGS MANAGEMENT
// =====================================================

/**
 * Get company tags
 */
export async function getCompanyTags(companyId: string) {
  const { data, error } = await supabase
    .from('application_tags')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return data || [];
}

/**
 * Create tag
 */
export async function createTag(
  companyId: string,
  name: string,
  color: string = '#3B82F6'
): Promise<{ success: boolean; tagId?: string; error?: string }> {
  const { data, error } = await supabase
    .from('application_tags')
    .insert({ company_id: companyId, name, color })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, tagId: data.id };
}

/**
 * Assign tag to application
 */
export async function assignTag(
  applicationId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('application_tag_assignments')
    .insert({
      application_id: applicationId,
      tag_id: tagId,
      assigned_by: user?.id
    });

  if (error) {
    if (error.code === '23505') return { success: true }; // Already assigned
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove tag from application
 */
export async function removeTag(
  applicationId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('application_tag_assignments')
    .delete()
    .eq('application_id', applicationId)
    .eq('tag_id', tagId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =====================================================
// STATISTICS
// =====================================================

/**
 * Get company dashboard stats
 */
export async function getCompanyStats(companyId: string) {
  const [offersResult, applicationsResult] = await Promise.all([
    supabase
      .from('job_offers')
      .select('status', { count: 'exact' })
      .eq('company_id', companyId),
    supabase
      .from('applications')
      .select('status', { count: 'exact' })
      .eq('company_id', companyId)
  ]);

  // Count offers by status
  const offersByStatus: Record<string, number> = {};
  (offersResult.data || []).forEach(offer => {
    offersByStatus[offer.status] = (offersByStatus[offer.status] || 0) + 1;
  });

  // Count applications by status
  const applicationsByStatus: Record<string, number> = {};
  (applicationsResult.data || []).forEach(app => {
    applicationsByStatus[app.status] = (applicationsByStatus[app.status] || 0) + 1;
  });

  return {
    offers: {
      total: offersResult.count || 0,
      byStatus: offersByStatus
    },
    applications: {
      total: applicationsResult.count || 0,
      byStatus: applicationsByStatus
    }
  };
}
