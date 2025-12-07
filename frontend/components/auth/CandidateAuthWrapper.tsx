'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCandidate } from '@/contexts/AuthContext';

interface CandidateAuthWrapperProps {
  children: React.ReactNode;
  requireProfile?: boolean; // Si true, redirige vers onboarding si pas de profil
}

/**
 * Wrapper pour les pages candidat
 * - Vérifie l'authentification
 * - Redirige vers onboarding si profil incomplet
 * - Affiche un loader pendant la vérification
 */
export default function CandidateAuthWrapper({ 
  children, 
  requireProfile = true 
}: CandidateAuthWrapperProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { candidate, isLoading: isCandidateLoading, error } = useCandidate();

  const isLoading = isAuthLoading || isCandidateLoading;

  useEffect(() => {
    if (isLoading) return;

    const pathname = window.location.pathname;
    const isOnboardingPage = pathname === '/candidate/onboarding' || pathname.startsWith('/candidate/onboarding/');

    console.log('[CandidateAuthWrapper] State:', {
      user: user ? { id: user.id, role: user.role } : null,
      candidate: candidate ? { id: candidate.id, firstName: candidate.firstName } : null,
      requireProfile,
      pathname,
      isOnboardingPage,
    });

    if (!user) {
      // Pas connecté → login
      console.log('[CandidateAuthWrapper] → /login-candidate');
      router.push('/login-candidate?redirect=' + pathname);
      return;
    }

    // Skip onboarding check if already on onboarding page
    if (isOnboardingPage) {
      console.log('[CandidateAuthWrapper] Already on onboarding page, skipping redirect');
      return;
    }

    // Connecté mais pas de profil candidat OU first_name null → onboarding
    if (requireProfile && (!candidate || !candidate.firstName) && !error) {
      console.log('[CandidateAuthWrapper] → /candidate/onboarding (missing profile or firstName)');
      router.push('/candidate/onboarding');
    }
  }, [user, candidate, isLoading, error, requireProfile, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No profile (et requireProfile = true)
  if (requireProfile && !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Redirection vers l'onboarding...</p>
        </div>
      </div>
    );
  }

  // All good!
  return <>{children}</>;
}
