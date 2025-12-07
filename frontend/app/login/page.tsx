'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login-candidate');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600 text-sm">
        Redirection vers la page de connexion...
      </p>
    </div>
  );
}
