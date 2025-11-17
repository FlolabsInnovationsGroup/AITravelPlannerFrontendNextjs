// Enhanced Map Panel with better UX and visual design
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Location } from '@/types/map';
import { Map, Layers, Search, Filter, MoreVertical, Route, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';

// Lazy load the actual map component
const GoogleMapComponent = dynamic(() => import('./GoogleMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center p-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <Map className="w-6 h-6 absolute inset-0 m-auto text-blue-600" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading interactive map...</p>
        <p className="mt-1 text-sm text-gray-500">Preparing your travel experience</p>
      </div>
    </div>
  )
});

interface MapControlsProps {
  locations: Location[];
  onLocationSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  onRouteGenerate?: () => void;
  onShare?: () => void;
}

function MapControls({ 
  locations, 
  onLocationSearch, 
  onFilterChange, 
  onRouteGenerate, 
  onShare 
}: MapControlsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filters = [
    { id: 'all', label: 'All Locations', count: locations.length },
    { id: 'attraction', label: 'Attractions', count: locations.filter(l => l.type === 'attraction').length },
    { id: 'restaurant', label: 'Restaurants', count: locations.filter(l => l.type === 'restaurant').length },
    { id: 'hotel', label: 'Hotels', count: locations.filter(l => l.type === 'hotel').length },
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">Travel Map</h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            {locations.length} location{locations.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRouteGenerate}
            className="h-8 px-3 text-gray-600 hover:text-blue-600"
            disabled={locations.length < 2}
          >
            <Route size={16} />
            <span className="ml-1 text-xs">Route</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="h-8 px-3 text-gray-600 hover:text-green-600"
          >
            <Share size={16} />
            <span className="ml-1 text-xs">Share</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800"
          >
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onLocationSearch?.(e.target.value);
          }}
          className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setSelectedFilter(filter.id);
                onFilterChange?.(filter.id);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface EnhancedMapPanelProps {
  currentSessionId: string | null;
  currentUserToken: string | null;
  onLocationUpdate?: (locations: Location[]) => void;
  className?: string;
}

export default function EnhancedMapPanel({
  currentSessionId,
  currentUserToken,
  onLocationUpdate,
  className = ""
}: EnhancedMapPanelProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleLocationSearch = useCallback((query: string) => {
    if (!query) {
      setFilteredLocations(locations);
      return;
    }
    
    const filtered = locations.filter(location =>
      (location.name && location.name.toLowerCase().includes(query.toLowerCase())) ||
      (location.vicinity && location.vicinity.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredLocations(filtered);
  }, [locations]);

  const handleFilterChange = useCallback((filter: string) => {
    if (filter === 'all') {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter(location => location.type === filter);
      setFilteredLocations(filtered);
    }
  }, [locations]);

  const handleRouteGenerate = useCallback(() => {
    if (locations.length < 2) return;
    
    // Generate route between locations
    // This would integrate with Google Directions API
    // Generating route for selected locations
  }, [locations]);

  const handleShare = useCallback(() => {
    // Share functionality
    const shareData = {
      title: 'My Travel Map',
      text: `Check out my travel map with ${locations.length} locations!`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  }, [locations]);

  return (
    <div className={`h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Controls Header */}
      <MapControls
        locations={filteredLocations}
        onLocationSearch={handleLocationSearch}
        onFilterChange={handleFilterChange}
        onRouteGenerate={handleRouteGenerate}
        onShare={handleShare}
      />

      {/* Map Container */}
      <div className="flex-1 relative">
        {error ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Map className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Unable to load map</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} size="sm">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <GoogleMapComponent
            locations={filteredLocations}
            onLocationAdd={(location) => {
              // Handle location addition if needed
              onLocationUpdate?.(locations);
            }}
            onLocationSelect={(location) => {
              // Handle location selection
              // Location selection handled internally
            }}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Updating map...</span>
            </div>
          </div>
        )}
      </div>

      {/* Location Summary */}
      {locations.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing {filteredLocations.length} of {locations.length} locations
            </span>
            {locations.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRouteGenerate}
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
              >
                <Route size={12} />
                <span className="ml-1">Create Route</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}