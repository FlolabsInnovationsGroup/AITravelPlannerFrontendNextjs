import React, { useState } from 'react';
import { Filter, MapPin, DollarSign, Star } from 'lucide-react';
import { LocationType } from '@/types/map';

interface MapFiltersProps {
  onFiltersChange: (filters: MapFilterState) => void;
  activeFilters: MapFilterState;
  locationCount?: number;
}

export interface MapFilterState {
  types: LocationType[];
  priceRange: [number, number];
  rating: number;
  distance: number;
  showRoutes: boolean;
  showWeather: boolean;
}

const DEFAULT_FILTERS: MapFilterState = {
  types: [],
  priceRange: [0, 1000],
  rating: 0,
  distance: 50,
  showRoutes: true,
  showWeather: false
};

const LOCATION_TYPES: { type: LocationType; label: string; icon: string; color: string }[] = [
  { type: 'hotel', label: 'Hotels', icon: '🏨', color: 'bg-blue-500' },
  { type: 'restaurant', label: 'Restaurants', icon: '🍽️', color: 'bg-orange-500' },
  { type: 'cafe', label: 'Cafes', icon: '☕', color: 'bg-green-500' },
  { type: 'attraction', label: 'Attractions', icon: '🏛️', color: 'bg-red-500' },
  { type: 'transport', label: 'Transport', icon: '🚉', color: 'bg-purple-500' },
  { type: 'shopping', label: 'Shopping', icon: '🛍️', color: 'bg-yellow-500' }
];

const MapFilters: React.FC<MapFiltersProps> = ({
  onFiltersChange,
  activeFilters,
  locationCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<MapFilterState>(activeFilters);

  const hasActiveFilters = 
    localFilters.types.length > 0 ||
    localFilters.priceRange[0] > 0 ||
    localFilters.priceRange[1] < 1000 ||
    localFilters.rating > 0 ||
    localFilters.distance < 50;

  const handleTypeToggle = (type: LocationType) => {
    const updatedTypes = localFilters.types.includes(type)
      ? localFilters.types.filter(t => t !== type)
      : [...localFilters.types, type];
    
    const newFilters = { ...localFilters, types: updatedTypes };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    const newFilters = { ...localFilters, priceRange: [min, max] as [number, number] };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRatingChange = (rating: number) => {
    const newFilters = { ...localFilters, rating };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDistanceChange = (distance: number) => {
    const newFilters = { ...localFilters, distance };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleLayerToggle = (layer: 'showRoutes' | 'showWeather') => {
    const newFilters = { ...localFilters, [layer]: !localFilters[layer] };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Toggle Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
        >
          <Filter size={16} />
          Map Filters
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {localFilters.types.length + (localFilters.rating > 0 ? 1 : 0)}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-2">
          {locationCount > 0 && (
            <span className="text-xs text-gray-500">
              {locationCount} locations
            </span>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Location Types */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Location Types
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LOCATION_TYPES.map(({ type, label, icon }) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`flex items-center gap-2 p-2 rounded-md border text-sm transition-colors ${
                    localFilters.types.includes(type)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Price Range (per night/meal)
            </div>
            <div className="flex items-center gap-3">
              <DollarSign size={16} className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="500"
                value={localFilters.priceRange[1]}
                onChange={(e) => handlePriceRangeChange(0, parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 min-w-[60px]">
                ${localFilters.priceRange[1]}
              </span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  type="button"
                  key={rating}
                  onClick={() => handleRatingChange(rating === localFilters.rating ? 0 : rating)}
                  className={`p-1 rounded transition-colors ${
                    rating <= localFilters.rating
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star size={20} fill="currentColor" />
                </button>
              ))}
              <span className="text-sm text-gray-600 ml-2">
                {localFilters.rating > 0 ? `${localFilters.rating}+ stars` : 'Any rating'}
              </span>
            </div>
          </div>

          {/* Distance Range */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Search Radius
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-gray-400" />
              <input
                type="range"
                min="1"
                max="100"
                value={localFilters.distance}
                onChange={(e) => handleDistanceChange(parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 min-w-[50px]">
                {localFilters.distance} km
              </span>
            </div>
          </div>

          {/* Map Layers */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Map Layers
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localFilters.showRoutes}
                  onChange={() => handleLayerToggle('showRoutes')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Show Routes & Directions</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localFilters.showWeather}
                  onChange={() => handleLayerToggle('showWeather')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Weather Overlay</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapFilters;