'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Mail,
  UserPlus,
  Shield,
  Eye,
  Edit,
  Send,
  MessageSquare,
  FileText,
  Columns,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  createInvitation,
  ManagerPermissions,
  DEFAULT_MANAGER_PERMISSIONS,
  ApplicationStatus,
} from '@/services/teamService';
import { getCompanyOffers } from '@/services/offerService';

interface InviteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  invitedBy: string;
  onSuccess?: () => void;
}

interface OfferOption {
  id: string;
  title: string;
}

const KANBAN_STAGES: { value: ApplicationStatus; label: string }[] = [
  { value: 'pending', label: 'Nouvelles candidatures' },
  { value: 'in_progress', label: 'En cours de traitement' },
  { value: 'interview', label: 'Entretien' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'withdrawn', label: 'Désistements' },
];

export function InviteManagerModal({
  isOpen,
  onClose,
  companyId,
  invitedBy,
  onSuccess,
}: InviteManagerModalProps) {
  const [step, setStep] = useState<'email' | 'permissions' | 'offers' | 'confirm' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'rh'>('manager');
  const [permissions, setPermissions] = useState<ManagerPermissions>(DEFAULT_MANAGER_PERMISSIONS);
  const [accessType, setAccessType] = useState<'all' | 'specific'>('all');
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les offres
  useEffect(() => {
    if (isOpen && accessType === 'specific') {
      loadOffers();
    }
  }, [isOpen, accessType, companyId]);

  const loadOffers = async () => {
    try {
      const result = await getCompanyOffers(companyId);
      const offersData = result.offers || result;
      if (Array.isArray(offersData)) {
        setOffers(offersData.map((o: { id: string; title: string }) => ({ id: o.id, title: o.title })));
      }
    } catch {
      console.error('Error loading offers');
    }
  };

  const handlePermissionChange = (key: keyof ManagerPermissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleStageToggle = (stage: ApplicationStatus) => {
    const current = permissions.kanban_stages_access;
    if (current.includes(stage)) {
      setPermissions(prev => ({
        ...prev,
        kanban_stages_access: current.filter(s => s !== stage),
      }));
    } else {
      setPermissions(prev => ({
        ...prev,
        kanban_stages_access: [...current, stage],
      }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createInvitation(
        companyId,
        invitedBy,
        email,
        role,
        permissions,
        accessType === 'specific' ? selectedOfferIds : undefined
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setRole('manager');
    setPermissions(DEFAULT_MANAGER_PERMISSIONS);
    setAccessType('all');
    setSelectedOfferIds([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 'success' ? 'Invitation envoyée !' : 'Inviter un collaborateur'}
              </h2>
              {step !== 'success' && (
                <p className="text-sm text-gray-500">
                  Étape {step === 'email' ? '1' : step === 'permissions' ? '2' : step === 'offers' ? '3' : '4'} sur 4
                </p>
              )}
            </div>
          </div>
          {step !== 'success' && (
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Email & Role */}
          {step === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email du collaborateur
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="collaborateur@entreprise.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rôle du collaborateur
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      role === 'manager'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">Manager</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Accès limité aux candidatures de ses offres
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('rh')}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      role === 'rh'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">RH</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Accès complet au recrutement
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Permissions */}
          {step === 'permissions' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    Définissez les actions que <strong>{email}</strong> pourra effectuer sur les candidatures.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-500" />
                  Accès en lecture
                </h3>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <span className="text-gray-700">Voir les candidatures</span>
                  <input
                    type="checkbox"
                    checked={permissions.can_view_applications}
                    onChange={e => handlePermissionChange('can_view_applications', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <span className="text-gray-700">Voir toutes les offres</span>
                  <input
                    type="checkbox"
                    checked={permissions.can_view_all_offers}
                    onChange={e => handlePermissionChange('can_view_all_offers', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-gray-500" />
                  Accès en écriture
                </h3>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <span className="text-gray-700">Changer le statut des candidatures</span>
                    <p className="text-xs text-gray-500">Déplacer dans le Kanban</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.can_change_status}
                    onChange={e => handlePermissionChange('can_change_status', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <span className="text-gray-700">Ajouter des notes</span>
                    <p className="text-xs text-gray-500">Commentaires internes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.can_add_notes}
                    onChange={e => handlePermissionChange('can_add_notes', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <span className="text-gray-700">Envoyer des emails aux candidats</span>
                    <p className="text-xs text-gray-500">Contact direct</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.can_send_emails}
                    onChange={e => handlePermissionChange('can_send_emails', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Columns className="h-5 w-5 text-gray-500" />
                  Colonnes Kanban accessibles
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {KANBAN_STAGES.map(stage => (
                    <label
                      key={stage.value}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition ${
                        permissions.kanban_stages_access.includes(stage.value)
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={permissions.kanban_stages_access.includes(stage.value)}
                        onChange={() => handleStageToggle(stage.value)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{stage.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Offer Access */}
          {step === 'offers' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Accès aux offres
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAccessType('all')}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      accessType === 'all'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">Toutes les offres</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Accès à toutes les offres actuelles et futures
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessType('specific')}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      accessType === 'specific'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">Offres spécifiques</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Sélectionner les offres accessibles
                    </p>
                  </button>
                </div>
              </div>

              {accessType === 'specific' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Sélectionnez les offres ({selectedOfferIds.length} sélectionnée{selectedOfferIds.length > 1 ? 's' : ''})
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                    {offers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucune offre disponible
                      </div>
                    ) : (
                      offers.map(offer => (
                        <label
                          key={offer.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOfferIds.includes(offer.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedOfferIds(prev => [...prev, offer.id]);
                              } else {
                                setSelectedOfferIds(prev => prev.filter(id => id !== offer.id));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <span className="text-gray-700">{offer.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Confirmer l'invitation
                </h3>
                <p className="text-gray-600">
                  Un email d'invitation sera envoyé à ce collaborateur
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rôle</span>
                  <span className="font-medium">{role === 'rh' ? 'RH' : 'Manager'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accès aux offres</span>
                  <span className="font-medium">
                    {accessType === 'all' ? 'Toutes' : `${selectedOfferIds.length} sélectionnée(s)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Colonnes Kanban</span>
                  <span className="font-medium">{permissions.kanban_stages_access.length} colonnes</span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Invitation envoyée !
              </h3>
              <p className="text-gray-600 mb-4">
                Un email a été envoyé à <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                L'invitation expire dans 7 jours
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between">
            <button
              onClick={() => {
                if (step === 'email') handleClose();
                else if (step === 'permissions') setStep('email');
                else if (step === 'offers') setStep('permissions');
                else if (step === 'confirm') setStep('offers');
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
            >
              {step === 'email' ? 'Annuler' : 'Retour'}
            </button>

            <button
              onClick={() => {
                if (step === 'email') setStep('permissions');
                else if (step === 'permissions') setStep('offers');
                else if (step === 'offers') setStep('confirm');
                else if (step === 'confirm') handleSubmit();
              }}
              disabled={
                isLoading ||
                (step === 'email' && !email) ||
                (step === 'offers' && accessType === 'specific' && selectedOfferIds.length === 0)
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : step === 'confirm' ? (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer l'invitation
                </>
              ) : (
                'Continuer'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteManagerModal;
