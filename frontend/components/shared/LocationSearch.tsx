'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, ChevronDown, X, Check } from 'lucide-react';
import { Location, FRENCH_REGIONS, createLocationFromCity } from '@/types';

// Re-export depuis le nouveau composant unifié
export { 
  LocationAutocomplete,
  MultiLocationAutocomplete,
  LocationFilterDropdown,
} from './LocationAutocomplete';
export type { LocationHierarchy, LocationSearchResult } from '@/data/locations';

interface LocationSearchProps {
  value?: Location;
  onChange: (location: Location | undefined) => void;
  placeholder?: string;
  showHierarchy?: boolean;
}

/**
 * Composant de recherche de localisation avec autocomplétion
 */
export function LocationSearch({
  value,
  onChange,
  placeholder = 'Rechercher une ville...',
  showHierarchy = true,
}: LocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Générer les suggestions basées sur la recherche
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    const searchLower = search.toLowerCase();
    const results: Location[] = [];

    for (const [region, cities] of Object.entries(FRENCH_REGIONS)) {
      for (const city of cities) {
        if (city.toLowerCase().includes(searchLower) || region.toLowerCase().includes(searchLower)) {
          results.push(createLocationFromCity(city));
        }
      }
    }

    setSuggestions(results.slice(0, 10));
  }, [search]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location: Location) => {
    onChange(location);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setSearch('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value ? `${value.city}, ${value.region}` : search}
          onChange={e => {
            setSearch(e.target.value);
            if (value) onChange(undefined);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {(value || search) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((loc, index) => (
            <button
              key={`${loc.city}-${index}`}
              onClick={() => handleSelect(loc)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{loc.city}</div>
                {showHierarchy && (
                  <div className="text-sm text-gray-500">
                    {loc.region}, {loc.country}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface LocationFilterProps {
  selectedCity?: string;
  selectedRegion?: string;
  selectedCountry?: string;
  onCityChange: (city: string | undefined) => void;
  onRegionChange: (region: string | undefined) => void;
  onCountryChange: (country: string | undefined) => void;
  showCitySearch?: boolean;
}

/**
 * Filtres de localisation hiérarchiques pour la recherche d'offres
 */
export function LocationFilter({
  selectedCity,
  selectedRegion,
  selectedCountry,
  onCityChange,
  onRegionChange,
  onCountryChange,
  showCitySearch = true,
}: LocationFilterProps) {
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<{city: string; region: string}[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);

  const regions = Object.keys(FRENCH_REGIONS);
  const cities = selectedRegion ? FRENCH_REGIONS[selectedRegion] || [] : [];

  // Recherche de ville avec autocomplétion
  useEffect(() => {
    if (!citySearch.trim()) {
      setCitySuggestions([]);
      return;
    }

    const searchLower = citySearch.toLowerCase();
    const results: {city: string; region: string}[] = [];

    for (const [region, regionCities] of Object.entries(FRENCH_REGIONS)) {
      for (const city of regionCities) {
        if (city.toLowerCase().includes(searchLower)) {
          results.push({ city, region });
        }
      }
    }

    setCitySuggestions(results.slice(0, 8));
  }, [citySearch]);

  const handleCitySelect = (city: string, region: string) => {
    onCityChange(city);
    onRegionChange(region);
    setCitySearch('');
    setShowCitySuggestions(false);
  };

  return (
    <div className="space-y-3">
      {/* Recherche rapide de ville */}
      {showCitySearch && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recherche rapide
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={cityInputRef}
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCitySuggestions(true);
              }}
              onFocus={() => setShowCitySuggestions(true)}
              placeholder="Tapez une ville..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {citySuggestions.map(({ city, region }) => (
                <button
                  key={`${city}-${region}`}
                  onClick={() => handleCitySelect(city, region)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{city}</span>
                  </span>
                  <span className="text-sm text-gray-500">{region}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showCitySearch && <div className="text-center text-xs text-gray-400">ou filtrez par région</div>}

      {/* Région */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Région
        </label>
        <button
          onClick={() => setIsRegionOpen(!isRegionOpen)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition"
        >
          <span className={selectedRegion ? 'text-gray-900' : 'text-gray-500'}>
            {selectedRegion || 'Toutes les régions'}
          </span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition ${isRegionOpen ? 'rotate-180' : ''}`} />
        </button>

        {isRegionOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onRegionChange(undefined);
                onCityChange(undefined);
                setIsRegionOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-gray-500">Toutes les régions</span>
              {!selectedRegion && <Check className="h-4 w-4 text-blue-600" />}
            </button>
            {regions.map(region => (
              <button
                key={region}
                onClick={() => {
                  onRegionChange(region);
                  onCityChange(undefined);
                  setIsRegionOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span>{region}</span>
                {selectedRegion === region && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ville (disponible si région sélectionnée) */}
      {selectedRegion && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville
          </label>
          <button
            onClick={() => setIsCityOpen(!isCityOpen)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition"
          >
            <span className={selectedCity ? 'text-gray-900' : 'text-gray-500'}>
              {selectedCity || 'Toutes les villes'}
            </span>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition ${isCityOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCityOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  onCityChange(undefined);
                  setIsCityOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="text-gray-500">Toutes les villes</span>
                {!selectedCity && <Check className="h-4 w-4 text-blue-600" />}
              </button>
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => {
                    onCityChange(city);
                    setIsCityOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>{city}</span>
                  {selectedCity === city && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LocationTagsInputProps {
  locations: Location[];
  onChange: (locations: Location[]) => void;
  maxLocations?: number;
  placeholder?: string;
}

/**
 * Input pour sélectionner plusieurs localisations (souhaits candidat)
 */
export function LocationTagsInput({
  locations,
  onChange,
  maxLocations = 5,
  placeholder = 'Ajouter une localisation...',
}: LocationTagsInputProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (location: Location) => {
    if (locations.length >= maxLocations) return;
    if (locations.some(l => l.city === location.city)) return;
    
    onChange([...locations, location]);
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(locations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Tags existants */}
      <div className="flex flex-wrap gap-2">
        {locations.map((loc, index) => (
          <span
            key={`${loc.city}-${index}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full"
          >
            <MapPin className="h-4 w-4" />
            <span className="font-medium">{loc.city}</span>
            <span className="text-blue-500 text-sm">{loc.region}</span>
            <button
              onClick={() => handleRemove(index)}
              className="ml-1 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>

      {/* Bouton/Input d'ajout */}
      {locations.length < maxLocations && (
        isAdding ? (
          <div className="relative">
            <LocationSearch
              onChange={(loc) => {
                if (loc) handleAdd(loc);
              }}
              placeholder={placeholder}
            />
            <button
              onClick={() => setIsAdding(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
          >
            <MapPin className="h-4 w-4" />
            {placeholder}
          </button>
        )
      )}

      {locations.length >= maxLocations && (
        <p className="text-sm text-amber-600">
          Maximum {maxLocations} localisations atteint
        </p>
      )}
    </div>
  );
}

export default LocationSearch;
