'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, User, LayoutDashboard, LogOut, Briefcase, Bookmark, Search, Bell, ChevronDown, FileText, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavBarProps {
  role?: 'candidate' | 'company' | 'admin' | null;
}

export default function NavBar({ role: propRole }: NavBarProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { role: authRole, logout, isLoading } = useAuth();
  
  // Utiliser le rôle du contexte si disponible, sinon celui passé en prop
  const role = authRole || propRole;

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (prefix: string) => pathname.startsWith(prefix);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#f5f3ef] border-b border-[#e8e4dc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Briefcase className="h-6 w-6 text-slate-900" strokeWidth={1.5} />
            <span className="text-xl font-light text-slate-900 tracking-wide">FinanceStages</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-2">
            {!role && (
              <>
                <Link
                  href="/login-candidate"
                  className="px-5 py-2 text-slate-700 hover:text-slate-900 transition font-light"
                >
                  Connexion
                </Link>
                <Link
                  href="/register/candidate"
                  className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition font-light"
                >
                  S'inscrire
                </Link>
              </>
            )}

            {role === 'candidate' && (
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
                  href="/company/applications"
                  className={`px-4 py-2 transition font-light ${
                    isActive('/company/applications')
                      ? 'text-slate-900 border-b-2 border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Candidatures
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

            {role && (
              <button
                onClick={() => logout()}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-red-600 transition font-light ml-4"
              >
                <LogOut className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
