import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'candidate' | 'company' | 'admin';

interface RoleAuthState {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  isAuthenticated: boolean;
}

interface UseRoleAuthOptions {
  requiredRole?: UserRole;
  redirectIfAuthenticated?: boolean;
  publicAccess?: boolean;
}

/**
 * Hook d'authentification avec gestion des rôles et redirections automatiques
 */
export function useRoleAuth(options: UseRoleAuthOptions = {}) {
  const { requiredRole, redirectIfAuthenticated = false, publicAccess = false } = options;
  const router = useRouter();
  const [authState, setAuthState] = useState<RoleAuthState>({
    user: null,
    loading: true,
    role: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const role = (user.user_metadata?.role as UserRole) || 'candidate';
          
          setAuthState({
            user,
            loading: false,
            role,
            isAuthenticated: true,
          });

          // Si on est sur une page publique et qu'on veut rediriger les utilisateurs authentifiés
          if (redirectIfAuthenticated) {
            switch (role) {
              case 'candidate':
                router.replace('/candidate');
                break;
              case 'company':
                router.replace('/company/dashboard');
                break;
              case 'admin':
                router.replace('/admin/dashboard');
                break;
            }
            return;
          }

          // Vérifier si l'utilisateur a le rôle requis
          if (requiredRole && role !== requiredRole) {
            // Rediriger vers la page appropriée selon le rôle
            switch (role) {
              case 'candidate':
                router.replace('/candidate');
                break;
              case 'company':
                router.replace('/company/dashboard');
                break;
              case 'admin':
                router.replace('/admin/dashboard');
                break;
            }
          }
        } else {
          // Pas d'utilisateur authentifié
          setAuthState({
            user: null,
            loading: false,
            role: null,
            isAuthenticated: false,
          });

          // Si un rôle est requis et que l'accès n'est pas public, rediriger vers le login approprié
          if (requiredRole && !publicAccess) {
            switch (requiredRole) {
              case 'candidate':
                router.replace('/login-candidate');
                break;
              case 'company':
                router.replace('/login-company');
                break;
              case 'admin':
                router.replace('/login-admin');
                break;
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setAuthState({
          user: null,
          loading: false,
          role: null,
          isAuthenticated: false,
        });
      }
    };

    checkAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const role = (session.user.user_metadata?.role as UserRole) || 'candidate';
        
        setAuthState({
          user: session.user,
          loading: false,
          role,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          role: null,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requiredRole, redirectIfAuthenticated, publicAccess, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    
    // Rediriger vers le login approprié selon le rôle actuel
    const role = authState.role;
    switch (role) {
      case 'company':
        router.push('/login-company');
        break;
      case 'admin':
        router.push('/login-admin');
        break;
      default:
        router.push('/login-candidate');
    }
  };

  return {
    ...authState,
    isCandidate: authState.role === 'candidate',
    isCompany: authState.role === 'company',
    isAdmin: authState.role === 'admin',
    signOut,
  };
}

/**
 * Hook pour détecter si l'utilisateur peut accéder à une fonctionnalité
 * Utile pour les pages à accès mixte (ex: /candidate/offers)
 */
export function useFeatureAccess() {
  const { isAuthenticated, role } = useRoleAuth({ publicAccess: true });

  const requireAuth = (requiredRole: UserRole, onUnauthorized?: () => void) => {
    if (!isAuthenticated) {
      if (onUnauthorized) {
        onUnauthorized();
      }
      return false;
    }
    
    if (role !== requiredRole) {
      if (onUnauthorized) {
        onUnauthorized();
      }
      return false;
    }
    
    return true;
  };

  return {
    isAuthenticated,
    role,
    requireAuth,
  };
}
