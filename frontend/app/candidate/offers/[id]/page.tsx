// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { ApplyModal } from '@/components/job/ApplyModal';
import { LocationHierarchy } from '@/components/shared/LocationTag';
import { jobOffers } from '@/data';
import { getSavedCVs, SavedCV } from '@/services/candidateService';
import { getOfferById } from '@/services/offerService';
import { JobOffer, createLocationFromCity } from '@/types';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // CVs from candidate_cvs table
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [defaultCVId, setDefaultCVId] = useState<string | undefined>(undefined);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  // Charger l'offre et les CVs
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load offer
        const offerData = await getOfferById(params.id as string);
        setOffer(offerData || jobOffers.find((o) => o.id === params.id) || null);

        // Load candidate CVs if logged in
        if (user?.id) {
          setCandidateId(user.id);
          const cvs = await getSavedCVs(user.id);
          setSavedCVs(cvs);
          
          // Find default CV
          const defaultCV = cvs.find(cv => cv.isDefault);
          setDefaultCVId(defaultCV?.id);
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
        const localOffer = jobOffers.find((o) => o.id === params.id);
        setOffer(localOffer || null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.id, user?.id]);

  const handleCVAdded = (newCV: SavedCV) => {
    setSavedCVs([...savedCVs, newCV]);
  };

  const handleApplySuccess = () => {
    setHasApplied(true);
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Offre non trouvée</h1>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Retour
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const offerLocation = createLocationFromCity(offer.location);

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
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium capitalize">
                      {offer.contractType}
                    </span>
                    <span className="text-blue-200 text-sm">
                      Publiée le {format(new Date(offer.postedDate), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{offer.title}</h1>
                  <p className="text-xl text-blue-100 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {offer.company.name}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`p-3 rounded-full transition ${
                      isSaved ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30'
                    }`}
                    title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition"
                    title="Partager"
                  >
                    <Share2 className="h-5 w-5" />
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
                    <p className="font-medium">{offer.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200">Durée</p>
                    <p className="font-medium">{offer.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200">Début</p>
                    <p className="font-medium">{format(new Date(offer.startDate), 'dd MMM yyyy', { locale: fr })}</p>
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
                <p className="text-gray-700 leading-relaxed">{offer.description}</p>
              </section>

              {/* Missions */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Missions principales</h2>
                <ul className="space-y-3">
                  {offer.missions.map((mission, index) => (
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
                <p className="text-gray-700 leading-relaxed">{offer.objectives}</p>
              </section>

              {/* Rattachement */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Rattachement hiérarchique</h2>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                  <span className="text-gray-700 font-medium">{offer.reporting}</span>
                </div>
              </section>

              {/* Compétences */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Compétences attendues</h2>
                <div className="flex flex-wrap gap-2">
                  {offer.skills.map((skill, index) => (
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
                    {offer.studyLevel.map((level, index) => (
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
                <p className="text-gray-700">{offer.applicationProcess}</p>
              </section>

              {/* Company Info */}
              <section className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  À propos de {offer.company.name}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Secteur d'activité</p>
                    <p className="font-medium text-gray-900">{offer.company.sector}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Taille de l'entreprise</p>
                    <p className="font-medium text-gray-900">{offer.company.size} employés</p>
                  </div>
                </div>
              </section>

              {/* Apply Section */}
              <section className="pt-6 border-t border-gray-200">
                {hasApplied ? (
                  <div className="text-center py-6 bg-green-50 rounded-xl">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Candidature envoyée !
                    </h3>
                    <p className="text-green-600 mb-4">
                      Votre candidature a été transmise à {offer.company.name}
                    </p>
                    <button
                      onClick={() => router.push('/candidate/applications')}
                      className="text-green-700 font-medium hover:underline flex items-center gap-1 mx-auto"
                    >
                      Voir mes candidatures
                      <ChevronRight className="h-4 w-4" />
                    </button>
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
                      onClick={() => setIsSaved(!isSaved)}
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
