import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export default function Footer() {
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
            <p className="text-sm text-slate-600 font-light max-w-md leading-relaxed">
              La plateforme de référence pour les stages et alternances en finance.
              Créateur de rencontres professionnelles.
            </p>
          </div>

          {/* Liens candidats */}
          <div>
            <h3 className="text-slate-900 font-light text-lg mb-4">Candidats</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/register/candidate" className="text-slate-600 hover:text-slate-900 transition font-light">
                  S'inscrire
                </Link>
              </li>
              <li>
                <Link href="/candidate/offers" className="text-slate-600 hover:text-slate-900 transition font-light">
                  Voir les offres
                </Link>
              </li>
              <li>
                <Link href="/candidate/profile" className="text-slate-600 hover:text-slate-900 transition font-light">
                  Mon profil
                </Link>
              </li>
            </ul>
          </div>

          {/* Liens entreprises */}
          <div>
            <h3 className="text-slate-900 font-light text-lg mb-4">Entreprises</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/register/company" className="text-slate-600 hover:text-slate-900 transition font-light">
                  S'inscrire
                </Link>
              </li>
              <li>
                <Link href="/company/offers/new" className="text-slate-600 hover:text-slate-900 transition font-light">
                  Publier une offre
                </Link>
              </li>
              <li>
                <Link href="/company/dashboard" className="text-slate-600 hover:text-slate-900 transition font-light">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500 font-light">
          © 2025 FinanceStages. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
