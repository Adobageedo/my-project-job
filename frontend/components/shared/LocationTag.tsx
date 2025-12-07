'use client';

import { MapPin, ChevronRight } from 'lucide-react';
import { Location, formatLocation, createLocationFromCity } from '@/types';

interface LocationTagProps {
  location: Location | string;
  format?: 'full' | 'short' | 'city';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Composant pour afficher une localisation de manière hiérarchique
 * Ville → Région → Pays
 */
export function LocationTag({
  location,
  format = 'short',
  size = 'md',
  showIcon = true,
  className = '',
  onClick,
}: LocationTagProps) {
  // Convertir string en Location si nécessaire
  const loc: Location = typeof location === 'string' 
    ? createLocationFromCity(location) 
    : location;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full
        bg-blue-50 text-blue-700 font-medium
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {showIcon && <MapPin className={iconSizes[size]} />}
      {formatLocation(loc, format)}
    </span>
  );
}

interface LocationHierarchyProps {
  location: Location | string;
  showCountry?: boolean;
  className?: string;
}

/**
 * Affiche la localisation sous forme hiérarchique avec séparateurs
 * Paris → Île-de-France → France
 */
export function LocationHierarchy({
  location,
  showCountry = true,
  className = '',
}: LocationHierarchyProps) {
  const loc: Location = typeof location === 'string' 
    ? createLocationFromCity(location) 
    : location;

  return (
    <div className={`flex items-center gap-1 text-sm text-gray-600 ${className}`}>
      <MapPin className="h-4 w-4 text-gray-400" />
      <span className="font-medium text-gray-900">{loc.city}</span>
      <ChevronRight className="h-3 w-3 text-gray-400" />
      <span className="text-gray-600">{loc.region}</span>
      {showCountry && (
        <>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="text-gray-500">{loc.country}</span>
        </>
      )}
    </div>
  );
}

interface LocationFilterTagsProps {
  selectedCity?: string;
  selectedRegion?: string;
  selectedCountry?: string;
  onCityChange?: (city: string | undefined) => void;
  onRegionChange?: (region: string | undefined) => void;
  onCountryChange?: (country: string | undefined) => void;
  onClear?: () => void;
}

/**
 * Tags de filtres de localisation pour la recherche
 */
export function LocationFilterTags({
  selectedCity,
  selectedRegion,
  selectedCountry,
  onCityChange,
  onRegionChange,
  onCountryChange,
  onClear,
}: LocationFilterTagsProps) {
  const hasFilters = selectedCity || selectedRegion || selectedCountry;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500">Filtres :</span>
      
      {selectedCountry && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
          🌍 {selectedCountry}
          <button
            onClick={() => onCountryChange?.(undefined)}
            className="ml-1 hover:text-red-500"
          >
            ×
          </button>
        </span>
      )}
      
      {selectedRegion && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
          📍 {selectedRegion}
          <button
            onClick={() => onRegionChange?.(undefined)}
            className="ml-1 hover:text-red-500"
          >
            ×
          </button>
        </span>
      )}
      
      {selectedCity && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
          🏙️ {selectedCity}
          <button
            onClick={() => onCityChange?.(undefined)}
            className="ml-1 hover:text-red-500"
          >
            ×
          </button>
        </span>
      )}
      
      {hasFilters && onClear && (
        <button
          onClick={onClear}
          className="text-sm text-red-500 hover:text-red-700 underline"
        >
          Effacer tout
        </button>
      )}
    </div>
  );
}

interface MultiLocationTagsProps {
  locations: (Location | string)[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  onRemove?: (index: number) => void;
}

/**
 * Affiche plusieurs localisations sous forme de tags
 */
export function MultiLocationTags({
  locations,
  maxDisplay = 3,
  size = 'sm',
  onRemove,
}: MultiLocationTagsProps) {
  const displayedLocations = locations.slice(0, maxDisplay);
  const remainingCount = locations.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-2">
      {displayedLocations.map((loc, index) => (
        <span
          key={index}
          className={`
            inline-flex items-center gap-1 rounded-full
            bg-blue-50 text-blue-700
            ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
          `}
        >
          <MapPin className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
          {typeof loc === 'string' ? loc : loc.city}
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="ml-1 hover:text-red-500 font-bold"
            >
              ×
            </button>
          )}
        </span>
      ))}
      
      {remainingCount > 0 && (
        <span className={`
          inline-flex items-center rounded-full
          bg-gray-100 text-gray-600
          ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
        `}>
          +{remainingCount} autre{remainingCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

export default LocationTag;
