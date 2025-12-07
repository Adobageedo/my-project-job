// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { useCandidate } from '@/contexts/AuthContext';
import { 
  getSavedSearches,
  updateSavedSearch,
  SavedSearch,
  AlertFrequency,
} from '@/services/candidateService';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/services/notificationsService';
import type { NotificationSettings } from '@/types';
import { 
  Bell, 
  Mail, 
  Clock,
  CheckCircle,
  Search,
  Briefcase,
  Calendar,
  ChevronRight,
  Settings,
  BellRing,
  FileText,
  TrendingUp,
} from 'lucide-react';

const frequencyOptions: { value: AlertFrequency; label: string; description: string }[] = [
  { value: 'instant', label: 'Instantané', description: 'Recevez un email dès qu\'une nouvelle offre correspond' },
  { value: 'daily', label: 'Quotidien', description: 'Un résumé chaque jour à 9h' },
  { value: 'weekly', label: 'Hebdomadaire', description: 'Un résumé chaque lundi matin' },
  { value: 'never', label: 'Jamais', description: 'Aucune notification par email' },
];

export default function NotificationsPage() {
  const { candidate } = useCandidate();
  const candidateId = candidate?.id;
  
  const [preferences, setPreferences] = useState<NotificationSettings | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (candidateId) {
      loadData();
    }
  }, [candidateId]);

  const loadData = async () => {
    if (!candidateId) return;
    
    try {
      const [prefs, searches] = await Promise.all([
        getNotificationSettings(candidateId),
        getSavedSearches(candidateId),
      ]);
      setPreferences(prefs);
      setSavedSearches(searches);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (updates: Partial<NotificationSettings>) => {
    if (!preferences) return;
    
    setSaving(true);
    try {
      const updated = await updateNotificationSettings(candidateId, updates);
      setPreferences(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSearchAlert = async (search: SavedSearch) => {
    try {
      const updated = await updateSavedSearch(search.id, {
        alertEnabled: !search.alertEnabled,
      });
      setSavedSearches(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            </div>
            <p className="text-gray-600">
              Configurez vos préférences de notifications et alertes email
            </p>
          </div>

          {/* Saved indicator */}
          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Préférences enregistrées avec succès
            </div>
          )}

          {/* Global Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Paramètres généraux
            </h2>

            {/* Master toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
              <div>
                <div className="font-medium text-gray-900">Activer les notifications email</div>
                <div className="text-sm text-gray-600">
                  Recevez des emails pour les nouvelles offres et mises à jour
                </div>
              </div>
              <button
                onClick={() => handleUpdatePreferences({ globalEnabled: !preferences?.globalEnabled })}
                disabled={saving}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  preferences?.globalEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    preferences?.globalEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {preferences?.globalEnabled && (
              <>
                {/* Frequency */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Fréquence des notifications
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {frequencyOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleUpdatePreferences({ frequency: option.value })}
                        disabled={saving}
                        className={`p-4 rounded-lg border-2 text-left transition ${
                          preferences?.frequency === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification types */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Types de notifications</h3>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BellRing className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Nouvelles offres correspondantes</div>
                        <div className="text-sm text-gray-600">
                          Alertes pour les offres qui correspondent à vos recherches
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdatePreferences({ newMatchingOffers: !preferences?.newMatchingOffers })}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        preferences?.newMatchingOffers ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          preferences?.newMatchingOffers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Mises à jour de candidatures</div>
                        <div className="text-sm text-gray-600">
                          Notifications quand le statut de vos candidatures change
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdatePreferences({ applicationUpdates: !preferences?.applicationUpdates })}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        preferences?.applicationUpdates ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          preferences?.applicationUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Résumé par email</div>
                        <div className="text-sm text-gray-600">
                          Recevoir un digest regroupant toutes les notifications
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdatePreferences({ emailDigest: !preferences?.emailDigest })}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        preferences?.emailDigest ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          preferences?.emailDigest ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Rapport hebdomadaire</div>
                        <div className="text-sm text-gray-600">
                          Statistiques et tendances du marché chaque semaine
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdatePreferences({ weeklyReport: !preferences?.weeklyReport })}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        preferences?.weeklyReport ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          preferences?.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Search Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-500" />
                Alertes de recherche
              </h2>
              <Link
                href="/candidate/searches"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                Gérer les recherches
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {savedSearches.length > 0 ? (
              <div className="space-y-3">
                {savedSearches.map(search => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{search.name}</div>
                      <div className="text-sm text-gray-600">
                        {search.alertEnabled 
                          ? `Alertes ${search.alertFrequency === 'instant' ? 'instantanées' : search.alertFrequency === 'daily' ? 'quotidiennes' : 'hebdomadaires'}`
                          : 'Alertes désactivées'
                        }
                        {search.matchingOffersCount !== undefined && (
                          <span className="ml-2 text-blue-600">
                            • {search.matchingOffersCount} offres
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSearchAlert(search)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        search.alertEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          search.alertEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 mb-4">Aucune recherche sauvegardée</p>
                <Link
                  href="/candidate/searches"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Créer une recherche
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
