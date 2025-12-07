'use client';

import CandidateAuthWrapper from '@/components/auth/CandidateAuthWrapper';

/**
 * Layout pour toutes les pages /candidate/*
 * Vérifie automatiquement l'auth et l'onboarding
 */
export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <CandidateAuthWrapper requireProfile={true}>
      {children}
    </CandidateAuthWrapper>
  );
}
