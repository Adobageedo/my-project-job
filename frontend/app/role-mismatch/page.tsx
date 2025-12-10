'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, LogIn, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function RoleMismatchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout } = useAuth();
  
  const expectedRole = searchParams.get('expected') || 'candidate';
  const returnUrl = searchParams.get('returnUrl') || '/';

  const isExpectedCandidate = expectedRole === 'candidate';

  const handleSwitchAccount = async () => {
    await logout();
    const loginPath = isExpectedCandidate ? '/login-candidate' : '/login-company';
    router.push(`${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Accès non autorisé
        </h1>
        
        <p className="text-gray-600 mb-6">
          {isExpectedCandidate ? (
            <>
              Cette page est réservée aux <strong>candidats</strong>. 
              Vous êtes actuellement connecté avec un compte <strong>entreprise</strong>.
            </>
          ) : (
            <>
              Cette page est réservée aux <strong>entreprises</strong>. 
              Vous êtes actuellement connecté avec un compte <strong>candidat</strong>.
            </>
          )}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleSwitchAccount}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Se connecter en tant que {isExpectedCandidate ? 'candidat' : 'entreprise'}
          </button>

          <Link
            href={isExpectedCandidate ? '/candidate/offers' : '/company/offers'}
            className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Retourner à mon espace
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Besoin d'un autre compte ?{' '}
          <Link 
            href={isExpectedCandidate ? '/register-candidate' : '/register-company'} 
            className="text-blue-600 hover:underline"
          >
            Créer un compte {isExpectedCandidate ? 'candidat' : 'entreprise'}
          </Link>
        </p>
      </div>
    </div>
  );
}
