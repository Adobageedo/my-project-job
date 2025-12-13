'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import OfferForm, { OfferFormData } from '@/components/job/OfferForm';
import { getCurrentCompany } from '@/services/companyService';
import { getCurrentUser } from '@/services/authService';
import { 
  getOfferById, 
  updateOffer, 
  deleteOffer, 
  publishOffer, 
  pauseOffer,
  closeOffer,
  duplicateOffer,
  getOfferManagers,
  JobOffer,
  JobOfferUpdateData,
  OfferManager
} from '@/services/offerService';
import { InviteManagerModal } from '@/components/company/InviteManagerModal';
import { 
  Loader2, 
  ArrowLeft, 
  Trash2, 
  Copy, 
  Play, 
  Pause, 
  CheckCircle,
  Eye,
  Users,
  MapPin,
  Briefcase,
  UserPlus,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [initialFormData, setInitialFormData] = useState<Partial<OfferFormData> | null>(null);
  const [managers, setManagers] = useState<OfferManager[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const mapEducationDbToUi = (level?: string | null): string[] => {
    switch (level) {
      case 'bac+3':
        return ['L3'];
      case 'bac+4':
        return ['M1'];
      case 'bac+5':
        return ['M2'];
      case 'bac+6':
        return ['MBA'];
      default:
        return [];
    }
  };

  const mapEducationUiToDb = (level: string): string | undefined => {
    switch (level) {
      case 'L3':
        return 'bac+3';
      case 'M1':
        return 'bac+4';
      case 'M2':
        return 'bac+5';
      case 'MBA':
        return 'bac+6';
      default:
        return undefined;
    }
  };

  useEffect(() => {
    const loadOffer = async () => {
      try {
        const [company, user] = await Promise.all([
          getCurrentCompany(),
          getCurrentUser()
        ]);
        if (!company) {
          router.push('/login-company');
          return;
        }
        setCompanyId(company.id);
        setCurrentUserId(user?.id || null);

        const offerData = await getOfferById(offerId);
        if (!offerData || offerData.company_id !== company.id) {
          router.push('/company/offers');
          return;
        }

        setOffer(offerData);
        
        // Load managers
        const offerManagers = await getOfferManagers(offerId);
        setManagers(offerManagers);
        
        // Convert DB format to form format
        const missions = offerData.missions 
          ? (typeof offerData.missions === 'string' 
              ? offerData.missions.split('\n').filter((m: string) => m.trim()) 
              : offerData.missions)
          : [''];
        
        setInitialFormData({
          title: offerData.title || '',
          description: offerData.description || '',
          missions: missions.length > 0 ? missions : [''],
          objectives: offerData.objectives || '',
          reporting: '',
          skills: offerData.required_skills?.length ? offerData.required_skills : [''],
          studyLevel: mapEducationDbToUi(offerData.education_level),
          contractType: offerData.contract_type,
          duration: offerData.duration_months ? `${offerData.duration_months} mois` : '',
          startDate: offerData.start_date?.split('T')[0] || '',
          location: offerData.location_city || '',
          remotePolicy: offerData.remote_policy || 'on_site',
          salary: offerData.remuneration_min ? `${offerData.remuneration_min}€/mois` : '',
          applicationProcess: 'CV + Lettre de motivation',
          requiresCoverLetter: offerData.requires_cover_letter ?? true,
          managerEmail: offerData.manager_email || '',
        });
      } catch (error) {
        console.error('Error loading offer:', error);
        router.push('/company/offers');
      } finally {
        setLoading(false);
      }
    };

    loadOffer();
  }, [offerId, router]);

  const handleSubmit = async (formData: OfferFormData, status: 'draft' | 'active') => {
    if (!offer) return;
    setSaving(true);

    // Parse duration to months
    const durationMatch = formData.duration.match(/(\d+)/);
    const durationMonths = durationMatch ? parseInt(durationMatch[1]) : null;

    // Parse salary
    const salaryMatch = formData.salary.match(/(\d+)/);
    const remunerationMin = salaryMatch ? parseInt(salaryMatch[1]) : null;

    const updates: JobOfferUpdateData = {
      title: formData.title,
      description: formData.description,
      missions: formData.missions.filter(m => m.trim()).join('\n'),
      objectives: formData.objectives,
      required_skills: formData.skills.filter(s => s.trim()),
      education_level: mapEducationUiToDb(formData.studyLevel[0]),
      contract_type: formData.contractType,
      duration_months: durationMonths || undefined,
      start_date: formData.startDate || undefined,
      location_city: formData.location,
      remote_policy: formData.remotePolicy,
      remuneration_min: remunerationMin || undefined,
      requires_cover_letter: formData.requiresCoverLetter,
      manager_email: formData.managerEmail || undefined,
    };

    const result = await updateOffer(offerId, updates);

    if (result.success) {
      // If saving as active and offer was draft/paused, publish it
      if (status === 'active' && (offer.status === 'draft' || offer.status === 'paused')) {
        await publishOffer(offerId);
      }
      // Reload offer data
      const updated = await getOfferById(offerId);
      if (updated) setOffer(updated);
      router.push('/company/offers');
    } else {
      alert('Erreur: ' + result.error);
    }
    setSaving(false);
  };

  const handlePause = async () => {
    const result = await pauseOffer(offerId);
    if (result.success) {
      const updated = await getOfferById(offerId);
      if (updated) setOffer(updated);
    }
  };

  const handleClose = async () => {
    if (!confirm('Êtes-vous sûr de vouloir marquer cette offre comme pourvue ?')) return;
    const result = await closeOffer(offerId);
    if (result.success) {
      const updated = await getOfferById(offerId);
      if (updated) setOffer(updated);
    }
  };

  const handleDuplicate = async () => {
    const result = await duplicateOffer(offerId);
    if (result.success && result.offer) {
      router.push(`/company/offers/${result.offer.id}`);
    } else {
      alert('Erreur: ' + result.error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce brouillon ?')) return;
    const result = await deleteOffer(offerId);
    if (result.success) {
      router.push('/company/offers');
    } else {
      alert('Erreur: ' + result.error);
    }
  };

  const handleReactivate = async () => {
    const result = await publishOffer(offerId);
    if (result.success) {
      const updated = await getOfferById(offerId);
      if (updated) setOffer(updated);
    }
  };

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

  if (!offer || !initialFormData) return null;

  const getStatusBadge = () => {
    switch (offer.status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>;
      case 'draft':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Brouillon</span>;
      case 'paused':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">En pause</span>;
      case 'filled':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Pourvue</span>;
      case 'expired':
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">Expirée</span>;
      case 'pending_validation':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1"><Shield className="h-3 w-3" /> En attente de validation</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="company" />

      <div className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/company/offers" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Retour aux offres
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{offer.title}</h1>
                  {getStatusBadge()}
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {offer.location_city || 'Non précisé'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="capitalize">{offer.contract_type}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {offer.applications_count} candidature{offer.applications_count > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {offer.views_count} vue{offer.views_count > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {offer.status === 'draft' && (
                  <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Supprimer"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={handleDuplicate}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Dupliquer"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <OfferForm
                  initialData={initialFormData}
                  onSubmit={handleSubmit}
                  onCancel={() => router.push('/company/offers')}
                  isEditing={true}
                  saving={saving}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  {offer.status === 'active' && (
                    <>
                      <button
                        onClick={handlePause}
                        className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2"
                      >
                        <Pause className="h-4 w-4" />
                        Mettre en pause
                      </button>
                      <button
                        onClick={handleClose}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Marquer comme pourvue
                      </button>
                    </>
                  )}

                  {offer.status === 'paused' && (
                    <button
                      onClick={handleReactivate}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Réactiver l'offre
                    </button>
                  )}

                  <Link
                    href={`/company/offers/${offerId}/applications`}
                    className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Candidatures ({offer.applications_count})
                  </Link>
                </div>
              </div>

              {/* Managers */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Accès à l'offre</h3>
                  {managers.length > 0 && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      + Ajouter
                    </button>
                  )}
                </div>
                
                {managers.length === 0 ? (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600"
                  >
                    <UserPlus className="h-6 w-6" />
                    <span className="text-sm font-medium">Ajouter un manager</span>
                    <span className="text-xs text-gray-400">Invitez des collaborateurs à gérer cette offre</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {managers.map((manager) => (
                      <div key={manager.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        {manager.user?.avatar_url ? (
                          <img 
                            src={manager.user.avatar_url} 
                            alt="" 
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                            {manager.user?.first_name?.[0]}{manager.user?.last_name?.[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {manager.user?.first_name} {manager.user?.last_name}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {manager.permissions?.can_view_applications && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px]">Voir</span>
                            )}
                            {manager.permissions?.can_change_status && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[10px]">Statut</span>
                            )}
                            {manager.permissions?.can_add_notes && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[10px]">Notes</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Statistiques</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vues</span>
                    <span className="font-medium">{offer.views_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Candidatures</span>
                    <span className="font-medium">{offer.applications_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Créée le</span>
                    <span className="font-medium">
                      {format(new Date(offer.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                  {offer.published_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Publiée le</span>
                      <span className="font-medium">
                        {format(new Date(offer.published_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Invite Manager Modal */}
      {companyId && currentUserId && (
        <InviteManagerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          companyId={companyId}
          invitedBy={currentUserId}
          onSuccess={async () => {
            const updatedManagers = await getOfferManagers(offerId);
            setManagers(updatedManagers);
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
}
