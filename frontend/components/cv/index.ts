/**
 * Module de gestion des CV
 * Composants pour upload, gestion et sélection des CV candidats
 */

export { CVUploadWithParsing } from './CVUploadWithParsing';
export { default } from './CVUploadWithParsing';

// Ré-exports des composants existants (à migrer progressivement)
export { CVManager, CVSelector } from './CVManager';
export { default as CVUpload } from './CVUpload';
