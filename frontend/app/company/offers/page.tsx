'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/shared/Badge';
import { jobOffers, applications } from '@/data';
import { JobOffer, Application } from '@/types';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  MoreVertical,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ViewMode = 'grid' | 'list';
type OfferFilter = 'all' | 'active' | 'filled' | 'expired';

export default function CompanyOffersPage() {
  const companyId = 'comp-1'; // Mock
  
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OfferFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les offres de l'entreprise
    const companyOffers = jobOffers.filter(o => o.companyId === companyId);
    setOffers(companyOffers);
    setLoading(false);
  }, []);

  // Obtenir les candidatures par offre
  const getOfferApplications = (offerId: string) => {
    return applications.filter(a => a.offerId === offerId);
  };

  // Filtrer les offres
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = searchTerm === '' ||
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: offers.length,
    active: offers.filter(o => o.status === 'active').length,
    filled: offers.filter(o => o.status === 'filled').length,
    expired: offers.filter(o => o.status === 'expired').length,
    totalApplications: offers.reduce((acc, o) => acc + getOfferApplications(o.id).length, 0),
  };

  const getStatusBadge = (status: JobOffer['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Active</span>;
      case 'filled':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><Users className="h-3 w-3" /> Pourvue</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Expirée</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="company" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Mes offres</h1>
              <p className="text-gray-600">
                Gérez vos offres de stage et d'alternance
              </p>
            </div>
            <Link
              href="/company/offers/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle offre
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-gray-600 text-sm">Total</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-gray-600 text-sm">Actives</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.filled}</div>
              <div className="text-gray-600 text-sm">Pourvues</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-500">{stats.expired}</div>
              <div className="text-gray-600 text-sm">Expirées</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{stats.totalApplications}</div>
              <div className="text-gray-600 text-sm">Candidatures</div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une offre..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Filtres par statut */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {(['all', 'active', 'filled', 'expired'] as OfferFilter[]).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        statusFilter === filter
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filter === 'all' ? 'Toutes' : filter === 'active' ? 'Actives' : filter === 'filled' ? 'Pourvues' : 'Expirées'}
                    </button>
                  ))}
                </div>

                {/* Toggle vue */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des offres */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : filteredOffers.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOffers.map(offer => {
                  const offerApps = getOfferApplications(offer.id);
                  const pendingCount = offerApps.filter(a => a.status === 'pending').length;

                  return (
                    <div
                      key={offer.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{offer.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {offer.location}
                            </div>
                          </div>
                          {getStatusBadge(offer.status)}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Briefcase className="h-4 w-4" />
                            <span className="capitalize">{offer.contractType}</span>
                            <span>•</span>
                            <span>{offer.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            Début: {format(new Date(offer.startDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </div>

                        {/* Candidatures */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {offerApps.length} candidature{offerApps.length > 1 ? 's' : ''}
                            </span>
                            {pendingCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                {pendingCount} nouvelle{pendingCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <Link
                          href={`/company/offers/${offer.id}/applications`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          Voir les candidatures
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                            <Edit3 className="h-4 w-4 text-gray-500" />
                          </button>
                          <button className="p-2 hover:bg-red-100 rounded-lg transition">
                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidatures</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOffers.map(offer => {
                      const offerApps = getOfferApplications(offer.id);
                      const pendingCount = offerApps.filter(a => a.status === 'pending').length;

                      return (
                        <tr key={offer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{offer.title}</div>
                            <div className="text-sm text-gray-500">{offer.duration}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{offer.location}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                              {offer.contractType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-medium">{offerApps.length}</span>
                              {pendingCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                  +{pendingCount}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(offer.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/company/offers/${offer.id}/applications`}
                                className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
                                title="Voir les candidatures"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <Edit3 className="h-4 w-4 text-gray-500" />
                              </button>
                              <button className="p-2 hover:bg-red-100 rounded-lg transition">
                                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune offre trouvée</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune offre ne correspond à vos critères'
                  : 'Commencez par créer votre première offre'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link
                  href="/company/offers/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Créer une offre
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
