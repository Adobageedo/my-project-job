'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import { login, logout } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, setUserRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Rediriger si déjà connecté en tant qu'admin
  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Connexion via authService
      const authUser = await login(email, password);

      // Vérifier si c'est un admin
      if (authUser.role !== 'admin') {
        setError('Accès refusé. Vous n\'avez pas les permissions d\'administrateur.');
        await logout();
        setIsLoading(false);
        return;
      }

      // Enregistrer le rôle dans le contexte
      setUserRole('admin');

      // Rediriger vers le dashboard admin
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Email ou mot de passe incorrect');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Titre */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Administration</h1>
            <p className="text-gray-600 mt-2">
              Accès réservé aux administrateurs
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
                Email administrateur
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="admin@jobteaser.com"
                  required
                  autoComplete="email"
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
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connexion...' : 'Accéder à l\'administration'}
            </button>
          </form>

          {/* Warning */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Zone sécurisée</p>
                <p>Cette page est réservée aux administrateurs. Toute tentative d'accès non autorisée est enregistrée.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Retour */}
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-300">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
