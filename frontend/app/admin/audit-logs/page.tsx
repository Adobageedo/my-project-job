'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { AuditLog, AuditLogAction } from '@/types';
import { Download, Search, Filter, Calendar, User, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Données mockées pour les audit logs
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'login',
    userId: 'user-1',
    userName: 'Marie Dubois',
    userEmail: 'marie.dubois@bnpparibas.com',
    userRole: 'company',
    timestamp: '2024-12-03T14:30:00Z',
    details: 'Connexion réussie',
    ipAddress: '192.168.1.100',
  },
  {
    id: '2',
    action: 'offer_created',
    userId: 'user-2',
    userName: 'Sophie Martin',
    userEmail: 'sophie.martin@societegenerale.fr',
    userRole: 'hr',
    timestamp: '2024-12-03T13:15:00Z',
    details: 'Création offre: Stage Analyste Financier',
    ipAddress: '192.168.1.101',
    metadata: { offerId: 'offer-123', offerTitle: 'Stage Analyste Financier' },
  },
  {
    id: '3',
    action: 'application_created',
    userId: 'user-3',
    userName: 'Jean Dupont',
    userEmail: 'jean.dupont@example.com',
    userRole: 'candidate',
    timestamp: '2024-12-03T12:00:00Z',
    details: 'Candidature pour: Stage M&A Junior',
    ipAddress: '192.168.1.102',
  },
  {
    id: '4',
    action: 'user_suspended',
    userId: 'admin-1',
    userName: 'Admin Platform',
    userEmail: 'admin@financestages.fr',
    userRole: 'admin',
    timestamp: '2024-12-03T11:30:00Z',
    details: 'Suspension utilisateur: fake-account@test.com',
    ipAddress: '192.168.1.1',
  },
  {
    id: '5',
    action: 'cv_uploaded',
    userId: 'user-5',
    userName: 'Claire Bernard',
    userEmail: 'claire.bernard@example.com',
    userRole: 'candidate',
    timestamp: '2024-12-03T10:45:00Z',
    details: 'Upload CV: cv_claire_bernard.pdf',
    ipAddress: '192.168.1.103',
  },
  {
    id: '6',
    action: 'export_data',
    userId: 'admin-1',
    userName: 'Admin Platform',
    userEmail: 'admin@financestages.fr',
    userRole: 'admin',
    timestamp: '2024-12-03T09:00:00Z',
    details: 'Export données candidats (CSV)',
    ipAddress: '192.168.1.1',
  },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<AuditLogAction | 'all'>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtrage des logs
  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchRole = filterRole === 'all' || log.userRole === filterRole;

    let matchDate = true;
    if (startDate) {
      matchDate = matchDate && new Date(log.timestamp) >= new Date(startDate);
    }
    if (endDate) {
      matchDate = matchDate && new Date(log.timestamp) <= new Date(endDate);
    }

    return matchSearch && matchAction && matchRole && matchDate;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Action', 'Utilisateur', 'Email', 'Rôle', 'Détails', 'IP'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr }),
      getActionLabel(log.action),
      log.userName,
      log.userEmail,
      getRoleLabel(log.userRole),
      log.details,
      log.ipAddress || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getActionLabel = (action: AuditLogAction): string => {
    const labels: Record<AuditLogAction, string> = {
      login: 'Connexion',
      logout: 'Déconnexion',
      registration: 'Inscription',
      profile_update: 'Mise à jour profil',
      application_created: 'Candidature créée',
      application_status_changed: 'Statut candidature modifié',
      offer_created: 'Offre créée',
      offer_updated: 'Offre modifiée',
      offer_deleted: 'Offre supprimée',
      user_suspended: 'Utilisateur suspendu',
      user_deleted: 'Utilisateur supprimé',
      cv_uploaded: 'CV uploadé',
      export_data: 'Export données',
    };
    return labels[action];
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      candidate: 'Candidat',
      company: 'Entreprise',
      hr: 'RH',
      manager: 'Manager',
      admin: 'Administrateur',
    };
    return labels[role] || role;
  };

  const getActionColor = (action: AuditLogAction): string => {
    const colors: Record<string, string> = {
      login: 'bg-blue-100 text-blue-800',
      logout: 'bg-slate-100 text-slate-800',
      registration: 'bg-green-100 text-green-800',
      profile_update: 'bg-yellow-100 text-yellow-800',
      application_created: 'bg-purple-100 text-purple-800',
      application_status_changed: 'bg-orange-100 text-orange-800',
      offer_created: 'bg-green-100 text-green-800',
      offer_updated: 'bg-yellow-100 text-yellow-800',
      offer_deleted: 'bg-red-100 text-red-800',
      user_suspended: 'bg-red-100 text-red-800',
      user_deleted: 'bg-red-100 text-red-800',
      cv_uploaded: 'bg-blue-100 text-blue-800',
      export_data: 'bg-purple-100 text-purple-800',
    };
    return colors[action] || 'bg-slate-100 text-slate-800';
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
                <h1 className="text-3xl font-light text-slate-900">Audit Logs</h1>
                <p className="text-slate-600 mt-2">
                  Historique complet des actions sur la plateforme
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Recherche */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recherche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom, email, détails..."
                    className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Action
                </label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value as AuditLogAction | 'all')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes</option>
                  <option value="login">Connexion</option>
                  <option value="registration">Inscription</option>
                  <option value="offer_created">Offre créée</option>
                  <option value="application_created">Candidature</option>
                  <option value="user_suspended">Suspension</option>
                  <option value="export_data">Export</option>
                </select>
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rôle
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="candidate">Candidat</option>
                  <option value="company">Entreprise</option>
                  <option value="hr">RH</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Période
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {filteredLogs.length} log{filteredLogs.length > 1 ? 's' : ''} trouvé{filteredLogs.length > 1 ? 's' : ''}
              </p>
              {(searchTerm || filterAction !== 'all' || filterRole !== 'all' || startDate) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterAction('all');
                    setFilterRole('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Date & Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Détails
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{log.userName}</div>
                        <div className="text-xs text-slate-500">{log.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {getRoleLabel(log.userRole)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Aucun log trouvé</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
