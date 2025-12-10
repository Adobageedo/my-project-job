'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, ChevronDown, Globe, Building, Map, Search } from 'lucide-react';
import {
  searchLocations,
  LocationSearchResult,
  LocationHierarchy,
  LocationType,
  getLocationTypeLabel,
} from '@/data/locations';

// =====================================================
// TYPES
// =====================================================

interface LocationAutocompleteProps {
  value?: LocationHierarchy | null;
  onChange: (location: LocationHierarchy | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  allowedTypes?: LocationType[]; // Limiter les types autorisés
  className?: string;
  disabled?: boolean;
}

interface MultiLocationAutocompleteProps {
  values: LocationHierarchy[];
  onChange: (locations: LocationHierarchy[]) => void;
  placeholder?: string;
  label?: string;
  maxLocations?: number;
  allowedTypes?: LocationType[];
  className?: string;
}

// =====================================================
// COMPOSANT PRINCIPAL - AUTOCOMPLETE SIMPLE
// =====================================================

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Rechercher une ville, région, pays...',
  label,
  required = false,
  allowedTypes = ['city', 'region', 'country', 'continent'],
  className = '',
  disabled = false,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recherche avec debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      const searchResults = searchLocations(query, 15)
        .filter(r => allowedTypes.includes(r.type));
      setResults(searchResults);
      setHighlightIndex(-1);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [query, allowedTypes]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((result: LocationSearchResult) => {
    onChange(result.hierarchy);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  }, [onChange]);

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0) {
          handleSelect(results[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const getDisplayValue = (): string => {
    if (!value) return '';
    if (value.city) return `${value.city}, ${value.region || value.country || ''}`;
    if (value.region) return `${value.region}, ${value.country || ''}`;
    if (value.country) return value.country;
    if (value.continent) return value.continent;
    return '';
  };

  const getTypeIcon = (type: LocationType) => {
    switch (type) {
      case 'city': return <Building className="h-4 w-4 text-blue-500" />;
      case 'region': return <Map className="h-4 w-4 text-purple-500" />;
      case 'country': return <MapPin className="h-4 w-4 text-green-500" />;
      case 'continent': return <Globe className="h-4 w-4 text-orange-500" />;
    }
  };

  const getTypeBadgeColor = (type: LocationType): string => {
    switch (type) {
      case 'city': return 'bg-blue-100 text-blue-700';
      case 'region': return 'bg-purple-100 text-purple-700';
      case 'country': return 'bg-green-100 text-green-700';
      case 'continent': return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value ? getDisplayValue() : query}
          onChange={(e) => {
            if (value) onChange(null);
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        {(value || query) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown des résultats */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition ${
                highlightIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
              } ${index === 0 ? 'rounded-t-xl' : ''} ${index === results.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-100'}`}
            >
              {getTypeIcon(result.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{result.label}</div>
                <div className="text-sm text-gray-500 truncate">
                  {result.hierarchy.region && result.type === 'city' && result.hierarchy.region}
                  {result.hierarchy.country && result.type !== 'continent' && (result.type === 'city' ? `, ${result.hierarchy.country}` : result.hierarchy.country)}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadgeColor(result.type)}`}>
                {getLocationTypeLabel(result.type)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Message si pas de résultats */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>Aucune localisation trouvée</p>
          <p className="text-sm">Essayez avec un autre terme</p>
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPOSANT MULTI-SÉLECTION
// =====================================================

export function MultiLocationAutocomplete({
  values,
  onChange,
  placeholder = 'Ajouter une localisation...',
  label,
  maxLocations = 5,
  allowedTypes = ['city', 'region', 'country', 'continent'],
  className = '',
}: MultiLocationAutocompleteProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (location: LocationHierarchy | null) => {
    if (!location) return;
    if (values.length >= maxLocations) return;
    
    // Éviter les doublons
    const isDuplicate = values.some(v => 
      v.city === location.city && 
      v.region === location.region && 
      v.country === location.country &&
      v.continent === location.continent
    );
    if (isDuplicate) return;
    
    onChange([...values, location]);
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const getLocationLabel = (loc: LocationHierarchy): string => {
    if (loc.city) return loc.city;
    if (loc.region) return loc.region;
    if (loc.country) return loc.country;
    if (loc.continent) return loc.continent;
    return 'Non spécifié';
  };

  const getLocationType = (loc: LocationHierarchy): LocationType => {
    if (loc.city) return 'city';
    if (loc.region) return 'region';
    if (loc.country) return 'country';
    return 'continent';
  };

  const getTagColor = (loc: LocationHierarchy): string => {
    const type = getLocationType(loc);
    switch (type) {
      case 'city': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'region': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'country': return 'bg-green-50 text-green-700 border-green-200';
      case 'continent': return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Tags existants */}
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((loc, index) => (
          <span
            key={`${getLocationLabel(loc)}-${index}`}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getTagColor(loc)}`}
          >
            <MapPin className="h-4 w-4" />
            <span className="font-medium">{getLocationLabel(loc)}</span>
            {loc.region && loc.city && (
              <span className="text-sm opacity-75">{loc.region}</span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="ml-1 hover:text-red-500 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>

      {/* Input d'ajout */}
      {values.length < maxLocations && (
        isAdding ? (
          <div className="relative">
            <LocationAutocomplete
              value={null}
              onChange={(loc) => {
                handleAdd(loc);
              }}
              placeholder={placeholder}
              allowedTypes={allowedTypes}
            />
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
          >
            <MapPin className="h-4 w-4" />
            {placeholder}
          </button>
        )
      )}

      {values.length >= maxLocations && (
        <p className="text-sm text-amber-600 mt-2">
          Maximum {maxLocations} localisations atteint
        </p>
      )}
    </div>
  );
}

// =====================================================
// COMPOSANT FILTRE DE LOCALISATION (pour recherche d'offres)
// =====================================================

interface LocationFilterDropdownProps {
  value?: LocationHierarchy | null;
  onChange: (location: LocationHierarchy | null) => void;
  placeholder?: string;
  className?: string;
}

export function LocationFilterDropdown({
  value,
  onChange,
  placeholder = 'Toutes les localisations',
  className = '',
}: LocationFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayValue = (): string => {
    if (!value) return placeholder;
    if (value.city) return value.city;
    if (value.region) return value.region;
    if (value.country) return value.country;
    if (value.continent) return value.continent;
    return placeholder;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition bg-white"
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {getDisplayValue()}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-hidden">
          {/* Recherche intégrée */}
          <div className="p-2 border-b">
            <LocationAutocomplete
              value={value}
              onChange={(loc) => {
                onChange(loc);
                setIsOpen(false);
              }}
              placeholder="Rechercher..."
            />
          </div>
          
          {/* Option "Toutes" */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-500 border-t"
            >
              <X className="h-4 w-4" />
              Effacer le filtre
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationAutocomplete;
