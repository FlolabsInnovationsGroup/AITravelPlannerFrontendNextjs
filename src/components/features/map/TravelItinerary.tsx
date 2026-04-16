'use client';

import React from 'react';
import { MapPin, Trash2, Navigation } from 'lucide-react';
import { Location } from '@/types/map';

interface TravelItineraryProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  onLocationRemove?: (locationId: string) => void;
  onOptimizeRoute?: () => void;
  className?: string;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TravelItinerary: React.FC<TravelItineraryProps> = ({
  locations,
  onLocationSelect,
  onLocationRemove,
  onOptimizeRoute,
  className = '',
}) => {
  if (locations.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 ${className}`}>
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No locations in your itinerary yet.</p>
          <p className="text-xs text-gray-400 mt-1">Chat with AI to add destinations!</p>
        </div>
      </div>
    );
  }

  let totalDistance = 0;
  for (let i = 0; i < locations.length - 1; i += 1) {
    totalDistance += haversineDistance(
      locations[i].latitude,
      locations[i].longitude,
      locations[i + 1].latitude,
      locations[i + 1].longitude,
    );
  }

  return (
    <div className={`p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Travel Itinerary ({locations.length} stops)
        </h3>
        {onOptimizeRoute && locations.length > 2 && (
          <button
            type="button"
            onClick={onOptimizeRoute}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors"
          >
            <Navigation size={12} />
            Optimize Route
          </button>
        )}
      </div>

      {totalDistance > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-600">
            Total distance: <span className="font-medium">{totalDistance.toFixed(1)} km</span>
            {' '}({(totalDistance * 0.621371).toFixed(1)} mi)
          </p>
        </div>
      )}

      <div className="space-y-0">
        {locations.map((location, index) => (
          <div key={location.id || `loc-${index}`}>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                {index < locations.length - 1 && (
                  <div className="w-0.5 h-8 bg-blue-200 mt-1" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onLocationSelect?.(location)}
                  className="text-left w-full"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {location.name || 'Unknown location'}
                  </p>
                  {location.type && (
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {location.type.replace('_', ' ')}
                    </p>
                  )}
                </button>
              </div>

              {onLocationRemove && location.id && (
                <button
                  type="button"
                  onClick={() => onLocationRemove(location.id!)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from itinerary"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {index < locations.length - 1 && (
              <div className="ml-6 pl-3 text-xs text-gray-400">
                {haversineDistance(
                  location.latitude,
                  location.longitude,
                  locations[index + 1].latitude,
                  locations[index + 1].longitude,
                ).toFixed(1)}{' '}
                km
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelItinerary;
