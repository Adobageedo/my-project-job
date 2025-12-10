/**
 * Base de données de localisations hiérarchiques
 * Utilise la librairie country-state-city pour les données
 */

import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

export type LocationType = 'city' | 'region' | 'country' | 'continent';

export interface LocationHierarchy {
  city?: string;
  region?: string;
  regionCode?: string;
  country?: string;
  countryCode?: string;
  continent?: string;
}

// =====================================================
// CONTINENTS (mapping des codes pays vers continents)
// =====================================================
const CONTINENT_MAPPING: Record<string, string[]> = {
  'Europe': ['FR', 'GB', 'DE', 'ES', 'IT', 'CH', 'BE', 'NL', 'LU', 'PT', 'IE', 'AT', 'PL', 'SE', 'NO', 'DK', 'FI', 'CZ', 'GR', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'EE', 'LV', 'LT', 'MC', 'MT', 'CY'],
  'Amérique du Nord': ['US', 'CA', 'MX'],
  'Amérique du Sud': ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO'],
  'Asie': ['CN', 'JP', 'KR', 'IN', 'SG', 'HK', 'TW', 'TH', 'MY', 'ID', 'PH', 'VN', 'AE', 'SA', 'IL', 'QA', 'KW', 'BH'],
  'Océanie': ['AU', 'NZ'],
  'Afrique': ['ZA', 'MA', 'EG', 'NG', 'KE', 'TN', 'GH', 'CI', 'SN'],
};

// Inverse mapping: code pays -> continent
const COUNTRY_TO_CONTINENT: Record<string, string> = {};
Object.entries(CONTINENT_MAPPING).forEach(([continent, countries]) => {
  countries.forEach(code => {
    COUNTRY_TO_CONTINENT[code] = continent;
  });
});

// Liste des continents
export const CONTINENTS = Object.keys(CONTINENT_MAPPING);

/**
 * Obtenir le continent d'un pays par son code
 */
export function getContinentByCountryCode(countryCode: string): string {
  return COUNTRY_TO_CONTINENT[countryCode] || 'Autre';
}

// =====================================================
// PAYS PRIORITAIRES (les plus recherchés en premier)
// =====================================================
const PRIORITY_COUNTRIES = ['FR', 'GB', 'DE', 'CH', 'BE', 'LU', 'US', 'CA', 'SG', 'AE'];

/**
 * Obtenir tous les pays, triés avec les prioritaires en premier
 */
export function getAllCountries(): ICountry[] {
  const all = Country.getAllCountries();
  return all.sort((a, b) => {
    const aIdx = PRIORITY_COUNTRIES.indexOf(a.isoCode);
    const bIdx = PRIORITY_COUNTRIES.indexOf(b.isoCode);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Obtenir les régions/états d'un pays
 */
export function getStatesByCountry(countryCode: string): IState[] {
  return State.getStatesOfCountry(countryCode);
}

/**
 * Obtenir les villes d'une région
 */
export function getCitiesByState(countryCode: string, stateCode: string): ICity[] {
  return City.getCitiesOfState(countryCode, stateCode);
}

/**
 * Obtenir les villes d'un pays
 */
export function getCitiesByCountry(countryCode: string): ICity[] {
  return City.getCitiesOfCountry(countryCode) || [];
}

// =====================================================
// STRUCTURE DE RÉSULTAT DE RECHERCHE
// =====================================================
export interface LocationSearchResult {
  id: string;
  label: string;
  type: LocationType;
  hierarchy: LocationHierarchy;
  displayLabel: string;
}

/**
 * Recherche unifiée dans toutes les localisations
 */
export function searchLocations(query: string, maxResults: number = 15): LocationSearchResult[] {
  if (!query || query.length < 2) return [];
  
  const results: LocationSearchResult[] = [];
  const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const matchScore = (text: string): number => {
    const textNorm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (textNorm === queryLower) return 100;
    if (textNorm.startsWith(queryLower)) return 80;
    if (textNorm.includes(queryLower)) return 60;
    return 0;
  };

  // Chercher dans les continents
  for (const continent of CONTINENTS) {
    const score = matchScore(continent);
    if (score > 0) {
      results.push({
        id: `continent_${continent}`,
        label: continent,
        type: 'continent',
        hierarchy: { continent },
        displayLabel: `🌍 ${continent}`,
      });
    }
  }

  // Chercher dans les pays prioritaires d'abord
  const countries = getAllCountries();
  for (const country of countries.slice(0, 50)) { // Limiter pour la perf
    const score = Math.max(matchScore(country.name), matchScore(country.isoCode));
    if (score > 0) {
      const continent = getContinentByCountryCode(country.isoCode);
      results.push({
        id: `country_${country.isoCode}`,
        label: country.name,
        type: 'country',
        hierarchy: { country: country.name, countryCode: country.isoCode, continent },
        displayLabel: `${country.flag || '🏳️'} ${country.name}`,
      });
    }
  }

  // Chercher dans les régions des pays prioritaires
  for (const countryCode of PRIORITY_COUNTRIES) {
    const states = getStatesByCountry(countryCode);
    const country = Country.getCountryByCode(countryCode);
    if (!country) continue;
    
    for (const state of states.slice(0, 30)) {
      const score = matchScore(state.name);
      if (score > 0) {
        const continent = getContinentByCountryCode(countryCode);
        results.push({
          id: `region_${countryCode}_${state.isoCode}`,
          label: state.name,
          type: 'region',
          hierarchy: { 
            region: state.name, 
            regionCode: state.isoCode,
            country: country.name, 
            countryCode,
            continent 
          },
          displayLabel: `📍 ${state.name}, ${country.name}`,
        });
      }
    }
  }

  // Chercher dans les villes des pays prioritaires
  for (const countryCode of PRIORITY_COUNTRIES.slice(0, 5)) { // Top 5 pays
    const cities = getCitiesByCountry(countryCode);
    const country = Country.getCountryByCode(countryCode);
    if (!country) continue;
    
    for (const city of cities) {
      const score = matchScore(city.name);
      if (score > 0 && results.length < maxResults * 2) {
        const state = city.stateCode ? State.getStateByCodeAndCountry(city.stateCode, countryCode) : null;
        const continent = getContinentByCountryCode(countryCode);
        results.push({
          id: `city_${countryCode}_${city.stateCode}_${city.name}`,
          label: city.name,
          type: 'city',
          hierarchy: { 
            city: city.name, 
            region: state?.name,
            regionCode: city.stateCode,
            country: country.name, 
            countryCode,
            continent 
          },
          displayLabel: `🏙️ ${city.name}${state ? `, ${state.name}` : ''}, ${country.name}`,
        });
      }
    }
  }

  // Trier par pertinence et limiter
  return results
    .sort((a, b) => {
      const aScore = matchScore(a.label);
      const bScore = matchScore(b.label);
      if (aScore !== bScore) return bScore - aScore;
      
      // Prioriser par type (ville > région > pays > continent)
      const typeOrder: Record<LocationType, number> = { city: 0, region: 1, country: 2, continent: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    })
    .slice(0, maxResults);
}

/**
 * Obtenir la hiérarchie complète d'une ville par son nom
 */
export function getCityHierarchy(cityName: string, countryCode?: string): LocationHierarchy | null {
  const countries = countryCode ? [countryCode] : PRIORITY_COUNTRIES;
  
  for (const code of countries) {
    const cities = getCitiesByCountry(code);
    const city = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    
    if (city) {
      const country = Country.getCountryByCode(code);
      const state = city.stateCode ? State.getStateByCodeAndCountry(city.stateCode, code) : null;
      const continent = getContinentByCountryCode(code);
      
      return {
        city: city.name,
        region: state?.name,
        regionCode: city.stateCode,
        country: country?.name,
        countryCode: code,
        continent,
      };
    }
  }
  return null;
}

/**
 * Vérifier si une localisation correspond à un filtre
 * Supporte la hiérarchie : continent inclut tous les pays, etc.
 */
export function locationMatchesFilter(
  location: LocationHierarchy,
  filter: LocationHierarchy
): boolean {
  // Si filtre par continent
  if (filter.continent && !filter.country && !filter.region && !filter.city) {
    return location.continent === filter.continent;
  }
  
  // Si filtre par pays
  if (filter.countryCode && !filter.region && !filter.city) {
    return location.countryCode === filter.countryCode;
  }
  if (filter.country && !filter.region && !filter.city) {
    return location.country === filter.country;
  }
  
  // Si filtre par région
  if (filter.regionCode && !filter.city) {
    return location.regionCode === filter.regionCode;
  }
  if (filter.region && !filter.city) {
    return location.region === filter.region;
  }
  
  // Si filtre par ville
  if (filter.city) {
    return location.city?.toLowerCase() === filter.city.toLowerCase();
  }
  
  return true;
}

/**
 * Formater une hiérarchie pour affichage
 */
export function formatLocationHierarchy(
  hierarchy: LocationHierarchy,
  format: 'full' | 'short' | 'minimal' = 'short'
): string {
  const parts: string[] = [];
  
  if (hierarchy.city) parts.push(hierarchy.city);
  if (hierarchy.region && format !== 'minimal') parts.push(hierarchy.region);
  if (hierarchy.country && format === 'full') parts.push(hierarchy.country);
  if (hierarchy.continent && format === 'full') parts.push(hierarchy.continent);
  
  return parts.join(', ') || 'Non spécifié';
}

/**
 * Obtenir l'icône selon le type de localisation
 */
export function getLocationTypeIcon(type: LocationType): string {
  switch (type) {
    case 'city': return '🏙️';
    case 'region': return '📍';
    case 'country': return '🏳️';
    case 'continent': return '🌍';
    default: return '📍';
  }
}

/**
 * Obtenir le label du type de localisation
 */
export function getLocationTypeLabel(type: LocationType): string {
  switch (type) {
    case 'city': return 'Ville';
    case 'region': return 'Région';
    case 'country': return 'Pays';
    case 'continent': return 'Continent';
    default: return 'Localisation';
  }
}

// =====================================================
// EXPORTS POUR COMPATIBILITÉ AVEC L'ANCIEN CODE
// =====================================================

// Ancienne structure FRENCH_REGIONS pour compatibilité
export const FRENCH_REGIONS: Record<string, string[]> = {};
const frStates = getStatesByCountry('FR');
frStates.forEach(state => {
  const cities = getCitiesByState('FR', state.isoCode);
  FRENCH_REGIONS[state.name] = cities.slice(0, 20).map(c => c.name);
});

/**
 * Obtenir la région française d'une ville (compatibilité)
 */
export function getRegionFromCity(city?: string | null): string {
  if (!city) return 'Autre';
  for (const [region, cities] of Object.entries(FRENCH_REGIONS)) {
    if (cities.some(c => c.toLowerCase() === city.toLowerCase())) {
      return region;
    }
  }
  return 'Autre';
}
