'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import OfferForm, { OfferFormData } from '@/components/job/OfferForm';
import { getCurrentCompany } from '@/services/companyService';
import { createOffer, JobOfferCreateData } from '@/services/offerService';
import { Loader2 } from 'lucide-react';

export default function NewOfferPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      const company = await getCurrentCompany();
      if (!company) {
        router.push('/login-company');
        return;
      }
      setCompanyId(company.id);
      setLoading(false);
    };
    loadCompany();
  }, [router]);

  const mapStudyLevelToEducationEnum = (level?: string): string | undefined => {
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

  const handleSubmit = async (formData: OfferFormData, status: 'draft' | 'active') => {
    if (!companyId) return;

    setSaving(true);
    
    // Parse duration to months
    const durationMatch = formData.duration.match(/(\d+)/);
    const durationMonths = durationMatch ? parseInt(durationMatch[1]) : null;

    // Parse salary
    const salaryMatch = formData.salary.match(/(\d+)/);
    const remunerationMin = salaryMatch ? parseInt(salaryMatch[1]) : null;
    const educationLevelEnum = mapStudyLevelToEducationEnum(formData.studyLevel[0]);

    const offerData: JobOfferCreateData = {
      title: formData.title,
      description: formData.description,
      missions: formData.missions.filter(m => m.trim()).join('\n'),
      objectives: formData.objectives,
      required_skills: formData.skills.filter(s => s.trim()),
      education_level: educationLevelEnum,
      contract_type: formData.contractType,
      duration_months: durationMonths || undefined,
      start_date: formData.startDate || undefined,
      location_city: formData.location,
      remote_policy: formData.remotePolicy,
      remuneration_min: remunerationMin || undefined,
      requires_cover_letter: formData.requiresCoverLetter,
      manager_email: formData.managerEmail || undefined,
      status,
    };

    const result = await createOffer(companyId, offerData);
    setSaving(false);

    if (result.success) {
      router.push('/company/offers');
    } else {
      alert('Erreur: ' + result.error);
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="company" />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Publier une nouvelle offre</h1>
            <p className="text-gray-600">
              Créez une offre de stage ou d'alternance attractive pour les candidats
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <OfferForm
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              saving={saving}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
