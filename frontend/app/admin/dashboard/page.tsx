'use client';

import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { candidates, companies, jobOffers, applications } from '@/data';
import { Users, Building2, Briefcase, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  const stats = {
    totalCandidates: candidates.length,
    totalCompanies: companies.length,
    totalOffers: jobOffers.length,
    activeOffers: jobOffers.filter((o) => o.status === 'active').length,
    filledOffers: jobOffers.filter((o) => o.status === 'filled').length,
    expiredOffers: jobOffers.filter((o) => o.status === 'expired').length,
    totalApplications: applications.length,
  };

  // Activité récente simulée
  const recentActivity = [
    {
      id: '1',
      type: 'registration',
      userName: 'Lucas Dubois',
      userRole: 'candidate' as const,
      timestamp: '2025-01-26T10:30:00',
      details: 'Nouveau candidat inscrit',
    },
    {
      id: '2',
      type: 'offer_created',
      userName: 'BNP Paribas',
      userRole: 'company' as const,
      timestamp: '2025-01-26T09:15:00',
      details: 'Nouvelle offre: Analyste Junior - Finance de Marché',
    },
    {
      id: '3',
      type: 'application',
      userName: 'Emma Martin',
      userRole: 'candidate' as const,
      timestamp: '2025-01-26T08:45:00',
      details: 'Candidature à Analyste M&A chez Rothschild',
    },
    {
      id: '4',
      type: 'registration',
      userName: 'Lazard',
      userRole: 'company' as const,
      timestamp: '2025-01-25T16:20:00',
      details: 'Nouvelle entreprise inscrite',
    },
    {
      id: '5',
      type: 'login',
      userName: 'Hugo Bernard',
      userRole: 'candidate' as const,
      timestamp: '2025-01-25T15:10:00',
      details: 'Connexion candidat',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return '👤';
      case 'offer_created':
        return '📢';
      case 'application':
        return '📝';
      case 'login':
        return '🔑';
      default:
        return '📌';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="admin" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Administrateur</h1>
            <p className="text-gray-600">
              Vue d'ensemble de la plateforme et gestion des utilisateurs
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-blue-600" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stats.totalCandidates}
              </div>
              <div className="text-gray-600 text-sm">Candidats inscrits</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stats.totalCompanies}
              </div>
              <div className="text-gray-600 text-sm">Entreprises</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stats.totalOffers}
              </div>
              <div className="text-gray-600 text-sm">Offres publiées</div>
              <div className="text-green-600 text-xs mt-2">
                {stats.activeOffers} actives
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stats.totalApplications}
              </div>
              <div className="text-gray-600 text-sm">Candidatures</div>
            </div>
          </div>

          {/* Offers Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-green-800 mb-1">
                {stats.activeOffers}
              </div>
              <div className="text-green-800 text-sm">Offres actives</div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-blue-800 mb-1">
                {stats.filledOffers}
              </div>
              <div className="text-blue-800 text-sm">Postes pourvus</div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {stats.expiredOffers}
              </div>
              <div className="text-gray-800 text-sm">Offres expirées</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-slate-900">Activité récente</h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {activity.userName}
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {activity.userRole === 'candidate'
                                ? 'Candidat'
                                : activity.userRole === 'company'
                                ? 'Entreprise'
                                : 'Admin'}
                            </span>
                          </div>
                          <div className="text-gray-600 text-sm mt-1">
                            {activity.details}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(activity.timestamp).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <a
              href="/admin/users"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Users className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Gérer les utilisateurs</h3>
              <p className="text-gray-600 text-sm">
                Consulter et gérer les comptes candidats et entreprises
              </p>
            </a>

            <a
              href="/admin/offers"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Briefcase className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Gérer les offres</h3>
              <p className="text-gray-600 text-sm">
                Modérer et gérer les offres de stage et alternance
              </p>
            </a>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <Activity className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Statistiques avancées</h3>
              <p className="text-gray-600 text-sm">
                Analyser les performances et tendances de la plateforme
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
