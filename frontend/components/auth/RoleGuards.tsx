'use client';

import { useRoleAuth } from '@/hooks/useRoleAuth';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Guard pour les pages Candidat
 * Redirige automatiquement vers /login-candidate si non authentifié
 */
export function CandidateGuard({ children, fallback }: RoleGuardProps) {
  const { loading, isAuthenticated, isCandidate } = useRoleAuth({ requiredRole: 'candidate' });

  if (loading) {
    return fallback || <LoadingScreen />;
  }

  if (!isAuthenticated || !isCandidate) {
    return fallback || <LoadingScreen message="Redirection..." />;
  }

  return <>{children}</>;
}

/**
 * Guard pour les pages Company
 * Redirige automatiquement vers /login-company si non authentifié
 */
export function CompanyGuard({ children, fallback }: RoleGuardProps) {
  const { loading, isAuthenticated, isCompany } = useRoleAuth({ requiredRole: 'company' });

  if (loading) {
    return fallback || <LoadingScreen />;
  }

  if (!isAuthenticated || !isCompany) {
    return fallback || <LoadingScreen message="Redirection..." />;
  }

  return <>{children}</>;
}

/**
 * Guard pour les pages Admin
 * Redirige automatiquement vers /login-admin si non authentifié
 */
export function AdminGuard({ children, fallback }: RoleGuardProps) {
  const { loading, isAuthenticated, isAdmin } = useRoleAuth({ requiredRole: 'admin' });

  if (loading) {
    return fallback || <LoadingScreen />;
  }

  if (!isAuthenticated || !isAdmin) {
    return fallback || <LoadingScreen message="Redirection..." />;
  }

  return <>{children}</>;
}

/**
 * Composant de chargement par défaut
 */
function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

/**
 * HOC pour protéger les pages par rôle
 */
export function withCandidateAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <CandidateGuard>
        <WrappedComponent {...props} />
      </CandidateGuard>
    );
  };
}

export function withCompanyAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <CompanyGuard>
        <WrappedComponent {...props} />
      </CompanyGuard>
    );
  };
}

export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AdminGuard>
        <WrappedComponent {...props} />
      </AdminGuard>
    );
  };
}
