'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Brain, 
  Zap,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  Save,
  Send
} from 'lucide-react';
import { parseJobOfferPDF } from '@/services/offerService';
import { OfferFormData, defaultFormData } from './OfferForm';
import { LocationAutocomplete } from '@/components/shared/LocationAutocomplete';
import { getCityHierarchy } from '@/data/locations';

interface ParsedOffer extends OfferFormData {
  fileName: string;
  status: 'pending' | 'parsing' | 'parsed' | 'error' | 'validated';
  error?: string;
}

interface MultiOfferPDFParserProps {
  onOffersValidated: (offers: OfferFormData[]) => void;
  onCancel: () => void;
}

// Messages de parsing animés
const PARSING_MESSAGES = [
  'Lecture du document...',
  'Extraction du titre...',
  'Analyse des missions...',
  'Identification des compétences...',
  'Détection du profil recherché...',
  'Finalisation...',
];

export default function MultiOfferPDFParser({ 
  onOffersValidated, 
  onCancel 
}: MultiOfferPDFParserProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [parsedOffers, setParsedOffers] = useState<ParsedOffer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [parsingProgress, setParsingProgress] = useState({ current: 0, total: 0 });
  const [parsingMessageIndex, setParsingMessageIndex] = useState(0);
  const [step, setStep] = useState<'upload' | 'analyze' | 'validate'>('upload');

  // Animation des messages de parsing
  useEffect(() => {
    if (!isAnalyzing) {
      setParsingMessageIndex(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setParsingMessageIndex(prev => 
        prev < PARSING_MESSAGES.length - 1 ? prev + 1 : 0
      );
    }, 1500);

    return () => clearInterval(messageInterval);
  }, [isAnalyzing]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add new files, avoiding duplicates
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const newFiles = acceptedFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...newFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Process files in batches - show validation UI immediately after first file
  const analyzeFiles = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setParsingProgress({ current: 0, total: files.length });

    // Initialize parsed offers array
    const initialOffers: ParsedOffer[] = files.map(file => ({
      ...defaultFormData,
      fileName: file.name,
      status: 'pending'
    }));
    setParsedOffers(initialOffers);

    // Process a single file
    const processFile = async (file: File, index: number): Promise<ParsedOffer> => {
      setParsedOffers(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: 'parsing' };
        return updated;
      });

      try {
        const parsedData = await parseJobOfferPDF(file);
        
        const offer: ParsedOffer = {
          ...defaultFormData,
          fileName: file.name,
          status: 'parsed',
          title: parsedData.title || '',
          description: parsedData.description || '',
          missions: parsedData.missions?.length ? parsedData.missions : ['', '', ''],
          objectives: parsedData.objectives || '',
          skills: parsedData.skills?.length ? parsedData.skills : [''],
          studyLevel: parsedData.studyLevel || [],
          duration: parsedData.duration || '',
          startDate: parsedData.startDate || '',
          salary: parsedData.salary || '',
          location: parsedData.location || '',
        };

        setParsedOffers(prev => {
          const updated = [...prev];
          updated[index] = offer;
          return updated;
        });
        setParsingProgress(prev => ({ ...prev, current: prev.current + 1 }));

        return offer;
      } catch (err) {
        console.error(`Error parsing ${file.name}:`, err);
        const errorOffer: ParsedOffer = {
          ...defaultFormData,
          fileName: file.name,
          status: 'error',
          error: 'Erreur lors de l\'analyse du fichier'
        };
        setParsedOffers(prev => {
          const updated = [...prev];
          updated[index] = errorOffer;
          return updated;
        });
        setParsingProgress(prev => ({ ...prev, current: prev.current + 1 }));
        return errorOffer;
      }
    };

    // Process first file immediately
    await processFile(files[0], 0);
    
    // Switch to validation view immediately after first file
    // User can start validating while other files are being processed
    setStep('validate');
    setCurrentFormIndex(0);

    // Process remaining files in batches of 5 in background
    if (files.length > 1) {
      const remainingFiles = files.slice(1);
      const batchSize = 5;

      for (let i = 0; i < remainingFiles.length; i += batchSize) {
        const batch = remainingFiles.slice(i, i + batchSize);
        const batchPromises = batch.map((file, batchIndex) => 
          processFile(file, i + batchIndex + 1)
        );

        await Promise.all(batchPromises);
      }
    }

    setIsAnalyzing(false);
  };

  // Handle form field changes
  const handleFormChange = (
    field: keyof OfferFormData,
    value: any
  ) => {
    setParsedOffers(prev => {
      const updated = [...prev];
      updated[currentFormIndex] = {
        ...updated[currentFormIndex],
        [field]: value
      };
      return updated;
    });
  };

  // Handle mission changes
  const handleMissionChange = (index: number, value: string) => {
    setParsedOffers(prev => {
      const updated = [...prev];
      const newMissions = [...updated[currentFormIndex].missions];
      newMissions[index] = value;
      updated[currentFormIndex] = {
        ...updated[currentFormIndex],
        missions: newMissions
      };
      return updated;
    });
  };

  const addMission = () => {
    setParsedOffers(prev => {
      const updated = [...prev];
      updated[currentFormIndex] = {
        ...updated[currentFormIndex],
        missions: [...updated[currentFormIndex].missions, '']
      };
      return updated;
    });
  };

  const removeMission = (index: number) => {
    setParsedOffers(prev => {
      const updated = [...prev];
      if (updated[currentFormIndex].missions.length > 1) {
        updated[currentFormIndex] = {
          ...updated[currentFormIndex],
          missions: updated[currentFormIndex].missions.filter((_, i) => i !== index)
        };
      }
      return updated;
    });
  };

  // Handle skill changes
  const handleSkillChange = (index: number, value: string) => {
    setParsedOffers(prev => {
      const updated = [...prev];
      const newSkills = [...updated[currentFormIndex].skills];
      newSkills[index] = value;
      updated[currentFormIndex] = {
        ...updated[currentFormIndex],
        skills: newSkills
      };
      return updated;
    });
  };

  const addSkill = () => {
    setParsedOffers(prev => {
      const updated = [...prev];
      updated[currentFormIndex] = {
        ...updated[currentFormIndex],
        skills: [...updated[currentFormIndex].skills, '']
      };
      return updated;
    });
  };

  const removeSkill = (index: number) => {
    setParsedOffers(prev => {
      const updated = [...prev];
      if (updated[currentFormIndex].skills.length > 1) {
        updated[currentFormIndex] = {
          ...updated[currentFormIndex],
          skills: updated[currentFormIndex].skills.filter((_, i) => i !== index)
        };
      }
      return updated;
    });
  };

  // Handle study level changes
  const handleStudyLevelChange = (level: string) => {
    setParsedOffers(prev => {
      const updated = [...prev];
      const currentLevels = updated[currentFormIndex].studyLevel;
      const newLevels = currentLevels.includes(level)
        ? currentLevels.filter(l => l !== level)
        : [...currentLevels, level];
      updated[currentFormIndex] = {
        ...updated[currentFormIndex],
        studyLevel: newLevels
      };
      return updated;
    });
  };

  // Validate current form and move to next
  const validateCurrentForm = () => {
    setParsedOffers(prev => {
      const updated = [...prev];
      updated[currentFormIndex] = {
        ...updated[currentFormIndex],
        status: 'validated'
      };
      return updated;
    });

    // Move to next unvalidated form
    const nextIndex = parsedOffers.findIndex((o, i) => i > currentFormIndex && o.status === 'parsed');
    if (nextIndex !== -1) {
      setCurrentFormIndex(nextIndex);
    }
  };

  // Remove offer from list
  const removeOffer = (index: number) => {
    setParsedOffers(prev => prev.filter((_, i) => i !== index));
    if (currentFormIndex >= parsedOffers.length - 1) {
      setCurrentFormIndex(Math.max(0, parsedOffers.length - 2));
    }
  };

  // Submit all validated offers
  const submitAllOffers = () => {
    const validatedOffers = parsedOffers
      .filter(o => o.status === 'validated' || o.status === 'parsed')
      .map(({ fileName, status, error, ...formData }) => formData as OfferFormData);
    
    onOffersValidated(validatedOffers);
  };

  const currentOffer = parsedOffers[currentFormIndex];
  const validatedCount = parsedOffers.filter(o => o.status === 'validated').length;
  const parsedCount = parsedOffers.filter(o => o.status === 'parsed' || o.status === 'validated').length;

  // Step 1: Upload files
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Import multiple de fiches de poste
          </h2>
          <p className="text-gray-600">
            Uploadez plusieurs fichiers PDF et notre IA les analysera automatiquement
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            {isDragActive
              ? 'Déposez les fichiers ici...'
              : 'Glissez-déposez vos fiches de poste PDF ou cliquez pour sélectionner'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Format PDF uniquement</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Tout supprimer
              </button>
            </div>
            
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isAnalyzing}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={analyzeFiles}
            disabled={files.length === 0 || isAnalyzing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Lancer l'analyse ({files.length} fichier{files.length > 1 ? 's' : ''})
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Analyzing
  if (step === 'analyze') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Brain className="w-10 h-10 text-blue-500 animate-pulse" />
            <Zap className="w-6 h-6 text-yellow-500 animate-bounce" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyse IA en cours...
          </h2>
          <p className="text-gray-600 mb-4">
            {PARSING_MESSAGES[parsingMessageIndex]}
          </p>

          {/* Progress bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Fichier {parsingProgress.current} / {parsingProgress.total}</span>
              <span>{Math.round((parsingProgress.current / parsingProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(parsingProgress.current / parsingProgress.total) * 100}%` }}
              />
            </div>
          </div>

          {/* File status list */}
          <div className="mt-8 max-w-lg mx-auto space-y-2">
            {parsedOffers.map((offer, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition ${
                  offer.status === 'parsing' ? 'bg-blue-50' :
                  offer.status === 'parsed' ? 'bg-green-50' :
                  offer.status === 'error' ? 'bg-red-50' :
                  'bg-gray-50'
                }`}
              >
                {offer.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                {offer.status === 'parsing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                {offer.status === 'parsed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {offer.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                <span className="text-sm truncate flex-1 text-left">{offer.fileName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Validate forms
  if (step === 'validate' && currentOffer) {
    const pendingCount = parsedOffers.filter(o => o.status === 'pending' || o.status === 'parsing').length;
    
    return (
      <div className="space-y-6">
        {/* Header with progress */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Validation des offres
            </h2>
            <p className="text-sm text-gray-600">
              Vérifiez et modifiez les informations extraites
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Show parsing progress if still analyzing */}
            {isAnalyzing && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-700">
                  Analyse {parsingProgress.current}/{parsingProgress.total}
                </span>
              </div>
            )}
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {currentFormIndex + 1}/{parsedOffers.length}
              </div>
              <div className="text-xs text-gray-500">
                {validatedCount} validée{validatedCount > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Offer tabs/indicators */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {parsedOffers.map((offer, index) => (
            <button
              key={index}
              onClick={() => offer.status !== 'pending' && setCurrentFormIndex(index)}
              disabled={offer.status === 'pending'}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition relative ${
                index === currentFormIndex
                  ? 'bg-blue-600 text-white shadow-md'
                  : offer.status === 'validated'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : offer.status === 'error'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : offer.status === 'parsing'
                  ? 'bg-blue-50 text-blue-600'
                  : offer.status === 'pending'
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {offer.status === 'validated' && (
                <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-600" />
              )}
              {offer.status === 'parsing' && (
                <Loader2 className="w-3 h-3 absolute -top-1 -right-1 text-blue-600 animate-spin" />
              )}
              {offer.status === 'error' && (
                <AlertCircle className="w-3 h-3 absolute -top-1 -right-1 text-red-600" />
              )}
              Offre {index + 1}
            </button>
          ))}
        </div>

        {/* Form card - styled as a "sheet" */}
        <div className="relative">
          {/* Background sheets effect */}
          {parsedOffers.length > 1 && (
            <>
              <div className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200 transform rotate-1 translate-y-2 -z-10" />
              {parsedOffers.length > 2 && (
                <div className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200 transform -rotate-1 translate-y-4 -z-20" />
              )}
            </>
          )}
          
          {/* Main form card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            {/* File name badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 truncate max-w-xs">
                  {currentOffer.fileName}
                </span>
              </div>
              <button
                onClick={() => removeOffer(currentFormIndex)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Supprimer cette offre"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {currentOffer.status === 'pending' || currentOffer.status === 'parsing' ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Brain className="w-8 h-8 text-blue-500 animate-pulse" />
                  <Zap className="w-5 h-5 text-yellow-500 animate-bounce" />
                </div>
                <p className="text-gray-600 font-medium">
                  Analyse en cours...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {currentOffer.fileName}
                </p>
              </div>
            ) : currentOffer.status === 'error' ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{currentOffer.error || 'Erreur lors de l\'analyse'}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'offre *
                  </label>
                  <input
                    type="text"
                    value={currentOffer.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Analyste Junior - M&A"
                  />
                </div>

                {/* Type et Durée */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de contrat *
                    </label>
                    <select
                      value={currentOffer.contractType}
                      onChange={(e) => handleFormChange('contractType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="stage">Stage</option>
                      <option value="alternance">Alternance</option>
                      <option value="cdi">CDI</option>
                      <option value="cdd">CDD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée *
                    </label>
                    <input
                      type="text"
                      value={currentOffer.duration}
                      onChange={(e) => handleFormChange('duration', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 6 mois"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={currentOffer.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez le poste et le contexte..."
                  />
                </div>

                {/* Missions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Missions principales
                  </label>
                  <div className="space-y-2">
                    {currentOffer.missions.map((mission, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={mission}
                          onChange={(e) => handleMissionChange(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Mission ${index + 1}`}
                        />
                        {currentOffer.missions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMission(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addMission}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Ajouter une mission
                  </button>
                </div>

                {/* Niveau d'études */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau d'études requis
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['L3', 'M1', 'M2', 'MBA'].map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentOffer.studyLevel.includes(level)}
                          onChange={() => handleStudyLevelChange(level)}
                          className="h-4 w-4 text-blue-600 rounded mr-2"
                        />
                        <span className="text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Compétences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compétences
                  </label>
                  <div className="space-y-2">
                    {currentOffer.skills.map((skill, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleSkillChange(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Compétence ${index + 1}`}
                        />
                        {currentOffer.skills.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Ajouter une compétence
                  </button>
                </div>

                {/* Lieu et Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lieu
                    </label>
                    <LocationAutocomplete
                      value={currentOffer.location ? getCityHierarchy(currentOffer.location) || { city: currentOffer.location } : null}
                      onChange={(loc) => {
                        const locationStr = loc 
                          ? (loc.city || loc.region || loc.country || '') 
                          : '';
                        handleFormChange('location', locationStr);
                      }}
                      placeholder="Rechercher une ville..."
                      allowedTypes={['city', 'region', 'country']}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={currentOffer.startDate}
                      onChange={(e) => handleFormChange('startDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Rémunération */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rémunération
                  </label>
                  <input
                    type="text"
                    value={currentOffer.salary}
                    onChange={(e) => handleFormChange('salary', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 1200-1400€/mois"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation and actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentFormIndex(Math.max(0, currentFormIndex - 1))}
              disabled={currentFormIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>
            <button
              onClick={() => setCurrentFormIndex(Math.min(parsedOffers.length - 1, currentFormIndex + 1))}
              disabled={currentFormIndex === parsedOffers.length - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3">
            {currentOffer.status !== 'validated' && currentOffer.status !== 'error' && (
              <button
                onClick={validateCurrentForm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Valider cette offre
              </button>
            )}

            {parsedCount > 0 && (
              <button
                onClick={submitAllOffers}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Créer {parsedCount} offre{parsedCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
