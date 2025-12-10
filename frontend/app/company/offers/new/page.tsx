'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import OfferForm, { OfferFormData } from '@/components/job/OfferForm';
import MultiOfferPDFParser from '@/components/job/MultiOfferPDFParser';
import { getCurrentCompany } from '@/services/companyService';
import { createOffer, JobOfferCreateData } from '@/services/offerService';
import { Loader2, FileStack, FileText, CheckCircle, AlertCircle } from 'lucide-react';

type Mode = 'choose' | 'single' | 'multi';

interface CreationResult {
  fileName?: string;
  title: string;
  success: boolean;
  error?: string;
}

export default function NewOfferPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>('choose');
  const [creatingMultiple, setCreatingMultiple] = useState(false);
  const [creationResults, setCreationResults] = useState<CreationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

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

  const createOfferFromFormData = async (formData: OfferFormData, status: 'draft' | 'active' = 'active'): Promise<CreationResult> => {
    if (!companyId) return { title: formData.title, success: false, error: 'Company ID manquant' };

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
    
    return {
      title: formData.title,
      success: result.success,
      error: result.error
    };
  };

  const handleSingleSubmit = async (formData: OfferFormData, status: 'draft' | 'active') => {
    setSaving(true);
    const result = await createOfferFromFormData(formData, status);
    setSaving(false);

    if (result.success) {
      router.push('/company/offers');
    } else {
      alert('Erreur: ' + result.error);
    }
  };

  const handleMultipleOffersValidated = async (offers: OfferFormData[]) => {
    setCreatingMultiple(true);
    const results: CreationResult[] = [];

    // Create offers sequentially to avoid rate limiting
    for (const offer of offers) {
      const result = await createOfferFromFormData(offer, 'active');
      results.push(result);
    }

    setCreationResults(results);
    setCreatingMultiple(false);
    setShowResults(true);
  };

  const handleFinish = () => {
    router.push('/company/offers');
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

  // Show creation results
  if (showResults) {
    const successCount = creationResults.filter(r => r.success).length;
    const errorCount = creationResults.filter(r => !r.success).length;

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />

        <div className="flex-1 py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                errorCount === 0 ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                {errorCount === 0 ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {errorCount === 0 ? 'Offres créées avec succès !' : 'Création terminée'}
              </h2>
              <p className="text-gray-600 mb-6">
                {successCount} offre{successCount > 1 ? 's' : ''} créée{successCount > 1 ? 's' : ''}
                {errorCount > 0 && `, ${errorCount} erreur${errorCount > 1 ? 's' : ''}`}
              </p>

              <div className="space-y-3 mb-8 max-h-64 overflow-y-auto">
                {creationResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg text-left ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.title || 'Sans titre'}
                      </p>
                      {result.error && (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinish}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Voir mes offres
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Show creating multiple offers progress
  if (creatingMultiple) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Création des offres en cours...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant la création de vos offres
            </p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {mode === 'choose' ? 'Publier une nouvelle offre' :
               mode === 'multi' ? 'Import multiple de fiches de poste' :
               'Créer une offre'}
            </h1>
            <p className="text-gray-600">
              {mode === 'choose' ? 'Créez une ou plusieurs offres de stage ou d\'alternance' :
               mode === 'multi' ? 'Uploadez plusieurs fichiers PDF pour créer plusieurs offres en une fois' :
               'Créez une offre de stage ou d\'alternance attractive pour les candidats'}
            </p>
          </div>

          {/* Mode choice */}
          {mode === 'choose' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Single offer */}
              <button
                onClick={() => setMode('single')}
                className="bg-white rounded-xl shadow-lg p-8 text-left hover:shadow-xl transition group border-2 border-transparent hover:border-blue-500"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
                  <FileText className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Créer une offre
                </h3>
                <p className="text-gray-600">
                  Créez une seule offre manuellement ou en important un PDF
                </p>
              </button>

              {/* Multiple offers */}
              <button
                onClick={() => setMode('multi')}
                className="bg-white rounded-xl shadow-lg p-8 text-left hover:shadow-xl transition group border-2 border-transparent hover:border-purple-500"
              >
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition">
                  <FileStack className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Import multiple
                </h3>
                <p className="text-gray-600">
                  Importez plusieurs fiches de poste PDF et créez toutes vos offres en une fois
                </p>
                <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  <Loader2 className="w-3 h-3" />
                  Analyse IA par lot
                </div>
              </button>
            </div>
          )}

          {/* Single offer mode */}
          {mode === 'single' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <OfferForm
                onSubmit={handleSingleSubmit}
                onCancel={() => setMode('choose')}
                saving={saving}
              />
            </div>
          )}

          {/* Multi offer mode */}
          {mode === 'multi' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <MultiOfferPDFParser
                onOffersValidated={handleMultipleOffersValidated}
                onCancel={() => setMode('choose')}
              />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
