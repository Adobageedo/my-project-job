'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { jobOffers } from '@/data';
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminOffersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'filled' | 'expired'>('all');

  const filteredOffers = jobOffers.filter((offer) => {
    const matchesSearch =
      searchTerm === '' ||
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.company.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'filled':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'expired':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'filled':
        return 'Pourvue';
      case 'expired':
        return 'Expirée';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'filled':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="admin" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion des offres</h1>
            <p className="text-gray-600">
              Modérez et gérez toutes les offres de la plateforme
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-slate-900">{jobOffers.length}</div>
              <div className="text-gray-600 text-sm">Total des offres</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-green-800">
                {jobOffers.filter((o) => o.status === 'active').length}
              </div>
              <div className="text-green-800 text-sm">Offres actives</div>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-blue-800">
                {jobOffers.filter((o) => o.status === 'filled').length}
              </div>
              <div className="text-blue-800 text-sm">Postes pourvus</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-gray-800">
                {jobOffers.filter((o) => o.status === 'expired').length}
              </div>
              <div className="text-gray-800 text-sm">Offres expirées</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rechercher une offre ou une entreprise..."
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actives</option>
                    <option value="filled">Pourvues</option>
                    <option value="expired">Expirées</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Offers Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Offre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Entreprise</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Localisation</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date de publication</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{offer.title}</div>
                        <div className="text-sm text-gray-600">{offer.duration}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{offer.company.name}</div>
                        <div className="text-sm text-gray-600">{offer.company.sector}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {offer.contractType === 'stage' ? 'Stage' : 'Alternance'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{offer.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(offer.postedDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(offer.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              offer.status
                            )}`}
                          >
                            {getStatusLabel(offer.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Count */}
          {filteredOffers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Aucune offre ne correspond à vos critères</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
