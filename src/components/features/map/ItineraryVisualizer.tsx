'use client';

import React, { useState, useMemo } from 'react';
import { Navigation, Clock, MapPin, Route, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { Location } from '@/types/map';

interface ItineraryVisualizerProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  onRouteOptimize?: (optimizedOrder: Location[]) => void;
  className?: string;
}

interface RouteSegment {
  from: Location;
  to: Location;
  distance: number;
  duration: number;
  mode: 'driving' | 'walking' | 'transit';
}

// ==================== HELPER FUNCTIONS ====================
// These must be defined before the component to avoid no-use-before-define errors

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateDuration(distanceKm: number, mode: 'driving' | 'walking' | 'transit'): number {
  // Returns duration in minutes
  switch (mode) {
    case 'driving':
      return distanceKm * 2; // ~30 km/h in city traffic
    case 'walking':
      return distanceKm * 12; // ~5 km/h walking speed
    case 'transit':
      return distanceKm * 3; // ~20 km/h with stops
    default:
      return distanceKm * 2;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getLocationTypeEmoji(type?: string): string {
  switch (type) {
    case 'hotel': return '🏨';
    case 'restaurant': return '🍽️';
    case 'cafe': return '☕';
    case 'attraction': return '🏛️';
    case 'transport': return '🚉';
    case 'shopping': return '🛍️';
    case 'park': return '🌳';
    case 'beach': return '🏖️';
    case 'mountain': return '⛰️';
    default: return '📍';
  }
}

// ==================== END HELPER FUNCTIONS ====================

const ItineraryVisualizer: React.FC<ItineraryVisualizerProps> = ({
  locations,
  onLocationSelect,
  onRouteOptimize,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRouteDetails, setShowRouteDetails] = useState(true);
  const [selectedTravelMode, setSelectedTravelMode] = useState<'driving' | 'walking' | 'transit'>('driving');

  // Calculate route segments with estimated distances and durations
  const routeSegments = useMemo((): RouteSegment[] => {
    if (locations.length < 2) return [];

    return locations.slice(0, -1).map((location, index) => {
      const nextLocation = locations[index + 1];
      
      // Calculate Haversine distance
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        nextLocation.latitude,
        nextLocation.longitude
      );

      // Estimate duration based on travel mode
      const duration = estimateDuration(distance, selectedTravelMode);

      return {
        from: location,
        to: nextLocation,
        distance,
        duration,
        mode: selectedTravelMode
      };
    });
  }, [locations, selectedTravelMode]);

  const totalDistance = routeSegments.reduce((sum, segment) => sum + segment.distance, 0);
  const totalDuration = routeSegments.reduce((sum, segment) => sum + segment.duration, 0);

  const handleOptimizeRoute = () => {
    // Simple optimization: sort by latitude then longitude
    const optimized = [...locations].sort((a, b) => {
      if (Math.abs(a.latitude - b.latitude) > 0.01) {
        return a.latitude - b.latitude;
      }
      return a.longitude - b.longitude;
    });

    onRouteOptimize?.(optimized);
  };

  if (locations.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <MapPin size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Add locations to see your itinerary</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Route size={16} className="text-blue-600" />
          <h3 className="font-medium text-gray-800">Travel Itinerary</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {locations.length} stops
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRouteDetails(!showRouteDetails)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={showRouteDetails ? 'Hide details' : 'Show details'}
          >
            {showRouteDetails ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Travel Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Travel by:</span>
            <div className="flex bg-gray-100 rounded-md p-1">
              {[
                { mode: 'driving' as const, icon: '🚗', label: 'Car' },
                { mode: 'walking' as const, icon: '🚶', label: 'Walk' },
                { mode: 'transit' as const, icon: '🚌', label: 'Transit' }
              ].map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedTravelMode(mode)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    selectedTravelMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Route Summary */}
          {locations.length > 1 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-600">Total Distance: </span>
                  <span className="font-medium">{totalDistance.toFixed(1)} km</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Est. Duration: </span>
                  <span className="font-medium">{formatDuration(totalDuration)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOptimizeRoute}
                className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Optimize Route
              </button>
            </div>
          )}

          {/* Location List */}
          <div className="space-y-3">
            {locations.map((location, index) => (
              <div key={location.id || index}>
                {/* Location Item */}
                <div
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                  onClick={() => onLocationSelect?.(location)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onLocationSelect?.(location);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${location.name || 'location'}`}
                >
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Location Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">
                      {location.name}
                    </h4>
                    {location.vicinity && (
                      <p className="text-sm text-gray-600 truncate">
                        {location.vicinity}
                      </p>
                    )}
                    {location.type && (
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {location.type}
                      </span>
                    )}
                  </div>

                  {/* Location Type Emoji */}
                  <div className="flex-shrink-0">
                    <span className="text-lg">
                      {getLocationTypeEmoji(location.type)}
                    </span>
                  </div>
                </div>

                {/* Route Segment */}
                {index < locations.length - 1 && showRouteDetails && (
                  <div className="flex items-center gap-2 ml-4 my-2 text-sm text-gray-500">
                    <div className="w-px h-6 bg-gray-300" />
                    <Navigation size={14} className="text-blue-500" />
                    <span>{routeSegments[index]?.distance.toFixed(1)} km</span>
                    <span>•</span>
                    <Clock size={14} />
                    <span>{formatDuration(routeSegments[index]?.duration || 0)}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedTravelMode}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryVisualizer;