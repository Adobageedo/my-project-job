/**
 * Service d'upload de fichiers vers Supabase Storage
 */

import { supabase } from '@/lib/supabase';

/**
 * Upload un logo d'entreprise (fichier ou URL)
 */
export async function uploadCompanyLogo(
  companyId: string,
  source: File | string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    let fileToUpload: File;
    
    if (typeof source === 'string') {
      // C'est une URL - télécharger le fichier
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error('Impossible de télécharger l\'image depuis l\'URL');
      }
      
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || 'image/png';
      const extension = contentType.split('/')[1] || 'png';
      fileToUpload = new File([blob], `logo.${extension}`, { type: contentType });
    } else {
      fileToUpload = source;
    }

    // Valider le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(fileToUpload.type)) {
      return { success: false, error: 'Format non supporté. Utilisez JPG, PNG, GIF, WebP ou SVG.' };
    }

    // Valider la taille (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (fileToUpload.size > maxSize) {
      return { success: false, error: 'Le fichier est trop volumineux (max 2MB)' };
    }

    // Générer un nom de fichier unique
    const extension = fileToUpload.name.split('.').pop() || 'png';
    const fileName = `${companyId}/logo_${Date.now()}.${extension}`;

    // Upload vers le bucket "logos"
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);

    return { success: true, url: urlData.publicUrl };
  } catch (error: unknown) {
    console.error('Upload logo error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Supprimer un logo d'entreprise
 */
export async function deleteCompanyLogo(
  logoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = logoUrl.split('/logos/');
    if (urlParts.length < 2) {
      return { success: false, error: 'URL de logo invalide' };
    }
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from('logos')
      .remove([filePath]);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    console.error('Delete logo error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Mettre à jour le logo d'une entreprise dans la base
 */
export async function updateCompanyLogoUrl(
  companyId: string,
  logoUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('companies')
      .update({ logo_url: logoUrl })
      .eq('id', companyId);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    console.error('Update logo URL error:', error);
    return { success: false, error: (error as Error).message };
  }
}
