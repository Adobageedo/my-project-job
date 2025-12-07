/**
 * Export centralisé des composants
 */

// Navigation
export { default as NavBar } from './layout/NavBar';
export { default as Footer } from './layout/Footer';

// Cards
export { default as JobCard } from './job/JobCard';
export { default as CandidateCard } from './candidate/CandidateCard';

// UI
export { default as Badge } from './shared/Badge';
export { default as Modal } from './shared/Modal';

// Localisation
export { 
  LocationTag, 
  LocationHierarchy, 
  LocationFilterTags, 
  MultiLocationTags 
} from './shared/LocationTag';
export { 
  LocationSearch, 
  LocationFilter, 
  LocationTagsInput 
} from './shared/LocationSearch';

// CV Management
export { CVManager, CVSelector } from './cv/CVManager';
export { default as CVUpload } from './cv/CVUpload';

// Applications
export { default as ApplicationKanban } from './job/ApplicationKanban';
export { ApplicationDetailSheet } from './job/ApplicationDetailSheet';
export { ApplyModal } from './job/ApplyModal';

// Parsing
export { default as JobOfferPDFParser } from './job/JobOfferPDFParser';
