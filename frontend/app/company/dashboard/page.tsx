'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/shared/Badge';
import { 
  getCurrentCompany, 
  getCompanyApplications, 
  getCompanyStats,
  Company,
  Application
} from '@/services/companyService';
import { getCompanyOffers, JobOffer } from '@/services/offerService';
import { Briefcase, Users, Eye, Plus, TrendingUp, Loader2 } from 'lucide-react';
import { PendingValidationBanner } from '@/components/company/PendingValidationBanner';

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    totalOffers: 0,
    activeOffers: 0,
    totalApplications: 0,
    pendingReview: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current company
        const companyData = await getCurrentCompany();
        if (!companyData) {
          router.push('/login-company');
          return;
        }
        setCompany(companyData);

        // Load offers, applications and stats in parallel
        const [offersResult, applicationsResult, statsResult] = await Promise.all([
          getCompanyOffers(companyData.id, { limit: 10 }),
          getCompanyApplications(companyData.id, { limit: 5 }),
          getCompanyStats(companyData.id)
        ]);

        setOffers(offersResult.offers);
        setRecentApplications(applicationsResult.applications);
        
        setStats({
          totalOffers: statsResult.offers.total,
          activeOffers: statsResult.offers.byStatus['active'] || 0,
          totalApplications: statsResult.applications.total,
          pendingReview: statsResult.applications.byStatus['pending'] || 0,
        });
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="company" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pending Validation Banner */}
          {company && company.status !== 'active' && (
            <PendingValidationBanner
              companyName={company.name}
              companyStatus={company.status}
              isVerified={company.is_verified}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Entreprise</h1>
              <p className="text-gray-600">
                Gérez vos offres et suivez vos candidatures
              </p>
            </div>
            <Link
              href="/company/offers/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle offre
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <TrendingUp className="h-5 w-5 text-green-500" />
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
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stats.totalApplications}
              </div>
              <div className="text-gray-600 text-sm">Candidatures reçues</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stats.pendingReview}
              </div>
              <div className="text-gray-600 text-sm">À examiner</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-lg shadow-md text-white">
              <div className="flex items-center justify-between mb-4">
                <Briefcase className="h-8 w-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {Math.round((stats.pendingReview / (stats.totalApplications || 1)) * 100)}%
              </div>
              <div className="text-sm opacity-90">Taux de traitement</div>
              <div className="text-xs opacity-75 mt-2">
                {stats.totalApplications - stats.pendingReview} traitées
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  Candidatures récentes
                </h2>
                <Link
                  href="/company/applications"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Voir toutes →
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Candidat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Offre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {application.candidate?.first_name} {application.candidate?.last_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {application.candidate?.headline || application.candidate?.specialization || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {application.job_offer?.title || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(application.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'interview' ? 'bg-purple-100 text-purple-800' :
                          application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {application.status === 'pending' ? 'En attente' :
                           application.status === 'in_progress' ? 'En cours' :
                           application.status === 'interview' ? 'Entretien' :
                           application.status === 'accepted' ? 'Acceptée' :
                           application.status === 'rejected' ? 'Refusée' : application.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/company/applications?id=${application.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Voir profil
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Offers */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  Mes offres actives
                </h2>
                <Link
                  href="/company/offers"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Gérer les offres →
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {offers.filter(o => o.status === 'active').slice(0, 3).map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {offer.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{offer.location_city || 'Non précisé'}</span>
                          <span>•</span>
                          <span>{offer.contract_type === 'stage' ? 'Stage' : 'Alternance'}</span>
                          <span>•</span>
                          <span>
                            {offer.applications_count} candidature
                            {offer.applications_count > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/company/offers/${offer.id}`}
                          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        >
                          Modifier
                        </Link>
                        <Link
                          href={`/company/offers/${offer.id}/applications`}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                        >
                          Candidatures
                        </Link>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
