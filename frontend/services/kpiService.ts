import { supabase } from '@/lib/supabase';

export interface PlatformKPIs {
  // Registration metrics
  companiesRegistered: number;
  candidatesRegistered: number;
  offersCreated: number;
  
  // Application metrics
  totalApplications: number;
  offersFilled: number; // Offers that found candidates
  
  // Activity metrics
  activeCompanyUsers: number; // At least 2 connections
  activeCandidates: number;
  avgApplicationsPerActiveUser: number;
  companiesWithActiveUsers: number;
  
  // Period comparison (vs last period)
  companiesRegisteredChange: number;
  candidatesRegisteredChange: number;
  offersCreatedChange: number;
  applicationsChange: number;
  
  // Timestamps
  lastUpdated: string;
}

export interface KPISnapshot {
  id: string;
  snapshot_date: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  companies_registered: number;
  candidates_registered: number;
  offers_created: number;
  total_applications: number;
  offers_filled: number;
  active_company_users: number;
  active_candidates: number;
  avg_applications_per_user: number;
  companies_with_active_users: number;
  created_at: string;
}

export interface AdminNotificationSettings {
  id: string;
  admin_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'none';
  email_enabled: boolean;
  kpi_companies_registered: boolean;
  kpi_candidates_registered: boolean;
  kpi_offers_created: boolean;
  kpi_applications: boolean;
  kpi_offers_filled: boolean;
  kpi_active_company_users: boolean;
  kpi_active_candidates: boolean;
  kpi_avg_applications: boolean;
  kpi_companies_with_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get current platform KPIs
 */
export async function getPlatformKPIs(): Promise<PlatformKPIs> {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get current counts
  const [
    companiesResult,
    candidatesResult,
    offersResult,
    applicationsResult,
    filledOffersResult,
    // Previous period for comparison
    prevCompaniesResult,
    prevCandidatesResult,
    prevOffersResult,
    prevApplicationsResult,
  ] = await Promise.all([
    // Current totals
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
    supabase.from('job_offers').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('job_offers').select('*', { count: 'exact', head: true }).eq('status', 'filled'),
    // Last month comparison
    supabase.from('companies').select('*', { count: 'exact', head: true })
      .lt('created_at', lastMonth.toISOString()),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .eq('role', 'candidate')
      .lt('created_at', lastMonth.toISOString()),
    supabase.from('job_offers').select('*', { count: 'exact', head: true })
      .lt('created_at', lastMonth.toISOString()),
    supabase.from('applications').select('*', { count: 'exact', head: true })
      .lt('created_at', lastMonth.toISOString()),
  ]);

  // Get active users (users with at least 2 logins/sessions in last 30 days)
  // Using last_sign_in_at as proxy for activity
  const { data: activeCompanyUsersData } = await supabase
    .from('users')
    .select('id, company_id')
    .eq('role', 'company')
    .gte('last_sign_in_at', lastMonth.toISOString());

  const { data: activeCandidatesData } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'candidate')
    .gte('last_sign_in_at', lastMonth.toISOString());

  // Count unique companies with active users
  const uniqueCompaniesWithActiveUsers = new Set(
    activeCompanyUsersData?.map(u => u.company_id).filter(Boolean) || []
  ).size;

  // Calculate average applications per active candidate
  const activeCandidateIds = activeCandidatesData?.map(u => u.id) || [];
  let avgApplicationsPerActiveUser = 0;
  
  if (activeCandidateIds.length > 0) {
    const { count: activeUserApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('user_id', activeCandidateIds);
    
    avgApplicationsPerActiveUser = (activeUserApplications || 0) / activeCandidateIds.length;
  }

  const companiesRegistered = companiesResult.count || 0;
  const candidatesRegistered = candidatesResult.count || 0;
  const offersCreated = offersResult.count || 0;
  const totalApplications = applicationsResult.count || 0;

  const prevCompanies = prevCompaniesResult.count || 0;
  const prevCandidates = prevCandidatesResult.count || 0;
  const prevOffers = prevOffersResult.count || 0;
  const prevApplications = prevApplicationsResult.count || 0;

  return {
    companiesRegistered,
    candidatesRegistered,
    offersCreated,
    totalApplications,
    offersFilled: filledOffersResult.count || 0,
    activeCompanyUsers: activeCompanyUsersData?.length || 0,
    activeCandidates: activeCandidatesData?.length || 0,
    avgApplicationsPerActiveUser: Math.round(avgApplicationsPerActiveUser * 10) / 10,
    companiesWithActiveUsers: uniqueCompaniesWithActiveUsers,
    
    // Changes (new this month)
    companiesRegisteredChange: companiesRegistered - prevCompanies,
    candidatesRegisteredChange: candidatesRegistered - prevCandidates,
    offersCreatedChange: offersCreated - prevOffers,
    applicationsChange: totalApplications - prevApplications,
    
    lastUpdated: now.toISOString(),
  };
}

/**
 * Get KPI history for charts
 */
export async function getKPIHistory(
  periodType: 'daily' | 'weekly' | 'monthly' = 'daily',
  limit: number = 30
): Promise<KPISnapshot[]> {
  const { data, error } = await supabase
    .from('kpi_snapshots')
    .select('*')
    .eq('period_type', periodType)
    .order('snapshot_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching KPI history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get admin notification settings
 */
export async function getAdminNotificationSettings(adminId: string): Promise<AdminNotificationSettings | null> {
  const { data, error } = await supabase
    .from('admin_notification_settings')
    .select('*')
    .eq('admin_id', adminId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching notification settings:', error);
  }

  return data;
}

/**
 * Save admin notification settings
 */
export async function saveAdminNotificationSettings(
  adminId: string,
  settings: Partial<AdminNotificationSettings>
): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('admin_notification_settings')
    .select('id')
    .eq('admin_id', adminId)
    .single();

  const payload = {
    ...settings,
    admin_id: adminId,
    updated_at: new Date().toISOString(),
  };

  let error;
  
  if (existing) {
    const result = await supabase
      .from('admin_notification_settings')
      .update(payload)
      .eq('admin_id', adminId);
    error = result.error;
  } else {
    const result = await supabase
      .from('admin_notification_settings')
      .insert({ ...payload, created_at: new Date().toISOString() });
    error = result.error;
  }

  if (error) {
    console.error('Error saving notification settings:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Log a KPI snapshot (called by cron job)
 */
export async function logKPISnapshot(
  periodType: 'daily' | 'weekly' | 'monthly'
): Promise<{ success: boolean; error?: string }> {
  try {
    const kpis = await getPlatformKPIs();
    
    const { error } = await supabase
      .from('kpi_snapshots')
      .insert({
        snapshot_date: new Date().toISOString().split('T')[0],
        period_type: periodType,
        companies_registered: kpis.companiesRegistered,
        candidates_registered: kpis.candidatesRegistered,
        offers_created: kpis.offersCreated,
        total_applications: kpis.totalApplications,
        offers_filled: kpis.offersFilled,
        active_company_users: kpis.activeCompanyUsers,
        active_candidates: kpis.activeCandidates,
        avg_applications_per_user: kpis.avgApplicationsPerActiveUser,
        companies_with_active_users: kpis.companiesWithActiveUsers,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error logging KPI snapshot:', error);
    return { success: false, error: (error as Error).message };
  }
}
