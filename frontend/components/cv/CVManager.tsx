// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  Upload,
  Trash2,
  Star,
  StarOff,
  Download,
  Eye,
  Plus,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { SavedCV } from '@/types';
import { uploadCV } from '@/services';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Helper function to format dates
const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  try {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  } catch {
    return '';
  }
};

interface CVManagerProps {
  candidateId: string;
  savedCVs: SavedCV[];
  defaultCVId?: string;
  onCVsChange: (cvs: SavedCV[]) => void;
  onDefaultChange: (cvId: string) => void;
  onDelete?: (cvId: string) => void;
  maxCVs?: number;
}

/**
 * Gestionnaire de CV multiples pour les candidats
 */
export function CVManager({
  candidateId,
  savedCVs,
  defaultCVId,
  onCVsChange,
  onDefaultChange,
  onDelete,
  maxCVs = 5,
}: CVManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCVName, setNewCVName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPendingFile(acceptedFiles[0]);
      setNewCVName(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
      setShowAddModal(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: savedCVs.length >= maxCVs,
  });

  const handleUpload = async () => {
    if (!pendingFile || !newCVName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload du fichier vers Supabase Storage
      const result = await uploadCV(candidateId, pendingFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Le CV est déjà créé dans uploadCV, on recharge les CVs
      // Créer un objet temporaire pour l'affichage immédiat
      const newCV: SavedCV = {
        id: result.cvId || `cv-${Date.now()}`,
        userId: candidateId,
        name: newCVName.trim(),
        filename: pendingFile.name,
        url: result.url || '',
        storagePath: `${candidateId}/${Date.now()}.pdf`,
        isDefault: savedCVs.length === 0, // Premier CV = défaut
        fileSize: pendingFile.size,
        mimeType: pendingFile.type || 'application/pdf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedCVs = [...savedCVs, newCV];
      onCVsChange(updatedCVs);

      if (newCV.isDefault) {
        onDefaultChange(newCV.id);
      }

      // Reset
      setShowAddModal(false);
      setPendingFile(null);
      setNewCVName('');
    } catch (error) {
      console.error('Erreur upload CV:', error);
      alert('Erreur lors de l\'upload du CV');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (cvId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce CV ?')) return;

    // Si un callback onDelete est fourni, l'utiliser (pour la suppression en base)
    if (onDelete) {
      onDelete(cvId);
    } else {
      // Fallback: mise à jour locale uniquement
      const updatedCVs = savedCVs.filter(cv => cv.id !== cvId);
      onCVsChange(updatedCVs);

      // Si c'était le CV par défaut, définir le premier comme nouveau défaut
      if (cvId === defaultCVId && updatedCVs.length > 0) {
        onDefaultChange(updatedCVs[0].id);
      }
    }
  };

  const handleSetDefault = (cvId: string) => {
    const updatedCVs = savedCVs.map(cv => ({
      ...cv,
      isDefault: cv.id === cvId,
    }));
    onCVsChange(updatedCVs);
    onDefaultChange(cvId);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Taille inconnue';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'Date inconnue';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'Date inconnue';
    return format(date, 'dd MMM yyyy', { locale: fr });
  };

  return (
    <div className="space-y-4">
      {/* Liste des CV */}
      <div className="space-y-3">
        {savedCVs.map(cv => (
          <div
            key={cv.id}
            className={`
              flex items-center justify-between p-4 rounded-lg border
              ${cv.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-lg
                ${cv.isDefault ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <FileText className={`h-6 w-6 ${cv.isDefault ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{cv.name}</span>
                  {cv.isDefault && (
                    <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      Par défaut
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatFileSize(cv.fileSize)} • Ajouté le{' '}
                  {formatDate(cv.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voir */}
              <a
                href={cv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Voir le CV"
              >
                <Eye className="h-5 w-5" />
              </a>

              {/* Télécharger */}
              <a
                href={cv.url}
                download={cv.filename}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                title="Télécharger"
              >
                <Download className="h-5 w-5" />
              </a>

              {/* Définir par défaut */}
              {!cv.isDefault && (
                <button
                  onClick={() => handleSetDefault(cv.id)}
                  className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                  title="Définir par défaut"
                >
                  <StarOff className="h-5 w-5" />
                </button>
              )}
              {cv.isDefault && (
                <button
                  className="p-2 text-yellow-500 cursor-default"
                  title="CV par défaut"
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              )}

              {/* Supprimer */}
              <button
                onClick={() => handleDelete(cv.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Supprimer"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}

        {savedCVs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun CV enregistré</p>
            <p className="text-sm">Ajoutez votre premier CV pour postuler aux offres</p>
          </div>
        )}
      </div>

      {/* Zone d'upload */}
      {savedCVs.length < maxCVs && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">
            {isDragActive
              ? 'Déposez le fichier ici...'
              : 'Glissez-déposez un CV ou cliquez pour sélectionner'
            }
          </p>
          <p className="text-sm text-gray-400 mt-1">
            PDF uniquement, max 5 MB ({savedCVs.length}/{maxCVs} CV)
          </p>
        </div>
      )}

      {/* Modal de nommage */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Nommer votre CV</h3>
            
            <div className="mb-4">
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
              <p className="text-sm text-gray-500 mt-1">
                Fichier : {pendingFile?.name}
              </p>
            </div>

            {isUploading && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Upload en cours...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setPendingFile(null);
                  setNewCVName('');
                }}
                disabled={isUploading}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || !newCVName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CVSelectorProps {
  savedCVs: SavedCV[];
  selectedCVId?: string;
  onSelect: (cvId: string) => void;
  onAddNew: () => void;
  allowAddNew?: boolean;
}

/**
 * Sélecteur de CV pour la candidature
 */
export function CVSelector({
  savedCVs,
  selectedCVId,
  onSelect,
  onAddNew,
  allowAddNew = true,
}: CVSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Sélectionnez un CV pour cette candidature
      </label>

      <div className="space-y-2">
        {savedCVs.map(cv => (
          <label
            key={cv.id}
            className={`
              flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition
              ${selectedCVId === cv.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name="cv-selection"
              value={cv.id}
              checked={selectedCVId === cv.id}
              onChange={() => onSelect(cv.id)}
              className="h-4 w-4 text-blue-600"
            />
            
            <FileText className={`h-5 w-5 ${selectedCVId === cv.id ? 'text-blue-600' : 'text-gray-400'}`} />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{cv.name}</span>
                {cv.isDefault && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                    Par défaut
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                Ajouté le {formatDate(cv.createdAt)}
              </span>
            </div>

            {selectedCVId === cv.id && (
              <Check className="h-5 w-5 text-blue-600" />
            )}
          </label>
        ))}

        {allowAddNew && (
          <button
            onClick={onAddNew}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
          >
            <Plus className="h-5 w-5" />
            Ajouter un nouveau CV
          </button>
        )}
      </div>

      {savedCVs.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          ⚠️ Vous devez ajouter au moins un CV pour postuler
        </p>
      )}
    </div>
  );
}

export default CVManager;
