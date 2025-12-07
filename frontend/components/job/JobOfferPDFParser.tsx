// @ts-nocheck
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { parseJobOfferPDF } from '@/services/offerService';

interface JobOfferData {
  title?: string;
  description?: string;
  missions?: string[];
  objectives?: string;
  skills?: string[];
  studyLevel?: string[];
  duration?: string;
  startDate?: string;
  salary?: string;
  location?: string;
}

interface JobOfferPDFParserProps {
  onParseComplete: (data: JobOfferData) => void;
}

export default function JobOfferPDFParser({ onParseComplete }: JobOfferPDFParserProps) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setUploadedFile(file);

    try {
      setUploading(false);
      setParsing(true);

      // Parser la fiche de poste avec l'IA via le service
      const parsedData = await parseJobOfferPDF(file);
      
      setParsing(false);
      setParseSuccess(true);
      onParseComplete(parsedData);

      // Reset success après 3 secondes
      setTimeout(() => setParseSuccess(false), 3000);
    } catch (err) {
      setError('Erreur lors du traitement de la fiche de poste. Veuillez réessayer.');
      setUploading(false);
      setParsing(false);
    }
  }, [onParseComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="space-y-4">
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

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}
          ${uploading || parsing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-3">
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
              <p className="text-sm text-slate-600">Upload de la fiche de poste...</p>
            </>
          ) : parsing ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
              <p className="text-sm text-slate-600">Analyse par IA en cours...</p>
              <p className="text-xs text-slate-500">Extraction des informations du PDF</p>
            </>
          ) : parseSuccess ? (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <p className="text-sm text-green-600 font-medium">Fiche de poste analysée !</p>
              <p className="text-xs text-slate-500">Les champs ont été pré-remplis</p>
            </>
          ) : uploadedFile ? (
            <>
              <FileText className="w-12 h-12 mx-auto text-slate-400" />
              <p className="text-sm text-slate-600">{uploadedFile.name}</p>
              <p className="text-xs text-slate-500">
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto text-slate-400" />
              <p className="text-sm text-slate-600">
                {isDragActive 
                  ? 'Déposez la fiche de poste ici' 
                  : 'Glissez-déposez votre fiche de poste PDF ou cliquez pour sélectionner'
                }
              </p>
              <p className="text-xs text-slate-500">Format PDF uniquement - Max 10 MB</p>
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
