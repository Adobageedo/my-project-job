// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Send,
  FileText,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { SavedCV } from '@/types';
import { CVSelector } from '../cv/CVManager';
import { uploadCV, createApplication } from '@/services/candidateService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Flexible interface for offer that works with both types/JobOffer and services/FrontendJobOffer
interface ApplyModalOffer {
  id: string;
  title: string;
  company?: {
    id?: string;
    name: string;
  };
  companyId?: string;
  location?: string;
  contractType?: string;
  startDate?: string | null;
  duration?: string;
  requiresCoverLetter?: boolean;
}

interface ApplyModalProps {
  offer: ApplyModalOffer;
  candidateId: string;
  savedCVs: SavedCV[];
  defaultCVId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCVAdded: (cv: SavedCV) => void;
}

type Step = 'select-cv' | 'add-cv' | 'cover-letter' | 'confirm' | 'success';

export function ApplyModal({
  offer,
  candidateId,
  savedCVs,
  defaultCVId,
  isOpen,
  onClose,
  onSuccess,
  onCVAdded,
}: ApplyModalProps) {
  const [step, setStep] = useState<Step>(savedCVs.length > 0 ? 'select-cv' : 'add-cv');
  const [selectedCVId, setSelectedCVId] = useState<string | undefined>(defaultCVId);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pour l'ajout de nouveau CV
  const [newCVName, setNewCVName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPendingFile(acceptedFiles[0]);
      setNewCVName(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleUploadNewCV = async () => {
    if (!pendingFile || !newCVName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadCV(candidateId, pendingFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const newCV: SavedCV = {
        id: result.cvId || `cv-${Date.now()}`,
        userId: candidateId,
        name: newCVName.trim(),
        filename: pendingFile.name,
        url: result.url || '',
        storagePath: `${candidateId}/${Date.now()}.pdf`,
        isDefault: savedCVs.length === 0,
        fileSize: pendingFile.size,
        mimeType: pendingFile.type || 'application/pdf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onCVAdded(newCV);
      setSelectedCVId(newCV.id);
      setStep('cover-letter');
      setPendingFile(null);
      setNewCVName('');
    } catch (err) {
      setError('Erreur lors de l\'upload du CV. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCVId) {
      setError('Veuillez sélectionner un CV');
      return;
    }

    // Vérifier si la lettre de motivation est obligatoire
    if (offer.requiresCoverLetter && !coverLetter?.trim()) {
      setError('La lettre de motivation est obligatoire pour cette offre');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get companyId from offer (either from company.id or companyId property)
      const companyId = offer.company?.id || offer.companyId;
      if (!companyId) {
        throw new Error('Company ID is missing from offer');
      }

      // Get the selected CV URL to store with the application
      const selectedCV = savedCVs.find(cv => cv.id === selectedCVId);
      const cvUrl = selectedCV?.url;

      const result = await createApplication(
        candidateId,
        offer.id,
        companyId,
        coverLetter || undefined,
        cvUrl
      );

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'envoi de la candidature');
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la candidature');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCV = savedCVs.find(cv => cv.id === selectedCVId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'success' ? 'Candidature envoyée !' : 'Postuler à cette offre'}
            </h2>
            {step !== 'success' && (
              <p className="text-sm text-gray-500 mt-1">{offer.title}</p>
            )}
          </div>
          {step !== 'success' && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Offer Summary */}
        {step !== 'success' && (
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {offer.company?.name || 'Entreprise'}
              </div>
              {offer.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {offer.location}
                </div>
              )}
              {offer.duration && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {offer.duration}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Select CV */}
          {step === 'select-cv' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quel CV souhaitez-vous utiliser ?
                </h3>
                <CVSelector
                  savedCVs={savedCVs}
                  selectedCVId={selectedCVId}
                  onSelect={setSelectedCVId}
                  onAddNew={() => setStep('add-cv')}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Add New CV */}
          {step === 'add-cv' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ajouter un nouveau CV
                </h3>

                {!pendingFile ? (
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
                      ${isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">
                      {isDragActive
                        ? 'Déposez le fichier ici...'
                        : 'Glissez-déposez votre CV ou cliquez pour sélectionner'
                      }
                    </p>
                    <p className="text-sm text-gray-400">PDF uniquement, max 5 MB</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{pendingFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(pendingFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setPendingFile(null);
                          setNewCVName('');
                        }}
                        className="p-2 hover:bg-blue-100 rounded-lg transition"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du CV
                      </label>
                      <input
                        type="text"
                        value={newCVName}
                        onChange={e => setNewCVName(e.target.value)}
                        placeholder="Ex: CV Finance 2024"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {isUploading && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">Upload et analyse en cours...</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Cover Letter */}
          {step === 'cover-letter' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                  Lettre de motivation
                  {offer.requiresCoverLetter ? (
                    <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                      Obligatoire
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      Optionnel
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {offer.requiresCoverLetter 
                    ? 'Cette offre requiert une lettre de motivation pour postuler'
                    : 'Personnalisez votre candidature avec un message pour le recruteur'
                  }
                </p>

                {selectedCV && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-700">
                      CV sélectionné : <strong>{selectedCV.name}</strong>
                    </span>
                  </div>
                )}

                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Bonjour,&#10;&#10;Je suis très intéressé(e) par cette opportunité...&#10;&#10;Cordialement,"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    offer.requiresCoverLetter && !coverLetter?.trim() 
                      ? 'border-amber-300 bg-amber-50' 
                      : 'border-gray-300'
                  }`}
                  rows={8}
                />
                <p className="text-sm text-gray-400 mt-2">
                  {coverLetter.length} / 2000 caractères
                </p>
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Confirmer votre candidature
                </h3>
                <p className="text-gray-600">
                  Vous êtes sur le point de postuler à cette offre
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Offre</span>
                  <span className="font-medium">{offer.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entreprise</span>
                  <span className="font-medium">{offer.company.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CV utilisé</span>
                  <span className="font-medium">{selectedCV?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lettre de motivation</span>
                  <span className="font-medium">
                    {coverLetter ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Candidature envoyée !
              </h3>
              <p className="text-gray-600 mb-4">
                Votre candidature a été transmise à {offer.company.name}
              </p>
              <p className="text-sm text-gray-500">
                Vous recevrez une notification lorsque le recruteur aura examiné votre profil
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between">
            <button
              onClick={() => {
                if (step === 'add-cv' && savedCVs.length > 0) {
                  setStep('select-cv');
                  setPendingFile(null);
                  setNewCVName('');
                } else if (step === 'cover-letter') {
                  setStep(savedCVs.length > 0 ? 'select-cv' : 'add-cv');
                } else if (step === 'confirm') {
                  setStep('cover-letter');
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
            >
              {step === 'select-cv' || (step === 'add-cv' && savedCVs.length === 0)
                ? 'Annuler'
                : 'Retour'
              }
            </button>

            <button
              onClick={() => {
                if (step === 'select-cv') {
                  if (selectedCVId) {
                    setStep('cover-letter');
                  } else {
                    setError('Veuillez sélectionner un CV');
                  }
                } else if (step === 'add-cv') {
                  handleUploadNewCV();
                } else if (step === 'cover-letter') {
                  setStep('confirm');
                } else if (step === 'confirm') {
                  handleSubmit();
                }
              }}
              disabled={
                isSubmitting ||
                isUploading ||
                (step === 'select-cv' && !selectedCVId) ||
                (step === 'add-cv' && (!pendingFile || !newCVName.trim()))
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isUploading ? 'Upload...' : 'Envoi...'}
                </>
              ) : step === 'confirm' ? (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer ma candidature
                </>
              ) : step === 'add-cv' ? (
                'Ajouter et continuer'
              ) : (
                'Continuer'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplyModal;
