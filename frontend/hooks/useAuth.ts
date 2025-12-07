import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  isCandidate: boolean;
  isCompany: boolean;
  isAdmin: boolean;
  onboardingCompleted: boolean;
}

export function useAuth(requireAuth: boolean = false) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isCandidate: false,
    isCompany: false,
    isAdmin: false,
    onboardingCompleted: false,
  });

  useEffect(() => {
    // Vérifier la session actuelle
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const role = user.user_metadata?.role || 'candidate';
          const onboardingCompleted = user.user_metadata?.onboarding_completed || false;

          setAuthState({
            user,
            loading: false,
            isCandidate: role === 'candidate',
            isCompany: role === 'company',
            isAdmin: role === 'admin',
            onboardingCompleted,
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
            isCandidate: false,
            isCompany: false,
            isAdmin: false,
            onboardingCompleted: false,
          });

          // Rediriger vers login candidat si auth requise
          if (requireAuth) {
            router.push('/login-candidate');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setAuthState({
          user: null,
          loading: false,
          isCandidate: false,
          isCompany: false,
          isAdmin: false,
          onboardingCompleted: false,
        });
      }
    };

    checkUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'candidate';
        const onboardingCompleted = session.user.user_metadata?.onboarding_completed || false;

        setAuthState({
          user: session.user,
          loading: false,
          isCandidate: role === 'candidate',
          isCompany: role === 'company',
          isAdmin: role === 'admin',
          onboardingCompleted,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          isCandidate: false,
          isCompany: false,
          isAdmin: false,
          onboardingCompleted: false,
        });

        if (requireAuth) {
          router.push('/login-candidate');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requireAuth, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return {
    ...authState,
    signOut,
  };
}
