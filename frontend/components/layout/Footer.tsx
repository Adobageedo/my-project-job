'use client';

import Link from 'next/link';
import { Briefcase, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FooterProps {
  role?: 'candidate' | 'company' | 'admin' | null;
}

export default function Footer({ role: propRole }: FooterProps) {
  const { role: authRole } = useAuth();
  const role = authRole || propRole;

  return (
    <footer className="bg-[#f5f3ef] border-t border-[#e8e4dc] py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <Briefcase className="h-6 w-6 text-slate-900" strokeWidth={1.5} />
              <span className="text-xl font-light text-slate-900">FinanceStages</span>
            </div>
            <p className="text-sm text-slate-600 font-light max-w-md leading-relaxed mb-6">
              La plateforme de référence pour les stages et alternances en finance.
              Créateur de rencontres professionnelles.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <a href="mailto:contact@financestages.fr" className="flex items-center gap-1 hover:text-slate-900 transition">
                <Mail className="h-4 w-4" />
                contact@financestages.fr
              </a>
            </div>
          </div>

          {/* Liens selon le rôle */}
          {!role && (
            <>
              {/* Visiteur - Liens candidats */}
              <div>
                <h3 className="text-slate-900 font-light text-lg mb-4">Candidats</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/register/candidate" className="text-slate-600 hover:text-slate-900 transition font-light">
                      S'inscrire
                    </Link>
                  </li>
                  <li>
                    <Link href="/login-candidate" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Se connecter
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate/offers" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Voir les offres
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Visiteur - Liens entreprises */}
              <div>
                <h3 className="text-slate-900 font-light text-lg mb-4">Entreprises</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/register/company" className="text-slate-600 hover:text-slate-900 transition font-light">
                      S'inscrire
                    </Link>
                  </li>
                  <li>
                    <Link href="/login-company" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Se connecter
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="https://berthoisconseils.fr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-900 transition font-light inline-flex items-center gap-1"
                    >
                      Nos services
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://berthoisconseils.fr/faq-recrutement" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-900 transition font-light inline-flex items-center gap-1"
                    >
                      Blog
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </>
          )}

          {role === 'candidate' && (
            <>
              {/* Candidat connecté */}
              <div>
                <h3 className="text-slate-900 font-light text-lg mb-4">Mon espace</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/candidate" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Tableau de bord
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate/offers" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Rechercher des offres
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate/applications" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Mes candidatures
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate/saved" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Offres sauvegardées
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-slate-900 font-light text-lg mb-4">Profil</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/candidate/profile" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Mon profil
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate/cv" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Mes CV
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate/notifications" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Notifications
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}

          {role === 'company' && (
            <>
              {/* Entreprise connectée */}
              <div>
                <h3 className="text-slate-900 font-light text-lg mb-4">Mon espace</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/company/dashboard" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Tableau de bord
                    </Link>
                  </li>
                  <li>
                    <Link href="/company/offers" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Mes offres
                    </Link>
                  </li>
                  <li>
                    <Link href="/company/offers/new" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Publier une offre
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-slate-900 font-light text-lg mb-4">Entreprise</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/company/profile" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Profil entreprise
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="https://berthoisconseils.fr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-900 transition font-light inline-flex items-center gap-1"
                    >
                      Services RH
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://berthoisconseils.fr/blog" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-900 transition font-light inline-flex items-center gap-1"
                    >
                      Blog
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </>
          )}

          {role === 'admin' && (
            <>
              {/* Admin connecté */}
              <div>
                <h3 className="text-slate-900 font-light text-lg mb-4">Administration</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/admin/dashboard" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Tableau de bord
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/companies" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Entreprises
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/users" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Utilisateurs
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/offers" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Offres
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-slate-900 font-light text-lg mb-4">Outils</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/admin/stats" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Statistiques
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/settings" className="text-slate-600 hover:text-slate-900 transition font-light">
                      Paramètres
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Liens légaux et copyright */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-slate-500 font-light">
              <Link href="/legal/mentions" className="hover:text-slate-900 transition">
                Mentions légales
              </Link>
              <Link href="/legal/privacy" className="hover:text-slate-900 transition">
                Politique de confidentialité
              </Link>
              <Link href="/legal/cgu" className="hover:text-slate-900 transition">
                CGU
              </Link>
            </div>
            <div className="text-sm text-slate-500 font-light">
              © 2025 FinanceStages. Tous droits réservés.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
