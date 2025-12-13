'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { 
  Users, 
  Building2, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Home, 
  ShieldCheck,
  Bell,
  FileText,
  CheckCircle,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getPlatformKPIs, PlatformKPIs } from '@/services/kpiService';
import { getPendingCompaniesCount } from '@/services/adminCompanyService';

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [pendingCompaniesCount, setPendingCompaniesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadKPIs = async () => {
    try {
      const [kpiData, pendingCount] = await Promise.all([
        getPlatformKPIs(),
        getPendingCompaniesCount(),
      ]);
      setKpis(kpiData);
      setPendingCompaniesCount(pendingCount);
    } catch (err) {
      console.error('Error loading KPIs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadKPIs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadKPIs();
  };

  const formatChange = (change: number) => {
    if (change > 0) return `+${change}`;
    return change.toString();
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="admin" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="admin" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Administrateur</h1>
              <p className="text-gray-600">
                Vue d'ensemble de la plateforme et indicateurs clés
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {/* Alert for pending companies */}
          {pendingCompaniesCount > 0 && (
            <a
              href="/admin/pending-companies"
              className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 hover:bg-amber-100 transition"
            >
              <ShieldCheck className="h-6 w-6 text-amber-600" />
              <span className="text-amber-800 font-medium">
                {pendingCompaniesCount} entreprise{pendingCompaniesCount > 1 ? 's' : ''} en attente de validation
              </span>
              <ArrowUpRight className="h-5 w-5 text-amber-600 ml-auto" />
            </a>
          )}

          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-blue-600" />
                {kpis && kpis.candidatesRegisteredChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${kpis.candidatesRegisteredChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.candidatesRegisteredChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {formatChange(kpis.candidatesRegisteredChange)}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {kpis?.candidatesRegistered || 0}
              </div>
              <div className="text-gray-600 text-sm">Candidats inscrits</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
                {kpis && kpis.companiesRegisteredChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${kpis.companiesRegisteredChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.companiesRegisteredChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {formatChange(kpis.companiesRegisteredChange)}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {kpis?.companiesRegistered || 0}
              </div>
              <div className="text-gray-600 text-sm">Entreprises inscrites</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
                {kpis && kpis.offersCreatedChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${kpis.offersCreatedChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.offersCreatedChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {formatChange(kpis.offersCreatedChange)}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {kpis?.offersCreated || 0}
              </div>
              <div className="text-gray-600 text-sm">Offres créées</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
                {kpis && kpis.applicationsChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${kpis.applicationsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.applicationsChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {formatChange(kpis.applicationsChange)}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {kpis?.totalApplications || 0}
              </div>
              <div className="text-gray-600 text-sm">Candidatures</div>
            </div>
          </div>

          {/* Activity KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-green-50 p-5 rounded-lg shadow-sm border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 text-sm font-medium">Offres pourvues</span>
              </div>
              <div className="text-2xl font-bold text-green-800">
                {kpis?.offersFilled || 0}
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 text-sm font-medium">Candidats actifs</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {kpis?.activeCandidates || 0}
              </div>
              <div className="text-blue-600 text-xs mt-1">derniers 30 jours</div>
            </div>

            <div className="bg-purple-50 p-5 rounded-lg shadow-sm border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-purple-800 text-sm font-medium">Utilisateurs entreprise actifs</span>
              </div>
              <div className="text-2xl font-bold text-purple-800">
                {kpis?.activeCompanyUsers || 0}
              </div>
              <div className="text-purple-600 text-xs mt-1">derniers 30 jours</div>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg shadow-sm border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-amber-600" />
                <span className="text-amber-800 text-sm font-medium">Entreprises actives</span>
              </div>
              <div className="text-2xl font-bold text-amber-800">
                {kpis?.companiesWithActiveUsers || 0}
              </div>
              <div className="text-amber-600 text-xs mt-1">avec ≥1 utilisateur actif</div>
            </div>

            <div className="bg-indigo-50 p-5 rounded-lg shadow-sm border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <span className="text-indigo-800 text-sm font-medium">Moy. candidatures</span>
              </div>
              <div className="text-2xl font-bold text-indigo-800">
                {kpis?.avgApplicationsPerActiveUser || 0}
              </div>
              <div className="text-indigo-600 text-xs mt-1">par candidat actif</div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
            <a
              href="/admin/pending-companies"
              className="bg-amber-50 border-2 border-amber-200 p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <ShieldCheck className="h-8 w-8 text-amber-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Valider entreprises</h3>
              <p className="text-gray-600 text-sm">
                Approuver les nouvelles entreprises inscrites
              </p>
            </a>

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

            <a
              href="/admin/homepage"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Home className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Page d'accueil</h3>
              <p className="text-gray-600 text-sm">
                Configurer le contenu et les sections de la page d'accueil
              </p>
            </a>

            <a
              href="/admin/notifications"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Bell className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Notifications KPI</h3>
              <p className="text-gray-600 text-sm">
                Configurer les rapports KPI par email
              </p>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
