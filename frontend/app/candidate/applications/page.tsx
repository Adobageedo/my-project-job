// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { useCandidate } from '@/contexts/AuthContext';
import Modal from '@/components/shared/Modal';
import { ApplicationDetailSheet } from '@/components/job/ApplicationDetailSheet';
import { applications as mockApplications } from '@/data/index';
import { withdrawApplication as deleteApplication } from '@/services/candidateService';
import { Application, ApplicationStatus } from '@/types';
import { 
  Calendar, 
  Building2, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Eye,
  MapPin,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig: Record<ApplicationStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  reviewing: { label: 'En examen', color: 'text-blue-700', bg: 'bg-blue-100', icon: AlertCircle },
  accepted: { label: 'Acceptée', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  rejected: { label: 'Refusée', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

export default function CandidateApplicationsPage() {
  const { candidate } = useCandidate();
  const candidateId = candidate?.id;
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // État pour la suppression
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (candidateId) {
      loadApplications();
    }
  }, [candidateId]);

  const loadApplications = async () => {
    if (!candidateId) return;
    
    try {
      setApplications(mockApplications.filter((app: Application) => app.candidateId === candidateId));
    } catch (error) {
      console.error(error);
    }
  };

  // Appliquer les filtres
  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      app.offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.offer.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Fonction de suppression
  const handleDeleteApplication = async () => {
    if (!applicationToDelete || !candidateId) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await deleteApplication(applicationToDelete.id, candidateId);
      setApplications(prev => prev.filter(app => app.id !== applicationToDelete.id));
      setShowDeleteModal(false);
      setApplicationToDelete(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter((app) => app.status === 'pending').length,
    reviewing: applications.filter((app) => app.status === 'reviewing').length,
    accepted: applications.filter((app) => app.status === 'accepted').length,
    rejected: applications.filter((app) => app.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Mes candidatures</h1>
            <p className="text-gray-600">
              Suivez l'état d'avancement de vos candidatures
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <button
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-xl transition ${
                statusFilter === 'all' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-white shadow-sm border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className={`text-sm ${statusFilter === 'all' ? 'text-gray-300' : 'text-gray-600'}`}>Total</div>
            </button>
            
            <button
              onClick={() => setStatusFilter('pending')}
              className={`p-4 rounded-xl transition ${
                statusFilter === 'pending' 
                  ? 'bg-amber-500 text-white shadow-lg' 
                  : 'bg-amber-50 border border-amber-200 hover:border-amber-300'
              }`}
            >
              <div className={`text-2xl font-bold ${statusFilter === 'pending' ? 'text-white' : 'text-amber-700'}`}>
                {stats.pending}
              </div>
              <div className={`text-sm ${statusFilter === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>En attente</div>
            </button>
            
            <button
              onClick={() => setStatusFilter('reviewing')}
              className={`p-4 rounded-xl transition ${
                statusFilter === 'reviewing' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-blue-50 border border-blue-200 hover:border-blue-300'
              }`}
            >
              <div className={`text-2xl font-bold ${statusFilter === 'reviewing' ? 'text-white' : 'text-blue-700'}`}>
                {stats.reviewing}
              </div>
              <div className={`text-sm ${statusFilter === 'reviewing' ? 'text-blue-100' : 'text-blue-700'}`}>En examen</div>
            </button>
            
            <button
              onClick={() => setStatusFilter('accepted')}
              className={`p-4 rounded-xl transition ${
                statusFilter === 'accepted' 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'bg-green-50 border border-green-200 hover:border-green-300'
              }`}
            >
              <div className={`text-2xl font-bold ${statusFilter === 'accepted' ? 'text-white' : 'text-green-700'}`}>
                {stats.accepted}
              </div>
              <div className={`text-sm ${statusFilter === 'accepted' ? 'text-green-100' : 'text-green-700'}`}>Acceptées</div>
            </button>
            
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`p-4 rounded-xl transition ${
                statusFilter === 'rejected' 
                  ? 'bg-red-500 text-white shadow-lg' 
                  : 'bg-red-50 border border-red-200 hover:border-red-300'
              }`}
            >
              <div className={`text-2xl font-bold ${statusFilter === 'rejected' ? 'text-white' : 'text-red-700'}`}>
                {stats.rejected}
              </div>
              <div className={`text-sm ${statusFilter === 'rejected' ? 'text-red-100' : 'text-red-700'}`}>Refusées</div>
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par offre ou entreprise..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Applications List */}
          {filteredApplications.length > 0 ? (
            <div className="space-y-4">
              {filteredApplications.map((application) => {
                const StatusIcon = statusConfig[application.status].icon;
                return (
                  <div
                    key={application.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
                    onClick={() => {
                      setSelectedApplication(application);
                      setShowDetail(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.offer.title}
                          </h3>
                          <span className={`
                            inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                            ${statusConfig[application.status].bg} ${statusConfig[application.status].color}
                          `}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[application.status].label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <Building2 className="h-4 w-4" />
                          <span>{application.offer.company.name}</span>
                          <span className="text-gray-300">•</span>
                          <MapPin className="h-4 w-4" />
                          <span>{application.offer.location}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Postulé le {format(new Date(application.applicationDate), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs capitalize">
                            {application.offer.contractType}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {application.offer.duration}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bouton supprimer (uniquement pour les candidatures en attente) */}
                        {application.status === 'pending' && (
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition text-gray-400 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setApplicationToDelete(application);
                              setShowDeleteModal(true);
                            }}
                            title="Retirer ma candidature"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplication(application);
                            setShowDetail(true);
                          }}
                        >
                          <Eye className="h-5 w-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : applications.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun résultat
              </h3>
              <p className="text-gray-600 mb-4">
                Aucune candidature ne correspond à vos critères de recherche
              </p>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Aucune candidature pour le moment
              </h3>
              <p className="text-gray-600 mb-6">
                Consultez nos offres et postulez à celles qui vous intéressent
              </p>
              <a
                href="/candidate/offers"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Découvrir les offres
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Sheet */}
      {selectedApplication && (
        <ApplicationDetailSheet
          application={selectedApplication}
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedApplication(null);
          }}
          viewMode="candidate"
        />
      )}

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setApplicationToDelete(null);
          setDeleteError(null);
        }}
        title="Retirer ma candidature"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">Êtes-vous sûr de vouloir retirer cette candidature ?</p>
              <p className="text-amber-700 text-sm mt-1">
                Cette action est irréversible. Vous devrez postuler à nouveau si vous changez d'avis.
              </p>
            </div>
          </div>

          {applicationToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">{applicationToDelete.offer.title}</h4>
              <p className="text-gray-600 text-sm">{applicationToDelete.offer.company.name}</p>
              <p className="text-gray-500 text-xs mt-1">
                Postulé le {format(new Date(applicationToDelete.applicationDate), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}

          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {deleteError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setApplicationToDelete(null);
                setDeleteError(null);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteApplication}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Retirer ma candidature
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
