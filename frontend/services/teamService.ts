/**
 * Service de gestion d'équipe entreprise
 * Gère les invitations de managers et les permissions granulaires
 */

import { supabase } from '@/lib/supabase';

// Types
export type CompanyRole = 'company' | 'rh' | 'manager';
export type ApplicationStatus = 'pending' | 'in_progress' | 'interview' | 'rejected' | 'accepted' | 'withdrawn';

export interface ManagerPermissions {
  can_view_applications: boolean;
  can_edit_applications: boolean;
  can_send_emails: boolean;
  can_change_status: boolean;
  can_add_notes: boolean;
  can_create_offers: boolean;
  can_edit_offers: boolean;
  can_view_all_offers: boolean;
  kanban_stages_access: ApplicationStatus[];
}

export const DEFAULT_MANAGER_PERMISSIONS: ManagerPermissions = {
  can_view_applications: true,
  can_edit_applications: false,
  can_send_emails: false,
  can_change_status: false,
  can_add_notes: true,
  can_create_offers: false,
  can_edit_offers: false,
  can_view_all_offers: true,
  kanban_stages_access: ['pending', 'in_progress', 'interview'],
};

export const FULL_PERMISSIONS: ManagerPermissions = {
  can_view_applications: true,
  can_edit_applications: true,
  can_send_emails: true,
  can_change_status: true,
  can_add_notes: true,
  can_create_offers: true,
  can_edit_offers: true,
  can_view_all_offers: true,
  kanban_stages_access: ['pending', 'in_progress', 'interview', 'rejected', 'accepted', 'withdrawn'],
};

export interface Invitation {
  id: string;
  company_id: string;
  invited_by: string;
  email: string;
  role: CompanyRole;
  permissions: ManagerPermissions;
  offer_ids: string[] | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  company_roles: CompanyRole[];
  is_company_owner: boolean;
  is_primary_company_contact: boolean;
  permissions?: ManagerPermissions;
  offer_ids?: string[] | null;
  last_login_at: string | null;
  created_at: string;
}

// =====================================================
// INVITATION FUNCTIONS
// =====================================================

/**
 * Créer une invitation pour un nouveau membre d'équipe
 * Appelle le backend qui utilise Supabase Admin API pour envoyer le magic link
 */
export async function createInvitation(
  companyId: string,
  invitedBy: string,
  email: string,
  role: CompanyRole = 'manager',
  permissions: Partial<ManagerPermissions> = {},
  offerIds?: string[]
): Promise<{ success: boolean; invitation?: Invitation; error?: string }> {
  try {
    const mergedPermissions = { ...DEFAULT_MANAGER_PERMISSIONS, ...permissions };

    // Appeler le backend sécurisé
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api';
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.access_token) {
      return { success: false, error: 'Non authentifié' };
    }

    const response = await fetch(`${backendUrl}/v1/team/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        companyId,
        role,
        permissions: mergedPermissions,
        offerIds: offerIds || undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Erreur lors de l\'envoi' };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Create invitation error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Récupérer les invitations d'une entreprise
 */
export async function getCompanyInvitations(
  companyId: string,
  status?: 'pending' | 'accepted' | 'expired' | 'revoked'
): Promise<Invitation[]> {
  let query = supabase
    .from('company_invitations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get invitations error:', error);
    return [];
  }

  return data as Invitation[];
}

/**
 * Révoquer une invitation
 */
export async function revokeInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('company_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Renvoyer une invitation via le backend
 * TODO: Implémenter l'endpoint backend /team/resend-invite
 */
export async function resendInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  // Pour l'instant, on révoque et on demande de recréer
  // L'implémentation complète nécessite un endpoint backend
  console.warn('resendInvitation: Not fully implemented yet, please revoke and create a new invitation');
  return { success: false, error: 'Veuillez révoquer l\'invitation et en créer une nouvelle' };
}

// =====================================================
// TEAM MEMBER FUNCTIONS
// =====================================================

/**
 * Récupérer les membres d'équipe d'une entreprise
 */
export async function getTeamMembers(companyId: string): Promise<TeamMember[]> {
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      avatar_url,
      company_roles,
      is_company_owner,
      is_primary_company_contact,
      last_login_at,
      created_at
    `)
    .eq('company_id', companyId)
    .eq('role', 'company')
    .order('is_company_owner', { ascending: false });

  if (error) {
    console.error('Get team members error:', error);
    return [];
  }

  // Récupérer les permissions pour chaque utilisateur
  const userIds = users.map(u => u.id);
  const { data: permissions } = await supabase
    .from('user_permissions')
    .select('user_id, permissions, offer_ids')
    .eq('company_id', companyId)
    .in('user_id', userIds);

  const permissionsMap = new Map(
    permissions?.map(p => [p.user_id, { permissions: p.permissions, offer_ids: p.offer_ids }]) || []
  );

  return users.map(user => ({
    ...user,
    permissions: permissionsMap.get(user.id)?.permissions as ManagerPermissions | undefined,
    offer_ids: permissionsMap.get(user.id)?.offer_ids,
  })) as TeamMember[];
}

/**
 * Mettre à jour les permissions d'un membre d'équipe
 */
export async function updateMemberPermissions(
  userId: string,
  companyId: string,
  permissions: Partial<ManagerPermissions>,
  offerIds?: string[] | null,
  grantedBy?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('user_permissions')
    .select('id, permissions')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .single();

  const mergedPermissions = existing
    ? { ...existing.permissions, ...permissions }
    : { ...DEFAULT_MANAGER_PERMISSIONS, ...permissions };

  if (existing) {
    const { error } = await supabase
      .from('user_permissions')
      .update({
        permissions: mergedPermissions,
        offer_ids: offerIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('user_permissions')
      .insert({
        user_id: userId,
        company_id: companyId,
        permissions: mergedPermissions,
        offer_ids: offerIds,
        granted_by: grantedBy,
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

/**
 * Retirer un membre de l'équipe
 */
export async function removeMember(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  // Vérifier que ce n'est pas le owner
  const { data: user } = await supabase
    .from('users')
    .select('is_company_owner')
    .eq('id', userId)
    .single();

  if (user?.is_company_owner) {
    return { success: false, error: 'Impossible de retirer le propriétaire de l\'entreprise' };
  }

  // Supprimer les permissions
  await supabase
    .from('user_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('company_id', companyId);

  // Retirer l'utilisateur de l'entreprise
  const { error } = await supabase
    .from('users')
    .update({
      company_id: null,
      company_roles: [],
      is_primary_company_contact: false,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =====================================================
// OWNER TRANSFER
// =====================================================

/**
 * Transférer le rôle de propriétaire à un autre membre
 */
export async function transferOwnership(
  currentOwnerId: string,
  newOwnerId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que le nouvel owner fait partie de l'équipe
    const { data: newOwner } = await supabase
      .from('users')
      .select('id, company_id')
      .eq('id', newOwnerId)
      .eq('company_id', companyId)
      .single();

    if (!newOwner) {
      return { success: false, error: 'L\'utilisateur ne fait pas partie de cette entreprise' };
    }

    // Retirer le statut owner de l'ancien propriétaire
    await supabase
      .from('users')
      .update({ is_company_owner: false })
      .eq('id', currentOwnerId);

    // Attribuer le statut owner au nouveau propriétaire
    const { error } = await supabase
      .from('users')
      .update({
        is_company_owner: true,
        is_primary_company_contact: true,
        company_roles: ['company', 'rh'], // Le owner a tous les rôles par défaut
      })
      .eq('id', newOwnerId);

    if (error) throw error;

    // Donner toutes les permissions au nouveau owner
    await updateMemberPermissions(newOwnerId, companyId, FULL_PERMISSIONS, null, currentOwnerId);

    return { success: true };
  } catch (error: unknown) {
    console.error('Transfer ownership error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Vérifier les permissions d'un utilisateur pour une action spécifique
 */
export async function checkPermission(
  userId: string,
  companyId: string,
  permission: keyof ManagerPermissions
): Promise<boolean> {
  // Les owners ont toutes les permissions
  const { data: user } = await supabase
    .from('users')
    .select('is_company_owner, company_roles')
    .eq('id', userId)
    .single();

  if (user?.is_company_owner) {
    return true;
  }

  // Les RH ont la plupart des permissions
  if (user?.company_roles?.includes('rh')) {
    const rhRestrictedPermissions: (keyof ManagerPermissions)[] = [];
    if (!rhRestrictedPermissions.includes(permission)) {
      return true;
    }
  }

  // Vérifier les permissions spécifiques
  const { data: perms } = await supabase
    .from('user_permissions')
    .select('permissions')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .single();

  if (!perms?.permissions) {
    return false;
  }

  const permValue = (perms.permissions as ManagerPermissions)[permission];
  
  // Handle array permissions (like kanban_stages_access)
  if (Array.isArray(permValue)) {
    return permValue.length > 0;
  }
  
  return permValue ?? false;
}

// =====================================================
// ADDITIONAL FUNCTIONS & ALIASES
// =====================================================

/**
 * Alias pour getTeamMembers (compatibilité)
 */
export const getCompanyMembers = getTeamMembers;

/**
 * Type alias pour CompanyMember (compatibilité)
 */
export type CompanyMember = TeamMember;

/**
 * Annuler une invitation
 */
export async function cancelInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('company_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('status', 'pending');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
