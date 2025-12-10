// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/job/JobCard';
import Modal from '@/components/shared/Modal';
import { LocationAutocomplete } from '@/components/shared/LocationAutocomplete';
import { LocationHierarchy } from '@/data/locations';
import { LoginPrompt } from '@/components/shared/LoginPrompt';
import { getAllOffersForCandidate, FrontendJobOffer } from '@/services/offerService';
import { getCurrentCandidate, getSavedCVs, createSavedSearch, getSavedSearches, SavedSearch, AlertFrequency } from '@/services/candidateService';
import { useFeatureAccess } from '@/hooks/useRoleAuth';
import { getRegionFromCity } from '@/types';
import SavedSearchForm, { SavedSearchFormData, formDataToSearchFilters, formDataToNotificationOptions } from '@/components/candidate/SavedSearchForm';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  SlidersHorizontal, 
  X, 
  Loader2, 
  Bell, 
  BellRing,
  Save,
  Check,
  Clock,
  FileText,
} from 'lucide-react';

export default function CandidateOffersPage() {
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvCount, setCvCount] = useState<number>(0);
  const [offers, setOffers] = useState<FrontendJobOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState<LocationHierarchy | null>(null);
  const [filters, setFilters] = useState({
    studyLevel: '',
    contractType: '',
  });
  
  // États pour la sauvegarde de recherche
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  
  // États pour la gestion de l'accès
  const { isAuthenticated, requireAuth } = useFeatureAccess();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Charger les offres (public) + infos candidat si connecté
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Charger toujours les offres (accès public) - format frontend-compatible
        const offersData = await getAllOffersForCandidate();
        setOffers(offersData);

        // Puis, si l'utilisateur est connecté, charger les données candidat via service
        const candidateData = await getCurrentCandidate();

        if (!candidateData) {
          return;
        }

        setCandidateId(candidateData.id);
        setCvUrl(candidateData.cv_url);

        const [searchesData, cvs] = await Promise.all([
          getSavedSearches(candidateData.id),
          getSavedCVs(candidateData.id),
        ]);

        setSavedSearches(searchesData);
        setCvCount(cvs.length);
      } catch (error) {
        console.error('Erreur chargement offres candidat:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Générer un nom de recherche automatique
  const generateSearchName = () => {
    const parts: string[] = [];
    if (searchTerm) parts.push(`"${searchTerm}"`);
    if (locationFilter) {
      parts.push(locationFilter.city || locationFilter.region || locationFilter.country || '');
    }
    if (filters.contractType) parts.push(filters.contractType);
    if (filters.studyLevel) parts.push(filters.studyLevel);
    return parts.length > 0 ? parts.join(' - ') : 'Ma recherche';
  };

  // Sauvegarder la recherche via le formulaire
  const handleSaveSearch = async (formData: SavedSearchFormData) => {
    if (!candidateId) return;
    
    setIsSaving(true);
    try {
      const searchFilters = formDataToSearchFilters(formData);
      const notificationOptions = formDataToNotificationOptions(formData);
      
      const newSearch = await createSavedSearch(
        candidateId,
        formData.name,
        searchFilters,
        formData.alertEnabled,
        formData.alertFrequency,
        {
          preferredDay: notificationOptions.preferred_day,
          preferredHour: notificationOptions.preferred_hour,
          biweeklyWeek: notificationOptions.biweekly_week,
        }
      );
      setSavedSearches(prev => [newSearch, ...prev]);
      setSavedSuccess(true);
      setTimeout(() => {
        setShowSaveModal(false);
        setSavedSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Ouvrir le modal avec un nom généré (requiert authentification)
  const openSaveModal = () => {
    const hasAccess = requireAuth('candidate', () => {
      setShowLoginPrompt(true);
    });
    
    if (hasAccess) {
      setShowSaveModal(true);
    }
  };

  // Vérifier si la recherche actuelle est déjà sauvegardée
  const locationString = locationFilter?.city || locationFilter?.region || locationFilter?.country;
  const isCurrentSearchSaved = savedSearches.some(s => 
    s.filters.search === (searchTerm || undefined) &&
    JSON.stringify(s.filters.locations) === JSON.stringify(locationString ? [locationString] : undefined) &&
    JSON.stringify(s.filters.contract_types) === JSON.stringify(filters.contractType ? [filters.contractType] : undefined)
  );

  // Filtrer les offres
  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      searchTerm === '' ||
      (offer.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrage par localisation hiérarchique (ville dans région dans pays)
    let matchesLocation = true;
    if (locationFilter) {
      const offerLocation = (offer.location || '').toLowerCase();
      const offerRegion = getRegionFromCity(offer.location);
      
      if (locationFilter.city) {
        // Filtre par ville exacte
        matchesLocation = offerLocation.includes(locationFilter.city.toLowerCase());
      } else if (locationFilter.region) {
        // Filtre par région (inclut toutes les villes de la région)
        matchesLocation = offerRegion === locationFilter.region;
      } else if (locationFilter.country) {
        // Filtre par pays (toutes les offres du pays)
        matchesLocation = true; // Pour l'instant, on suppose que toutes sont en France
      }
    }

    const matchesStudyLevel =
      filters.studyLevel === '' || (offer.studyLevel || []).includes(filters.studyLevel as any);

    const matchesContractType =
      filters.contractType === '' || offer.contractType === filters.contractType;

    return matchesSearch && matchesLocation && matchesStudyLevel && matchesContractType;
  });

  const hasActiveFilters = locationFilter || filters.studyLevel || filters.contractType;
  const activeFiltersCount = [locationFilter, filters.studyLevel, filters.contractType].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocationFilter(null);
    setFilters({ studyLevel: '', contractType: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Offres disponibles</h1>
              <p className="text-gray-600">
                Trouvez le stage ou l'alternance idéal en finance
              </p>
            </div>

            {/* Résumé CV */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Mes CV</p>
                <p className="text-xs text-gray-500">
                  {cvCount > 0
                    ? 'Votre CV principal est prêt pour vos candidatures.'
                    : 'Ajoutez un CV pour postuler plus facilement.'}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {cvUrl && (
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Voir mon CV
                  </a>
                )}
                <Link
                  href="/candidate/cv"
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Gérer mes CV
                </Link>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Rechercher une offre, une entreprise, un mot-clé..."
                />
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition
                  ${showFilters || hasActiveFilters
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <SlidersHorizontal className="h-5 w-5" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Filtres actifs :</span>
                
                {locationFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
                    <MapPin className="h-3 w-3" />
                    {locationFilter.city || locationFilter.region || locationFilter.country}
                    {locationFilter.city && locationFilter.region && (
                      <span className="text-purple-500 text-xs">({locationFilter.region})</span>
                    )}
                    <button onClick={() => setLocationFilter(null)} className="ml-1 hover:text-purple-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.studyLevel && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                    <GraduationCap className="h-3 w-3" />
                    {filters.studyLevel}
                    <button onClick={() => setFilters({ ...filters, studyLevel: '' })} className="ml-1 hover:text-green-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.contractType && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm capitalize">
                    <Briefcase className="h-3 w-3" />
                    {filters.contractType}
                    <button onClick={() => setFilters({ ...filters, contractType: '' })} className="ml-1 hover:text-amber-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium ml-2"
                >
                  Tout effacer
                </button>
              </div>
            )}
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Location Filter */}
                <div className="lg:col-span-2">
                  <LocationAutocomplete
                    value={locationFilter}
                    onChange={setLocationFilter}
                    label="Localisation"
                    placeholder="Ville, région ou pays..."
                    allowedTypes={['city', 'region', 'country']}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Filtrez par ville, région (inclut toutes les villes) ou pays
                  </p>
                </div>

                {/* Study Level */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-green-600" />
                    Niveau d'études
                  </h3>
                  <select
                    value={filters.studyLevel}
                    onChange={(e) => setFilters({ ...filters, studyLevel: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les niveaux</option>
                    <option value="L3">Licence 3 (L3)</option>
                    <option value="M1">Master 1 (M1)</option>
                    <option value="M2">Master 2 (M2)</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                {/* Contract Type */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-600" />
                    Type de contrat
                  </h3>
                  <select
                    value={filters.contractType}
                    onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les types</option>
                    <option value="stage">Stage</option>
                    <option value="alternance">Alternance</option>
                    <option value="apprentissage">Apprentissage</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results Count & Save Search */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{filteredOffers.length}</span> offre{filteredOffers.length > 1 ? 's' : ''} trouvée{filteredOffers.length > 1 ? 's' : ''}
              {searchTerm && (
                <span className="text-sm text-gray-500 ml-2">
                  pour "<span className="font-medium">{searchTerm}</span>"
                </span>
              )}
            </p>
            
            {/* Bouton sauvegarder la recherche */}
            {(searchTerm || hasActiveFilters) && !isCurrentSearchSaved && (
              <button
                onClick={openSaveModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium text-sm shadow-sm"
              >
                <BellRing className="h-4 w-4" />
                Créer une alerte
              </button>
            )}
            {isCurrentSearchSaved && (
              <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                <Check className="h-4 w-4" />
                Alerte active
              </span>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Chargement des offres...</span>
            </div>
          )}

          {/* Offers Grid */}
          {!loading && filteredOffers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => (
                <JobCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredOffers.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune offre trouvée
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Aucune offre ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Réinitialiser les filtres
                </button>
                {(searchTerm || hasActiveFilters) && (
                  <button
                    onClick={openSaveModal}
                    className="px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Bell className="h-4 w-4" />
                    Créer une alerte pour cette recherche
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de sauvegarde de recherche */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setSavedSuccess(false);
        }}
        title="Sauvegarder cette recherche"
        size="lg"
      >
        {savedSuccess ? (
          <div className="text-center py-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recherche sauvegardée !</h3>
            <p className="text-gray-600">
              Vous recevrez un email dès qu'une nouvelle offre correspond à vos critères.
            </p>
          </div>
        ) : (
          <SavedSearchForm
            initialData={{
              name: generateSearchName(),
              query: searchTerm,
              locations: locationFilter ? [locationFilter] : [],
              contractTypes: filters.contractType ? [filters.contractType] : [],
              studyLevels: filters.studyLevel ? [filters.studyLevel] : [],
              alertEnabled: true,
              alertFrequency: 'daily',
              preferredDay: 'monday',
              preferredHour: 9,
            }}
            onSubmit={handleSaveSearch}
            onCancel={() => setShowSaveModal(false)}
            isSubmitting={isSaving}
          />
        )}
      </Modal>

      {/* Login Prompt pour actions réservées */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Connexion requise"
        message="Vous devez être connecté en tant que candidat pour sauvegarder des recherches ou postuler aux offres."
        loginUrl="/login-candidate"
        registerUrl="/register/candidate"
      />

      <Footer />
    </div>
  );
}
