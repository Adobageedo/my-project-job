// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { ApplyModal } from '@/components/job/ApplyModal';
import { LocationHierarchy } from '@/components/shared/LocationTag';
import { jobOffers } from '@/data';
import { getSavedCVs, SavedCV } from '@/services/candidateService';
import { getOfferForCandidate, FrontendJobOffer } from '@/services/offerService';
import { 
  getApplicationForOffer, 
  withdrawApplication,
  FrontendApplication 
} from '@/services/applicationService';
import { 
  isOfferSaved, 
  saveOffer, 
  unsaveOffer 
} from '@/services/savedOfferService';
import { createLocationFromCity } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin,
  Calendar,
  Briefcase,
  Euro,
  GraduationCap,
  Clock,
  Building2,
  ArrowLeft,
  Send,
  Share2,
  Heart,
  Loader2,
  CheckCircle,
  Users,
  ChevronRight,
  XCircle,
  AlertTriangle,
  Eye,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [offer, setOffer] = useState<FrontendJobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [existingApplication, setExistingApplication] = useState<FrontendApplication | null>(null);

  // CVs from candidate_cvs table
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [defaultCVId, setDefaultCVId] = useState<string | undefined>(undefined);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  
  // Withdrawal state
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Charger l'offre et les CVs
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Ensure params.id is a string (Next.js can return array in some cases)
      const offerId = Array.isArray(params.id) ? params.id[0] : params.id;
      if (!offerId || typeof offerId !== 'string') {
        console.error('Invalid offer ID:', params.id);
        setLoading(false);
        return;
      }

      try {
        // Load offer from Supabase (with frontend-compatible format)
        const offerData = await getOfferForCandidate(offerId);
        // Fallback to mock data if not found in DB
        if (offerData) {
          setOffer(offerData);
        } else {
          const mockOffer = jobOffers.find((o) => o.id === offerId);
          if (mockOffer) {
            // Convert mock offer to FrontendJobOffer format
            setOffer({
              ...mockOffer,
              companyId: mockOffer.companyId || mockOffer.company?.id || '',
              required_skills: mockOffer.skills || [],
              postedDate: mockOffer.postedDate || null,
              startDate: mockOffer.startDate || null,
            } as FrontendJobOffer);
          } else {
            setOffer(null);
          }
        }

        // Load candidate CVs, check for existing application and saved status if logged in
        if (user?.id) {
          setCandidateId(user.id);
          
          // Load CVs, check for existing application and saved status in parallel
          const [cvs, application, saved] = await Promise.all([
            getSavedCVs(user.id),
            getApplicationForOffer(user.id, offerId),
            isOfferSaved(user.id, offerId)
          ]);
          
          setSavedCVs(cvs);
          setExistingApplication(application);
          setIsSaved(saved);
          
          // Find default CV
          const defaultCV = cvs.find(cv => cv.isDefault);
          setDefaultCVId(defaultCV?.id);
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
        const mockOffer = jobOffers.find((o) => o.id === offerId);
        if (mockOffer) {
          setOffer({
            ...mockOffer,
            companyId: mockOffer.companyId || mockOffer.company?.id || '',
            required_skills: mockOffer.skills || [],
            postedDate: mockOffer.postedDate || null,
            startDate: mockOffer.startDate || null,
          } as FrontendJobOffer);
        } else {
          setOffer(null);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.id, user?.id]);

  const handleCVAdded = (newCV: SavedCV) => {
    setSavedCVs([...savedCVs, newCV]);
  };

  const handleApplySuccess = async () => {
    // Reload the application to get full details
    if (user?.id && offer?.id) {
      const application = await getApplicationForOffer(user.id, offer.id);
      setExistingApplication(application);
    }
  };

  const handleWithdraw = async () => {
    if (!existingApplication || !candidateId) return;
    
    setIsWithdrawing(true);
    setWithdrawError(null);
    
    try {
      const result = await withdrawApplication(existingApplication.id, candidateId);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du retrait');
      }
      setExistingApplication(null);
      setShowWithdrawConfirm(false);
    } catch (err: any) {
      setWithdrawError(err.message || 'Erreur lors du retrait de la candidature');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle save/unsave offer
  const handleToggleSave = async () => {
    if (!candidateId || !offer?.id) {
      console.error('handleToggleSave: Missing candidateId or offer.id', { candidateId, offerId: offer?.id });
      return;
    }
    
    try {
      if (isSaved) {
        const result = await unsaveOffer(candidateId, offer.id);
        if (result.success) {
          setIsSaved(false);
        }
      } else {
        const result = await saveOffer(candidateId, offer.id);
        if (result.success) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Status config for display
  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
    in_progress: { label: 'En cours d\'examen', color: 'text-blue-700', bg: 'bg-blue-100', icon: Eye },
    interview: { label: 'Entretien prévu', color: 'text-purple-700', bg: 'bg-purple-100', icon: Users },
    accepted: { label: 'Acceptée', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
    rejected: { label: 'Refusée', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Chargement de l'offre...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Offre introuvable
            </h1>
            
            <p className="text-gray-600 mb-8">
              Cette offre n'existe plus ou a été supprimée par l'entreprise. 
              Elle a peut-être déjà été pourvue ou n'est plus disponible.
            </p>

            <div className="space-y-3">
              <Link
                href="/candidate/offers"
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Voir toutes les offres
              </Link>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Conseil :</strong> Créez une alerte pour être notifié 
                dès qu'une offre similaire est publiée !
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const offerLocation = createLocationFromCity(offer.location);
  const skills = (offer.skills && offer.skills.length > 0
    ? offer.skills
    : offer.required_skills) || [];
  const missions = Array.isArray(offer.missions)
    ? offer.missions
    : (offer.missions ? offer.missions.split('\n').filter((m) => m.trim().length > 0) : []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour aux offres
          </button>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {offer.contractType && (
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium capitalize">
                        {offer.contractType}
                      </span>
                    )}
                    <span className="text-blue-200 text-sm">
                      {offer.postedDate ? `Publiée le ${format(new Date(offer.postedDate), 'dd MMMM yyyy', { locale: fr })}` : ''}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{offer.title}</h1>
                  <p className="text-xl text-blue-100 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {offer.company?.name || 'Entreprise'}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSave}
                    className={`p-3 rounded-full transition ${
                      isSaved ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30'
                    }`}
                    title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200">Localisation</p>
                    <p className="font-medium">{offer.location || 'Non spécifié'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200">Durée</p>
                    <p className="font-medium">{offer.duration || 'Non spécifié'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200">Début</p>
                    <p className="font-medium">{offer.startDate ? format(new Date(offer.startDate), 'dd MMM yyyy', { locale: fr }) : 'Non spécifié'}</p>
                  </div>
                </div>
                {offer.salary && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Euro className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-200">Rémunération</p>
                      <p className="font-medium">{offer.salary}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Hierarchy */}
            <div className="px-8 py-4 bg-blue-50 border-b">
              <LocationHierarchy location={offerLocation} />
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Description */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Description du poste
                </h2>
                <p className="text-gray-700 leading-relaxed">{offer.description || 'Aucune description disponible'}</p>
              </section>

              {/* Missions */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Missions principales</h2>
                <ul className="space-y-3">
                  {missions.map((mission, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{mission}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Objectifs */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Objectifs</h2>
                <p className="text-gray-700 leading-relaxed">{offer.objectives || 'Non spécifié'}</p>
              </section>

              {/* Rattachement */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Rattachement hiérarchique</h2>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                  <span className="text-gray-700 font-medium">{offer.reporting || 'Non spécifié'}</span>
                </div>
              </section>

              {/* Compétences */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Compétences attendues</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              {/* Niveau d'études */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Niveau d'études requis</h2>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                  <div className="flex gap-2">
                    {(offer.studyLevel || []).map((level, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Modalités */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Modalités de candidature</h2>
                <p className="text-gray-700">{offer.applicationProcess || 'Postulez directement via cette plateforme'}</p>
              </section>

              {/* Company Info */}
              <section className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  À propos de {offer.company?.name || 'l\'entreprise'}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Secteur d'activité</p>
                    <p className="font-medium text-gray-900">{offer.company?.sector || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Taille de l'entreprise</p>
                    <p className="font-medium text-gray-900">{offer.company?.size ? `${offer.company.size} employés` : 'Non spécifié'}</p>
                  </div>
                </div>
              </section>

              {/* Apply Section */}
              <section className="pt-6 border-t border-gray-200">
                {existingApplication ? (
                  <div className="space-y-4">
                    {/* Application Status Card */}
                    <div className={`rounded-xl p-6 ${
                      existingApplication.status === 'accepted' ? 'bg-green-50 border border-green-200' :
                      existingApplication.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                      existingApplication.status === 'interview' ? 'bg-purple-50 border border-purple-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {(() => {
                            const config = statusConfig[existingApplication.status] || statusConfig.pending;
                            const StatusIcon = config.icon;
                            return (
                              <div className={`p-3 rounded-full ${config.bg}`}>
                                <StatusIcon className={`h-6 w-6 ${config.color}`} />
                              </div>
                            );
                          })()}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              Vous avez déjà postulé à cette offre
                            </h3>
                            <p className="text-gray-600 mb-2">
                              Candidature envoyée le{' '}
                              <span className="font-medium">
                                {format(new Date(existingApplication.applicationDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                              </span>
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`
                                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                                ${(statusConfig[existingApplication.status] || statusConfig.pending).bg}
                                ${(statusConfig[existingApplication.status] || statusConfig.pending).color}
                              `}>
                                {(statusConfig[existingApplication.status] || statusConfig.pending).label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Application details */}
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {existingApplication.cvUrl && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>CV envoyé</span>
                            <a 
                              href={existingApplication.cvUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Voir
                            </a>
                          </div>
                        )}
                        {existingApplication.coverLetter && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Lettre de motivation envoyée</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
                        <Link
                          href="/candidate/applications"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          Voir mes candidatures
                        </Link>
                        
                        {/* Withdraw button - only for pending applications */}
                        {existingApplication.status === 'pending' && (
                          <button
                            onClick={() => setShowWithdrawConfirm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                          >
                            <XCircle className="h-4 w-4" />
                            Retirer ma candidature
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Withdraw Confirmation Modal */}
                    {showWithdrawConfirm && (
                      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="p-2 bg-amber-100 rounded-full">
                              <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Retirer ma candidature ?
                              </h3>
                              <p className="text-gray-600 mt-1">
                                Cette action est irréversible. Vous devrez postuler à nouveau si vous changez d'avis.
                              </p>
                            </div>
                          </div>

                          {withdrawError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                              {withdrawError}
                            </div>
                          )}

                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setShowWithdrawConfirm(false);
                                setWithdrawError(null);
                              }}
                              disabled={isWithdrawing}
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={handleWithdraw}
                              disabled={isWithdrawing}
                              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isWithdrawing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Retrait...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  Retirer
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
                    >
                      <Send className="h-5 w-5" />
                      Postuler à cette offre
                    </button>
                    <button
                      onClick={handleToggleSave}
                      className={`w-full sm:w-auto px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition ${
                        isSaved
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? 'Sauvegardée' : 'Sauvegarder'}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {candidateId && (
        <ApplyModal
          offer={offer}
          candidateId={candidateId}
          savedCVs={savedCVs}
          defaultCVId={defaultCVId}
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
          onCVAdded={handleCVAdded}
        />
      )}

      <Footer />
    </div>
  );
}
