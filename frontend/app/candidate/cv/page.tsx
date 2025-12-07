// @ts-nocheck
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { CVManager } from '@/components/cv';
import { SavedCV } from '@/types';
import { FileText, Info, Shield, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import {
  getCurrentCandidate,
  getSavedCVs,
  setDefaultCV,
  deleteSavedCV,
  getSignedCVUrl,
} from '@/services/candidateService';

export default function CandidateCVPage() {
  const router = useRouter();
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [defaultCVId, setDefaultCVId] = useState<string | undefined>(undefined);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le candidat courant et ses CV depuis la table saved_cvs
  const loadData = useCallback(async () => {
    try {
      // Use service to get current candidate
      const candidateData = await getCurrentCandidate();

      if (!candidateData) {
        router.push('/login');
        return;
      }

      // Check if onboarding is complete (first_name is set)
      if (!candidateData.first_name) {
        router.push('/candidate/onboarding');
        return;
      }

      setCandidateId(candidateData.id);

      // Charger les CV depuis la table saved_cvs
      const cvs = await getSavedCVs(candidateData.id);

      // Générer des URLs signées pour chaque CV (bucket privé)
      const cvsWithSignedUrls = await Promise.all(
        cvs.map(async (cv) => {
          if (cv.storagePath) {
            try {
              const signedUrl = await getSignedCVUrl(cv.storagePath, 3600);
              return { ...cv, url: signedUrl };
            } catch (err) {
              console.error('Erreur URL signée pour CV', cv.id, err);
              return cv;
            }
          }
          return cv;
        })
      );

      setSavedCVs(cvsWithSignedUrls);

      // Trouver le CV par défaut
      const defaultCV = cvsWithSignedUrls.find(cv => cv.isDefault);
      setDefaultCVId(defaultCV?.id);
    } catch (err: any) {
      console.error('Erreur chargement CV candidat:', err);
      setError('Erreur lors du chargement de vos CV');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Callback quand CVManager modifie la liste des CV (ajout, renommage, etc.)
  const handleCVsChange = (cvs: SavedCV[]) => {
    setSavedCVs(cvs);
    const defaultCV = cvs.find(cv => cv.isDefault);
    setDefaultCVId(defaultCV?.id);
  };

  // Callback quand on change le CV par défaut
  const handleDefaultChange = async (cvId: string) => {
    if (!candidateId) return;

    try {
      await setDefaultCV(candidateId, cvId);
      
      // Mettre à jour l'état local
      setSavedCVs(prev => prev.map(cv => ({
        ...cv,
        isDefault: cv.id === cvId,
      })));
      setDefaultCVId(cvId);
      setError(null);
    } catch (err) {
      console.error('Erreur setDefaultCV:', err);
      setError('Erreur lors de la mise à jour du CV principal');
    }
  };

  // Callback pour supprimer un CV
  const handleDeleteCV = async (cvId: string) => {
    if (!candidateId) return;

    try {
      await deleteSavedCV(cvId);
      
      // Recharger les données
      await loadData();
    } catch (err) {
      console.error('Erreur suppression CV:', err);
      setError('Erreur lors de la suppression du CV');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement de vos CV...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!candidateId) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Profil candidat introuvable</p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Mes CV</h1>
            <p className="text-gray-600">
              Gérez vos CV et choisissez celui à utiliser pour vos candidatures
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold text-blue-900">CV multiples</span>
              </div>
              <p className="text-sm text-blue-700">
                Enregistrez jusqu'à 5 CV différents pour adapter votre candidature à chaque offre
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-semibold text-purple-900">Analyse IA</span>
              </div>
              <p className="text-sm text-purple-700">
                Vos CV sont analysés automatiquement pour extraire vos compétences et expériences
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-semibold text-green-900">Sécurisé</span>
              </div>
              <p className="text-sm text-green-700">
                Vos documents sont stockés de manière sécurisée et confidentiels
              </p>
            </div>
          </div>

          {/* CV Manager */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                CV enregistrés ({savedCVs.length}/5)
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <CVManager
              candidateId={candidateId}
              savedCVs={savedCVs}
              defaultCVId={defaultCVId}
              onCVsChange={handleCVsChange}
              onDefaultChange={handleDefaultChange}
              onDelete={handleDeleteCV}
              maxCVs={5}
            />
          </div>

          {/* Tips */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Conseils pour vos CV</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Adaptez votre CV à chaque type de poste (finance de marché, corporate, conseil...)</li>
                  <li>• Mettez en avant vos expériences les plus pertinentes en premier</li>
                  <li>• Utilisez des mots-clés du secteur financier</li>
                  <li>• Limitez votre CV à 1-2 pages maximum</li>
                  <li>• Vérifiez l'orthographe et la mise en forme</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
