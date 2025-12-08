'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles, Brain, Zap } from 'lucide-react';
import { parseJobOfferPDF } from '@/services/offerService';

interface JobOfferData {
  title?: string;
  description?: string;
  missions?: string[];
  objectives?: string;
  skills?: string[];
  studyLevel?: string[];
  contractType?: string;
  duration?: string;
  startDate?: string;
  salary?: string;
  location?: string;
}

interface JobOfferPDFParserProps {
  onParseComplete: (data: JobOfferData) => void;
  onParsingStart?: () => void;
  onParsingEnd?: () => void;
  compact?: boolean;
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

export default function JobOfferPDFParser({ 
  onParseComplete, 
  onParsingStart,
  onParsingEnd,
  compact = false 
}: JobOfferPDFParserProps) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsingMessageIndex, setParsingMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Animation des messages de parsing
  useEffect(() => {
    if (!parsing) {
      setParsingMessageIndex(0);
      setProgress(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setParsingMessageIndex(prev => 
        prev < PARSING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 1500);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 95));
    }, 200);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [parsing]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setUploadedFile(file);

    try {
      setUploading(false);
      setParsing(true);
      onParsingStart?.();

      // Parser la fiche de poste avec l'IA via le service
      const parsedData = await parseJobOfferPDF(file);
      
      setProgress(100);
      setParsing(false);
      setParseSuccess(true);
      onParsingEnd?.();
      onParseComplete(parsedData);

      // Reset success après 3 secondes
      setTimeout(() => setParseSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur parsing PDF:', err);
      setError('Erreur lors du traitement de la fiche de poste. Veuillez réessayer.');
      setUploading(false);
      setParsing(false);
      onParsingEnd?.();
    }
  }, [onParseComplete, onParsingStart, onParsingEnd]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {!compact && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Création assistée par IA</p>
              <p className="text-xs text-slate-600 mt-1">
                Gagnez du temps ! Uploadez une fiche de poste PDF et notre IA remplira automatiquement 
                les champs du formulaire. Vous pourrez ensuite les vérifier et les modifier.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg text-center cursor-pointer transition-all
          ${compact ? 'p-6' : 'p-8'}
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}
          ${uploading || parsing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
          {uploading ? (
            <>
              <Loader2 className={`mx-auto text-blue-500 animate-spin ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
              <p className="text-sm text-slate-600">Upload de la fiche de poste...</p>
            </>
          ) : parsing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Brain className={`text-blue-500 animate-pulse ${compact ? 'w-6 h-6' : 'w-8 h-8'}`} />
                <Zap className={`text-yellow-500 animate-bounce ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </div>
              <p className="text-sm font-medium text-blue-600">
                {PARSING_MESSAGES[parsingMessageIndex]}
              </p>
              {!compact && (
                <>
                  <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Analyse IA en cours... {progress}%</p>
                </>
              )}
            </div>
          ) : parseSuccess ? (
            <>
              <CheckCircle className={`mx-auto text-green-500 ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
              <p className="text-sm text-green-600 font-medium">Fiche de poste analysée !</p>
              {!compact && <p className="text-xs text-slate-500">Les champs ont été pré-remplis</p>}
            </>
          ) : uploadedFile ? (
            <>
              <FileText className={`mx-auto text-slate-400 ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
              <p className="text-sm text-slate-600">{uploadedFile.name}</p>
              <p className="text-xs text-slate-500">
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
            </>
          ) : (
            <>
              <Upload className={`mx-auto text-slate-400 ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
              <p className="text-sm text-slate-600">
                {isDragActive 
                  ? 'Déposez la fiche de poste ici' 
                  : compact
                    ? 'Glissez-déposez un PDF ou cliquez'
                    : 'Glissez-déposez votre fiche de poste PDF ou cliquez pour sélectionner'
                }
              </p>
              {!compact && <p className="text-xs text-slate-500">Format PDF uniquement - Max 10 MB</p>}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
