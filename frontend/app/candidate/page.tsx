// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/job/JobCard';
import { ApplicationDetailSheet } from '@/components/job/ApplicationDetailSheet';
import { JobOffer, Candidate } from '@/types';
import { getCurrentCandidate, getSavedCVs } from '@/services/candidateService';
import { getRecentOffers } from '@/services/offerService';
import { getCandidateApplications, FrontendApplication } from '@/services/applicationService';
import {
  Briefcase,
  FileText,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Eye,
  Star,
  Bell,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CandidateDashboard() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [recentApplications, setRecentApplications] = useState<FrontendApplication[]>([]);
  const [recommendedOffers, setRecommendedOffers] = useState<JobOffer[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<FrontendApplication | null>(null);
  const [showApplicationDetail, setShowApplicationDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvCount, setCvCount] = useState<number>(0);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Récupérer le profil candidat via service
        const candidateData = await getCurrentCandidate();

        if (!candidateData) {
          // Pas connecté → redirection côté NavBar/AuthGuard si nécessaire
          setError('Vous devez être connecté pour accéder à votre espace candidat');
          setLoading(false);
          return;
        }

        // Map service data to local Candidate type
        const mappedCandidate: Candidate = {
          id: candidateData.id,
          firstName: candidateData.first_name || '',
          lastName: candidateData.last_name || '',
          email: candidateData.email,
          phone: candidateData.phone || undefined,
          school: candidateData.institution || undefined,
          studyLevel: candidateData.education_level || undefined,
          specialization: candidateData.specialization || undefined,
          alternanceRhythm: candidateData.alternance_rhythm || undefined,
          preferredLocations: undefined,
          locations: candidateData.target_locations || [],
          availableFrom: candidateData.available_from || undefined,
          savedCVs: undefined,
          defaultCVId: undefined,
          cvUrl: candidateData.cv_url || undefined,
          cvParsed: candidateData.cv_parsed || undefined,
          createdAt: candidateData.created_at,
        };

        setCandidate(mappedCandidate);

        // Charger candidatures, offres recommandées et CV en parallèle
        const [apps, offers, cvs] = await Promise.all([
          getCandidateApplications(candidateData.id),
          getRecentOffers(4),
          getSavedCVs(candidateData.id),
        ]);

        setRecentApplications(apps.slice(0, 3));
        setRecommendedOffers(offers);
        setCvCount(cvs.length);
      } catch (err: any) {
        console.error('Erreur chargement dashboard candidat:', err);
        setError('Une erreur est survenue lors du chargement de votre tableau de bord');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const stats = {
    totalApplications: recentApplications.length,
    pending: recentApplications.filter(a => a.status === 'pending').length,
    reviewing: recentApplications.filter(a =>
      a.status === 'reviewing' || a.status === 'in_progress' || a.status === 'interview'
    ).length,
    accepted: recentApplications.filter(a => a.status === 'accepted').length,
    rejected: recentApplications.filter(a => a.status === 'rejected').length,
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock },
    in_progress: { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-100', icon: AlertCircle },
    interview: { label: 'Entretien', color: 'text-purple-600', bg: 'bg-purple-100', icon: Clock },
    accepted: { label: 'Acceptée', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
    rejected: { label: 'Refusée', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
    withdrawn: { label: 'Retirée', color: 'text-gray-600', bg: 'bg-gray-100', icon: XCircle },
    reviewing: { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-100', icon: AlertCircle }, // legacy alias
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="inline-block h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Chargement de votre tableau de bord...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">{error || 'Profil candidat introuvable'}</p>
            <Link
              href="/candidate/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Compléter mon profil
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Bonjour, {candidate.firstName} 👋
                </h1>
                <p className="text-blue-100 text-lg">
                  {[candidate.school, candidate.studyLevel, candidate.specialization].filter(Boolean).join(' • ') || 'Complétez votre profil'}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/candidate/profile"
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                >
                  <User className="h-5 w-5" />
                  Mon profil
                </Link>
                <Link
                  href="/candidate/cv"
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  Mes CV ({cvCount})
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Send className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalApplications}</span>
              </div>
              <p className="text-sm text-gray-600">Candidatures</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
              </div>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.reviewing}</span>
              </div>
              <p className="text-sm text-gray-600">En examen</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.accepted}</span>
              </div>
              <p className="text-sm text-gray-600">Acceptées</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.rejected}</span>
              </div>
              <p className="text-sm text-gray-600">Refusées</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Applications */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Candidatures récentes</h2>
                  <Link
                    href="/candidate/applications"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    Voir tout
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="divide-y divide-gray-100">
                  {recentApplications.map((app) => {
                    const config = statusConfig[app.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    const offer = app.offer;
                    return (
                      <div
                        key={app.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => {
                          setSelectedApplication(app);
                          setShowApplicationDetail(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {offer?.title || 'Offre non disponible'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {offer?.company?.name || 'Entreprise'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {offer?.location || 'Non spécifié'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(app.applicationDate), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`
                              inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                              ${config.bg} ${config.color}
                            `}>
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </span>
                            <Eye className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {recentApplications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Send className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucune candidature pour le moment</p>
                      <Link
                        href="/candidate/offers"
                        className="mt-3 inline-block text-blue-600 hover:underline"
                      >
                        Découvrir les offres
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & CV */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
                <div className="space-y-3">
                  <Link
                    href="/candidate/offers"
                    className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  >
                    <Briefcase className="h-5 w-5" />
                    <span className="font-medium">Rechercher des offres</span>
                  </Link>
                  <Link
                    href="/candidate/cv"
                    className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Gérer mes CV</span>
                  </Link>
                  <Link
                    href="/candidate/profile"
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Modifier mon profil</span>
                  </Link>
                </div>
              </div>

              {/* CV Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Mes CV</h2>
                  <Link href="/candidate/cv" className="text-blue-600 hover:text-blue-700 text-sm">
                    Gérer
                  </Link>
                </div>
                
                {cvCount > 0 ? (
                  <div className="space-y-3">
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg border border-blue-300 bg-blue-50"
                    >
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">CV Principal</p>
                        <span className="text-xs text-blue-600">Par défaut</span>
                      </div>
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500 mb-3">Aucun CV enregistré</p>
                    <Link
                      href="/candidate/cv"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ajouter un CV
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Offers */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Offres recommandées pour vous</h2>
                <p className="text-gray-600 text-sm">Basées sur votre profil et vos préférences</p>
              </div>
              <Link
                href="/candidate/offers"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Voir toutes les offres
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedOffers.map((offer) => (
                <JobCard key={offer.id} offer={offer} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Application Detail Sheet */}
      {selectedApplication && (
        <ApplicationDetailSheet
          application={selectedApplication}
          isOpen={showApplicationDetail}
          onClose={() => {
            setShowApplicationDetail(false);
            setSelectedApplication(null);
          }}
          viewMode="candidate"
        />
      )}

      <Footer />
    </div>
  );
}
