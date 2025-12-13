'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import {
  Building2,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Globe,
  Linkedin,
  Briefcase,
  Users,
  Crown,
  ExternalLink,
} from 'lucide-react';
import {
  getAllPendingCompanies,
  approveCompany,
  rejectCompany,
  PendingCompany,
} from '@/services/adminCompanyService';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminPendingCompaniesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load pending companies
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companies = await getAllPendingCompanies();
        setPendingCompanies(companies);
      } catch (err) {
        console.error('Error loading pending companies:', err);
        setError('Erreur lors du chargement des entreprises en attente');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadCompanies();
    }
  }, [user]);

  const handleApprove = async (companyId: string, companyName: string) => {
    if (!user) return;
    
    setProcessingId(companyId);
    try {
      const result = await approveCompany(companyId);
      if (result.success) {
        setPendingCompanies(prev => prev.filter(c => c.id !== companyId));
        setSuccessMessage(
          `${companyName} a été approuvée. ${result.offersActivated || 0} offre(s) activée(s).`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(result.error || 'Erreur lors de l\'approbation');
      }
    } catch (err) {
      console.error('Error approving company:', err);
      setError('Erreur lors de l\'approbation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (companyId: string) => {
    if (!user || !rejectionReason.trim()) return;
    
    setProcessingId(companyId);
    try {
      const result = await rejectCompany(companyId, rejectionReason);
      if (result.success) {
        setPendingCompanies(prev => prev.filter(c => c.id !== companyId));
        setRejectModalOpen(null);
        setRejectionReason('');
      } else {
        setError(result.error || 'Erreur lors du rejet');
      }
    } catch (err) {
      console.error('Error rejecting company:', err);
      setError('Erreur lors du rejet');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSizeLabel = (size: string | null) => {
    if (!size) return 'Non précisé';
    const labels: Record<string, string> = {
      '1-50': '1-50 employés',
      '50-250': '50-250 employés',
      '250-1000': '250-1000 employés',
      '1000-5000': '1000-5000 employés',
      '5000-10000': '5000-10000 employés',
      '10000+': '10000+ employés',
    };
    return labels[size] || size;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Entreprises en attente de validation</h1>
            <p className="text-gray-600 mt-2">
              {pendingCompanies.length} entreprise{pendingCompanies.length > 1 ? 's' : ''} en attente de validation
            </p>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-500 hover:text-green-700">
                ×
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          )}

          {/* Pending companies list */}
          {pendingCompanies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Aucune entreprise en attente</h2>
              <p className="text-gray-600 mt-2">Toutes les entreprises ont été traitées.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCompanies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Company header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="w-16 h-16 rounded-xl object-contain bg-gray-50 border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                            <p className="text-gray-600">{company.sector || 'Secteur non précisé'}</p>
                            {company.siret && (
                              <p className="text-gray-500 text-sm">SIRET: {company.siret}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {getSizeLabel(company.size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Inscrite le {formatDate(company.created_at)}
                          </span>
                          {company.pending_offers_count > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Briefcase className="h-4 w-4" />
                              {company.pending_offers_count} offre{company.pending_offers_count > 1 ? 's' : ''} en attente
                            </span>
                          )}
                        </div>

                        {/* Links */}
                        <div className="flex gap-4 mt-3">
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Globe className="h-4 w-4" />
                              Site web
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {company.linkedin_url && (
                            <a
                              href={company.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Linkedin className="h-4 w-4" />
                              LinkedIn
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                          title="Voir les détails"
                        >
                          {expandedCompany === company.id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleApprove(company.id, company.name)}
                          disabled={processingId === company.id}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {processingId === company.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approuver
                        </button>
                        <button
                          onClick={() => setRejectModalOpen(company.id)}
                          disabled={processingId === company.id}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedCompany === company.id && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Description */}
                        {company.description && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">
                              {company.description}
                            </p>
                          </div>
                        )}

                        {/* Creator / Owner */}
                        {company.creator && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Crown className="h-4 w-4 text-amber-500" />
                              Créateur / Propriétaire
                            </h4>
                            <div className="space-y-2">
                              <p className="text-gray-900 font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                {company.creator.first_name || ''} {company.creator.last_name || ''}
                              </p>
                              <a
                                href={`mailto:${company.creator.email}`}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                {company.creator.email}
                              </a>
                              <div className="flex gap-2 mt-2">
                                {company.creator.is_company_owner && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                    Propriétaire
                                  </span>
                                )}
                                {company.creator.is_primary_company_contact && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    Contact principal
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Primary Contact (if different from creator) */}
                        {company.primary_contact && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-500" />
                              Interlocuteur principal
                            </h4>
                            <div className="space-y-2">
                              <p className="text-gray-900 font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                {company.primary_contact.first_name || ''} {company.primary_contact.last_name || ''}
                              </p>
                              <a
                                href={`mailto:${company.primary_contact.email}`}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                {company.primary_contact.email}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Contact info from company */}
                        {(company.contact_name || company.contact_email) && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              Contact entreprise
                            </h4>
                            <div className="space-y-2">
                              {company.contact_name && (
                                <p className="text-gray-900 font-medium flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  {company.contact_name}
                                </p>
                              )}
                              {company.contact_email && (
                                <a
                                  href={`mailto:${company.contact_email}`}
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                                >
                                  <Mail className="h-4 w-4" />
                                  {company.contact_email}
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Reject modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejeter l'entreprise</h3>
            <p className="text-gray-600 mb-4">
              Veuillez indiquer la raison du rejet. Cette information sera envoyée à l'entreprise.
              Toutes les offres en attente seront également annulées.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Raison du rejet..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModalOpen(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReject(rejectModalOpen)}
                disabled={!rejectionReason.trim() || processingId === rejectModalOpen}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {processingId === rejectModalOpen && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
