'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page de notifications - Redirige vers le profil candidat
 * Les paramètres de notifications sont maintenant dans la section "Notifications" du profil
 */
export default function NotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection vers la page profil où se trouvent maintenant les paramètres de notifications
    router.replace('/candidate/profile');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Redirection vers votre profil...</p>
      </div>
    </div>
  );
}
