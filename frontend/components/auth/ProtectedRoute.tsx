'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  allowedRoles?: ('candidate' | 'company' | 'admin')[];
}

export default function ProtectedRoute({ 
  children, 
  requireOnboarding = true,
  allowedRoles = ['candidate']
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, isCandidate, isCompany, isAdmin, onboardingCompleted } = useAuth(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login-candidate');
      return;
    }

    // Vérifier les rôles autorisés
    const hasAllowedRole = 
      (allowedRoles.includes('candidate') && isCandidate) ||
      (allowedRoles.includes('company') && isCompany) ||
      (allowedRoles.includes('admin') && isAdmin);

    if (!hasAllowedRole) {
      router.push('/login-candidate');
      return;
    }

    // Vérifier l'onboarding pour les candidats
    if (requireOnboarding && isCandidate && !onboardingCompleted) {
      router.push('/candidate/onboarding');
      return;
    }
  }, [user, loading, isCandidate, isCompany, isAdmin, onboardingCompleted, requireOnboarding, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
