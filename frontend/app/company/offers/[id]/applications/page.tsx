// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import OfferKanbanView from '@/components/job/OfferKanbanView';
import { ApplicationDetailSheet } from '@/components/job/ApplicationDetailSheet';
import { jobOffers, applications as mockApplications } from '@/data/index';
import { updateApplicationStatus } from '@/services/companyService';
import { JobOffer, Application, ApplicationStatus } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function OfferApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    // Charger l'offre et ses candidatures
    const foundOffer = jobOffers.find(o => o.id === offerId);
    if (foundOffer) {
      setOffer(foundOffer);
      const offerApplications = mockApplications.filter(a => a.offerId === offerId);
      setApplications(offerApplications);
    }
    setLoading(false);
  }, [offerId]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationStatus({ id: applicationId, status: newStatus });
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      throw error;
    }
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setShowDetail(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Offre non trouvée</h2>
            <Link href="/company/offers" className="text-blue-600 hover:text-blue-700">
              Retour aux offres
            </Link>
          </div>
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
          {/* Navigation */}
          <div className="mb-6">
            <Link
              href="/company/offers"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux offres
            </Link>
          </div>

          {/* Vue Kanban */}
          <OfferKanbanView
            offer={offer}
            applications={applications}
            onStatusChange={handleStatusChange}
            onViewApplication={handleViewApplication}
          />
        </div>
      </div>

      {/* Détail de la candidature */}
      {selectedApplication && (
        <ApplicationDetailSheet
          application={selectedApplication}
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedApplication(null);
          }}
          viewMode="company"
          onStatusChange={async (newStatus) => {
            await handleStatusChange(selectedApplication.id, newStatus);
            setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
