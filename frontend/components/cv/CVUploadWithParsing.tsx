// @ts-nocheck
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CVParseResult } from '@/types';
import { uploadCV, parseCV } from '@/services/candidateService';

interface CVUploadWithParsingProps {
  candidateId: string;
  onParseComplete?: (data: CVParseResult) => void;
  onFileUpload?: (file: File, url: string) => void;
  onError?: (error: string) => void;
}

/**
 * Composant d'upload de CV avec parsing IA automatique
 * Utilise cvService pour l'upload vers Supabase et le parsing via backend
 */
export function CVUploadWithParsing({ 
  candidateId,
  onParseComplete, 
  onFileUpload,
  onError 
}: CVUploadWithParsingProps) {
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
      // Upload du fichier via cvService
      const uploadResult = await uploadCV(candidateId, file);
      
      setUploading(false);
      setParsing(true);

      // Parser le CV avec l'IA via le backend
      const parsedData = await parseCV(file);
      
      setParsing(false);
      setParseSuccess(true);

      // Callbacks
      if (onFileUpload) {
        onFileUpload(file, uploadResult.url);
      }
      if (onParseComplete) {
        onParseComplete(parsedData);
      }

      // Reset success après 3 secondes
      setTimeout(() => setParseSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du traitement du CV';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setUploading(false);
      setParsing(false);
    }
  }, [candidateId, onFileUpload, onParseComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  return (
    <div className="space-y-4">
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
              <p className="text-sm text-slate-600">Upload du CV en cours...</p>
            </>
          ) : parsing ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
              <p className="text-sm text-slate-600">Analyse du CV par IA...</p>
              <p className="text-xs text-slate-500">Extraction des informations en cours</p>
            </>
          ) : parseSuccess ? (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <p className="text-sm text-green-600 font-medium">CV analysé avec succès !</p>
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
                {isDragActive ? 'Déposez votre CV ici' : 'Glissez-déposez votre CV ou cliquez pour sélectionner'}
              </p>
              <p className="text-xs text-slate-500">Format PDF uniquement - Max 5 MB</p>
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

      {uploadedFile && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Extraction automatique activée</p>
              <p className="text-xs text-slate-600 mt-1">
                Les informations de votre CV ont été extraites automatiquement par notre IA.
                Vous pouvez les vérifier et les modifier avant validation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CVUploadWithParsing;
