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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'candidate' },
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
