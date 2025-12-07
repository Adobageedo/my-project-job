'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Mail, Lock, Chrome, AlertCircle, Building2 } from 'lucide-react';
import { login, logout } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginCompanyPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, setUserRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Rediriger si déjà connecté en tant qu'entreprise
  useEffect(() => {
    if (!authLoading && user?.role === 'company') {
      router.push('/company/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Connexion via authService
      const authUser = await login(email, password);

      // Vérifier si c'est une entreprise
      if (authUser.role !== 'company') {
        setError('Ce compte n\'est pas un compte entreprise. Veuillez utiliser la page de connexion appropriée.');
        await logout();
        setIsLoading(false);
        return;
      }

      // Enregistrer le rôle dans le contexte
      setUserRole('company');

      // Rediriger vers le dashboard entreprise
      router.push('/company/dashboard');
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Espace Entreprise</h1>
              <p className="text-gray-600 mt-2">
                Connectez-vous pour gérer vos offres d'emploi
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
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="contact@entreprise.com"
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
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-purple-600 rounded" />
                  <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <a href="#" className="text-sm text-purple-600 hover:text-purple-700">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
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
              Première fois sur JobTeaser ?{' '}
              <Link href="/register/company" className="text-purple-600 hover:text-purple-700 font-medium">
                Créer un compte entreprise
              </Link>
            </div>

            {/* Autres espaces */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
              <p className="mb-2">Vous êtes candidat ?</p>
              <Link href="/login-candidate" className="text-blue-600 hover:text-blue-700 font-medium">
                Espace Candidat
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
