'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/authService';
import { 
  Loader2, 
  CheckCircle, 
  Mail, 
  ArrowRight,
  Building2,
  User,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<'loading' | 'needs-login' | 'needs-verification' | 'redirecting' | 'error'>('loading');
  const [userType, setUserType] = useState<'candidate' | 'company' | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndRedirect();
  }, []);

  const checkUserAndRedirect = async () => {
    try {
      // Vérifier si l'utilisateur est connecté via Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Pas de session, l'utilisateur doit se connecter
        setStatus('needs-login');
        return;
      }

      setEmail(session.user.email || null);

      // Vérifier si l'email est confirmé
      if (!session.user.email_confirmed_at) {
        setStatus('needs-verification');
        return;
      }

      // Récupérer les infos utilisateur depuis la table users
      const user = await getCurrentUser();
      
      if (!user) {
        // L'utilisateur auth existe mais pas dans la table users
        // Cela peut arriver si l'inscription n'est pas terminée
        setStatus('needs-login');
        return;
      }

      // Déterminer le type d'utilisateur
      const type = user.role === 'company' ? 'company' : 'candidate';
      setUserType(type);
      setStatus('redirecting');

      // Rediriger vers le bon onboarding
      if (type === 'company') {
        // Vérifier si l'entreprise est déjà liée
        if (user.company_id) {
          router.push('/company/dashboard');
        } else {
          router.push('/company/onboarding');
        }
      } else {
        // Candidat - vérifier si l'onboarding est complet
        if (user.onboarding_completed) {
          // Vérifier s'il y a une URL de retour
          const returnUrl = searchParams?.get('returnUrl');
          if (returnUrl) {
            router.push(decodeURIComponent(returnUrl));
          } else {
            router.push('/candidate/offers');
          }
        } else {
          router.push('/candidate/onboarding');
        }
      }
    } catch (err: any) {
      console.error('Onboarding check error:', err);
      setError(err.message || 'Une erreur est survenue');
      setStatus('error');
    }
  };

  // État de chargement
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification de votre compte...</p>
        </div>
      </div>
    );
  }

  // Utilisateur doit se connecter
  if (status === 'needs-login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connexion requise
          </h1>
          <p className="text-gray-600 mb-8">
            Veuillez vous connecter pour continuer votre inscription.
          </p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <User className="h-5 w-5" />
              Se connecter en tant que candidat
            </Link>
            <Link
              href="/login-company"
              className="w-full py-3 px-6 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-semibold flex items-center justify-center gap-2"
            >
              <Building2 className="h-5 w-5" />
              Se connecter en tant qu'entreprise
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Email non vérifié
  if (status === 'needs-verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-amber-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-gray-600 mb-2">
            Un email de confirmation a été envoyé à :
          </p>
          <p className="font-medium text-gray-900 mb-6">{email}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-amber-800">
              <strong>Cliquez sur le lien dans l'email</strong> pour confirmer votre adresse et continuer votre inscription.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
          >
            J'ai confirmé mon email
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="mt-4 text-sm text-gray-500">
            Vous n'avez pas reçu l'email ?{' '}
            <button 
              onClick={async () => {
                if (email) {
                  await supabase.auth.resend({ type: 'signup', email });
                  alert('Email renvoyé !');
                }
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Renvoyer
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Redirection en cours
  if (status === 'redirecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Email vérifié !
          </h2>
          <p className="text-gray-600 mb-4">
            Redirection vers {userType === 'company' ? 'l\'espace entreprise' : 'votre profil'}...
          </p>
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Erreur
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Une erreur est survenue
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
