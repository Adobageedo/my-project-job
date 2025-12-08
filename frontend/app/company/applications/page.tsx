'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { 
  getCurrentCompany,
  getApplicationsByStatus,
  updateApplicationStatus,
  Application 
} from '@/services/companyService';
import { Kanban, List, Loader2, User, Calendar, Briefcase } from 'lucide-react';
import Link from 'next/link';

type ApplicationStatusType = 'pending' | 'in_progress' | 'interview' | 'rejected' | 'accepted' | 'withdrawn';

const STATUS_COLUMNS: { key: ApplicationStatusType; label: string; color: string }[] = [
  { key: 'pending', label: 'Nouvelles', color: 'bg-yellow-500' },
  { key: 'in_progress', label: 'En cours', color: 'bg-blue-500' },
  { key: 'interview', label: 'Entretien', color: 'bg-purple-500' },
  { key: 'accepted', label: 'Acceptées', color: 'bg-green-500' },
  { key: 'rejected', label: 'Refusées', color: 'bg-red-500' },
];

export default function CompanyApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, accepted: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const company = await getCurrentCompany();
        if (!company) {
          router.push('/login-company');
          return;
        }

        const appsByStatus = await getApplicationsByStatus(company.id);
        setApplications(appsByStatus);

        // Calculate stats
        const allApps = Object.values(appsByStatus).flat();
        setStats({
          total: allApps.length,
          pending: appsByStatus.pending?.length || 0,
          inProgress: appsByStatus.in_progress?.length || 0,
          accepted: appsByStatus.accepted?.length || 0,
        });
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatusType) => {
    const result = await updateApplicationStatus(applicationId, newStatus);
    if (result.success) {
      // Reload applications
      const company = await getCurrentCompany();
      if (company) {
        const appsByStatus = await getApplicationsByStatus(company.id);
        setApplications(appsByStatus);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <NavBar role="company" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar role="company" />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-slate-900">Suivi des candidatures</h1>
                <p className="text-slate-600 mt-2">
                  Gérez vos candidatures avec le tableau Kanban
                </p>
              </div>

              {/* Toggle view mode */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                    ${viewMode === 'kanban'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  <Kanban className="w-4 h-4" />
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                    ${viewMode === 'list'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  <List className="w-4 h-4" />
                  Liste
                </button>
              </div>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Total candidatures</p>
              <p className="text-3xl font-light text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Nouvelles</p>
              <p className="text-3xl font-light text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">En cours</p>
              <p className="text-3xl font-light text-blue-600 mt-2">{stats.inProgress}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Acceptées</p>
              <p className="text-3xl font-light text-green-600 mt-2">{stats.accepted}</p>
            </div>
          </div>

          {/* Kanban View */}
          {viewMode === 'kanban' ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 overflow-x-auto">
              <div className="flex gap-4 min-w-max">
                {STATUS_COLUMNS.map((column) => (
                  <div key={column.key} className="w-72 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <h3 className="font-medium text-slate-900">{column.label}</h3>
                      <span className="text-sm text-slate-500">
                        ({applications[column.key]?.length || 0})
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(applications[column.key] || []).map((app) => (
                        <div
                          key={app.id}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {app.candidate?.first_name} {app.candidate?.last_name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {app.candidate?.headline || app.candidate?.specialization || '-'}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 flex items-center gap-1 mb-2">
                            <Briefcase className="w-4 h-4" />
                            {app.job_offer?.title || '-'}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(app.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))}
                      {(applications[column.key]?.length || 0) === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">
                          Aucune candidature
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Candidat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Offre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.values(applications).flat().map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {app.candidate?.first_name} {app.candidate?.last_name}
                        </div>
                        <div className="text-sm text-slate-500">{app.candidate?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {app.job_offer?.title || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(app.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatusType)}
                          className="text-sm border border-slate-300 rounded px-2 py-1"
                        >
                          {STATUS_COLUMNS.map((col) => (
                            <option key={col.key} value={col.key}>{col.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/company/applications/${app.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Voir détails
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
