// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Modal from '@/components/shared/Modal';
import { useCandidate } from '@/contexts/AuthContext';
import { 
  getSavedSearches, 
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  SavedSearch,
  AlertFrequency,
  DAYS_OF_WEEK,
} from '@/services/candidateService';
import SavedSearchForm, { SavedSearchFormData, formDataToSearchFilters, formDataToNotificationOptions } from '@/components/candidate/SavedSearchForm';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const alertFrequencyLabels: Record<AlertFrequency, string> = {
  instant: 'À chaque nouvelle offre',
  daily: 'Chaque jour',
  weekly: 'Chaque semaine',
  biweekly: 'Toutes les 2 semaines',
  never: 'Désactivé',
};

export default function SavedSearchesPage() {
  const { candidate } = useCandidate();
  const candidateId = candidate?.id;
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour le modal de création/édition
  const [showModal, setShowModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
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

  const openCreateModal = () => {
    setEditingSearch(null);
    setShowModal(true);
  };

  const openEditModal = (search: SavedSearch) => {
    setEditingSearch(search);
    setShowModal(true);
  };

  const handleSaveSearch = async (formData: SavedSearchFormData) => {
    if (!candidateId) return;
    
    setIsSaving(true);
    try {
      const filters = formDataToSearchFilters(formData);
      const notificationOptions = formDataToNotificationOptions(formData);

      if (editingSearch) {
        const updated = await updateSavedSearch(editingSearch.id, {
          name: formData.name,
          filters,
          alertEnabled: formData.alertEnabled,
          alertFrequency: formData.alertFrequency,
          preferredDay: notificationOptions.preferred_day,
          preferredHour: notificationOptions.preferred_hour,
          biweeklyWeek: notificationOptions.biweekly_week,
        });
        setSavedSearches(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const newSearch = await createSavedSearch(
          candidateId,
          formData.name,
          filters,
          formData.alertEnabled,
          formData.alertFrequency,
          {
            preferredDay: notificationOptions.preferred_day,
            preferredHour: notificationOptions.preferred_hour,
            biweeklyWeek: notificationOptions.biweekly_week,
          }
        );
        setSavedSearches(prev => [newSearch, ...prev]);
      }
      
      setShowModal(false);
      setEditingSearch(null);
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
      const isCurrentlyEnabled = search.alertEnabled || search.notify_new_matches;
      const newEnabled = !isCurrentlyEnabled;
      
      // Déterminer la fréquence à utiliser
      let newFrequency: AlertFrequency;
      if (newEnabled) {
        // Réactivation: utiliser la fréquence existante (si pas 'never') ou 'daily' par défaut
        const existingFreq = search.alertFrequency || search.notification_frequency;
        newFrequency = (existingFreq && existingFreq !== 'never') ? existingFreq : 'daily';
      } else {
        // Désactivation: mettre à 'never'
        newFrequency = 'never';
      }
      
      const updated = await updateSavedSearch(search.id, {
        alertEnabled: newEnabled,
        alertFrequency: newFrequency,
      });
      setSavedSearches(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const executeSearch = (search: SavedSearch) => {
    // Construire l'URL avec les filtres
    const params = new URLSearchParams();
    if (search.filters.search) params.set('q', search.filters.search);
    if (search.filters.locations?.length) params.set('locations', search.filters.locations.join(','));
    if (search.filters.contract_types?.length) params.set('types', search.filters.contract_types.join(','));
    if (search.filters.education_levels?.length) params.set('levels', search.filters.education_levels.join(','));
    
    window.location.href = `/candidate/offers?${params.toString()}`;
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
                {savedSearches.filter(s => s.alertEnabled || s.notify_new_matches).length}
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
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{search.name}</h3>
                        {(search.alertEnabled || search.notify_new_matches) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <Bell className="h-3 w-3" />
                            {alertFrequencyLabels[search.alertFrequency || search.notification_frequency]}
                            {(search.alertFrequency === 'daily' || search.notification_frequency === 'daily') && (
                              <span className="text-green-600">• {(search.preferred_hour ?? 9).toString().padStart(2, '0')}:00</span>
                            )}
                            {(search.alertFrequency === 'weekly' || search.notification_frequency === 'weekly') && (
                              <span className="text-green-600">• {DAYS_OF_WEEK.find(d => d.value === search.preferred_day)?.label || 'Lundi'} {(search.preferred_hour ?? 9).toString().padStart(2, '0')}:00</span>
                            )}
                            {(search.alertFrequency === 'biweekly' || search.notification_frequency === 'biweekly') && (
                              <span className="text-green-600">• {DAYS_OF_WEEK.find(d => d.value === search.preferred_day)?.label || 'Lundi'} {(search.preferred_hour ?? 9).toString().padStart(2, '0')}:00</span>
                            )}
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
                        {search.filters.search && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">
                            <Search className="h-3 w-3" />
                            "{search.filters.search}"
                          </span>
                        )}
                        {search.filters.locations?.map(loc => (
                          <span key={loc} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm">
                            <MapPin className="h-3 w-3" />
                            {loc}
                          </span>
                        ))}
                        {search.filters.contract_types?.map(type => (
                          <span key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm capitalize">
                            <Briefcase className="h-3 w-3" />
                            {type}
                          </span>
                        ))}
                        {search.filters.education_levels?.map(level => (
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
                          (search.alertEnabled || search.notify_new_matches)
                            ? 'bg-green-50 hover:bg-green-100 text-green-600' 
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                        }`}
                        title={(search.alertEnabled || search.notify_new_matches) ? 'Désactiver les alertes' : 'Activer les alertes'}
                      >
                        {(search.alertEnabled || search.notify_new_matches) ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
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
          setEditingSearch(null);
        }}
        title={editingSearch ? 'Modifier la recherche' : 'Nouvelle recherche sauvegardée'}
        size="lg"
      >
        <SavedSearchForm
          editingSearch={editingSearch}
          onSubmit={handleSaveSearch}
          onCancel={() => {
            setShowModal(false);
            setEditingSearch(null);
          }}
          isSubmitting={isSaving}
        />
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
