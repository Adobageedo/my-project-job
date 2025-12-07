'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Bell, Mail, Save, CheckCircle } from 'lucide-react';

interface NotificationSettings {
  notifyNewApplications: boolean;
  notifyNewOffers: boolean;
  notifyStatusChange: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  emailFrom: string;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    notifyNewApplications: true,
    notifyNewOffers: true,
    notifyStatusChange: true,
    frequency: 'instant',
    emailFrom: 'notifications@financestages.fr',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation de sauvegarde
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-slate-900">Paramètres des notifications</h1>
            <p className="text-slate-600 mt-2">
              Configurez vos préférences de notifications par email
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Notifications par email */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">Types de notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifyApplications"
                      type="checkbox"
                      checked={settings.notifyNewApplications}
                      onChange={(e) => setSettings({ ...settings, notifyNewApplications: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="notifyApplications" className="font-medium text-slate-900">
                      Nouvelles candidatures
                    </label>
                    <p className="text-sm text-slate-600">
                      Recevez une notification lorsqu'un candidat postule à l'une de vos offres
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifyOffers"
                      type="checkbox"
                      checked={settings.notifyNewOffers}
                      onChange={(e) => setSettings({ ...settings, notifyNewOffers: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="notifyOffers" className="font-medium text-slate-900">
                      Nouvelles offres
                    </label>
                    <p className="text-sm text-slate-600">
                      Recevez une notification lorsqu'une nouvelle offre correspondant à votre profil est publiée
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifyStatus"
                      type="checkbox"
                      checked={settings.notifyStatusChange}
                      onChange={(e) => setSettings({ ...settings, notifyStatusChange: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="notifyStatus" className="font-medium text-slate-900">
                      Changements de statut
                    </label>
                    <p className="text-sm text-slate-600">
                      Recevez une notification lorsque le statut d'une candidature change
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fréquence */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Fréquence des notifications</h2>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="instant"
                    type="radio"
                    name="frequency"
                    value="instant"
                    checked={settings.frequency === 'instant'}
                    onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="instant" className="ml-3">
                    <span className="font-medium text-slate-900">Instantané</span>
                    <p className="text-sm text-slate-600">Recevez un email immédiatement pour chaque événement</p>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="daily"
                    type="radio"
                    name="frequency"
                    value="daily"
                    checked={settings.frequency === 'daily'}
                    onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="daily" className="ml-3">
                    <span className="font-medium text-slate-900">Quotidien</span>
                    <p className="text-sm text-slate-600">Recevez un résumé quotidien de tous les événements</p>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="weekly"
                    type="radio"
                    name="frequency"
                    value="weekly"
                    checked={settings.frequency === 'weekly'}
                    onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="weekly" className="ml-3">
                    <span className="font-medium text-slate-900">Hebdomadaire</span>
                    <p className="text-sm text-slate-600">Recevez un résumé hebdomadaire tous les lundis</p>
                  </label>
                </div>
              </div>
            </div>

            {/* Configuration email */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">Configuration email</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="emailFrom" className="block text-sm font-medium text-slate-700 mb-2">
                    Adresse d'envoi personnalisée
                  </label>
                  <input
                    id="emailFrom"
                    type="email"
                    value={settings.emailFrom}
                    onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="notifications@votre-domaine.fr"
                  />
                  <p className="mt-2 text-sm text-slate-600">
                    Les emails seront envoyés depuis cette adresse via Resend
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Service de mailing configuré
                  </p>
                  <p className="text-xs text-blue-700">
                    Les emails sont envoyés via Resend depuis votre backend Railway. 
                    Assurez-vous que votre domaine est vérifié dans Resend pour éviter que vos emails 
                    ne soient marqués comme spam.
                  </p>
                </div>
              </div>
            </div>

            {/* RGPD */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="font-medium text-slate-900 mb-2">Confidentialité et RGPD</h3>
              <p className="text-sm text-slate-600">
                Vos préférences de notification sont stockées de manière sécurisée. Vous pouvez les modifier 
                à tout moment. Conformément au RGPD, vous disposez d'un droit d'accès, de modification et de 
                suppression de vos données.
              </p>
            </div>

            {/* Bouton de sauvegarde */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                <Save className="w-4 h-4" />
                Enregistrer les préférences
              </button>

              {saved && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Paramètres enregistrés</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
