// @ts-nocheck
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { login as authLogin, logout as authLogout } from '@/services/authService';
import { updateCandidateProfile as updateCandidateService } from '@/services/candidateService';
import { Candidate } from '@/types';

// =====================================================
// TYPES
// =====================================================

export type UserRole = 'candidate' | 'company' | 'admin' | null;

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  onboarding_completed?: boolean;
  profile_completed?: boolean;
  company_id?: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

interface AuthContextValue {
  // Auth state
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRedirecting: boolean;
  role: UserRole;
  
  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUserRole: (role: UserRole) => void;
  
  // Candidate state (only populated for candidate role)
  candidate: Candidate | null;
  isCandidateLoading: boolean;
  isUpdating: boolean;
  candidateError: string | null;
  
  // Candidate actions
  updateCandidate: (updates: Partial<Candidate>) => Promise<void>;
  refreshCandidate: () => Promise<void>;
  clearCandidate: () => void;

  // Company state (only populated for company role)
  company: CompanyInfo | null;
  refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// =====================================================
// CONSTANTS
// =====================================================

const AUTH_STORAGE_KEY = 'jobteaser_auth_user';
const CANDIDATE_STORAGE_KEY = 'candidate_profile';

// Routes publiques
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/login-candidate',
  '/login-company',
  '/login-admin',
  '/register/candidate',
  '/register/company',
  '/auth/verify-email',
  '/register/candidate/confirm-email',
  '/candidate/offers',
];

// Routes d'onboarding (accessibles même si onboarding non complété)
const ONBOARDING_ROUTES: Record<string, string> = {
  candidate: '/candidate/onboarding',
  company: '/company/onboarding',
};

// Routes par rôle
const ROLE_ROUTES: Record<string, string[]> = {
  candidate: [
    '/candidate',
    '/candidate/dashboard',
    '/candidate/profile',
    '/candidate/applications',
    '/candidate/offers',
    '/candidate/saved',
    '/candidate/searches',
    '/candidate/cv',
    '/candidate/gdpr',
    '/candidate/onboarding',
    '/candidate/notifications',
    '/settings',
  ],
  company: [
    '/company',
    '/company/dashboard',
    '/company/profile',
    '/company/offers',
    '/company/applications',
    '/company/gdpr',
    '/company/onboarding',
    '/company/team',
    '/settings',
  ],
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/companies',
    '/admin/offers',
    '/admin/gdpr',
    '/admin/audit-logs',
    '/admin/homepage',
    '/admin/pending-offers',
    '/admin/pending-companies',
    '/admin/notifications',
    '/admin/recruitcrm-sync',
    '/administrateur',
    '/settings',
  ],
};

const ROLE_DASHBOARDS: Record<string, string> = {
  candidate: '/candidate/dashboard',
  company: '/company/dashboard',
  admin: '/admin/dashboard',
};

// =====================================================
// PROVIDER
// =====================================================

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function AuthProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Candidate state
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isCandidateLoading, setIsCandidateLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  // Company state
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  // =====================================================
  // COMPANY FUNCTIONS
  // =====================================================

  const loadCompany = useCallback(async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('[AuthContext] loadCompany error:', error);
        return;
      }

      setCompany(data as CompanyInfo);
    } catch (error) {
      console.error('[AuthContext] loadCompany error:', error);
    }
  }, []);

  const refreshCompany = useCallback(async () => {
    if (user?.company_id) {
      await loadCompany(user.company_id);
    }
  }, [user?.company_id, loadCompany]);

  // =====================================================
  // CANDIDATE FUNCTIONS
  // =====================================================

  const loadCandidate = useCallback(async (userId: string) => {
    console.log('[AuthContext] loadCandidate START', { userId });
    setIsCandidateLoading(true);
    setCandidateError(null);

    try {
      // Query from unified users table instead of candidates table
      const { data, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('role', 'candidate')
        .single();

      console.log('[AuthContext] loadCandidate QUERY RESULT', { data, error: userError });

      if (userError) {
        if (userError.code === 'PGRST116') {
          // User not found - shouldn't happen after login
          console.log('[AuthContext] loadCandidate NOT FOUND');
          setCandidate(null);
          return;
        }
        throw userError;
      }

      // Map users table to Candidate type
      const candidateProfile: Candidate = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        school: data.institution,
        studyLevel: data.education_level,
        specialization: data.specialization,
        alternanceRhythm: data.alternance_rhythm,
        locations: data.target_locations || [],
        availableFrom: data.available_from,
        cvUrl: data.cv_url,
        cvParsed: data.cv_parsed,
        createdAt: data.created_at,
      };

      setCandidate(candidateProfile);
      localStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(candidateProfile));
      console.log('[AuthContext] loadCandidate SUCCESS', { candidateProfile });
    } catch (err: any) {
      console.error('[AuthContext] loadCandidate ERROR:', err);
      setCandidateError(err.message || 'Erreur lors du chargement du profil');

      // Try cache fallback
      const cached = localStorage.getItem(CANDIDATE_STORAGE_KEY);
      if (cached) {
        try {
          setCandidate(JSON.parse(cached));
          console.log('[AuthContext] loadCandidate CACHE FALLBACK');
        } catch {
          // Ignore
        }
      }
    } finally {
      console.log('[AuthContext] loadCandidate END');
      setIsCandidateLoading(false);
    }
  }, []);

  const updateCandidate = useCallback(async (updates: Partial<Candidate>) => {
    if (!candidate) return;

    setIsUpdating(true);
    setCandidateError(null);

    // Optimistic update
    const optimisticCandidate = { ...candidate, ...updates };
    setCandidate(optimisticCandidate);
    localStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(optimisticCandidate));

    try {
      await updateCandidateService(candidate.id, updates);
    } catch (err: any) {
      console.error('Erreur mise à jour candidat:', err);
      setCandidateError(err.message || 'Erreur lors de la mise à jour');
      // Rollback
      setCandidate(candidate);
      localStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(candidate));
    } finally {
      setIsUpdating(false);
    }
  }, [candidate]);

  const refreshCandidate = useCallback(async () => {
    if (user?.id && user?.role === 'candidate') {
      await loadCandidate(user.id);
    }
  }, [user, loadCandidate]);

  const clearCandidate = useCallback(() => {
    setCandidate(null);
    localStorage.removeItem(CANDIDATE_STORAGE_KEY);
  }, []);

  // =====================================================
  // AUTH FUNCTIONS
  // =====================================================

  const determineUserRole = async (supabaseUser: User): Promise<UserRole> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (userError) {
        console.error('Erreur requête users pour rôle:', userError);
        return null;
      }

      return (userData?.role as UserRole) || null;
    } catch (error) {
      console.error('Erreur détermination rôle:', error);
      return null;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AuthContext] login START', { email });
      const authUser = await authLogin(email, password);
      console.log('[AuthContext] login authUser', { authUser });

      const contextUser: AuthUser = {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role as UserRole,
        first_name: authUser.first_name,
        last_name: authUser.last_name,
        onboarding_completed: authUser.onboarding_completed,
        profile_completed: authUser.profile_completed,
        company_id: authUser.company_id,
      };

      console.log('[AuthContext] login contextUser', { contextUser });
      setUser(contextUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(contextUser));

      // Load candidate data if role is candidate
      if (authUser.role === 'candidate') {
        console.log('[AuthContext] login loading candidate...');
        await loadCandidate(authUser.id);
      }

      // Load company data if role is company
      if (authUser.role === 'company' && authUser.company_id) {
        console.log('[AuthContext] login loading company...');
        await loadCompany(authUser.company_id);
      }

      console.log('[AuthContext] login SUCCESS');
      return { success: true };
    } catch (error: unknown) {
      console.error('[AuthContext] login ERROR', error);
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = async () => {
    try {
      await authLogout();
      localStorage.removeItem(AUTH_STORAGE_KEY);
      clearCandidate();
      setCompany(null);
      setUser(null);
      setIsRedirecting(false);
      router.push('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      setIsRedirecting(false);
    }
  };

  const setUserRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  // =====================================================
  // EFFECTS
  // =====================================================

  // Load user from localStorage and verify session
  useEffect(() => {
    let isMounted = true;
    let candidateLoaded = false;
    
    const initAuth = async () => {
      try {
        // Load from localStorage first for immediate UI (évite le flash)
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        const storedCandidate = localStorage.getItem(CANDIDATE_STORAGE_KEY);
        
        if (stored) {
          const parsedUser = JSON.parse(stored) as AuthUser;
          if (isMounted) {
            setUser(parsedUser);
            // Si on a des données en cache, on peut arrêter le loading immédiatement
            // La vérification de session se fera en arrière-plan
            setIsLoading(false);
          }
          
          // Load candidate from cache first
          if (parsedUser.role === 'candidate' && storedCandidate) {
            const parsedCandidate = JSON.parse(storedCandidate);
            if (isMounted) setCandidate(parsedCandidate);
            candidateLoaded = true;
          }
        }

        // Verify with Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.id === session.user.id) {
              if (isMounted) setUser(parsed);
              // Only load candidate if not already loaded from cache
              if (parsed.role === 'candidate' && !candidateLoaded) {
                await loadCandidate(parsed.id);
              }
            }
          } else {
            const role = await determineUserRole(session.user);
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              role,
            };
            if (isMounted) setUser(authUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));

            if (role === 'candidate' && !candidateLoaded) {
              await loadCandidate(session.user.id);
            }
          }
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(CANDIDATE_STORAGE_KEY);
          if (isMounted) {
            setUser(null);
            setCandidate(null);
          }
        }
      } catch (error) {
        console.error('Erreur init auth:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Auth state change listener - only handle sign in/out, not token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange', { event });
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(CANDIDATE_STORAGE_KEY);
        if (isMounted) {
          setUser(null);
          setCandidate(null);
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Only reload if not already loaded
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (isMounted) setUser(parsed);
          // Don't reload candidate on every auth state change
        }
      }
      // Ignore TOKEN_REFRESHED and other events to prevent re-loading
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadCandidate]);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    const checkRouteAccess = () => {
      const isLoginRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
      const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
      );
      const isInviteRoute = pathname.startsWith('/invite/');

      // Helper: check if current path is an onboarding route for user's role
      const isOnboardingRoute = (role: string | null) => {
        if (!role) return false;
        const onboardingPath = ONBOARDING_ROUTES[role];
        return onboardingPath && (pathname === onboardingPath || pathname.startsWith(onboardingPath + '/'));
      };

      // Helper: check if user needs onboarding
      const needsOnboarding = (role: string | null): boolean => {
        if (!role) return false;
        
        // Admin never needs onboarding
        if (role === 'admin') return false;
        
        // Candidate: needs onboarding if no firstName
        if (role === 'candidate') {
          // Wait for candidate data to load before deciding
          if (isCandidateLoading) return false;
          return !candidate?.firstName;
        }
        
        // Company: needs onboarding if onboarding_completed is false
        if (role === 'company') {
          return user?.onboarding_completed === false;
        }
        
        return false;
      };

      // Dynamic offer routes are public
      if (pathname.startsWith('/candidate/offers/')) {
        setIsRedirecting(false);
        return;
      }

      // Invite routes are special - allow access
      if (isInviteRoute) {
        setIsRedirecting(false);
        return;
      }

      // Pages de login/register - pas de redirection si non connecté
      if (isLoginRoute && !user) {
        setIsRedirecting(false);
        return;
      }

      // Routes publiques - pas de redirection
      if (isPublicRoute && !user) {
        setIsRedirecting(false);
        return;
      }

      // Si l'utilisateur est connecté et sur une page de login → rediriger
      if (user && isLoginRoute) {
        const returnUrlParam = searchParams?.get('returnUrl');
        const targetUrl = returnUrlParam ? decodeURIComponent(returnUrlParam) : null;
        const dashboard = ROLE_DASHBOARDS[user.role || 'candidate'];
        
        setIsRedirecting(true);
        
        // Check onboarding first
        if (needsOnboarding(user.role)) {
          const onboardingUrl = ONBOARDING_ROUTES[user.role || 'candidate'];
          if (onboardingUrl) {
            const url = targetUrl 
              ? `${onboardingUrl}?returnUrl=${encodeURIComponent(targetUrl)}`
              : onboardingUrl;
            router.replace(url);
            return;
          }
        }
        
        // Redirect to target URL if valid for user's role
        if (targetUrl) {
          const userRoutes = ROLE_ROUTES[user.role || 'candidate'] || [];
          const canAccessTarget = userRoutes.some(route => 
            targetUrl === route || targetUrl.startsWith(route + '/')
          );
          
          if (canAccessTarget) {
            router.replace(targetUrl);
            return;
          }
        }
        
        router.replace(dashboard || '/');
        return;
      }

      if (isPublicRoute) return;

      // Not logged in → redirect to login
      if (!user) {
        setIsRedirecting(true);
        const returnUrl = encodeURIComponent(pathname);
        if (pathname.startsWith('/candidate')) {
          router.replace(`/login-candidate?returnUrl=${returnUrl}`);
        } else if (pathname.startsWith('/company')) {
          router.replace(`/login-company?returnUrl=${returnUrl}`);
        } else if (pathname.startsWith('/admin')) {
          router.replace(`/login-admin?returnUrl=${returnUrl}`);
        }
        return;
      }

      // User is logged in - check onboarding
      if (user.role && needsOnboarding(user.role)) {
        // Already on onboarding page → allow
        if (isOnboardingRoute(user.role)) {
          setIsRedirecting(false);
          return;
        }
        
        // Redirect to onboarding
        const onboardingUrl = ONBOARDING_ROUTES[user.role];
        if (onboardingUrl) {
          setIsRedirecting(true);
          router.replace(onboardingUrl);
          return;
        }
      }

      // Check role-based access
      if (user.role) {
        const allowedRoutes = ROLE_ROUTES[user.role] || [];
        const hasAccess = allowedRoutes.some(route =>
          pathname === route || pathname.startsWith(route + '/')
        );

        if (!hasAccess) {
          // Cross-role access attempt
          const isCandidateTryingCompany = user.role === 'candidate' && pathname.startsWith('/company');
          const isCompanyTryingCandidate = user.role === 'company' && pathname.startsWith('/candidate');
          
          if (isCandidateTryingCompany || isCompanyTryingCandidate) {
            setIsRedirecting(true);
            const expectedRole = isCandidateTryingCompany ? 'company' : 'candidate';
            router.replace(`/role-mismatch?expected=${expectedRole}&returnUrl=${encodeURIComponent(pathname)}`);
            return;
          }
          
          // Redirect to dashboard
          setIsRedirecting(true);
          const dashboard = ROLE_DASHBOARDS[user.role];
          if (dashboard && pathname !== dashboard) {
            router.replace(dashboard);
          }
        } else {
          // User has access
          setIsRedirecting(false);
        }
      }
    };

    checkRouteAccess();
  }, [pathname, searchParams, user, candidate, isCandidateLoading, isLoading, router]);

  // Realtime subscription for candidate updates
  useEffect(() => {
    if (!candidate) return;

    const channel = supabase
      .channel(`candidate:${candidate.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'candidates',
          filter: `id=eq.${candidate.id}`,
        },
        () => {
          refreshCandidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [candidate, refreshCandidate]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <AuthContext.Provider
      value={{
        // Auth
        user,
        isLoading,
        isAuthenticated: !!user,
        isRedirecting,
        role: user?.role || null,
        login,
        logout,
        setUserRole,
        // Candidate
        candidate,
        isCandidateLoading,
        isUpdating,
        candidateError,
        updateCandidate,
        refreshCandidate,
        clearCandidate,
        // Company
        company,
        refreshCompany,
      }}
    >
      {/* Overlay de loading par-dessus la page actuelle pendant les redirections */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <svg className="h-10 w-10 text-blue-600 animate-spin mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

// Wrapper component that provides Suspense boundary for useSearchParams
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <svg className="h-10 w-10 text-blue-600 animate-spin mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    }>
      <AuthProviderInner>{children}</AuthProviderInner>
    </Suspense>
  );
}

// =====================================================
// HOOKS
// =====================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Backward compatibility hook for candidate pages
export function useCandidate() {
  const context = useAuth();
  return {
    candidate: context.candidate,
    isLoading: context.isCandidateLoading,
    isUpdating: context.isUpdating,
    error: context.candidateError,
    updateCandidate: context.updateCandidate,
    refreshCandidate: context.refreshCandidate,
    clearCandidate: context.clearCandidate,
  };
}

// Hook for route guarding
export function useRouteGuard(requiredRole?: UserRole) {
  const { user, isLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (pathname.startsWith('/candidate')) {
        router.push('/login-candidate');
      } else if (pathname.startsWith('/company')) {
        router.push('/login-company');
      } else if (pathname.startsWith('/admin')) {
        router.push('/login-admin');
      }
      return;
    }

    if (requiredRole && role !== requiredRole) {
      const dashboard = ROLE_DASHBOARDS[role || 'candidate'];
      router.push(dashboard);
    }
  }, [user, isLoading, role, requiredRole, router, pathname]);

  return { isLoading, isAuthorized: !requiredRole || role === requiredRole };
}
