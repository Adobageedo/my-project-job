'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { RecruitCRMSync } from '@/types';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Database, Settings, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Données mockées pour les synchronisations
const mockSyncData: RecruitCRMSync[] = [
  {
    id: '1',
    entityType: 'candidate',
    entityId: 'cand-001',
    recruitCRMId: 'recruit-cand-123',
    lastSyncedAt: '2024-12-03T14:00:00Z',
    status: 'synced',
  },
  {
    id: '2',
    entityType: 'company',
    entityId: 'comp-001',
    recruitCRMId: 'recruit-comp-456',
    lastSyncedAt: '2024-12-03T13:30:00Z',
    status: 'synced',
  },
  {
    id: '3',
    entityType: 'offer',
    entityId: 'offer-001',
    recruitCRMId: 'recruit-job-789',
    lastSyncedAt: '2024-12-03T12:00:00Z',
    status: 'pending',
  },
  {
    id: '4',
    entityType: 'application',
    entityId: 'app-001',
    recruitCRMId: '',
    lastSyncedAt: '2024-12-03T11:00:00Z',
    status: 'error',
    errorMessage: 'API timeout - réessayer',
  },
];

interface SyncStats {
  totalSynced: number;
  pending: number;
  errors: number;
  lastSync: string;
}

export default function RecruitCRMSyncPage() {
  const [syncData, setSyncData] = useState<RecruitCRMSync[]>(mockSyncData);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState<'all' | 'candidate' | 'company' | 'offer' | 'application'>('all');

  const stats: SyncStats = {
    totalSynced: syncData.filter(s => s.status === 'synced').length,
    pending: syncData.filter(s => s.status === 'pending').length,
    errors: syncData.filter(s => s.status === 'error').length,
    lastSync: syncData.length > 0 ? syncData[0].lastSyncedAt : new Date().toISOString(),
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulation de synchronisation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mettre à jour les données
    setSyncData(prev => prev.map(item => ({
      ...item,
      status: item.status === 'error' ? 'synced' : item.status,
      lastSyncedAt: new Date().toISOString(),
      errorMessage: undefined,
    })));
    
    setIsSyncing(false);
  };

  const getEntityLabel = (type: string): string => {
    const labels: Record<string, string> = {
      candidate: 'Candidat',
      company: 'Entreprise',
      offer: 'Offre',
      application: 'Candidature',
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      synced: 'Synchronisé',
      pending: 'En attente',
      error: 'Erreur',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      synced: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-slate-900">Synchronisation RecruiteCRM</h1>
                <p className="text-slate-600 mt-2">
                  Gérez la synchronisation bidirectionnelle avec votre CRM
                </p>
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`
                  flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg transition
                  ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}
                `}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Synchronisés</p>
                  <p className="text-2xl font-light text-slate-900">{stats.totalSynced}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">En attente</p>
                  <p className="text-2xl font-light text-slate-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Erreurs</p>
                  <p className="text-2xl font-light text-slate-900">{stats.errors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Dernière sync</p>
                  <p className="text-sm font-medium text-slate-900">
                    {format(new Date(stats.lastSync), 'HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type d'entité à synchroniser
                </label>
                <select
                  value={syncType}
                  onChange={(e) => setSyncType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les entités</option>
                  <option value="candidate">Candidats uniquement</option>
                  <option value="company">Entreprises uniquement</option>
                  <option value="offer">Offres uniquement</option>
                  <option value="application">Candidatures uniquement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fréquence de synchronisation
                </label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Temps réel</option>
                  <option>Toutes les 15 minutes</option>
                  <option>Toutes les heures</option>
                  <option>Quotidienne</option>
                </select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Connexion active</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Backend API Railway connecté à RecruiteCRM. Synchronisation bidirectionnelle activée.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table de synchronisation */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Historique des synchronisations</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Type d'entité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      ID Plateforme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      ID RecruiteCRM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Dernière sync
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {syncData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {getEntityLabel(item.entityType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                        {item.entityId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                        {item.recruitCRMId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {format(new Date(item.lastSyncedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.status === 'error' ? (
                          <button
                            onClick={() => {
                              // Réessayer la synchronisation
                              console.log('Retry sync for', item.id);
                            }}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Réessayer
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
