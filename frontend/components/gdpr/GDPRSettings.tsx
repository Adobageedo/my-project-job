'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Download, 
  Trash2, 
  AlertTriangle, 
  FileText, 
  Eye, 
  Lock,
  CheckCircle,
  Loader2,
  ChevronRight,
  Mail,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { API_CONFIG } from '@/services/api/config';

interface GDPRSettingsProps {
  userType: 'candidate' | 'company';
  userId: string;
  userEmail: string;
  onAccountDeleted?: () => void;
}

export default function GDPRSettings({ 
  userType, 
  userId, 
  userEmail,
  onAccountDeleted 
}: GDPRSettingsProps) {
  const router = useRouter();
  
  // États pour les différentes actions
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Exporter les données personnelles
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Récupérer les données selon le type d'utilisateur
      let userData: any = {};
      
      if (userType === 'candidate') {
        // Use unified users table for candidate profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .eq('role', 'candidate')
          .single();
        
        const { data: applications } = await supabase
          .from('applications')
          .select('*, job_offers(*)')
          .eq('candidate_id', userId);

        const { data: savedCVs } = await supabase
          .from('saved_cvs')
          .select('*')
          .eq('candidate_id', userId);

        userData = {
          profile,
          applications,
          savedCVs,
          exportDate: new Date().toISOString(),
          userType: 'candidate'
        };
      } else {
        // Use unified users table for company user, join to companies
        const { data: profile } = await supabase
          .from('users')
          .select('*, companies(*)')
          .eq('id', userId)
          .eq('role', 'company')
          .single();

        const companyId = profile?.company_id;
        
        const { data: offers } = await supabase
          .from('job_offers')
          .select('*')
          .eq('company_id', companyId);

        userData = {
          profile,
          company: profile?.companies,
          offers,
          exportDate: new Date().toISOString(),
          userType: 'company'
        };
      }

      // Créer et télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-${userType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export des données');
    } finally {
      setIsExporting(false);
    }
  };

  // Supprimer le compte via le backend (suppression complète incluant auth)
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      setDeleteError('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Obtenir le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // Appeler le backend pour supprimer complètement le compte
      const endpoint = userType === 'candidate' 
        ? `${API_CONFIG.BACKEND_URL}/v1/account/candidate`
        : `${API_CONFIG.BACKEND_URL}/v1/account/company`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la suppression du compte');
      }

      const result = await response.json();
      console.log('Compte supprimé:', result);

      // Déconnexion locale (le compte auth est déjà supprimé côté backend)
      await supabase.auth.signOut();
      
      if (onAccountDeleted) {
        onAccountDeleted();
      } else {
        router.push('/?account_deleted=true');
      }
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      setDeleteError(error.message || 'Erreur lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Protection des données (RGPD)</h2>
          <p className="text-sm text-gray-600">Gérez vos données personnelles et votre compte</p>
        </div>
      </div>

      {/* Vos droits */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">Vos droits RGPD</h3>
        <p className="text-sm text-blue-800">
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, 
          de rectification, de portabilité et de suppression de vos données personnelles.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* Consulter les données */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Consulter mes données</h3>
              <p className="text-sm text-gray-600 mt-1">
                Visualisez toutes les informations que nous détenons sur vous.
              </p>
            </div>
            <button
              onClick={() => router.push(`/${userType}/profile`)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              Voir mon profil
            </button>
          </div>
        </div>

        {/* Exporter les données */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Exporter mes données</h3>
              <p className="text-sm text-gray-600 mt-1">
                Téléchargez une copie de toutes vos données au format JSON.
              </p>
              {exportSuccess && (
                <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Export téléchargé avec succès !
                </div>
              )}
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exporter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Rectifier les données */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Rectifier mes données</h3>
              <p className="text-sm text-gray-600 mt-1">
                Modifiez vos informations personnelles depuis votre profil.
              </p>
            </div>
            <button
              onClick={() => router.push(`/${userType}/profile`)}
              className="px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition"
            >
              Modifier
            </button>
          </div>
        </div>

        {/* Contacter le DPO */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Contacter le DPO</h3>
              <p className="text-sm text-gray-600 mt-1">
                Pour toute question relative à vos données personnelles.
              </p>
            </div>
            <a
              href="mailto:dpo@jobteaser.com"
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition"
            >
              dpo@jobteaser.com
            </a>
          </div>
        </div>

        {/* Zone de danger - Suppression */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Supprimer mon compte</h3>
              <p className="text-sm text-red-700 mt-1">
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Supprimer le compte</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeleteError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Attention !</strong> Cette action supprimera définitivement :
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                {userType === 'candidate' ? (
                  <>
                    <li>Votre profil candidat</li>
                    <li>Tous vos CV téléchargés</li>
                    <li>Toutes vos candidatures</li>
                    <li>Vos recherches sauvegardées</li>
                  </>
                ) : (
                  <>
                    <li>Votre profil entreprise</li>
                    <li>Toutes vos offres d'emploi</li>
                    <li>L'historique des candidatures reçues</li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation !== 'SUPPRIMER'}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer définitivement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
