/**
 * Service de gestion des permissions utilisateur
 * Centralise la vérification des droits pour les utilisateurs entreprise
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface UserPermissions {
  user_id: string;
  company_id: string;
  is_owner: boolean;
  is_primary_contact: boolean;
  company_roles: string[];
  permissions: {
    can_view_applications: boolean;
    can_edit_applications: boolean;
    can_send_emails: boolean;
    can_change_status: boolean;
    can_add_notes: boolean;
    can_create_offers: boolean;
    can_edit_offers: boolean;
    can_view_all_offers: boolean;
    can_manage_team: boolean;
    can_edit_company_profile: boolean;
    kanban_stages_access: string[];
  };
  offer_ids: string[] | null; // null = all offers
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// =====================================================
// DEFAULT PERMISSIONS BY ROLE
// =====================================================

export const OWNER_PERMISSIONS = {
  can_view_applications: true,
  can_edit_applications: true,
  can_send_emails: true,
  can_change_status: true,
  can_add_notes: true,
  can_create_offers: true,
  can_edit_offers: true,
  can_view_all_offers: true,
  can_manage_team: true,
  can_edit_company_profile: true,
  kanban_stages_access: ['pending', 'in_progress', 'interview', 'rejected', 'accepted', 'withdrawn'],
};

export const RH_PERMISSIONS = {
  can_view_applications: true,
  can_edit_applications: true,
  can_send_emails: true,
  can_change_status: true,
  can_add_notes: true,
  can_create_offers: true,
  can_edit_offers: true,
  can_view_all_offers: true,
  can_manage_team: false,
  can_edit_company_profile: false,
  kanban_stages_access: ['pending', 'in_progress', 'interview', 'rejected', 'accepted', 'withdrawn'],
};

export const MANAGER_PERMISSIONS = {
  can_view_applications: true,
  can_edit_applications: false,
  can_send_emails: false,
  can_change_status: false,
  can_add_notes: true,
  can_create_offers: false,
  can_edit_offers: false,
  can_view_all_offers: false,
  can_manage_team: false,
  can_edit_company_profile: false,
  kanban_stages_access: ['pending', 'in_progress', 'interview'],
};

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Récupérer les permissions complètes de l'utilisateur courant
 */
export async function getCurrentUserPermissions(): Promise<UserPermissions | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Récupérer les infos utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, company_id, is_company_owner, is_primary_company_contact, company_roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !userData.company_id) {
      return null;
    }

    // Récupérer les permissions spécifiques si elles existent
    const { data: permData } = await supabase
      .from('user_permissions')
      .select('permissions, offer_ids')
      .eq('user_id', user.id)
      .eq('company_id', userData.company_id)
      .single();

    // Déterminer les permissions de base selon le rôle
    let basePermissions = MANAGER_PERMISSIONS;
    if (userData.is_company_owner || userData.is_primary_company_contact) {
      basePermissions = OWNER_PERMISSIONS;
    } else if (userData.company_roles?.includes('rh')) {
      basePermissions = RH_PERMISSIONS;
    }

    // Fusionner avec les permissions spécifiques
    const finalPermissions = permData?.permissions
      ? { ...basePermissions, ...permData.permissions }
      : basePermissions;

    return {
      user_id: userData.id,
      company_id: userData.company_id,
      is_owner: userData.is_company_owner || false,
      is_primary_contact: userData.is_primary_company_contact || false,
      company_roles: userData.company_roles || [],
      permissions: finalPermissions as UserPermissions['permissions'],
      offer_ids: permData?.offer_ids || null,
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return null;
  }
}

/**
 * Vérifier si l'utilisateur peut éditer le profil entreprise
 */
export async function canEditCompanyProfile(): Promise<PermissionCheckResult> {
  const perms = await getCurrentUserPermissions();
  if (!perms) {
    return { allowed: false, reason: 'Utilisateur non connecté' };
  }

  if (perms.is_owner || perms.is_primary_contact || perms.permissions.can_edit_company_profile) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Seul l\'administrateur peut modifier les informations de l\'entreprise' };
}

/**
 * Vérifier si l'utilisateur peut gérer l'équipe
 */
export async function canManageTeam(): Promise<PermissionCheckResult> {
  const perms = await getCurrentUserPermissions();
  if (!perms) {
    return { allowed: false, reason: 'Utilisateur non connecté' };
  }

  if (perms.is_owner || perms.is_primary_contact || perms.permissions.can_manage_team) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Vous n\'avez pas les droits pour gérer l\'équipe' };
}

/**
 * Vérifier si l'utilisateur peut voir une offre spécifique
 */
export async function canViewOffer(offerId: string): Promise<PermissionCheckResult> {
  const perms = await getCurrentUserPermissions();
  if (!perms) {
    return { allowed: false, reason: 'Utilisateur non connecté' };
  }

  // Owner/admin voit tout
  if (perms.is_owner || perms.is_primary_contact || perms.permissions.can_view_all_offers) {
    return { allowed: true };
  }

  // Sinon, vérifier si l'offre est dans la liste autorisée
  if (perms.offer_ids === null) {
    return { allowed: true }; // null = toutes les offres
  }

  if (perms.offer_ids.includes(offerId)) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Vous n\'avez pas accès à cette offre' };
}

/**
 * Récupérer la liste des offres autorisées pour l'utilisateur
 */
export async function getAuthorizedOfferIds(): Promise<string[] | null> {
  const perms = await getCurrentUserPermissions();
  if (!perms) return [];

  // Owner/admin voit tout
  if (perms.is_owner || perms.is_primary_contact || perms.permissions.can_view_all_offers) {
    return null; // null = toutes les offres
  }

  return perms.offer_ids || [];
}

/**
 * Vérifier si l'utilisateur peut créer des offres
 */
export async function canCreateOffers(): Promise<PermissionCheckResult> {
  const perms = await getCurrentUserPermissions();
  if (!perms) {
    return { allowed: false, reason: 'Utilisateur non connecté' };
  }

  if (perms.is_owner || perms.is_primary_contact || perms.permissions.can_create_offers) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Vous n\'avez pas les droits pour créer des offres' };
}

/**
 * Vérifier si l'utilisateur peut éditer une offre
 */
export async function canEditOffer(offerId: string): Promise<PermissionCheckResult> {
  const perms = await getCurrentUserPermissions();
  if (!perms) {
    return { allowed: false, reason: 'Utilisateur non connecté' };
  }

  // Owner/admin peut tout éditer
  if (perms.is_owner || perms.is_primary_contact) {
    return { allowed: true };
  }

  // Vérifier la permission globale
  if (!perms.permissions.can_edit_offers) {
    return { allowed: false, reason: 'Vous n\'avez pas les droits pour éditer les offres' };
  }

  // Vérifier si l'offre est dans la liste autorisée
  if (perms.offer_ids !== null && !perms.offer_ids.includes(offerId)) {
    return { allowed: false, reason: 'Vous n\'avez pas accès à cette offre' };
  }

  return { allowed: true };
}

/**
 * Transférer les droits d'administrateur à un autre membre
 */
export async function transferOwnership(
  newOwnerId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non connecté' };
    }

    // Vérifier que l'utilisateur actuel est owner
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_company_owner, company_id')
      .eq('id', user.id)
      .single();

    if (!currentUser?.is_company_owner || currentUser.company_id !== companyId) {
      return { success: false, error: 'Vous devez être propriétaire pour transférer les droits' };
    }

    // Vérifier que le nouveau propriétaire appartient à la même entreprise
    const { data: newOwner } = await supabase
      .from('users')
      .select('id, company_id')
      .eq('id', newOwnerId)
      .single();

    if (!newOwner || newOwner.company_id !== companyId) {
      return { success: false, error: 'L\'utilisateur ne fait pas partie de l\'entreprise' };
    }

    // Transférer les droits (transaction)
    // 1. Retirer les droits de l'ancien owner
    await supabase
      .from('users')
      .update({ 
        is_company_owner: false,
        is_primary_company_contact: false,
      })
      .eq('id', user.id);

    // 2. Donner les droits au nouveau owner
    await supabase
      .from('users')
      .update({ 
        is_company_owner: true,
        is_primary_company_contact: true,
        company_roles: ['company'],
      })
      .eq('id', newOwnerId);

    // 3. Donner toutes les permissions
    await supabase
      .from('user_permissions')
      .upsert({
        user_id: newOwnerId,
        company_id: companyId,
        permissions: OWNER_PERMISSIONS,
        offer_ids: null,
      });

    return { success: true };
  } catch (error: unknown) {
    console.error('Error transferring ownership:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Donner les droits d'administration à un membre (sans retirer les siens)
 */
export async function grantAdminRights(
  memberId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non connecté' };
    }

    // Vérifier que l'utilisateur actuel est owner
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_company_owner, company_id')
      .eq('id', user.id)
      .single();

    if (!currentUser?.is_company_owner || currentUser.company_id !== companyId) {
      return { success: false, error: 'Vous devez être propriétaire pour accorder les droits admin' };
    }

    // Mettre à jour les droits du membre
    await supabase
      .from('users')
      .update({ 
        is_primary_company_contact: true,
        company_roles: ['company'],
      })
      .eq('id', memberId);

    // Donner toutes les permissions
    await supabase
      .from('user_permissions')
      .upsert({
        user_id: memberId,
        company_id: companyId,
        permissions: OWNER_PERMISSIONS,
        offer_ids: null,
      });

    return { success: true };
  } catch (error: unknown) {
    console.error('Error granting admin rights:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Retirer les droits d'administration à un membre
 */
export async function revokeAdminRights(
  memberId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non connecté' };
    }

    // Vérifier que l'utilisateur actuel est owner
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_company_owner, company_id')
      .eq('id', user.id)
      .single();

    if (!currentUser?.is_company_owner || currentUser.company_id !== companyId) {
      return { success: false, error: 'Vous devez être propriétaire pour retirer les droits admin' };
    }

    // Ne pas pouvoir se retirer ses propres droits
    if (memberId === user.id) {
      return { success: false, error: 'Vous ne pouvez pas retirer vos propres droits' };
    }

    // Mettre à jour les droits du membre
    await supabase
      .from('users')
      .update({ 
        is_primary_company_contact: false,
        company_roles: ['manager'],
      })
      .eq('id', memberId);

    // Remettre les permissions par défaut
    await supabase
      .from('user_permissions')
      .upsert({
        user_id: memberId,
        company_id: companyId,
        permissions: MANAGER_PERMISSIONS,
        offer_ids: null,
      });

    return { success: true };
  } catch (error: unknown) {
    console.error('Error revoking admin rights:', error);
    return { success: false, error: (error as Error).message };
  }
}
