'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleAuth } from '@/hooks/useRoleAuth';
import { Loader2, Shield } from 'lucide-react';

/**
 * Page d'accès administrateur
 * URL cachée : /administrateur
 * Redirige automatiquement vers le dashboard admin si authentifié
 * Sinon redirige vers /login-admin
 */
export default function AdministrateurPage() {
  const router = useRouter();
  const { loading, isAuthenticated, isAdmin } = useRoleAuth({ publicAccess: true });

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated && isAdmin) {
      // Utilisateur admin authentifié → rediriger vers le dashboard
      router.replace('/admin/dashboard');
    } else {
      // Pas authentifié ou pas admin → rediriger vers login admin
      router.replace('/login-admin');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <Shield className="h-8 w-8 text-red-600 animate-pulse" />
        </div>
        <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Vérification des accès administrateur...</p>
      </div>
    </div>
  );
}
