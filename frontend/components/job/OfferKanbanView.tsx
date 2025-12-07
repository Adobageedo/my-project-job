'use client';

import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Application, ApplicationStatus, JobOffer, Candidate } from '@/types';
import { 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar, 
  ExternalLink, 
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  FileText,
  MapPin,
  Building2,
  Eye,
  MessageSquare,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration des colonnes Kanban
const KANBAN_COLUMNS: { id: ApplicationStatus; title: string; color: string; icon: any }[] = [
  { id: 'pending', title: 'Nouvelles', color: 'amber', icon: Clock },
  { id: 'reviewing', title: 'En examen', color: 'blue', icon: AlertCircle },
  { id: 'accepted', title: 'Acceptées', color: 'green', icon: CheckCircle },
  { id: 'rejected', title: 'Refusées', color: 'red', icon: XCircle },
];

interface KanbanFilters {
  search: string;
  studyLevel: string;
  school: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  hasCV: 'all' | 'yes' | 'no';
  priority: 'all' | 'high' | 'medium' | 'low';
}

interface OfferKanbanViewProps {
  offer: JobOffer;
  applications: Application[];
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => Promise<void>;
  onViewApplication: (application: Application) => void;
  onAddNote?: (applicationId: string, note: string) => void;
}

export default function OfferKanbanView({
  offer,
  applications,
  onStatusChange,
  onViewApplication,
  onAddNote,
}: OfferKanbanViewProps) {
  const [filters, setFilters] = useState<KanbanFilters>({
    search: '',
    studyLevel: '',
    school: '',
    dateRange: 'all',
    hasCV: 'all',
    priority: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Filtrer les candidatures
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Recherche textuelle
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          app.candidate.firstName.toLowerCase().includes(searchLower) ||
          app.candidate.lastName.toLowerCase().includes(searchLower) ||
          app.candidate.email.toLowerCase().includes(searchLower) ||
          app.candidate.school.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Niveau d'études
      if (filters.studyLevel && app.candidate.studyLevel !== filters.studyLevel) {
        return false;
      }

      // École
      if (filters.school) {
        if (!app.candidate.school.toLowerCase().includes(filters.school.toLowerCase())) {
          return false;
        }
      }

      // Date
      if (filters.dateRange !== 'all') {
        const appDate = new Date(app.applicationDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.dateRange === 'today' && diffDays > 0) return false;
        if (filters.dateRange === 'week' && diffDays > 7) return false;
        if (filters.dateRange === 'month' && diffDays > 30) return false;
      }

      // CV
      if (filters.hasCV === 'yes' && !app.cvUrl) return false;
      if (filters.hasCV === 'no' && app.cvUrl) return false;

      return true;
    });
  }, [applications, filters]);

  // Organiser par colonnes
  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      applications: filteredApplications.filter(app => app.status === col.id),
    }));
  }, [filteredApplications]);

  // Statistiques
  const stats = useMemo(() => ({
    total: applications.length,
    filtered: filteredApplications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }), [applications, filteredApplications]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || source.droppableId === destination.droppableId) {
      return;
    }

    const newStatus = destination.droppableId as ApplicationStatus;
    setIsUpdating(draggableId);

    try {
      await onStatusChange(draggableId, newStatus);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      studyLevel: '',
      school: '',
      dateRange: 'all',
      hasCV: 'all',
      priority: 'all',
    });
  };

  const hasActiveFilters = filters.search || filters.studyLevel || filters.school || 
    filters.dateRange !== 'all' || filters.hasCV !== 'all';

  const getColumnStyles = (color: string) => {
    const styles: Record<string, { bg: string; border: string; header: string }> = {
      amber: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100' },
      green: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100' },
      red: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100' },
    };
    return styles[color] || styles.amber;
  };

  return (
    <div className="space-y-6">
      {/* Header avec infos de l'offre */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {offer.company.name}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {offer.location}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                {offer.contractType}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600 text-sm">candidatures</div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          {KANBAN_COLUMNS.map(col => {
            const count = stats[col.id as keyof typeof stats] as number;
            const Icon = col.icon;
            return (
              <div key={col.id} className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${col.color}-100 text-${col.color}-700`}>
                  <Icon className="h-4 w-4" />
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{col.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Rechercher un candidat..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Toggle filtres avancés */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition ${
              showFilters || hasActiveFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {Object.values(filters).filter(v => v && v !== 'all').length}
              </span>
            )}
          </button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'études</label>
              <select
                value={filters.studyLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, studyLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="L3">Licence 3</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
                <option value="MBA">MBA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">École</label>
              <input
                type="text"
                value={filters.school}
                onChange={(e) => setFilters(prev => ({ ...prev, school: e.target.value }))}
                placeholder="Filtrer par école..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CV</label>
              <select
                value={filters.hasCV}
                onChange={(e) => setFilters(prev => ({ ...prev, hasCV: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="yes">Avec CV</option>
                <option value="no">Sans CV</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="col-span-full">
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}

        {/* Résumé des filtres actifs */}
        {hasActiveFilters && !showFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                Recherche: "{filters.search}"
                <button onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.studyLevel && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {filters.studyLevel}
                <button onClick={() => setFilters(prev => ({ ...prev, studyLevel: '' }))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {filters.dateRange === 'today' ? "Aujourd'hui" : filters.dateRange === 'week' ? 'Cette semaine' : 'Ce mois'}
                <button onClick={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const styles = getColumnStyles(column.color);
            const Icon = column.icon;

            return (
              <div key={column.id} className="flex flex-col">
                {/* Header de colonne */}
                <div className={`px-4 py-3 rounded-t-xl ${styles.header} border ${styles.border} border-b-0`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 text-${column.color}-600`} />
                      <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-sm font-medium bg-${column.color}-200 text-${column.color}-800`}>
                      {column.applications.length}
                    </span>
                  </div>
                </div>

                {/* Zone droppable */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        flex-1 p-3 space-y-3 rounded-b-xl border ${styles.border} min-h-[500px]
                        ${styles.bg}
                        ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                      `}
                    >
                      {column.applications.map((application, index) => (
                        <Draggable
                          key={application.id}
                          draggableId={application.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
                                hover:shadow-md transition-all cursor-grab
                                ${snapshot.isDragging ? 'shadow-xl rotate-2 scale-105' : ''}
                                ${isUpdating === application.id ? 'opacity-50' : ''}
                              `}
                            >
                              {/* Carte candidature */}
                              <div className="p-4">
                                {/* En-tête avec nom et actions */}
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {application.candidate.firstName} {application.candidate.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-600">{application.candidate.school}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewApplication(application);
                                      }}
                                      className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                                      title="Voir le détail"
                                    >
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    </button>
                                  </div>
                                </div>

                                {/* Infos candidat */}
                                <div className="space-y-1.5 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span className="truncate">{application.candidate.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    <span>{application.candidate.studyLevel} - {application.candidate.specialization}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{format(new Date(application.applicationDate), 'dd MMM yyyy', { locale: fr })}</span>
                                  </div>
                                </div>

                                {/* Tags et indicateurs */}
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                      {application.candidate.studyLevel}
                                    </span>
                                    {application.cvUrl && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        CV
                                      </span>
                                    )}
                                  </div>
                                  {application.notes && application.notes.length > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <MessageSquare className="h-3 w-3" />
                                      {application.notes.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {column.applications.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                          <Icon className="h-8 w-8 mb-2 opacity-50" />
                          <span className="text-sm">Aucune candidature</span>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
