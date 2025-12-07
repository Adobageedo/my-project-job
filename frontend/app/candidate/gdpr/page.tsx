'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import GDPRSettings from '@/components/gdpr/GDPRSettings';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CandidateGDPRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login-candidate');
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || '');
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/candidate/profile"
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour au profil
            </Link>
          </div>

          {/* Contenu RGPD */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {userId && (
              <GDPRSettings
                userType="candidate"
                userId={userId}
                userEmail={userEmail}
                onAccountDeleted={() => router.push('/?account_deleted=true')}
              />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
