// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/job/JobCard';
import Modal from '@/components/shared/Modal';
import { LocationFilter } from '@/components/shared/LocationSearch';
import { LoginPrompt } from '@/components/shared/LoginPrompt';
import { getAllOffersForCandidate, FrontendJobOffer } from '@/services/offerService';
import { getCurrentCandidate, getSavedCVs, createSavedSearch, getSavedSearches, SavedSearch, AlertFrequency } from '@/services/candidateService';
import { useFeatureAccess } from '@/hooks/useRoleAuth';
import { FRENCH_REGIONS, getRegionFromCity } from '@/types';
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
  const [filters, setFilters] = useState({
    city: '',
    region: '',
    country: 'France',
    studyLevel: '',
    contractType: '',
  });
  
  // États pour la sauvegarde de recherche
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState<AlertFrequency>('daily');
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
    if (filters.city) parts.push(filters.city);
    else if (filters.region) parts.push(filters.region);
    if (filters.contractType) parts.push(filters.contractType);
    if (filters.studyLevel) parts.push(filters.studyLevel);
    return parts.length > 0 ? parts.join(' - ') : 'Ma recherche';
  };

  // Sauvegarder la recherche
  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;
    
    setIsSaving(true);
    try {
      if (!candidateId) return;

      const newSearch = await createSavedSearch(
        candidateId,
        searchName,
        {
          query: searchTerm || undefined,
          regions: filters.region ? [filters.region] : undefined,
          cities: filters.city ? [filters.city] : undefined,
          contractTypes: filters.contractType ? [filters.contractType] : undefined,
          studyLevels: filters.studyLevel ? [filters.studyLevel] : undefined,
        },
        alertEnabled,
        alertFrequency
      );
      setSavedSearches(prev => [newSearch, ...prev]);
      setSavedSuccess(true);
      setTimeout(() => {
        setShowSaveModal(false);
        setSavedSuccess(false);
        setSearchName('');
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
      setSearchName(generateSearchName());
      setShowSaveModal(true);
    }
  };

  // Vérifier si la recherche actuelle est déjà sauvegardée
  const isCurrentSearchSaved = savedSearches.some(s => 
    s.filters.query === (searchTerm || undefined) &&
    JSON.stringify(s.filters.regions) === JSON.stringify(filters.region ? [filters.region] : undefined) &&
    JSON.stringify(s.filters.contractTypes) === JSON.stringify(filters.contractType ? [filters.contractType] : undefined)
  );

  // Filtrer les offres
  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      searchTerm === '' ||
      (offer.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrage par localisation hiérarchique
    let matchesLocation = true;
    if (filters.city) {
      matchesLocation = (offer.location || '').toLowerCase().includes(filters.city.toLowerCase());
    } else if (filters.region) {
      const offerRegion = getRegionFromCity(offer.location);
      matchesLocation = offerRegion === filters.region;
    }

    const matchesStudyLevel =
      filters.studyLevel === '' || (offer.studyLevel || []).includes(filters.studyLevel as any);

    const matchesContractType =
      filters.contractType === '' || offer.contractType === filters.contractType;

    return matchesSearch && matchesLocation && matchesStudyLevel && matchesContractType;
  });

  const hasActiveFilters = filters.city || filters.region || filters.studyLevel || filters.contractType;
  const activeFiltersCount = [filters.city, filters.region, filters.studyLevel, filters.contractType].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({ city: '', region: '', country: 'France', studyLevel: '', contractType: '' });
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
                
                {filters.region && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
                    <MapPin className="h-3 w-3" />
                    {filters.region}
                    <button onClick={() => setFilters({ ...filters, region: '', city: '' })} className="ml-1 hover:text-purple-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.city && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                    <MapPin className="h-3 w-3" />
                    {filters.city}
                    <button onClick={() => setFilters({ ...filters, city: '' })} className="ml-1 hover:text-blue-900">
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
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Localisation
                  </h3>
                  <LocationFilter
                    selectedCity={filters.city}
                    selectedRegion={filters.region}
                    selectedCountry={filters.country}
                    onCityChange={(city) => setFilters({ ...filters, city: city || '' })}
                    onRegionChange={(region) => setFilters({ ...filters, region: region || '', city: '' })}
                    onCountryChange={() => {}}
                  />
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
          setSearchName('');
          setSavedSuccess(false);
        }}
        title="Créer une alerte"
      >
        {savedSuccess ? (
          <div className="text-center py-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Alerte créée !</h3>
            <p className="text-gray-600">
              Vous recevrez un email dès qu'une nouvelle offre correspond à vos critères.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Résumé des critères */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Critères de recherche</h4>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm">
                    <Search className="h-3 w-3 text-gray-400" />
                    "{searchTerm}"
                  </span>
                )}
                {filters.region && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                    <MapPin className="h-3 w-3" />
                    {filters.region}
                  </span>
                )}
                {filters.city && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    <MapPin className="h-3 w-3" />
                    {filters.city}
                  </span>
                )}
                {filters.contractType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm capitalize">
                    <Briefcase className="h-3 w-3" />
                    {filters.contractType}
                  </span>
                )}
                {filters.studyLevel && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                    <GraduationCap className="h-3 w-3" />
                    {filters.studyLevel}
                  </span>
                )}
                {!searchTerm && !filters.region && !filters.city && !filters.contractType && !filters.studyLevel && (
                  <span className="text-gray-500 text-sm">Toutes les offres</span>
                )}
              </div>
            </div>

            {/* Nom de la recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'alerte
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Ex: Stages Finance Paris"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Fréquence des alertes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Fréquence des notifications
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAlertFrequency('instant')}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    alertFrequency === 'instant'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">Instantané</div>
                  <div className="text-xs text-gray-500 mt-0.5">Dès qu'une offre arrive</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAlertFrequency('daily')}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    alertFrequency === 'daily'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">Quotidien</div>
                  <div className="text-xs text-gray-500 mt-0.5">Résumé chaque jour</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAlertFrequency('weekly')}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    alertFrequency === 'weekly'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">Hebdo</div>
                  <div className="text-xs text-gray-500 mt-0.5">Résumé chaque semaine</div>
                </button>
              </div>
            </div>

            {/* Toggle alertes */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Recevoir les alertes par email</div>
                  <div className="text-sm text-gray-600">
                    Soyez notifié des nouvelles offres correspondantes
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlertEnabled(!alertEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  alertEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    alertEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSearchName('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                disabled={isSaving}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={isSaving || !searchName.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <BellRing className="h-4 w-4" />
                    Créer l'alerte
                  </>
                )}
              </button>
            </div>
          </div>
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
