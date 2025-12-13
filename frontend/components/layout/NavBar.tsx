'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, User, LayoutDashboard, LogOut, Briefcase, Bookmark, Search, Bell, ChevronDown, FileText, Home, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavBarProps {
  role?: 'candidate' | 'company' | 'admin' | null;
  minimal?: boolean; // Mode onboarding - affiche uniquement logo et déconnexion
  onLogout?: () => void; // Callback de déconnexion personnalisé
}

export default function NavBar({ role: propRole, minimal = false, onLogout }: NavBarProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const { role: authRole, logout, isLoading, candidate, company } = useAuth();
  
  // Utiliser le rôle du contexte si disponible, sinon celui passé en prop
  const role = authRole || propRole;

  // Handler de déconnexion
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
  };

  // Vérifier si le candidat doit compléter l'onboarding
  const needsOnboarding = role === 'candidate' && (!candidate || !candidate.firstName);

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (prefix: string) => pathname.startsWith(prefix);

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setShowLoginDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mode minimal pour l'onboarding
  if (minimal) {
    return (
      <nav className="bg-[#f5f3ef] border-b border-[#e8e4dc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <Briefcase className="h-6 w-6 text-slate-900" strokeWidth={1.5} />
              <span className="text-xl font-light text-slate-900 tracking-wide">FinanceStages</span>
            </Link>

            {/* Déconnexion uniquement */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">
                Compléter le profil
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-[#f5f3ef] border-b border-[#e8e4dc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Briefcase className="h-6 w-6 text-slate-900" strokeWidth={1.5} />
            <span className="text-xl font-light text-slate-900 tracking-wide">FinanceStages</span>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {!role && (
              <>
                {/* Lien vers les offres pour visiteurs */}
                <Link
                  href="/candidate/offers"
                  className={`px-4 py-2 transition font-light ${
                    isActivePrefix('/candidate/offers')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Offres
                </Link>

                {/* Dropdown Connexion */}
                <div className="relative" ref={loginDropdownRef}>
                  <button
                    onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                    className="flex items-center px-5 py-2 text-slate-700 hover:text-slate-900 transition font-light"
                  >
                    Connexion
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showLoginDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showLoginDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        href="/login-candidate"
                        onClick={() => setShowLoginDropdown(false)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Candidat</p>
                          <p className="text-xs text-gray-500">Trouvez votre stage ou alternance</p>
                        </div>
                      </Link>
                      <Link
                        href="/login-company"
                        onClick={() => setShowLoginDropdown(false)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Entreprise</p>
                          <p className="text-xs text-gray-500">Publiez vos offres</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/register/candidate"
                  className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition font-light rounded-lg"
                >
                  S'inscrire
                </Link>
              </>
            )}

            {role === 'candidate' && !needsOnboarding && (
              <>
                <Link
                  href="/candidate"
                  className={`flex items-center px-4 py-2 transition font-light ${
                    isActive('/candidate')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Home className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                  Accueil
                </Link>
                <Link
                  href="/candidate/offers"
                  className={`px-4 py-2 transition font-light ${
                    isActivePrefix('/candidate/offers')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Offres
                </Link>
                <Link
                  href="/candidate/applications"
                  className={`px-4 py-2 transition font-light ${
                    isActive('/candidate/applications')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Candidatures
                </Link>
                
                {/* Dropdown Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center px-4 py-2 transition font-light ${
                      isActivePrefix('/candidate/saved') || isActivePrefix('/candidate/searches') || isActivePrefix('/candidate/notifications')
                        ? 'text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mes favoris
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        href="/candidate/saved"
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center px-4 py-2.5 hover:bg-gray-50 transition ${
                          isActive('/candidate/saved') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        <Bookmark className="h-4 w-4 mr-3" />
                        Offres sauvegardées
                      </Link>
                      <Link
                        href="/candidate/searches"
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center px-4 py-2.5 hover:bg-gray-50 transition ${
                          isActive('/candidate/searches') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        <Search className="h-4 w-4 mr-3" />
                        Recherches favorites
                      </Link>
                      <Link
                        href="/candidate/cv"
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center px-4 py-2.5 hover:bg-gray-50 transition ${
                          isActive('/candidate/cv') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        <FileText className="h-4 w-4 mr-3" />
                        Mes CV
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <Link
                        href="/candidate/notifications"
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center px-4 py-2.5 hover:bg-gray-50 transition ${
                          isActive('/candidate/notifications') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        <Bell className="h-4 w-4 mr-3" />
                        Notifications
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/candidate/profile"
                  className={`flex items-center px-4 py-2 transition font-light ${
                    isActive('/candidate/profile')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                  Profil
                </Link>
              </>
            )}

            {role === 'company' && (
              <>
                <Link
                  href="/company/dashboard"
                  className={`flex items-center px-4 py-2 transition font-light ${
                    isActive('/company/dashboard')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                  Dashboard
                </Link>
                <Link
                  href="/company/offers"
                  className={`px-4 py-2 transition font-light ${
                    isActivePrefix('/company/offers')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mes offres
                </Link>
                <Link
                  href="/company/offers/new"
                  className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 transition font-light rounded-lg"
                >
                  + Nouvelle offre
                </Link>
                <Link
                  href="/company/profile"
                  className={`flex items-center px-4 py-2 transition font-light ${
                    isActive('/company/profile')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                  Profil
                </Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center px-4 py-2 transition font-light ${
                    isActive('/admin/dashboard')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                  Dashboard
                </Link>
                <Link
                  href="/admin/companies"
                  className={`px-4 py-2 transition font-light ${
                    isActive('/admin/companies')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Entreprises
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-4 py-2 transition font-light ${
                    isActive('/admin/users')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Candidats
                </Link>
                <Link
                  href="/admin/offers"
                  className={`px-4 py-2 transition font-light ${
                    isActive('/admin/offers')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Offres
                </Link>
              </>
            )}

            {role === 'candidate' && needsOnboarding && (
              <span className="px-4 py-2 text-slate-500 text-sm font-light">
                Complétez votre profil
              </span>
            )}

            {role && (
              <div className="flex items-center gap-3 ml-4">
                {/* Logo entreprise */}
                {role === 'company' && company?.logo_url && (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-8 w-8 rounded-lg object-contain bg-white border border-gray-200"
                  />
                )}
                <button
                  onClick={() => logout()}
                  className="flex items-center px-4 py-2 text-slate-600 hover:text-red-600 transition font-light"
                >
                  <LogOut className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition"
          >
            {showMobileMenu ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-[#e8e4dc] bg-[#f5f3ef]">
          <div className="px-4 py-4 space-y-2">
            {!role && (
              <>
                <Link
                  href="/candidate/offers"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-3 text-slate-700 hover:bg-white rounded-lg transition"
                >
                  Voir les offres
                </Link>
                <div className="border-t border-[#e8e4dc] my-2" />
                <Link
                  href="/login-candidate"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center px-4 py-3 text-slate-700 hover:bg-white rounded-lg transition"
                >
                  <User className="h-5 w-5 mr-3 text-blue-600" />
                  Connexion Candidat
                </Link>
                <Link
                  href="/login-company"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center px-4 py-3 text-slate-700 hover:bg-white rounded-lg transition"
                >
                  <Building2 className="h-5 w-5 mr-3 text-purple-600" />
                  Connexion Entreprise
                </Link>
                <div className="border-t border-[#e8e4dc] my-2" />
                <Link
                  href="/register/candidate"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-3 bg-slate-900 text-white text-center rounded-lg font-medium"
                >
                  S'inscrire
                </Link>
              </>
            )}

            {role === 'candidate' && needsOnboarding && (
              <>
                <div className="px-4 py-3 text-slate-500 text-sm">
                  Complétez votre profil pour accéder à toutes les fonctionnalités
                </div>
                <div className="border-t border-[#e8e4dc] my-2" />
                <button
                  onClick={() => { logout(); setShowMobileMenu(false); }}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-white rounded-lg transition"
                >
                  Déconnexion
                </button>
              </>
            )}

            {role === 'candidate' && !needsOnboarding && (
              <>
                <Link
                  href="/candidate"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/candidate') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Accueil
                </Link>
                <Link
                  href="/candidate/offers"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActivePrefix('/candidate/offers') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Offres
                </Link>
                <Link
                  href="/candidate/applications"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/candidate/applications') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Candidatures
                </Link>
                <Link
                  href="/candidate/saved"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/candidate/saved') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Offres sauvegardées
                </Link>
                <Link
                  href="/candidate/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/candidate/profile') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Profil
                </Link>
                <div className="border-t border-[#e8e4dc] my-2" />
                <button
                  onClick={() => { logout(); setShowMobileMenu(false); }}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-white rounded-lg transition"
                >
                  Déconnexion
                </button>
              </>
            )}

            {role === 'company' && (
              <>
                <Link
                  href="/company/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/company/dashboard') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/company/offers"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActivePrefix('/company/offers') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Mes offres
                </Link>
                <Link
                  href="/company/offers/new"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-3 bg-slate-900 text-white text-center rounded-lg font-medium"
                >
                  + Nouvelle offre
                </Link>
                <Link
                  href="/company/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/company/profile') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Profil entreprise
                </Link>
                <div className="border-t border-[#e8e4dc] my-2" />
                <button
                  onClick={() => { logout(); setShowMobileMenu(false); }}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-white rounded-lg transition"
                >
                  Déconnexion
                </button>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/admin/dashboard') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/companies"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/admin/companies') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Entreprises
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/admin/users') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Utilisateurs
                </Link>
                <Link
                  href="/admin/offers"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/admin/offers') ? 'bg-white text-slate-900 font-medium' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  Offres
                </Link>
                <div className="border-t border-[#e8e4dc] my-2" />
                <button
                  onClick={() => { logout(); setShowMobileMenu(false); }}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-white rounded-lg transition"
                >
                  Déconnexion
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
