/**
 * Service d'authentification
 * Gère la connexion, l'inscription et la gestion de session via Supabase Auth
 * Compatible avec le schéma unifié (users table)
 */

import { supabase } from '@/lib/supabase';

// Types
export type UserRole = 'candidate' | 'company' | 'admin';
export type CompanyRole = 'company' | 'rh' | 'manager';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  company_roles?: CompanyRole[];
  company_id?: string;
  first_name?: string;
  last_name?: string;
  name: string;
  onboarding_completed?: boolean;
  profile_completed?: boolean;
}

// Helper pour obtenir le user actuel depuis la table unifiée users
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return null;

    // Récupérer les infos depuis la table users
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, role, company_roles, company_id, first_name, last_name, onboarding_completed, profile_completed')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error || !userData) {
      // User existe dans auth mais pas dans users table - return basic info
      return {
        id: authUser.id,
        email: authUser.email || '',
        role: 'candidate', // Default
        name: authUser.email?.split('@')[0] || 'User',
      };
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role as UserRole,
      company_roles: userData.company_roles as CompanyRole[],
      company_id: userData.company_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      onboarding_completed: userData.onboarding_completed,
      profile_completed: userData.profile_completed,
      name: userData.first_name && userData.last_name 
        ? `${userData.first_name} ${userData.last_name}`
        : userData.email?.split('@')[0] || 'User',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Login avec mot de passe
export async function login(email: string, password: string): Promise<AuthUser> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Connexion échouée');

    const user = await getCurrentUser();
    if (!user) throw new Error('Impossible de récupérer le profil utilisateur');

    return user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Erreur de connexion');
  }
}

// Login avec OAuth (Google, LinkedIn)
export async function loginWithOAuth(provider: 'google' | 'azure'): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('OAuth login error:', error);
    throw new Error(error.message || 'Erreur de connexion OAuth');
  }
}

// Inscription candidat
export async function registerCandidate(
  email: string,
  password: string,
  additionalData?: Record<string, unknown>
): Promise<AuthUser> {
  try {
    // 1. Créer le compte auth
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/candidate/onboarding`
      : 'http://localhost:3000/candidate/onboarding';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'candidate' },
        emailRedirectTo: redirectUrl,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erreur lors de la création du compte');

    // 2. Créer l'entrée dans la table users
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email,
      role: 'candidate',
      first_name: additionalData?.firstName as string || null,
      last_name: additionalData?.lastName as string || null,
      phone: additionalData?.phone as string || null,
      institution: additionalData?.institution as string || null,
      education_level: additionalData?.educationLevel as string || null,
      specialization: additionalData?.specialization as string || null,
      profile_completed: false,
      onboarding_completed: false,
      onboarding_step: 0,
    });

    if (userError) throw userError;

    // Return user data directly instead of querying again
    // (email confirmation might block auth.getUser() immediately after signup)
    return {
      id: authData.user.id,
      email: authData.user.email || email,
      role: 'candidate',
      first_name: additionalData?.firstName as string,
      last_name: additionalData?.lastName as string,
      name: additionalData?.firstName && additionalData?.lastName
        ? `${additionalData.firstName} ${additionalData.lastName}`
        : email.split('@')[0],
    };
  } catch (error: unknown) {
    console.error('Register error:', error);
    throw new Error((error as Error).message || 'Erreur lors de l\'inscription');
  }
}

// Inscription entreprise
export async function registerCompany(
  email: string,
  password: string,
  companyData: {
    companyName: string;
    siret?: string;
    sector?: string;
    size?: string;
    contactName?: string;
    contactPhone?: string;
    roles?: CompanyRole[];
    captchaToken?: string | null;
  }
): Promise<AuthUser> {
  try {
    // 1. Créer le compte auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'company' },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erreur lors de la création du compte');

    // 2. Créer ou récupérer l'entreprise
    let companyId: string | null = null;

    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyData.companyName,
        siret: companyData.siret || null,
        sector: companyData.sector || null,
        size: companyData.size || null,
        contact_name: companyData.contactName || null,
        contact_email: email,
        contact_phone: companyData.contactPhone || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (companyError) {
      // Si l'entreprise existe déjà (SIRET unique), la récupérer
      if ((companyError as { code?: string }).code === '23505' && companyData.siret) {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('siret', companyData.siret)
          .single();
        companyId = existingCompany?.id || null;
      } else {
        throw companyError;
      }
    } else {
      companyId = newCompany.id;
    }

    // 3. Créer l'entrée dans la table users
    const nameParts = companyData.contactName?.split(' ') || [];
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email,
      role: 'company',
      company_roles: companyData.roles || ['company'],
      company_id: companyId,
      first_name: nameParts[0] || null,
      last_name: nameParts.slice(1).join(' ') || null,
      phone: companyData.contactPhone || null,
      is_primary_company_contact: true,
      is_company_owner: true, // Premier inscrit devient référent/owner
      profile_completed: true,
      onboarding_completed: true,
    });

    if (userError) throw userError;

    // Return user data directly instead of querying again
    return {
      id: authData.user.id,
      email: authData.user.email || email,
      role: 'company',
      company_roles: companyData.roles || ['company'],
      company_id: companyId || undefined,
      first_name: nameParts[0] || undefined,
      last_name: nameParts.slice(1).join(' ') || undefined,
      name: companyData.contactName || email.split('@')[0],
    };
  } catch (error: unknown) {
    console.error('Register error:', error);
    throw new Error((error as Error).message || 'Erreur lors de l\'inscription');
  }
}

// Déconnexion
export async function logout(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message || 'Erreur lors de la déconnexion');
  }
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Reset password error:', error);
    throw new Error(error.message || 'Erreur lors de la réinitialisation');
  }
}

// Update password
export async function updatePassword(newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Update password error:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du mot de passe');
  }
}

// Vérifier si l'utilisateur est connecté
export async function isAuthenticated(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

// Écouter les changements d'état d'authentification
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

// =====================================================
// OAUTH / SOCIAL LOGIN
// =====================================================

export type OAuthProvider = 'google' | 'azure' | 'linkedin_oidc';

/**
 * Connexion via OAuth (Google, Microsoft Azure, LinkedIn)
 * Redirige vers le provider et gère le callback
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  options?: {
    redirectTo?: string;
    scopes?: string;
    queryParams?: Record<string, string>;
  }
): Promise<void> {
  const redirectTo = options?.redirectTo || `${window.location.origin}/auth/callback`;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: options?.scopes,
      queryParams: options?.queryParams,
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    throw new Error(error.message || 'Erreur lors de la connexion');
  }
}

/**
 * Connexion avec Google
 */
export async function signInWithGoogle(redirectTo?: string): Promise<void> {
  return signInWithOAuth('google', {
    redirectTo,
    scopes: 'email profile',
  });
}

/**
 * Connexion avec Microsoft (Azure AD / Outlook professionnel)
 */
export async function signInWithMicrosoft(redirectTo?: string): Promise<void> {
  return signInWithOAuth('azure', {
    redirectTo,
    scopes: 'email profile openid',
  });
}

/**
 * Connexion avec LinkedIn
 */
export async function signInWithLinkedIn(redirectTo?: string): Promise<void> {
  return signInWithOAuth('linkedin_oidc', {
    redirectTo,
    scopes: 'openid profile email',
  });
}

/**
 * Compléter le profil après OAuth pour une entreprise
 * Appelé quand l'utilisateur s'inscrit via OAuth et doit compléter ses infos entreprise
 */
export async function completeCompanyOAuthProfile(
  userId: string,
  companyData: {
    companyName: string;
    siret?: string;
    sector?: string;
    size?: string;
    contactName?: string;
    contactPhone?: string;
    roles?: CompanyRole[];
  }
): Promise<{ success: boolean; companyId?: string; error?: string }> {
  try {
    // Vérifier si le SIRET existe déjà
    if (companyData.siret) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id, name')
        .eq('siret', companyData.siret)
        .single();

      if (existingCompany) {
        return {
          success: false,
          error: `Une entreprise avec ce SIRET existe déjà: ${existingCompany.name}`,
        };
      }
    }

    // Créer l'entreprise
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyData.companyName,
        siret: companyData.siret || null,
        sector: companyData.sector || null,
        size: companyData.size || null,
        contact_name: companyData.contactName || null,
        contact_phone: companyData.contactPhone || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (companyError) throw companyError;

    // Mettre à jour l'utilisateur avec les infos entreprise
    const nameParts = companyData.contactName?.split(' ') || [];
    const { error: userError } = await supabase
      .from('users')
      .update({
        role: 'company',
        company_roles: companyData.roles || ['company'],
        company_id: newCompany.id,
        first_name: nameParts[0] || null,
        last_name: nameParts.slice(1).join(' ') || null,
        phone: companyData.contactPhone || null,
        is_primary_company_contact: true,
        is_company_owner: true, // Premier inscrit devient owner
        profile_completed: true,
        onboarding_completed: false, // Doit compléter l'onboarding
      })
      .eq('id', userId);

    if (userError) throw userError;

    return { success: true, companyId: newCompany.id };
  } catch (error: unknown) {
    console.error('Complete OAuth profile error:', error);
    return {
      success: false,
      error: (error as Error).message || 'Erreur lors de la création du profil',
    };
  }
}

/**
 * Vérifier si un SIRET existe déjà
 */
export async function checkSiretExists(siret: string): Promise<{
  exists: boolean;
  companyName?: string;
}> {
  const { data } = await supabase
    .from('companies')
    .select('id, name')
    .eq('siret', siret)
    .single();

  return {
    exists: !!data,
    companyName: data?.name,
  };
}

/**
 * Extraire le domaine d'un email
 */
export function extractEmailDomain(email: string): string {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1].toLowerCase() : '';
}

/**
 * Vérifier si une entreprise existe avec ce domaine email
 */
export async function checkCompanyByEmailDomain(email: string): Promise<{
  exists: boolean;
  company?: {
    id: string;
    name: string;
    sector: string | null;
    size: string | null;
    logo_url: string | null;
  };
}> {
  const domain = extractEmailDomain(email);
  
  // Ignorer les domaines génériques
  const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net', 'wanadoo.fr'];
  if (genericDomains.includes(domain)) {
    return { exists: false };
  }

  // Chercher une entreprise avec un contact_email ayant le même domaine
  const { data } = await supabase
    .from('companies')
    .select('id, name, sector, size, logo_url, contact_email')
    .ilike('contact_email', `%@${domain}`)
    .limit(1)
    .single();

  if (data) {
    return {
      exists: true,
      company: {
        id: data.id,
        name: data.name,
        sector: data.sector,
        size: data.size,
        logo_url: data.logo_url,
      },
    };
  }

  // Chercher aussi dans les users avec le même domaine
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, companies!inner(id, name, sector, size, logo_url)')
    .eq('role', 'company')
    .ilike('email', `%@${domain}`)
    .limit(1)
    .single();

  if (userData?.companies) {
    // Handle both array and object response from Supabase
    const companyData = Array.isArray(userData.companies) ? userData.companies[0] : userData.companies;
    if (companyData) {
      return {
        exists: true,
        company: {
          id: companyData.id,
          name: companyData.name,
          sector: companyData.sector,
          size: companyData.size,
          logo_url: companyData.logo_url,
        },
      };
    }
  }

  return { exists: false };
}

/**
 * Inscription entreprise simplifiée - Étape 1 (création du compte utilisateur uniquement)
 * L'entreprise sera créée/rattachée après validation de l'email
 */
export async function registerCompanyUser(
  email: string,
  password: string,
  userData: {
    fullName: string;
    role: CompanyRole;
  }
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Créer le compte auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'company', pending_company: true },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erreur lors de la création du compte');

    // Créer l'entrée dans la table users (sans company_id pour l'instant)
    const nameParts = userData.fullName.split(' ');
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email,
      role: 'company',
      company_roles: [userData.role],
      company_id: null, // Sera renseigné après validation email
      first_name: nameParts[0] || null,
      last_name: nameParts.slice(1).join(' ') || null,
      is_primary_company_contact: false,
      is_company_owner: false,
      profile_completed: false,
      onboarding_completed: false,
    });

    if (userError) throw userError;

    return { success: true, userId: authData.user.id };
  } catch (error: unknown) {
    console.error('Register company user error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Rattacher un utilisateur à une entreprise existante
 */
export async function joinExistingCompany(
  userId: string,
  companyId: string,
  role: CompanyRole = 'manager'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        company_id: companyId,
        company_roles: [role],
        is_primary_company_contact: false,
        is_company_owner: false,
        profile_completed: true,
        onboarding_completed: true,
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    console.error('Join company error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Créer une nouvelle entreprise et rattacher l'utilisateur comme owner
 */
export async function createCompanyAndLink(
  userId: string,
  companyData: {
    name: string;
    siret: string;
    sector: string;
    size: string;
    website?: string;
    linkedin_url?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    description?: string;
  },
  userEmail: string
): Promise<{ success: boolean; companyId?: string; error?: string }> {
  try {
    // Vérifier si le SIRET existe déjà
    const siretCheck = await checkSiretExists(companyData.siret);
    if (siretCheck.exists) {
      return { success: false, error: `Ce SIRET est déjà enregistré pour : ${siretCheck.companyName}` };
    }

    // Créer l'entreprise avec tous les champs
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        siret: companyData.siret,
        sector: companyData.sector,
        size: companyData.size,
        website: companyData.website || null,
        linkedin_url: companyData.linkedin_url || null,
        contact_name: companyData.contact_name || null,
        contact_email: companyData.contact_email || userEmail,
        contact_phone: companyData.contact_phone || null,
        description: companyData.description || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (companyError) throw companyError;

    // Mettre à jour l'utilisateur comme owner
    const { error: userError } = await supabase
      .from('users')
      .update({
        company_id: newCompany.id,
        company_roles: ['company', 'rh'],
        is_primary_company_contact: true,
        is_company_owner: true,
        profile_completed: true,
        onboarding_completed: true,
      })
      .eq('id', userId);

    if (userError) throw userError;

    return { success: true, companyId: newCompany.id };
  } catch (error: unknown) {
    console.error('Create company error:', error);
    return { success: false, error: (error as Error).message };
  }
}
