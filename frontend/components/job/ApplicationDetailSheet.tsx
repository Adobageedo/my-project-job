'use client';

import Link from 'next/link';
import {
  X,
  User,
  Building2,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  FileText,
  MapPin,
  GraduationCap,
  Clock,
  MessageSquare,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LocationHierarchy } from '../shared/LocationTag';

// Flexible application interface that works with both old and new formats
interface ApplicationDetailData {
  id: string;
  applicationDate: string;
  status: string;
  coverLetter?: string | null;
  coverLetterFileUrl?: string | null;
  cvUrl?: string | null;
  offer: {
    id?: string;
    title: string;
    company: {
      name: string;
    };
    location?: string;
    duration?: string;
    contractType?: string;
    salary?: string;
  };
  // Optional candidate data (only for company/admin views)
  candidate?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    school?: string;
    studyLevel?: string;
    specialization?: string;
  };
  // Status history (optional)
  statusHistory?: Array<{
    fromStatus: string;
    toStatus: string;
    changedAt: string;
    changedBy?: string;
    reason?: string;
  }>;
  // Notes (optional)
  notes?: Array<{
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
    isPrivate?: boolean;
  }>;
}

interface ApplicationDetailSheetProps {
  application: ApplicationDetailData;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
  viewMode: 'candidate' | 'company' | 'admin';
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  pending: {
    label: 'En attente',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: <Clock className="h-5 w-5" />,
  },
  in_progress: {
    label: 'En cours d\'examen',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <AlertCircle className="h-5 w-5" />,
  },
  reviewing: {
    label: 'En cours d\'examen',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <AlertCircle className="h-5 w-5" />,
  },
  interview: {
    label: 'Entretien',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: <User className="h-5 w-5" />,
  },
  accepted: {
    label: 'Acceptée',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  rejected: {
    label: 'Refusée',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <XCircle className="h-5 w-5" />,
  },
  withdrawn: {
    label: 'Retirée',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: <XCircle className="h-5 w-5" />,
  },
};

export function ApplicationDetailSheet({
  application,
  isOpen,
  onClose,
  onStatusChange,
  viewMode,
}: ApplicationDetailSheetProps) {
  if (!isOpen) return null;

  const { candidate, offer, status } = application;
  const statusInfo = statusConfig[status] || statusConfig.pending;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Détails de la candidature
            </h2>
            <p className="text-sm text-gray-500">
              Candidature #{application.id.slice(-6).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`px-6 py-3 ${statusInfo.bgColor} flex items-center justify-between`}>
          <div className={`flex items-center gap-2 ${statusInfo.color}`}>
            {statusInfo.icon}
            <span className="font-medium">{statusInfo.label}</span>
          </div>
          <span className="text-sm text-gray-600">
            Postulé le {format(new Date(application.applicationDate), 'dd MMMM yyyy', { locale: fr })}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {
            <div className="space-y-6">
              {/* Candidat - Only show for company/admin views when candidate data exists */}
              {viewMode !== 'candidate' && candidate && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Candidat
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl font-semibold text-blue-600">
                          {(candidate.firstName?.[0] || '?')}{(candidate.lastName?.[0] || '?')}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {candidate.firstName || ''} {candidate.lastName || ''}
                        </h4>
                        {candidate.specialization && (
                          <p className="text-gray-600">{candidate.specialization}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      {candidate.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                            {candidate.email}
                          </a>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">
                            {candidate.phone}
                          </a>
                        </div>
                      )}
                      {candidate.school && (
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span>{candidate.school}</span>
                        </div>
                      )}
                      {candidate.studyLevel && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {candidate.studyLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Offre - Clickable to view offer details */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Offre
                </h3>
                <Link 
                  href={offer.id ? `/candidate/offers/${offer.id}` : '#'}
                  className="block bg-gray-50 rounded-xl p-4 space-y-3 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition">
                        {offer.title}
                      </h4>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Building2 className="h-4 w-4" />
                        <span>{offer.company?.name || 'Entreprise'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 opacity-0 group-hover:opacity-100 transition">
                      <span className="text-sm font-medium">Voir l'offre</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    {offer.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{offer.location}</span>
                      </div>
                    )}
                    {offer.duration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{offer.duration}</span>
                      </div>
                    )}
                    {offer.contractType && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                          {offer.contractType}
                        </span>
                      </div>
                    )}
                    {offer.salary && (
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        {offer.salary}
                      </div>
                    )}
                  </div>
                </Link>
              </section>

              {/* Documents de candidature */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents de candidature
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  {/* CV */}
                  {application.cvUrl ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">CV utilisé</p>
                          <p className="text-sm text-gray-500">Document PDF</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={application.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </a>
                        <a
                          href={application.cvUrl}
                          download
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Download className="h-4 w-4" />
                          Télécharger
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 text-gray-500">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm">Aucun CV attaché à cette candidature</p>
                    </div>
                  )}

                  {/* Lettre de motivation */}
                  {(application.coverLetter || application.coverLetterFileUrl) ? (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Lettre de motivation</p>
                          <p className="text-sm text-gray-500">
                            {application.coverLetter && application.coverLetterFileUrl
                              ? 'Texte + Pièce jointe'
                              : application.coverLetterFileUrl
                              ? 'Pièce jointe'
                              : 'Message personnalisé'}
                          </p>
                        </div>
                      </div>

                      {/* Fichier joint */}
                      {application.coverLetterFileUrl && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Lettre de motivation</p>
                              <p className="text-sm text-gray-500">
                                {application.coverLetterFileUrl.includes('.pdf') ? 'Document PDF' :
                                 application.coverLetterFileUrl.includes('.doc') ? 'Document Word' :
                                 'Pièce jointe'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={application.coverLetterFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition"
                            >
                              <Eye className="h-4 w-4" />
                              Voir
                            </a>
                            <a
                              href={application.coverLetterFileUrl}
                              download
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                              <Download className="h-4 w-4" />
                              Télécharger
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Texte de la lettre */}
                      {application.coverLetter && (
                        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-400">
                          <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                            {application.coverLetter}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 text-gray-500">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm">Aucune lettre de motivation</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Actions (pour entreprise/admin) */}
              {viewMode !== 'candidate' && onStatusChange && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {status !== 'reviewing' && (
                      <button
                        onClick={() => onStatusChange('reviewing')}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Marquer en examen
                      </button>
                    )}
                    {status !== 'accepted' && (
                      <button
                        onClick={() => onStatusChange('accepted')}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accepter
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button
                        onClick={() => onStatusChange('rejected')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Refuser
                      </button>
                    )}
                  </div>
                </section>
              )}
            </div>
          }
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            Fermer
          </button>
          
          <div className="flex items-center gap-3">
            {application.cvUrl && (
              <a
                href={application.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir mon CV
              </a>
            )}
            {offer.id && (
              <Link
                href={`/candidate/offers/${offer.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Voir l'offre
              </Link>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default ApplicationDetailSheet;
