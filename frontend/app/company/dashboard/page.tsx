'use client';

import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/shared/Badge';
import CandidateCard from '@/components/candidate/CandidateCard';
import { jobOffers, applications, candidates } from '@/data';
import { Briefcase, Users, Eye, Plus, TrendingUp } from 'lucide-react';

export default function CompanyDashboardPage() {
  // Simuler l'entreprise connectée
  const companyId = 'comp-1';
  
  const companyOffers = jobOffers.filter((offer) => offer.companyId === companyId);
  const companyApplications = applications.filter((app) => app.companyId === companyId);
  const recentApplications = companyApplications.slice(0, 5);
  
  const stats = {
    totalOffers: companyOffers.length,
    activeOffers: companyOffers.filter((o) => o.status === 'active').length,
    totalApplications: companyApplications.length,
    pendingReview: companyApplications.filter((a) => a.status === 'reviewing').length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="company" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            {application.candidate.firstName} {application.candidate.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {application.candidate.school}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {application.offer.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(application.applicationDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={application.status} />
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Voir profil
                        </button>
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
                {companyOffers.slice(0, 3).map((offer) => {
                  const offerApplications = companyApplications.filter(
                    (app) => app.offerId === offer.id
                  );

                  return (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {offer.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{offer.location}</span>
                          <span>•</span>
                          <span>{offer.contractType === 'stage' ? 'Stage' : 'Alternance'}</span>
                          <span>•</span>
                          <span>
                            {offerApplications.length} candidature
                            {offerApplications.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition">
                          Modifier
                        </button>
                        <Link
                          href={`/candidate/offers/${offer.id}`}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                        >
                          Voir
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
