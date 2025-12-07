// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Modal from '@/components/shared/Modal';
import { LocationFilter } from '@/components/shared/LocationSearch';
import { useCandidate } from '@/contexts/AuthContext';
import { 
  getSavedSearches, 
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  SavedSearch,
  SearchFilters,
  AlertFrequency,
} from '@/services/candidateService';
import { Location, FRENCH_REGIONS } from '@/types';
import { 
  Search, 
  Bell, 
  BellOff,
  Trash2, 
  Plus,
  Play,
  Edit3,
  Clock,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Filter,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const alertFrequencyLabels: Record<AlertFrequency, string> = {
  instant: 'Instantané',
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  never: 'Désactivé',
};

const contractTypeOptions = [
  { value: 'stage', label: 'Stage' },
  { value: 'alternance', label: 'Alternance' },
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
];

const studyLevelOptions = [
  { value: 'L3', label: 'Licence 3' },
  { value: 'M1', label: 'Master 1' },
  { value: 'M2', label: 'Master 2' },
  { value: 'Doctorat', label: 'Doctorat' },
];

export default function SavedSearchesPage() {
  const { candidate } = useCandidate();
  const candidateId = candidate?.id;
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour le modal de création/édition
  const [showModal, setShowModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    query: '',
    regions: [] as string[],
    countries: [] as string[],
    contractTypes: [] as string[],
    studyLevels: [] as string[],
    alertEnabled: true,
    alertFrequency: 'daily' as AlertFrequency,
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour la suppression
  const [searchToDelete, setSearchToDelete] = useState<SavedSearch | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (candidateId) {
      loadSavedSearches();
    }
  }, [candidateId]);

  const loadSavedSearches = async () => {
    if (!candidateId) return;
    
    try {
      const searches = await getSavedSearches(candidateId);
      setSavedSearches(searches);
    } catch (error) {
      console.error('Erreur lors du chargement des recherches:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      query: '',
      regions: [],
      countries: [],
      contractTypes: [],
      studyLevels: [],
      alertEnabled: true,
      alertFrequency: 'daily',
    });
    setEditingSearch(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (search: SavedSearch) => {
    setEditingSearch(search);
    setFormData({
      name: search.name,
      query: search.filters.query || '',
      regions: search.filters.regions || [],
      countries: search.filters.countries || [],
      contractTypes: search.filters.contractTypes || [],
      studyLevels: search.filters.studyLevels || [],
      alertEnabled: search.alertEnabled,
      alertFrequency: search.alertFrequency,
    });
    setShowModal(true);
  };

  const handleSaveSearch = async () => {
    if (!formData.name.trim()) return;
    
    setIsSaving(true);
    try {
      const filters: SearchFilters = {
        query: formData.query || undefined,
        regions: formData.regions.length > 0 ? formData.regions : undefined,
        countries: formData.countries.length > 0 ? formData.countries : undefined,
        contractTypes: formData.contractTypes.length > 0 ? formData.contractTypes : undefined,
        studyLevels: formData.studyLevels.length > 0 ? formData.studyLevels : undefined,
      };

      if (editingSearch) {
        const updated = await updateSavedSearch(editingSearch.id, {
          name: formData.name,
          filters,
          alertEnabled: formData.alertEnabled,
          alertFrequency: formData.alertFrequency,
        });
        setSavedSearches(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const newSearch = await createSavedSearch(
          candidateId,
          formData.name,
          filters,
          formData.alertEnabled,
          formData.alertFrequency
        );
        setSavedSearches(prev => [newSearch, ...prev]);
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSearch = async () => {
    if (!searchToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteSavedSearch(searchToDelete.id);
      setSavedSearches(prev => prev.filter(s => s.id !== searchToDelete.id));
      setShowDeleteModal(false);
      setSearchToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAlert = async (search: SavedSearch) => {
    try {
      const updated = await updateSavedSearch(search.id, {
        alertEnabled: !search.alertEnabled,
      });
      setSavedSearches(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const executeSearch = (search: SavedSearch) => {
    // Construire l'URL avec les filtres
    const params = new URLSearchParams();
    if (search.filters.query) params.set('q', search.filters.query);
    if (search.filters.regions?.length) params.set('regions', search.filters.regions.join(','));
    if (search.filters.contractTypes?.length) params.set('types', search.filters.contractTypes.join(','));
    if (search.filters.studyLevels?.length) params.set('levels', search.filters.studyLevels.join(','));
    
    window.location.href = `/candidate/offers?${params.toString()}`;
  };

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Search className="h-6 w-6 text-purple-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Recherches sauvegardées</h1>
              </div>
              <p className="text-gray-600">
                Gérez vos recherches favorites et configurez vos alertes email
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle recherche
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-purple-600">{savedSearches.length}</div>
              <div className="text-gray-600">Recherches sauvegardées</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-green-600">
                {savedSearches.filter(s => s.alertEnabled).length}
              </div>
              <div className="text-gray-600">Alertes actives</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-blue-600">
                {savedSearches.reduce((acc, s) => acc + (s.matchingOffersCount || 0), 0)}
              </div>
              <div className="text-gray-600">Offres correspondantes</div>
            </div>
          </div>

          {/* Searches List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
            </div>
          ) : savedSearches.length > 0 ? (
            <div className="space-y-4">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{search.name}</h3>
                        {search.alertEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <Bell className="h-3 w-3" />
                            {alertFrequencyLabels[search.alertFrequency]}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            <BellOff className="h-3 w-3" />
                            Alertes désactivées
                          </span>
                        )}
                        {search.matchingOffersCount !== undefined && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {search.matchingOffersCount} offres
                          </span>
                        )}
                      </div>

                      {/* Filtres */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {search.filters.query && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">
                            <Search className="h-3 w-3" />
                            "{search.filters.query}"
                          </span>
                        )}
                        {search.filters.cities?.map(city => (
                          <span key={city} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                            <MapPin className="h-3 w-3" />
                            {city}
                          </span>
                        ))}
                        {search.filters.regions?.map(region => (
                          <span key={region} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm">
                            <MapPin className="h-3 w-3" />
                            {region}
                          </span>
                        ))}
                        {search.filters.contractTypes?.map(type => (
                          <span key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm capitalize">
                            <Briefcase className="h-3 w-3" />
                            {type}
                          </span>
                        ))}
                        {search.filters.studyLevels?.map(level => (
                          <span key={level} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm">
                            <GraduationCap className="h-3 w-3" />
                            {level}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Créée le {format(new Date(search.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </span>
                        {search.lastUsedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Dernière utilisation: {format(new Date(search.lastUsedAt), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => executeSearch(search)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-blue-600"
                        title="Lancer la recherche"
                      >
                        <Play className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => toggleAlert(search)}
                        className={`p-2 rounded-lg transition ${
                          search.alertEnabled 
                            ? 'bg-green-50 hover:bg-green-100 text-green-600' 
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                        }`}
                        title={search.alertEnabled ? 'Désactiver les alertes' : 'Activer les alertes'}
                      >
                        {search.alertEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(search)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
                        title="Modifier"
                      >
                        <Edit3 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSearchToDelete(search);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition text-gray-400 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Aucune recherche sauvegardée
              </h3>
              <p className="text-gray-600 mb-6">
                Créez des recherches personnalisées et recevez des alertes pour les nouvelles offres
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <Plus className="h-5 w-5" />
                Créer une recherche
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/édition */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingSearch ? 'Modifier la recherche' : 'Nouvelle recherche'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Nom de la recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la recherche *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Stages Finance Paris"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Mots-clés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mots-clés
            </label>
            <input
              type="text"
              value={formData.query}
              onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
              placeholder="Ex: finance, M&A, audit..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Régions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Régions
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(FRENCH_REGIONS).slice(0, 8).map(region => (
                <button
                  key={region}
                  type="button"
                  onClick={() => toggleArrayItem(
                    formData.regions, 
                    region, 
                    (arr) => setFormData(prev => ({ ...prev, regions: arr }))
                  )}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    formData.regions.includes(region)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Type de contrat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="inline h-4 w-4 mr-1" />
              Type de contrat
            </label>
            <div className="flex flex-wrap gap-2">
              {contractTypeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleArrayItem(
                    formData.contractTypes, 
                    option.value, 
                    (arr) => setFormData(prev => ({ ...prev, contractTypes: arr }))
                  )}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    formData.contractTypes.includes(option.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau d'études */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="inline h-4 w-4 mr-1" />
              Niveau d'études
            </label>
            <div className="flex flex-wrap gap-2">
              {studyLevelOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleArrayItem(
                    formData.studyLevels, 
                    option.value, 
                    (arr) => setFormData(prev => ({ ...prev, studyLevels: arr }))
                  )}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    formData.studyLevels.includes(option.value)
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alertes */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Alertes email</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, alertEnabled: !prev.alertEnabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  formData.alertEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    formData.alertEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.alertEnabled && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">Fréquence des alertes</label>
                <select
                  value={formData.alertFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, alertFrequency: e.target.value as AlertFrequency }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="instant">Instantané (dès qu'une offre correspond)</option>
                  <option value="daily">Quotidien (résumé chaque jour)</option>
                  <option value="weekly">Hebdomadaire (résumé chaque semaine)</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              onClick={handleSaveSearch}
              disabled={isSaving || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {editingSearch ? 'Mettre à jour' : 'Créer la recherche'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSearchToDelete(null);
        }}
        title="Supprimer la recherche"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Voulez-vous vraiment supprimer cette recherche ? Les alertes associées seront également supprimées.
          </p>

          {searchToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">{searchToDelete.name}</h4>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSearchToDelete(null);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteSearch}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
