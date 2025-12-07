/**
 * Mock data - DEPRECATED
 * Utiliser les services Supabase à la place
 * Ces données sont des placeholders pour éviter les erreurs de build
 */

export const jobOffers: any[] = [];
export const applications: any[] = [];
export const candidates: any[] = [{
  id: 'placeholder',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  school: '',
  studyLevel: 'M1',
  specialization: '',
  locations: [],
  availableFrom: new Date().toISOString(),
}];
export const companies: any[] = [{
  id: 'placeholder',
  name: '',
  sector: '',
  size: 'startup',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  description: '',
  website: '',
  logo: '',
  status: 'active',
}];
