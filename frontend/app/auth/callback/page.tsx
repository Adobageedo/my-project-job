'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Récupérer les paramètres de l'URL (Supabase les ajoute après la redirection)
      const code = searchParams?.get('code');
      const errorParam = searchParams?.get('error');
      const errorDescription = searchParams?.get('error_description');

      if (errorParam) {
        throw new Error(errorDescription || errorParam);
      }

      // Si on a un code, échanger contre une session
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          throw exchangeError;
        }
      }

      // Vérifier la session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Session non trouvée. Veuillez vous reconnecter.');
      }

      setStatus('success');

      // Récupérer le rôle de l'utilisateur pour rediriger correctement
      const { data: userData } = await supabase
        .from('users')
        .select('role, company_id, onboarding_completed')
        .eq('id', session.user.id)
        .single();

      // Attendre un peu pour montrer le succès
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Rediriger selon le type d'utilisateur
      if (userData?.role === 'company') {
        if (userData.company_id) {
          router.push('/company/dashboard');
        } else {
          router.push('/company/onboarding');
        }
      } else {
        // Candidat
        if (userData?.onboarding_completed) {
          router.push('/candidate/offers');
        } else {
          router.push('/candidate/onboarding');
        }
      }
    } catch (err: any) {
      console.error('Auth callback error:', err);
      setError(err.message || 'Une erreur est survenue');
      setStatus('error');
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vérification en cours...</h2>
          <p className="text-gray-600">Validation de votre compte</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email vérifié !</h2>
          <p className="text-gray-600 mb-4">Redirection en cours...</p>
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Erreur
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Erreur de vérification
        </h1>
        <p className="text-gray-600 mb-6">{error}</p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
          >
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
