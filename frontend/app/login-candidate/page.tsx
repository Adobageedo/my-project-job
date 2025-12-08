'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Mail, Lock, Chrome, AlertCircle, Loader2, CheckCircle, ArrowRight, User, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkThrottle, recordSuccess, formatWaitTime } from '@/lib/rateLimit';

function LoginCandidateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, login, candidate, isCandidateLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // URL de redirection après connexion
  const redirectUrl = searchParams.get('redirect') || '/candidate';

  // Rediriger si déjà connecté en tant que candidat
  useEffect(() => {
    if (!authLoading && !isCandidateLoading && user?.role === 'candidate') {
      // Check if onboarding is needed (first_name is null = onboarding not complete)
      if (!candidate || !candidate.firstName) {
        router.push('/candidate/onboarding');
      } else {
        router.push(redirectUrl);
      }
    }
  }, [user, authLoading, isCandidateLoading, candidate, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimitError('');

    // Vérification du rate limit côté client
    const throttleKey = `login-candidate-${email}`;
    const throttleCheck = checkThrottle(throttleKey, {
      minInterval: 1000, // 1 seconde entre chaque tentative
      maxAttempts: 5, // 5 tentatives max
      lockoutDuration: 5 * 60 * 1000, // 5 minutes de blocage
      windowDuration: 5 * 60 * 1000, // Fenêtre de 5 minutes
    });

    if (!throttleCheck.allowed) {
      setRateLimitError(`Trop de tentatives. Réessayez dans ${formatWaitTime(throttleCheck.waitMs)}.`);
      return;
    }

    setIsLoading(true);

    try {
      // Connexion via AuthContext
      const result = await login(email, password);

      if (!result.success) {
        setError(result.error || 'Email ou mot de passe incorrect');
        setIsLoading(false);
        return;
      }

      // Succès - reset le throttle
      recordSuccess(throttleKey);

      // Afficher le succès
      setLoginSuccess(true);

      // Le contexte gère automatiquement la redirection
      setTimeout(() => {
        router.push(redirectUrl);
      }, 800);
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Email ou mot de passe incorrect');
      setIsLoading(false);
    }
  };

  // Affichage pendant le chargement initial
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Titre */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300 ${
                loginSuccess ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {loginSuccess ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <User className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                {loginSuccess ? 'Connexion réussie !' : 'Espace Candidat'}
              </h1>
              <p className="text-gray-600 mt-2">
                {loginSuccess 
                  ? 'Redirection vers votre espace...' 
                  : 'Connectez-vous pour accéder à vos candidatures'
                }
              </p>
            </div>

            {/* Animation de succès */}
            {loginSuccess && (
              <div className="flex justify-center mb-6">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            )}

            {/* Formulaire - masqué si connexion réussie */}
            {!loginSuccess && (
              <>
                {/* Message d'erreur */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Rate limit error */}
                {rateLimitError && (
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-orange-700">
                    <Clock className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{rateLimitError}</span>
                  </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="votre.email@exemple.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                      <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                    </label>
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Séparateur */}
                <div className="mt-6 mb-6 flex items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">ou</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Connexion sociale */}
                <div className="space-y-3">
                  <button 
                    type="button"
                    disabled={isLoading}
                    className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-50"
                  >
                    <Chrome className="h-5 w-5 mr-2" />
                    <span className="font-medium">Continuer avec Google</span>
                  </button>
                  <button 
                    type="button"
                    disabled={isLoading}
                    className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-50"
                  >
                    <svg className="h-5 w-5 mr-2" fill="#0A66C2" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="font-medium">Continuer avec LinkedIn</span>
                  </button>
                </div>

                {/* Lien inscription */}
                <div className="mt-6 text-center text-sm text-gray-600">
                  Pas encore de compte ?{' '}
                  <Link href="/register/candidate" className="text-blue-600 hover:text-blue-700 font-medium">
                    S'inscrire en tant que candidat
                  </Link>
                </div>

                {/* Autres espaces */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                  <p className="mb-2">Vous êtes une entreprise ?</p>
                  <Link href="/login-company" className="text-purple-600 hover:text-purple-700 font-medium">
                    Espace Entreprise
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function LoginCandidatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    }>
      <LoginCandidateContent />
    </Suspense>
  );
}
