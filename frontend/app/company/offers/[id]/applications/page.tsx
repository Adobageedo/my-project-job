'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { getCurrentCompany, updateApplicationStatus } from '@/services/companyService';
import { getOfferById, getOfferApplications, JobOffer, OfferApplication } from '@/services/offerService';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Mail, 
  FileText, 
  LayoutGrid, 
  List, 
  X, 
  MapPin,
  Briefcase,
  Eye,
  ChevronRight,
  Info,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ApplicationStatus = 'pending' | 'in_progress' | 'interview' | 'rejected' | 'accepted' | 'withdrawn';
type ViewMode = 'kanban' | 'list';

const STATUS_COLUMNS: { key: ApplicationStatus; label: string; color: string; bgLight: string }[] = [
  { key: 'pending', label: 'Nouvelles', color: 'bg-amber-500', bgLight: 'bg-amber-50' },
  { key: 'in_progress', label: 'En cours', color: 'bg-blue-500', bgLight: 'bg-blue-50' },
  { key: 'interview', label: 'Entretien', color: 'bg-purple-500', bgLight: 'bg-purple-50' },
  { key: 'accepted', label: 'Acceptées', color: 'bg-green-500', bgLight: 'bg-green-50' },
  { key: 'rejected', label: 'Refusées', color: 'bg-red-500', bgLight: 'bg-red-50' },
];

export default function OfferApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [applications, setApplications] = useState<OfferApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<OfferApplication | null>(null);
  const [draggedApplications, setDraggedApplications] = useState<string[]>([]);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

  const loadApplications = async () => {
    const { applications: apps } = await getOfferApplications(offerId);
    setApplications(apps);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const company = await getCurrentCompany();
        if (!company) {
          router.push('/login-company');
          return;
        }

        const offerData = await getOfferById(offerId);
        if (!offerData || offerData.company_id !== company.id) {
          router.push('/company/offers');
          return;
        }

        setOffer(offerData);
        await loadApplications();
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/company/offers');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [offerId, router]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    const result = await updateApplicationStatus(applicationId, newStatus);
    if (result.success) {
      await loadApplications();
    }
  };

  const handleBulkStatusChange = async (newStatus: ApplicationStatus) => {
    const promises = Array.from(selectedApplications).map(id => 
      updateApplicationStatus(id, newStatus)
    );
    await Promise.all(promises);
    setSelectedApplications(new Set());
    await loadApplications();
  };

  const toggleSelectApplication = (appId: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApplications(newSelected);
  };

  const selectAllInColumn = (status: ApplicationStatus) => {
    const appsInColumn = applications.filter(app => app.status === status);
    const newSelected = new Set(selectedApplications);
    appsInColumn.forEach(app => newSelected.add(app.id));
    setSelectedApplications(newSelected);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    if (selectedApplications.has(appId)) {
      setDraggedApplications(Array.from(selectedApplications));
    } else {
      setDraggedApplications([appId]);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedApplications.length > 0) {
      const promises = draggedApplications.map(id => 
        updateApplicationStatus(id, newStatus)
      );
      await Promise.all(promises);
      setDraggedApplications([]);
      setSelectedApplications(new Set());
      await loadApplications();
    }
  };

  // Group applications by status
  const applicationsByStatus = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.key] = applications.filter(app => app.status === col.key);
    return acc;
  }, {} as Record<ApplicationStatus, OfferApplication[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Offre non trouvée</h2>
            <Link href="/company/offers" className="text-blue-600 hover:text-blue-700">
              Retour aux offres
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusBadge = (status: ApplicationStatus) => {
    const config = STATUS_COLUMNS.find(c => c.key === status);
    if (!config) return null;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgLight} text-gray-700`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <NavBar role="company" />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-full mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/company/offers"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux offres
              </Link>
              
              <div className="flex items-center gap-3">
                {/* View toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 rounded-md transition ${
                      viewMode === 'kanban' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Vue Kanban"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Vue Liste"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Show offer details button */}
                <button
                  onClick={() => setShowOfferDetails(!showOfferDetails)}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    showOfferDetails 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Info className="h-4 w-4" />
                  Détails de l'offre
                </button>
              </div>
            </div>

            {/* Offer title and info */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {offer.location_city || 'Non précisé'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="capitalize">{offer.contract_type}</span>
                  </span>
                  {offer.manager_email && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Mail className="h-4 w-4" />
                      {offer.manager_email}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{applications.length}</div>
                <div className="text-sm text-gray-500">candidature{applications.length > 1 ? 's' : ''}</div>
              </div>
            </div>

            {/* Selection toolbar */}
            {selectedApplications.size > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  {selectedApplications.size} candidature{selectedApplications.size > 1 ? 's' : ''} sélectionnée{selectedApplications.size > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Déplacer vers :</span>
                  {STATUS_COLUMNS.filter(c => c.key !== 'withdrawn').map(col => (
                    <button
                      key={col.key}
                      onClick={() => handleBulkStatusChange(col.key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${col.bgLight} hover:opacity-80 transition`}
                    >
                      {col.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedApplications(new Set())}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Applications area */}
          <div className={`flex-1 overflow-auto p-6 ${showOfferDetails ? 'pr-3' : ''}`}>
            {viewMode === 'kanban' ? (
              /* Kanban View */
              <div className="flex gap-4 h-full min-w-max pb-4">
                {STATUS_COLUMNS.filter(c => c.key !== 'withdrawn').map((column) => (
                  <div 
                    key={column.key} 
                    className="w-80 flex-shrink-0 flex flex-col"
                    onDragOver={(e) => handleDragOver(e, column.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.key)}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                        <h3 className="font-semibold text-gray-900">{column.label}</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {applicationsByStatus[column.key]?.length || 0}
                        </span>
                      </div>
                      {(applicationsByStatus[column.key]?.length || 0) > 0 && (
                        <button
                          onClick={() => selectAllInColumn(column.key)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Tout sélectionner
                        </button>
                      )}
                    </div>
                    <div 
                      className={`flex-1 space-y-3 rounded-xl p-3 transition-colors min-h-[300px] ${
                        dragOverColumn === column.key 
                          ? 'bg-blue-100 border-2 border-dashed border-blue-400' 
                          : 'bg-gray-50'
                      }`}
                    >
                      {(applicationsByStatus[column.key] || []).map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onClick={() => setSelectedApplication(app)}
                          className={`bg-white border rounded-xl p-4 hover:shadow-md transition cursor-grab active:cursor-grabbing ${
                            selectedApplications.has(app.id) 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedApplications.has(app.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelectApplication(app.id);
                              }}
                              className="mt-1 h-4 w-4 text-blue-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {app.candidate?.first_name?.[0]}{app.candidate?.last_name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {app.candidate?.first_name} {app.candidate?.last_name}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 truncate mb-2">
                                {app.candidate?.headline || app.candidate?.specialization || '-'}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(app.created_at), 'dd MMM', { locale: fr })}
                                </span>
                                <div className="flex items-center gap-1">
                                  {app.cv_url && (
                                    <a 
                                      href={app.cv_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                                      title="Voir le CV"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </a>
                                  )}
                                  {app.candidate?.email && (
                                    <a 
                                      href={`mailto:${app.candidate.email}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                                      title="Envoyer un email"
                                    >
                                      <Mail className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(applicationsByStatus[column.key]?.length || 0) === 0 && (
                        <div className="text-sm text-gray-400 text-center py-12">
                          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Aucune candidature
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectedApplications.size === applications.length && applications.length > 0}
                          onChange={() => {
                            if (selectedApplications.size === applications.length) {
                              setSelectedApplications(new Set());
                            } else {
                              setSelectedApplications(new Set(applications.map(a => a.id)));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">École / Formation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr 
                        key={app.id} 
                        onClick={() => setSelectedApplication(app)}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedApplications.has(app.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedApplications.has(app.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectApplication(app.id);
                            }}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {app.candidate?.first_name?.[0]}{app.candidate?.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {app.candidate?.first_name} {app.candidate?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{app.candidate?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {app.candidate?.specialization || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(app.created_at), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={app.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(app.id, e.target.value as ApplicationStatus);
                            }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                          >
                            {STATUS_COLUMNS.filter(c => c.key !== 'withdrawn').map((col) => (
                              <option key={col.key} value={col.key}>{col.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {app.cv_url && (
                              <a 
                                href={app.cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
                                title="Voir le CV"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            )}
                            {app.candidate?.email && (
                              <a 
                                href={`mailto:${app.candidate.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
                                title="Envoyer un email"
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {applications.length === 0 && (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Aucune candidature pour cette offre</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Offer Details Panel */}
          {showOfferDetails && (
            <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Détails de l'offre</h3>
                  <button
                    onClick={() => setShowOfferDetails(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Titre</h4>
                    <p className="text-gray-900">{offer.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Type</h4>
                      <p className="text-gray-900 capitalize">{offer.contract_type}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Durée</h4>
                      <p className="text-gray-900">{offer.duration_months ? `${offer.duration_months} mois` : '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Lieu</h4>
                      <p className="text-gray-900">{offer.location_city || '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Télétravail</h4>
                      <p className="text-gray-900 capitalize">{offer.remote_policy || '-'}</p>
                    </div>
                  </div>

                  {offer.manager_email && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Responsable hiérarchique</h4>
                      <a href={`mailto:${offer.manager_email}`} className="text-blue-600 hover:underline text-sm">
                        {offer.manager_email}
                      </a>
                    </div>
                  )}

                  {(offer.remuneration_min || offer.remuneration_max) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Rémunération</h4>
                      <p className="text-gray-900">
                        {offer.remuneration_min && offer.remuneration_max 
                          ? `${offer.remuneration_min}€ - ${offer.remuneration_max}€/mois`
                          : `${offer.remuneration_min || offer.remuneration_max}€/mois`
                        }
                      </p>
                    </div>
                  )}

                  {offer.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                      <p className="text-gray-700 text-sm whitespace-pre-line">{offer.description}</p>
                    </div>
                  )}

                  {offer.required_skills && offer.required_skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Compétences requises</h4>
                      <div className="flex flex-wrap gap-2">
                        {offer.required_skills.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Link
                      href={`/company/offers/${offerId}`}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      Modifier l'offre
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Application Details Panel */}
          {selectedApplication && !showOfferDetails && (
            <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Détails candidature</h3>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Candidate info */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                      {selectedApplication.candidate?.first_name?.[0]}{selectedApplication.candidate?.last_name?.[0]}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedApplication.candidate?.first_name} {selectedApplication.candidate?.last_name}
                    </h4>
                    <p className="text-gray-500">{selectedApplication.candidate?.headline || selectedApplication.candidate?.specialization || '-'}</p>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-3">
                    {selectedApplication.candidate?.email && (
                      <a 
                        href={`mailto:${selectedApplication.candidate.email}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <Mail className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-700">{selectedApplication.candidate.email}</span>
                      </a>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Statut</h4>
                    <select
                      value={selectedApplication.status}
                      onChange={(e) => handleStatusChange(selectedApplication.id, e.target.value as ApplicationStatus)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-white"
                    >
                      {STATUS_COLUMNS.filter(c => c.key !== 'withdrawn').map((col) => (
                        <option key={col.key} value={col.key}>{col.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Documents</h4>
                    <div className="space-y-2">
                      {selectedApplication.cv_url && (
                        <a
                          href={selectedApplication.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-700 font-medium">CV</span>
                          <Eye className="h-4 w-4 text-blue-500 ml-auto" />
                        </a>
                      )}
                      {selectedApplication.cover_letter && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Lettre de motivation</h5>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{selectedApplication.cover_letter}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application date */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Date de candidature</h4>
                    <p className="text-gray-900">
                      {format(new Date(selectedApplication.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>

                  {/* Education */}
                  {selectedApplication.candidate?.education_level && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Formation</h4>
                      <p className="text-gray-900">{selectedApplication.candidate.education_level}</p>
                      {selectedApplication.candidate.specialization && (
                        <p className="text-sm text-gray-500">{selectedApplication.candidate.specialization}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
