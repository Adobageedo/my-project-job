'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { GDPRRequest } from '@/types';
import { Shield, FileText, Download, Trash2, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Données mockées pour les demandes RGPD
const mockGDPRRequests: GDPRRequest[] = [
  {
    id: '1',
    userId: 'user-123',
    userEmail: 'jean.dupont@example.com',
    requestType: 'export',
    status: 'pending',
    requestDate: '2024-12-02T10:00:00Z',
  },
  {
    id: '2',
    userId: 'user-456',
    userEmail: 'marie.martin@example.com',
    requestType: 'delete',
    status: 'in_progress',
    requestDate: '2024-12-01T14:30:00Z',
    notes: 'Vérification des candidatures en cours',
  },
  {
    id: '3',
    userId: 'user-789',
    userEmail: 'pierre.bernard@example.com',
    requestType: 'access',
    status: 'completed',
    requestDate: '2024-11-28T09:15:00Z',
    completedDate: '2024-11-29T16:00:00Z',
  },
  {
    id: '4',
    userId: 'user-012',
    userEmail: 'sophie.dubois@example.com',
    requestType: 'modify',
    status: 'completed',
    requestDate: '2024-11-25T11:00:00Z',
    completedDate: '2024-11-26T10:00:00Z',
    notes: 'Mise à jour email et téléphone effectuée',
  },
];

export default function GDPRPage() {
  const [requests, setRequests] = useState<GDPRRequest[]>(mockGDPRRequests);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const handleUpdateStatus = (id: string, newStatus: GDPRRequest['status']) => {
    setRequests(prev => prev.map(req => 
      req.id === id 
        ? { 
            ...req, 
            status: newStatus,
            completedDate: newStatus === 'completed' ? new Date().toISOString() : req.completedDate,
          } 
        : req
    ));
  };

  const getRequestTypeLabel = (type: GDPRRequest['requestType']): string => {
    const labels: Record<GDPRRequest['requestType'], string> = {
      access: 'Droit d\'accès',
      modify: 'Droit de rectification',
      delete: 'Droit à l\'effacement',
      export: 'Export des données',
    };
    return labels[type];
  };

  const getRequestTypeIcon = (type: GDPRRequest['requestType']) => {
    const icons = {
      access: Eye,
      modify: FileText,
      delete: Trash2,
      export: Download,
    };
    const Icon = icons[type];
    return <Icon className="w-4 h-4" />;
  };

  const getStatusLabel = (status: GDPRRequest['status']): string => {
    const labels: Record<GDPRRequest['status'], string> = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminé',
      rejected: 'Rejeté',
    };
    return labels[status];
  };

  const getStatusColor = (status: GDPRRequest['status']): string => {
    const colors: Record<GDPRRequest['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getStatusIcon = (status: GDPRRequest['status']) => {
    const icons = {
      pending: Clock,
      in_progress: Clock,
      completed: CheckCircle,
      rejected: XCircle,
    };
    const Icon = icons[status];
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-slate-700" />
              <div>
                <h1 className="text-3xl font-light text-slate-900">Gestion RGPD</h1>
                <p className="text-slate-600 mt-2">
                  Traitez les demandes d'exercice de droits des utilisateurs
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Total demandes</p>
              <p className="text-3xl font-light text-slate-900 mt-2">{requests.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">En attente</p>
              <p className="text-3xl font-light text-yellow-600 mt-2">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">En cours</p>
              <p className="text-3xl font-light text-blue-600 mt-2">
                {requests.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Terminées</p>
              <p className="text-3xl font-light text-green-600 mt-2">
                {requests.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>

          {/* Info RGPD */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Conformité RGPD - Délais légaux
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Droit d'accès et d'export : réponse sous 1 mois</li>
                  <li>• Droit de rectification : correction sous 1 mois</li>
                  <li>• Droit à l'effacement : traitement sous 1 mois (sauf obligations légales)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">Filtrer par statut:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    filter === 'pending'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  En attente
                </button>
                <button
                  onClick={() => setFilter('in_progress')}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    filter === 'in_progress'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  En cours
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    filter === 'completed'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Terminées
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Type de demande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Date demande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Date traitement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRequestTypeIcon(request.requestType)}
                          <span className="text-sm text-slate-900">
                            {getRequestTypeLabel(request.requestType)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{request.userEmail}</div>
                        <div className="text-xs text-slate-500">ID: {request.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {format(new Date(request.requestDate), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {request.completedDate 
                          ? format(new Date(request.completedDate), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Commencer
                          </button>
                        )}
                        {request.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'completed')}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Marquer terminé
                          </button>
                        )}
                        {request.status === 'completed' && (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Aucune demande trouvée</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
