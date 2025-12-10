'use client';

import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { FileQuestion, ArrowLeft, Search, Home } from 'lucide-react';

export default function OfferNotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
            <FileQuestion className="h-12 w-12 text-gray-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Offre introuvable
          </h1>
          
          <p className="text-gray-600 mb-8">
            Cette offre n'existe plus ou a été supprimée par l'entreprise. 
            Elle a peut-être déjà été pourvue ou n'est plus disponible.
          </p>

          <div className="space-y-3">
            <Link
              href="/candidate/offers"
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              Voir toutes les offres
            </Link>

            <Link
              href="/candidate/dashboard"
              className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              Retour à l'accueil
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Conseil :</strong> Créez une alerte pour être notifié 
              dès qu'une offre similaire est publiée !
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
