'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';
import { MultiLocationAutocomplete } from '@/components/shared/LocationAutocomplete';
import { LocationHierarchy } from '@/data/locations';
import { 
  SavedSearch, 
  SearchFilters,
  AlertFrequency, 
  PreferredDay,
  DAYS_OF_WEEK,
  HOURS_OF_DAY,
} from '@/services/candidateService';

// Options - Cohérent avec les enums de la base de données (000_main_schema.sql)
// contract_type ENUM: 'stage', 'alternance', 'cdi', 'cdd'
const contractTypeOptions = [
  { value: 'stage', label: 'Stage' },
  { value: 'alternance', label: 'Alternance' },
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
];

// education_level ENUM: 'bac', 'bac+1', 'bac+2', 'bac+3', 'bac+4', 'bac+5', 'bac+6', 'doctorat'
const studyLevelOptions = [
  { value: 'bac+3', label: 'Licence 3 (Bac+3)' },
  { value: 'bac+4', label: 'Master 1 (Bac+4)' },
  { value: 'bac+5', label: 'Master 2 (Bac+5)' },
  { value: 'bac+6', label: 'MBA / Bac+6' },
  { value: 'doctorat', label: 'Doctorat' },
];

// remote_policy options
const remotePolicyOptions = [
  { value: 'on_site', label: 'Sur site' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'remote', label: 'Full remote' },
];

const alertFrequencyOptions: { value: AlertFrequency; label: string; description: string }[] = [
  { value: 'instant', label: 'Instantané', description: 'Dès qu\'une nouvelle offre correspond' },
  { value: 'daily', label: 'Quotidien', description: 'Un résumé chaque jour' },
  { value: 'weekly', label: 'Hebdomadaire', description: 'Un résumé chaque semaine' },
  { value: 'biweekly', label: 'Bi-mensuel', description: 'Toutes les 2 semaines' },
];

export interface SavedSearchFormData {
  name: string;
  query: string;
  locations: LocationHierarchy[];
  contractTypes: string[];  // Valeurs de l'enum contract_type
  studyLevels: string[];    // Valeurs de l'enum education_level
  remotePolicy?: string;    // 'on_site', 'hybrid', 'remote'
  // Notifications - correspond aux colonnes saved_searches
  alertEnabled: boolean;    // -> notify_new_matches
  alertFrequency: AlertFrequency;  // -> notification_frequency
  preferredDay: PreferredDay;      // -> preferred_day
  preferredHour: number;           // -> preferred_hour
  biweeklyWeek?: number;           // -> biweekly_week (1 ou 2)
}

interface SavedSearchFormProps {
  initialData?: Partial<SavedSearchFormData>;
  editingSearch?: SavedSearch | null;
  onSubmit: (data: SavedSearchFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function SavedSearchForm({
  initialData,
  editingSearch,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SavedSearchFormProps) {
  const [formData, setFormData] = useState<SavedSearchFormData>({
    name: '',
    query: '',
    locations: [],
    contractTypes: [],
    studyLevels: [],
    remotePolicy: undefined,
    alertEnabled: true,
    alertFrequency: 'daily',
    preferredDay: 'monday',
    preferredHour: 9,
    biweeklyWeek: 1,
    ...initialData,
  });

  // Charger les données de la recherche en édition
  useEffect(() => {
    if (editingSearch) {
      // Convertir les locations string[] en LocationHierarchy[]
      const locations: LocationHierarchy[] = (editingSearch.filters?.locations || []).map((loc: string) => {
        // Essayer de déterminer si c'est une ville, région ou pays
        // Pour simplifier, on suppose que c'est une ville
        return { city: loc, country: 'France' };
      });

      setFormData({
        name: editingSearch.name || '',
        query: editingSearch.filters?.search || '',
        locations,
        contractTypes: editingSearch.filters?.contract_types || [],
        studyLevels: editingSearch.filters?.education_levels || [],
        remotePolicy: editingSearch.filters?.remote_policy,
        // Mapping des champs de notification
        alertEnabled: editingSearch.notify_new_matches ?? true,
        alertFrequency: editingSearch.notification_frequency || 'daily',
        preferredDay: editingSearch.preferred_day || 'monday',
        preferredHour: editingSearch.preferred_hour ?? 9,
        biweeklyWeek: editingSearch.biweekly_week ?? 1,
      });
    }
  }, [editingSearch]);

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Informations de base */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
          Informations
        </div>
        
        {/* Nom de la recherche */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom de la recherche <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Stages Finance Paris"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Donnez un nom explicite pour retrouver facilement cette recherche</p>
        </div>

        {/* Mots-clés */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Search className="inline h-4 w-4 mr-1 text-gray-400" />
            Mots-clés
          </label>
          <input
            type="text"
            value={formData.query}
            onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
            placeholder="Ex: finance, M&A, audit, marketing digital..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-200" />

      {/* Section 2: Critères de recherche */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">2</span>
          Critères de recherche
        </div>

        {/* Localisations */}
        <MultiLocationAutocomplete
          values={formData.locations}
          onChange={(locations) => setFormData(prev => ({ ...prev, locations }))}
          label="Localisations"
          placeholder="Ajouter une ville, région ou pays..."
          maxLocations={10}
          allowedTypes={['city', 'region', 'country']}
        />

        {/* Type de contrat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Briefcase className="inline h-4 w-4 mr-1 text-blue-500" />
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
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  formData.contractTypes.includes(option.value)
                    ? 'bg-blue-600 text-white shadow-sm'
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
            <GraduationCap className="inline h-4 w-4 mr-1 text-amber-500" />
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
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  formData.studyLevels.includes(option.value)
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Politique de télétravail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1 text-green-500" />
            Télétravail
          </label>
          <div className="flex flex-wrap gap-2">
            {remotePolicyOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  remotePolicy: prev.remotePolicy === option.value ? undefined : option.value 
                }))}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  formData.remotePolicy === option.value
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-200" />

      {/* Section 3: Alertes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">3</span>
          Notifications
        </div>

        <div className={`p-4 rounded-xl border-2 transition-all ${
          formData.alertEnabled 
            ? 'border-green-200 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${formData.alertEnabled ? 'bg-green-100' : 'bg-gray-200'}`}>
                <Bell className={`h-5 w-5 ${formData.alertEnabled ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <span className="font-medium text-gray-900">Recevoir des alertes email</span>
                <p className="text-sm text-gray-500">Soyez notifié des nouvelles offres correspondantes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, alertEnabled: !prev.alertEnabled }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                formData.alertEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  formData.alertEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {formData.alertEnabled && (
            <div className="mt-4 pt-4 border-t border-green-200 space-y-4">
              {/* Fréquence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Clock className="inline h-4 w-4 mr-1 text-gray-400" />
                  Fréquence des alertes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {alertFrequencyOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, alertFrequency: option.value }))}
                      className={`p-3 rounded-xl text-left transition-all ${
                        formData.alertFrequency === option.value
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className={`text-xs ${formData.alertFrequency === option.value ? 'text-green-100' : 'text-gray-500'}`}>
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options de timing */}
              {(formData.alertFrequency === 'daily' || formData.alertFrequency === 'weekly' || formData.alertFrequency === 'biweekly') && (
                <div className="flex gap-4 flex-wrap">
                  {(formData.alertFrequency === 'weekly' || formData.alertFrequency === 'biweekly') && (
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Jour</label>
                      <select
                        value={formData.preferredDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredDay: e.target.value as PreferredDay }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex-1 min-w-[100px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure</label>
                    <select
                      value={formData.preferredHour}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredHour: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {HOURS_OF_DAY.map(hour => (
                        <option key={hour.value} value={hour.value}>{hour.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* Option semaine pour bi-mensuel (cohérent avec biweekly_week dans la DB) */}
                  {formData.alertFrequency === 'biweekly' && (
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Semaine</label>
                      <select
                        value={formData.biweeklyWeek || 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, biweeklyWeek: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value={1}>Semaines impaires</option>
                        <option value={2}>Semaines paires</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              {editingSearch ? 'Modifier' : 'Sauvegarder'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * Helper pour convertir les données du formulaire vers le format SearchFilters de l'API
 * Cohérent avec l'interface SearchFilters dans candidateService.ts
 */
export function formDataToSearchFilters(formData: SavedSearchFormData): SearchFilters {
  // Convertir les LocationHierarchy en string[] de localisations
  const locations: string[] = formData.locations.map(loc => {
    return loc.city || loc.region || loc.country || '';
  }).filter(Boolean);

  return {
    search: formData.query || undefined,
    locations: locations.length > 0 ? locations : undefined,
    contract_types: formData.contractTypes.length > 0 ? formData.contractTypes : undefined,
    education_levels: formData.studyLevels.length > 0 ? formData.studyLevels : undefined,
    remote_policy: formData.remotePolicy || undefined,
  };
}

/**
 * Helper pour extraire les données de notification du formulaire
 * Cohérent avec les colonnes saved_searches dans la DB (002_add_manager_email_to_offers.sql)
 */
export function formDataToNotificationOptions(formData: SavedSearchFormData) {
  return {
    notify_new_matches: formData.alertEnabled,
    notification_frequency: formData.alertEnabled ? formData.alertFrequency : 'never',
    preferred_day: formData.preferredDay,
    preferred_hour: formData.preferredHour,
    biweekly_week: formData.biweeklyWeek || 1,
  };
}
