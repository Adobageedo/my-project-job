'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

// Mock: En production, cela viendrait d'un contexte d'authentification
const useAuth = () => {
  // Simuler un utilisateur connecté basé sur le chemin
  const pathname = usePathname();
  
  let role: UserRole | null = null;
  let isAuthenticated = false;
  
  if (pathname.startsWith('/candidate')) {
    role = 'candidate';
    isAuthenticated = true;
  } else if (pathname.startsWith('/company')) {
    role = 'company';
    isAuthenticated = true;
  } else if (pathname.startsWith('/admin')) {
    role = 'admin';
    isAuthenticated = true;
  }
  
  return { role, isAuthenticated, isLoading: false };
};

/**
 * Composant de protection des routes par rôle
 * Empêche l'accès aux espaces non autorisés
 */
export function AuthGuard({ children, allowedRoles, redirectTo = '/login-candidate' }: AuthGuardProps) {
  const router = useRouter();
  const { role, isAuthenticated, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (role && allowedRoles.includes(role)) {
      setIsAuthorized(true);
    } else {
      // Rediriger vers l'espace approprié
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
        default:
          router.replace(redirectTo);
      }
    }
  }, [role, isAuthenticated, isLoading, allowedRoles, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * HOC pour protéger les pages
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Hook pour vérifier les permissions
 */
export function usePermissions() {
  const { role, isAuthenticated } = useAuth();
  
  return {
    isAuthenticated,
    role,
    isCandidate: role === 'candidate',
    isCompany: role === 'company',
    isAdmin: role === 'admin',
    canViewCandidates: role === 'company' || role === 'admin',
    canManageOffers: role === 'company' || role === 'admin',
    canManageUsers: role === 'admin',
    canViewAllApplications: role === 'admin',
  };
}

/**
 * Composant pour afficher du contenu selon le rôle
 */
interface RoleBasedContentProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleBasedContent({ children, allowedRoles, fallback = null }: RoleBasedContentProps) {
  const { role } = useAuth();
  
  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
