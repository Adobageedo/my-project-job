// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Modal from '@/components/shared/Modal';
import { 
  getCompanyById,
  updateCompanyProfile as updateCompany,
  getCompanyWithUsers as getCompanyWithDetails,
  CompanyWithUsers as CompanyWithDetails,
} from '@/services/companyService';
import { supabase } from '@/lib/supabase';

// Placeholder functions for admin-specific operations
const getAllCompanies = async () => {
  const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};
const createCompany = async (data: any) => {
  const { data: company, error } = await supabase.from('companies').insert(data).select().single();
  if (error) throw error;
  return company;
};
const deleteCompany = async (id: string) => {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
};
const updateCompanyStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('companies').update({ status }).eq('id', id);
  if (error) throw error;
};
type CreateCompanyData = any;
import { Company } from '@/types';
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  Briefcase, 
  Mail, 
  Phone,
  Globe,
  MapPin,
  Edit3,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const sizeLabels: Record<Company['size'], string> = {
  startup: 'Startup (< 50)',
  pme: 'PME (50-250)',
  eti: 'ETI (250-5000)',
  grande_entreprise: 'Grande entreprise (> 5000)',
};

const statusConfig = {
  active: { label: 'Active', color: 'green', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'gray', icon: XCircle },
  pending: { label: 'En attente', color: 'amber', icon: Clock },
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Company['status'] | 'all'>('all');
  const [sectorFilter, setSectorFilter] = useState('');
  
  // Modal création/édition
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    sector: '',
    size: 'pme',
    description: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal détails
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Modal suppression
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Erreur chargement entreprises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = searchTerm === '' ||
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    const matchesSector = sectorFilter === '' || company.sector === sectorFilter;
    
    return matchesSearch && matchesStatus && matchesSector;
  });

  const sectors = [...new Set(companies.map(c => c.sector))];

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    inactive: companies.filter(c => c.status === 'inactive').length,
    pending: companies.filter(c => c.status === 'pending').length,
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sector: '',
      size: 'pme',
      description: '',
      website: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'France',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    });
    setEditingCompany(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      sector: company.sector,
      size: company.size,
      description: company.description || '',
      website: company.website || '',
      address: company.address || '',
      city: company.city || '',
      postalCode: company.postalCode || '',
      country: company.country || 'France',
      contactName: company.contactName,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.contactEmail) return;
    
    setIsSaving(true);
    try {
      if (editingCompany) {
        const updated = await updateCompany({ id: editingCompany.id, ...formData });
        setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await createCompany(formData);
        setCompanies(prev => [created, ...prev]);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteCompany(companyToDelete.id);
      setCompanies(prev => prev.filter(c => c.id !== companyToDelete.id));
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (company: Company, newStatus: Company['status']) => {
    try {
      const updated = await updateCompanyStatus(company.id, newStatus);
      setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const viewCompanyDetails = async (company: Company) => {
    try {
      const details = await getCompanyWithDetails(company.id);
      if (details) {
        setSelectedCompany(details);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="admin" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion des entreprises</h1>
              <p className="text-gray-600">
                Gérez les entreprises partenaires et leurs accès
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle entreprise
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-gray-600 text-sm">Total</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-gray-600 text-sm">Actives</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-gray-600 text-sm">En attente</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
              <div className="text-gray-600 text-sm">Inactives</div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une entreprise..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="pending">En attente</option>
                <option value="inactive">Inactives</option>
              </select>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les secteurs</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Liste des entreprises */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCompanies.map(company => {
                    const status = statusConfig[company.status];
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{company.name}</div>
                              <div className="text-sm text-gray-500">{sizeLabels[company.size]}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{company.sector}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-gray-900">{company.contactName}</div>
                            <div className="text-gray-500">{company.contactEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <Briefcase className="h-4 w-4" />
                              {company.offersCount || 0}
                            </span>
                            <span className="flex items-center gap-1 text-gray-600">
                              <Users className="h-4 w-4" />
                              {company.applicationsCount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={company.status}
                            onChange={(e) => handleStatusChange(company, e.target.value as Company['status'])}
                            className={`px-2 py-1 rounded-full text-xs font-medium border-0 bg-${status.color}-100 text-${status.color}-700 focus:ring-2 focus:ring-${status.color}-500`}
                          >
                            <option value="active">Active</option>
                            <option value="pending">En attente</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewCompanyDetails(company)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(company)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit3 className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => {
                                setCompanyToDelete(company);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">Aucune entreprise trouvée</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal création/édition */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteur *</label>
              <input
                type="text"
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taille</label>
              <select
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value as Company['size'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="startup">Startup</option>
                <option value="pme">PME</option>
                <option value="eti">ETI</option>
                <option value="grande_entreprise">Grande entreprise</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium text-gray-900 mb-3">Contact principal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du contact *</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.name || !formData.contactEmail}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : editingCompany ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCompanyToDelete(null);
        }}
        title="Supprimer l'entreprise"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action supprimera également toutes les offres et candidatures associées.
          </p>
          {companyToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">{companyToDelete.name}</div>
              <div className="text-sm text-gray-600">{companyToDelete.sector}</div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setCompanyToDelete(null);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal détails */}
      {selectedCompany && (
        <Modal
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedCompany(null);
          }}
          title={selectedCompany.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Infos générales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Secteur</div>
                <div className="font-medium">{selectedCompany.sector}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Taille</div>
                <div className="font-medium">{sizeLabels[selectedCompany.size]}</div>
              </div>
              {selectedCompany.website && (
                <div>
                  <div className="text-sm text-gray-500">Site web</div>
                  <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {selectedCompany.website}
                  </a>
                </div>
              )}
              {selectedCompany.city && (
                <div>
                  <div className="text-sm text-gray-500">Localisation</div>
                  <div className="font-medium">{selectedCompany.city}</div>
                </div>
              )}
            </div>

            {selectedCompany.description && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <p className="text-gray-700">{selectedCompany.description}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedCompany.stats.totalOffers}</div>
                <div className="text-sm text-gray-600">Offres</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{selectedCompany.stats.activeOffers}</div>
                <div className="text-sm text-gray-600">Actives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{selectedCompany.stats.totalApplications}</div>
                <div className="text-sm text-gray-600">Candidatures</div>
              </div>
            </div>

            {/* Contacts */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Contacts</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{selectedCompany.contactName}</div>
                    <div className="text-sm text-gray-600">{selectedCompany.contactEmail}</div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Principal</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <Footer />
    </div>
  );
}
