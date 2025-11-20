'use client';

import React from 'react';
import { Navigation, Clock, MapPin, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

interface RouteInfo {
  origin: string;
  destination: string;
  totalDistance: string;
  totalDuration: string;
  steps: DirectionStep[];
  warnings?: string[];
  summary?: string;
}

interface DirectionsPanelProps {
  routeInfo: RouteInfo | null;
  onClose: () => void;
  className?: string;
}

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  routeInfo,
  onClose,
  className = ''
}) => {
  if (!routeInfo) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Route Directions</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
          type="button"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Route Summary */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start gap-3 mb-3">
          <MapPin className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">From</p>
            <p className="font-medium text-gray-900 truncate">{routeInfo.origin}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">To</p>
            <p className="font-medium text-gray-900 truncate">{routeInfo.destination}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">{routeInfo.totalDistance}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">{routeInfo.totalDuration}</span>
          </div>
        </div>

        {routeInfo.summary && (
          <p className="mt-3 text-sm text-gray-600">{routeInfo.summary}</p>
        )}
      </div>

      {/* Warnings */}
      {routeInfo.warnings && routeInfo.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-100">
          {routeInfo.warnings.map((warning, index) => (
            <p key={index} className="text-sm text-yellow-800 flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">⚠️</span>
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* Turn-by-Turn Directions */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Turn-by-Turn Directions</h4>
          <div className="space-y-3">
            {routeInfo.steps.map((step, index) => (
              <div 
                key={index} 
                className="flex gap-3 pb-3 border-b border-gray-100 last:border-0"
              >
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                  </div>
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm text-gray-900 mb-1"
                    dangerouslySetInnerHTML={{ __html: step.instruction }}
                  />
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      {step.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Directions provided by Google Maps
        </p>
      </div>
    </div>
  );
};

export default DirectionsPanel;
