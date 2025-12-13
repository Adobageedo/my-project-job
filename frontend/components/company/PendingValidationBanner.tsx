'use client';

import { useState } from 'react';
import { AlertTriangle, X, Clock, Eye, EyeOff, CheckCircle, Info } from 'lucide-react';

interface PendingValidationBannerProps {
  companyName?: string;
  companyStatus: 'pending' | 'active' | 'suspended' | 'inactive';
  isVerified?: boolean;
  onDismiss?: () => void;
  dismissible?: boolean;
}

/**
 * Banner d'alerte affiché aux entreprises en attente de validation
 * Informe que les offres créées ne seront pas visibles des candidats avant approbation
 */
export function PendingValidationBanner({
  companyName,
  companyStatus,
  isVerified = false,
  onDismiss,
  dismissible = true,
}: PendingValidationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || companyStatus === 'active') {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (companyStatus === 'suspended') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">Compte suspendu</h3>
            <p className="text-sm text-red-700 mt-1">
              Votre compte entreprise a été suspendu. Vos offres et candidatures ne sont plus accessibles.
              Veuillez contacter le support pour plus d'informations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-amber-800">
              Compte en attente de validation
            </h3>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-amber-100 rounded transition"
              >
                <X className="h-4 w-4 text-amber-600" />
              </button>
            )}
          </div>
          
          <p className="text-sm text-amber-700 mt-1">
            Bienvenue ! {companyName || 'Votre entreprise'} est en cours de vérification par notre équipe.
          </p>

          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-amber-800">
                Vous pouvez créer et publier des offres dès maintenant
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <EyeOff className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-amber-800">
                <strong>Attention :</strong> Vos offres ne seront pas visibles des candidats avant validation
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-amber-800">
                La validation est généralement effectuée sous 24-48h ouvrées
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Petit badge de statut pour afficher dans les en-têtes
 */
export function CompanyStatusBadge({
  status,
}: {
  status: 'pending' | 'active' | 'suspended' | 'inactive';
}) {
  const statusConfig = {
    pending: {
      label: 'En attente',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Clock,
    },
    active: {
      label: 'Actif',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
    },
    suspended: {
      label: 'Suspendu',
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertTriangle,
    },
    inactive: {
      label: 'Inactif',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: EyeOff,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export default PendingValidationBanner;
