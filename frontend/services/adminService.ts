/**
 * Service administrateur
 * Gère les fonctionnalités admin : audit logs, RGPD, stats via Supabase
 * Compatible avec le schéma unifié (users table)
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface AdminStats {
  totalCandidates: number;
  totalCompanyUsers: number;
  totalCompanies: number;
  totalOffers: number;
  activeOffers: number;
  filledOffers: number;
  expiredOffers: number;
  totalApplications: number;
  pendingApplications: number;
  newUsersLastWeek: number;
  applicationsLastWeek: number;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GDPRRequest {
  id: string;
  user_id: string | null;
  user_email: string;
  request_type: 'access' | 'modification' | 'deletion' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  description: string | null;
  processed_by: string | null;
  processed_at: string | null;
  processing_notes: string | null;
  export_url: string | null;
  export_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSummary {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'candidate' | 'company' | 'admin';
  company_roles: string[];
  company_id: string | null;
  company_name?: string | null;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AuditLogFilters {
  action?: string;
  user_id?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface UserFilters {
  role?: 'candidate' | 'company' | 'admin';
  is_active?: boolean;
  is_suspended?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Backend API URL (Railway)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// =====================================================
// DASHBOARD STATISTICS
// =====================================================

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    candidatesResult,
    companyUsersResult,
    companiesResult,
    offersResult,
    activeOffersResult,
    filledOffersResult,
    expiredOffersResult,
    applicationsResult,
    pendingApplicationsResult,
    newUsersResult,
    recentApplicationsResult,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'company'),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('job_offers').select('*', { count: 'exact', head: true }),
    supabase.from('job_offers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('job_offers').select('*', { count: 'exact', head: true }).eq('status', 'filled'),
    supabase.from('job_offers').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    supabase.from('applications').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
  ]);

  return {
    totalCandidates: candidatesResult.count || 0,
    totalCompanyUsers: companyUsersResult.count || 0,
    totalCompanies: companiesResult.count || 0,
    totalOffers: offersResult.count || 0,
    activeOffers: activeOffersResult.count || 0,
    filledOffers: filledOffersResult.count || 0,
    expiredOffers: expiredOffersResult.count || 0,
    totalApplications: applicationsResult.count || 0,
    pendingApplications: pendingApplicationsResult.count || 0,
    newUsersLastWeek: newUsersResult.count || 0,
    applicationsLastWeek: recentApplicationsResult.count || 0,
  };
}

// =====================================================
// AUDIT LOGS
// =====================================================

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
  const { action, user_id, entity_type, start_date, end_date, limit = 100, offset = 0 } = filters;

  let query = supabase
    .from('audit_logs')
    .select('*');

  if (action) {
    query = query.eq('action', action);
  }

  if (user_id) {
    query = query.eq('user_id', user_id);
  }

  if (entity_type) {
    query = query.eq('entity_type', entity_type);
  }

  if (start_date) {
    query = query.gte('created_at', start_date);
  }

  if (end_date) {
    query = query.lte('created_at', end_date);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return (data || []) as AuditLog[];
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsCSV(filters: AuditLogFilters = {}): Promise<string> {
  const logs = await getAuditLogs({ ...filters, limit: 10000 });

  const headers = ['ID', 'Action', 'Entity Type', 'Entity ID', 'User Email', 'User Role', 'Timestamp', 'IP', 'Description'];
  const rows = logs.map(log => [
    log.id,
    log.action,
    log.entity_type,
    log.entity_id || '',
    log.user_email || '',
    log.user_role || '',
    log.created_at,
    log.ip_address || '',
    log.description || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('audit_logs').insert({
    user_id: user?.id,
    user_email: user?.email,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_values: oldValues,
    new_values: newValues,
    description,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =====================================================
// GDPR REQUESTS
// =====================================================

/**
 * Get GDPR requests
 */
export async function getGDPRRequests(filters?: {
  type?: string;
  status?: string;
}): Promise<GDPRRequest[]> {
  let query = supabase
    .from('gdpr_requests')
    .select('*');

  if (filters?.type) {
    query = query.eq('request_type', filters.type);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching GDPR requests:', error);
    return [];
  }

  return (data || []) as GDPRRequest[];
}

/**
 * Update GDPR request status
 */
export async function updateGDPRRequestStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  const updateData: Record<string, unknown> = {
    status,
    processing_notes: notes,
  };

  if (status === 'completed' || status === 'rejected') {
    updateData.processed_at = new Date().toISOString();
    updateData.processed_by = user?.id;
  }

  const { error } = await supabase
    .from('gdpr_requests')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log the action
  await createAuditLog('update', 'gdpr_request', id, undefined, { status, notes }, `GDPR request ${status}`);

  return { success: true };
}

// =====================================================
// USER MANAGEMENT
// =====================================================

/**
 * Get all users with filters
 */
export async function getUsers(filters: UserFilters = {}): Promise<{ users: UserSummary[]; total: number }> {
  const { role, is_active, is_suspended, search, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select(`
      id, email, first_name, last_name, role, company_roles, company_id,
      is_active, is_suspended, created_at, last_login_at,
      company:companies(name)
    `, { count: 'exact' });

  if (role) {
    query = query.eq('role', role);
  }

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  }

  if (is_suspended !== undefined) {
    query = query.eq('is_suspended', is_suspended);
  }

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return { users: [], total: 0 };
  }

  const users = (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    company_name: (row.company as Record<string, unknown>)?.name || null,
  })) as UserSummary[];

  return { users, total: count || 0 };
}

/**
 * Suspend user
 */
export async function suspendUser(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspension_reason: reason,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log the action
  await createAuditLog('suspension', 'user', userId, undefined, { reason }, `User suspended: ${reason}`);

  return { success: true };
}

/**
 * Unsuspend user
 */
export async function unsuspendUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({
      is_suspended: false,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }

  // Log the action
  await createAuditLog('unsuspension', 'user', userId, undefined, undefined, 'User unsuspended');

  return { success: true };
}

/**
 * Delete user (soft delete - deactivate)
 */
export async function deactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog('delete', 'user', userId, undefined, undefined, 'User deactivated');

  return { success: true };
}

// =====================================================
// COMPANY MANAGEMENT
// =====================================================

/**
 * Get all companies
 */
export async function getCompanies(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ companies: Record<string, unknown>[]; total: number }> {
  const { status, search, page = 1, limit = 50 } = filters || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,siret.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching companies:', error);
    return { companies: [], total: 0 };
  }

  return { companies: data || [], total: count || 0 };
}

/**
 * Update company status
 */
export async function updateCompanyStatus(
  companyId: string,
  status: 'pending' | 'active' | 'suspended' | 'inactive'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('companies')
    .update({ status })
    .eq('id', companyId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog('update', 'company', companyId, undefined, { status }, `Company status changed to ${status}`);

  return { success: true };
}

/**
 * Verify company
 */
export async function verifyCompany(companyId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('companies')
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('id', companyId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog('update', 'company', companyId, undefined, { is_verified: true }, 'Company verified');

  return { success: true };
}

// =====================================================
// RECRUITCRM SYNC (Backend Railway)
// =====================================================

/**
 * Get RecruitCRM sync status
 */
export async function getRecruitCRMSyncStatus() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Authentification requise');
  }

  const response = await fetch(`${API_URL}/v1/recruitcrm/status`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get sync status');
  }

  return await response.json();
}

/**
 * Trigger full RecruitCRM sync
 */
export async function triggerRecruitCRMSync() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Authentification requise');
  }

  const response = await fetch(`${API_URL}/v1/recruitcrm/sync/all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to trigger sync');
  }

  return await response.json();
}

/**
 * Get sync logs
 */
export async function getSyncLogs(limit: number = 50) {
  const { data, error } = await supabase
    .from('recruitcrm_sync_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sync logs:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// DATA EXPORT
// =====================================================

/**
 * Export users to CSV
 */
export async function exportUsersCSV(filters: UserFilters = {}): Promise<string> {
  const { users } = await getUsers({ ...filters, limit: 10000 });

  const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Company Roles', 'Active', 'Suspended', 'Created At'];
  const rows = users.map(user => [
    user.id,
    user.email,
    user.first_name || '',
    user.last_name || '',
    user.role,
    user.company_roles.join('; '),
    user.is_active ? 'Yes' : 'No',
    user.is_suspended ? 'Yes' : 'No',
    user.created_at,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export applications to CSV
 */
export async function exportApplicationsCSV(): Promise<string> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, status, created_at,
      candidate:users!applications_candidate_id_fkey(email, first_name, last_name),
      job_offer:job_offers(title, company:companies(name))
    `)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) {
    console.error('Error fetching applications for export:', error);
    return '';
  }

  const headers = ['ID', 'Candidate Email', 'Candidate Name', 'Job Title', 'Company', 'Status', 'Created At'];
  const rows = (data || []).map((app: Record<string, unknown>) => {
    const candidate = app.candidate as Record<string, unknown>;
    const jobOffer = app.job_offer as Record<string, unknown>;
    const company = jobOffer?.company as Record<string, unknown>;
    
    return [
      app.id,
      candidate?.email || '',
      `${candidate?.first_name || ''} ${candidate?.last_name || ''}`.trim(),
      jobOffer?.title || '',
      company?.name || '',
      app.status,
      app.created_at,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}
