'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function CandidateDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboardingComplete = searchParams.get('onboarding') === 'complete';

  useEffect(() => {
    // Redirection vers le dashboard des offres après 3 secondes
    if (onboardingComplete) {
      const timer = setTimeout(() => {
        router.push('/candidate/offers');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete, router]);

  if (onboardingComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Profil complété !
              </h1>
              
              <p className="text-gray-600 mb-6">
                Votre profil a été enregistré avec succès. Vous allez être redirigé vers les offres...
              </p>

              <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">Redirection en cours</span>
              </div>

              <button
                onClick={() => router.push('/candidate/offers')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
              >
                Voir les offres maintenant
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Si pas de paramètre onboarding, rediriger vers les offres
  useEffect(() => {
    router.push('/candidate/offers');
  }, [router]);

  return null;
}
