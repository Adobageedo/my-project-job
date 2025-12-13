'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import {
  Bell,
  Mail,
  Clock,
  Building2,
  Users,
  Briefcase,
  FileText,
  CheckCircle,
  TrendingUp,
  Activity,
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react';
import {
  getAdminNotificationSettings,
  saveAdminNotificationSettings,
  AdminNotificationSettings,
} from '@/services/kpiService';
import { useAuth } from '@/contexts/AuthContext';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'none';

const FREQUENCY_OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Quotidien', description: 'Recevez un résumé chaque jour à 8h' },
  { value: 'weekly', label: 'Hebdomadaire', description: 'Recevez un résumé chaque lundi à 8h' },
  { value: 'monthly', label: 'Mensuel', description: 'Recevez un résumé le 1er de chaque mois' },
  { value: 'none', label: 'Désactivé', description: 'Ne pas recevoir de notifications' },
];

const KPI_OPTIONS = [
  { key: 'kpi_companies_registered', label: 'Entreprises inscrites', icon: Building2, description: 'Nombre total d\'entreprises sur la plateforme' },
  { key: 'kpi_candidates_registered', label: 'Candidats inscrits', icon: Users, description: 'Nombre total de candidats inscrits' },
  { key: 'kpi_offers_created', label: 'Offres créées', icon: Briefcase, description: 'Nombre total d\'offres publiées' },
  { key: 'kpi_applications', label: 'Candidatures', icon: FileText, description: 'Nombre total de candidatures reçues' },
  { key: 'kpi_offers_filled', label: 'Offres pourvues', icon: CheckCircle, description: 'Offres ayant trouvé un candidat' },
  { key: 'kpi_active_company_users', label: 'Utilisateurs entreprise actifs', icon: Activity, description: 'Utilisateurs connectés dans les 30 derniers jours' },
  { key: 'kpi_active_candidates', label: 'Candidats actifs', icon: TrendingUp, description: 'Candidats connectés dans les 30 derniers jours' },
  { key: 'kpi_avg_applications', label: 'Moyenne candidatures/utilisateur', icon: TrendingUp, description: 'Nombre moyen de candidatures par candidat actif' },
  { key: 'kpi_companies_with_active', label: 'Entreprises avec utilisateurs actifs', icon: Building2, description: 'Entreprises avec au moins 1 utilisateur actif' },
];

export default function AdminNotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [settings, setSettings] = useState<Partial<AdminNotificationSettings>>({
    frequency: 'weekly',
    email_enabled: true,
    kpi_companies_registered: true,
    kpi_candidates_registered: true,
    kpi_offers_created: true,
    kpi_applications: true,
    kpi_offers_filled: true,
    kpi_active_company_users: true,
    kpi_active_candidates: true,
    kpi_avg_applications: true,
    kpi_companies_with_active: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      try {
        const data = await getAdminNotificationSettings(user.id);
        if (data) {
          setSettings(data);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await saveAdminNotificationSettings(user.id, settings);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleFrequencyChange = (frequency: Frequency) => {
    setSettings(prev => ({ ...prev, frequency }));
  };

  const handleKPIToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof AdminNotificationSettings] }));
  };

  const handleSelectAll = () => {
    const newSettings = { ...settings };
    KPI_OPTIONS.forEach(opt => {
      newSettings[opt.key as keyof AdminNotificationSettings] = true as any;
    });
    setSettings(newSettings);
  };

  const handleDeselectAll = () => {
    const newSettings = { ...settings };
    KPI_OPTIONS.forEach(opt => {
      newSettings[opt.key as keyof AdminNotificationSettings] = false as any;
    });
    setSettings(newSettings);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="h-8 w-8 text-blue-600" />
              Notifications KPI
            </h1>
            <p className="text-gray-600 mt-2">
              Configurez la fréquence et le contenu des rapports KPI que vous souhaitez recevoir par email.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span>Paramètres sauvegardés avec succès</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Email toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Notifications par email</h3>
                    <p className="text-gray-600 text-sm">Recevoir les rapports KPI par email</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, email_enabled: !prev.email_enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.email_enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.email_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Frequency selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fréquence des rapports</h3>
                  <p className="text-gray-600 text-sm">À quelle fréquence souhaitez-vous recevoir les rapports ?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                {FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFrequencyChange(option.value)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      settings.frequency === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-semibold ${
                      settings.frequency === option.value ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">KPIs à inclure</h3>
                    <p className="text-gray-600 text-sm">Sélectionnez les indicateurs à inclure dans vos rapports</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Tout sélectionner
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {KPI_OPTIONS.map((kpi) => {
                  const Icon = kpi.icon;
                  const isEnabled = settings[kpi.key as keyof AdminNotificationSettings];
                  
                  return (
                    <button
                      key={kpi.key}
                      onClick={() => handleKPIToggle(kpi.key)}
                      className={`p-4 rounded-lg border-2 text-left transition flex items-start gap-3 ${
                        isEnabled
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isEnabled ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${isEnabled ? 'text-green-700' : 'text-gray-900'}`}>
                          {kpi.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{kpi.description}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isEnabled ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {isEnabled && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Enregistrer les paramètres
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
