// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Modal from '@/components/shared/Modal';
import { useCandidate } from '@/contexts/AuthContext';
import { 
  getSavedOffers, 
  unsaveOffer, 
  FrontendSavedOffer 
} from '@/services/savedOfferService';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Calendar,
  MapPin,
  Building2,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SavedOffersPage() {
  const { candidate } = useCandidate();
  const candidateId = candidate?.id;
  
  const [savedOffers, setSavedOffers] = useState<FrontendSavedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la suppression
  const [offerToRemove, setOfferToRemove] = useState<FrontendSavedOffer | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  

  useEffect(() => {
    if (candidateId) {
      loadSavedOffers();
    }
  }, [candidateId]);

  const loadSavedOffers = async () => {
    if (!candidateId) return;
    
    try {
      const offers = await getSavedOffers(candidateId);
      setSavedOffers(offers);
    } catch (error) {
      console.error('Erreur lors du chargement des offres sauvegardées:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOffer = async () => {
    if (!offerToRemove || !candidateId) return;
    
    setIsRemoving(true);
    try {
      const result = await unsaveOffer(candidateId, offerToRemove.offer.id);
      if (result.success) {
        setSavedOffers(prev => prev.filter(s => s.id !== offerToRemove.id));
        setShowRemoveModal(false);
        setOfferToRemove(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setIsRemoving(false);
    }
  };


  const filteredOffers = savedOffers.filter(saved => 
    searchTerm === '' ||
    (saved.offer?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (saved.offer?.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (saved.offer?.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bookmark className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Offres sauvegardées</h1>
            </div>
            <p className="text-gray-600">
              Retrouvez toutes les offres que vous avez mises de côté
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-blue-600">{savedOffers.length}</div>
              <div className="text-gray-600">Offres sauvegardées</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-green-600">
                {savedOffers.filter(s => s.offer.status === 'active').length}
              </div>
              <div className="text-gray-600">Offres actives</div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher dans vos offres sauvegardées..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Offers List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : filteredOffers.length > 0 ? (
            <div className="space-y-4">
              {filteredOffers.map((saved) => (
                <div
                  key={saved.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link 
                            href={`/candidate/offers/${saved.offer.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition"
                          >
                            {saved.offer.title}
                          </Link>
                          {saved.offer.status !== 'active' && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              Offre expirée
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {saved.offer.company.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {saved.offer.location || 'Non spécifié'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Sauvegardé le {format(new Date(saved.savedAt), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          {saved.offer?.contractType && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs capitalize">
                              {saved.offer.contractType}
                            </span>
                          )}
                          {saved.offer?.duration && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                              {saved.offer.duration}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/candidate/offers/${saved.offer.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-blue-600"
                          title="Voir l'offre"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => {
                            setOfferToRemove(saved);
                            setShowRemoveModal(true);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition text-gray-400 hover:text-red-600"
                          title="Retirer des favoris"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : savedOffers.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun résultat</h3>
              <p className="text-gray-600 mb-4">
                Aucune offre sauvegardée ne correspond à votre recherche
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Effacer la recherche
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Bookmark className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Aucune offre sauvegardée
              </h3>
              <p className="text-gray-600 mb-6">
                Parcourez les offres et cliquez sur le cœur pour les sauvegarder
              </p>
              <Link
                href="/candidate/offers"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Découvrir les offres
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setOfferToRemove(null);
        }}
        title="Retirer des favoris"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Voulez-vous vraiment retirer cette offre de vos favoris ?
          </p>

          {offerToRemove && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">{offerToRemove.offer.title}</h4>
              <p className="text-gray-600 text-sm">{offerToRemove.offer.company.name}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowRemoveModal(false);
                setOfferToRemove(null);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={isRemoving}
            >
              Annuler
            </button>
            <button
              onClick={handleRemoveOffer}
              disabled={isRemoving}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
            >
              {isRemoving ? 'Suppression...' : 'Retirer'}
            </button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
