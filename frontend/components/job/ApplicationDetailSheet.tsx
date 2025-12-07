'use client';

import { useState } from 'react';
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
  ChevronRight,
  Download,
  ExternalLink,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
} from 'lucide-react';
import { Application, ApplicationStatus, ApplicationNote } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LocationHierarchy } from '../shared/LocationTag';

interface ApplicationDetailSheetProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: ApplicationStatus) => void;
  onAddNote?: (note: string) => void;
  viewMode: 'candidate' | 'company' | 'admin';
}

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  pending: {
    label: 'En attente',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: <Clock className="h-5 w-5" />,
  },
  reviewing: {
    label: 'En cours d\'examen',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <AlertCircle className="h-5 w-5" />,
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
};

export function ApplicationDetailSheet({
  application,
  isOpen,
  onClose,
  onStatusChange,
  onAddNote,
  viewMode,
}: ApplicationDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'notes'>('details');
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  if (!isOpen) return null;

  const { candidate, offer, status } = application;
  const statusInfo = statusConfig[status];

  const handleAddNote = async () => {
    if (!newNote.trim() || !onAddNote) return;
    
    setIsSubmittingNote(true);
    try {
      await onAddNote(newNote);
      setNewNote('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Détails', icon: <FileText className="h-4 w-4" /> },
    { id: 'history', label: 'Historique', icon: <History className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
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

        {/* Tabs */}
        <div className="flex border-b px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Candidat */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Candidat
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-semibold text-blue-600">
                        {candidate.firstName[0]}{candidate.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </h4>
                      <p className="text-gray-600">{candidate.specialization}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                        {candidate.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">
                        {candidate.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span>{candidate.school}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {candidate.studyLevel}
                      </span>
                    </div>
                  </div>

                  {/* CV */}
                  {application.cvUrl && (
                    <div className="pt-3 border-t">
                      <a
                        href={application.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Voir le CV</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Offre */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Offre
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{offer.title}</h4>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Building2 className="h-4 w-4" />
                      <span>{offer.company.name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{offer.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{offer.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                        {offer.contractType}
                      </span>
                    </div>
                    {offer.salary && (
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        {offer.salary}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Lettre de motivation */}
              {application.coverLetter && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Lettre de motivation
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {application.coverLetter}
                    </p>
                  </div>
                </section>
              )}

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
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Historique des changements
              </h3>
              
              {application.statusHistory && application.statusHistory.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  
                  {application.statusHistory.map((change, index) => (
                    <div key={change.id} className="relative pl-10 pb-6">
                      <div className={`
                        absolute left-2 w-5 h-5 rounded-full border-2 border-white
                        ${statusConfig[change.toStatus].bgColor}
                      `} />
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${statusConfig[change.toStatus].color}`}>
                            {statusConfig[change.toStatus].label}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            depuis {statusConfig[change.fromStatus].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Par {change.changedBy} • {format(new Date(change.changedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                        {change.reason && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            "{change.reason}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun changement de statut enregistré</p>
                </div>
              )}

              {/* Création initiale */}
              <div className="relative pl-10">
                <div className="absolute left-2 w-5 h-5 rounded-full bg-gray-200 border-2 border-white" />
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-700">Candidature créée</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(application.applicationDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Ajouter une note */}
              {viewMode !== 'candidate' && onAddNote && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Ajouter une note interne..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isSubmittingNote}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Ajouter
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des notes */}
              {application.notes && application.notes.length > 0 ? (
                <div className="space-y-3">
                  {application.notes.map(note => (
                    <div key={note.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{note.authorName}</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(note.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                      {note.isPrivate && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          Note privée
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune note pour cette candidature</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            Fermer
          </button>
          
          {viewMode === 'candidate' && application.cvUrl && (
            <a
              href={application.cvUrl}
              download
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger mon CV
            </a>
          )}
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
