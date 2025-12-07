'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Mail, Lock, Chrome, AlertCircle, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginCandidatePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login, logout, candidate, isCandidateLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Rediriger si déjà connecté en tant que candidat
  useEffect(() => {
    console.log('[LoginCandidate] State:', {
      authLoading,
      isCandidateLoading,
      user: user ? { id: user.id, role: user.role } : null,
      candidate: candidate ? { id: candidate.id, firstName: candidate.firstName } : null,
    });

    if (!authLoading && !isCandidateLoading && user?.role === 'candidate') {
      console.log('[LoginCandidate] Redirecting...', {
        has_candidate: !!candidate,
        has_firstName: !!candidate?.firstName,
      });

      // Check if onboarding is needed (first_name is null = onboarding not complete)
      if (!candidate || !candidate.firstName) {
        console.log('[LoginCandidate] → /candidate/onboarding');
        router.push('/candidate/onboarding');
      } else {
        console.log('[LoginCandidate] → /candidate/dashboard');
        router.push('/candidate/dashboard');
      }
    }
  }, [user, authLoading, isCandidateLoading, candidate, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Connexion via AuthContext
      const result = await login(email, password);

      if (!result.success) {
        setError(result.error || 'Email ou mot de passe incorrect');
        setIsLoading(false);
        return;
      }

      // Le contexte gère automatiquement la redirection et le chargement du candidat
      // Attendre un peu pour que le contexte se mette à jour
      setTimeout(() => {
        router.push('/candidate/dashboard');
      }, 100);
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Email ou mot de passe incorrect');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Titre */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Espace Candidat</h1>
              <p className="text-gray-600 mt-2">
                Connectez-vous pour accéder à vos candidatures
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
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
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre.email@exemple.com"
                    required
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
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                  <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
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
              <button className="w-full py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition flex items-center justify-center">
                <Chrome className="h-5 w-5 mr-2" />
                <span className="font-medium">Continuer avec Google</span>
              </button>
              <button className="w-full py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition flex items-center justify-center">
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
              <p className="mb-2">Vous êtes une entreprise ou un administrateur ?</p>
              <div className="flex gap-3 justify-center">
                <Link href="/login-company" className="text-blue-600 hover:text-blue-700 font-medium">
                  Espace Entreprise
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
