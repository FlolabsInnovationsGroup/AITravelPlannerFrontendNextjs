import React from 'react';
import { Location, LocationType } from '@/types/map';

interface CustomMarkerProps {
  location: Location;
  onClick: () => void;
  isSelected?: boolean;
}

export const CustomMarker: React.FC<CustomMarkerProps> = ({ location, onClick, isSelected }) => {
  const getMarkerStyle = (type?: LocationType) => {
    const baseStyle = {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: isSelected ? '3px solid #ffffff' : '2px solid #ffffff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff',
      boxShadow: isSelected 
        ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(74, 144, 226, 0.3)' 
        : '0 2px 8px rgba(0, 0, 0, 0.2)',
      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
      transition: 'all 0.2s ease-in-out',
    };

    // Color scheme inspired by Mindtrip's vibrant design
    switch (type) {
      case 'hotel':
      case 'accommodation':
        return { ...baseStyle, backgroundColor: '#4A90E2' }; // Professional Blue
      case 'restaurant':
        return { ...baseStyle, backgroundColor: '#FF6B6B' }; // Warm Red
      case 'cafe':
        return { ...baseStyle, backgroundColor: '#51CF66' }; // Fresh Green
      case 'airport':
      case 'station':
      case 'transport':
        return { ...baseStyle, backgroundColor: '#9775FA' }; // Modern Purple
      case 'museum':
        return { ...baseStyle, backgroundColor: '#F06292' }; // Cultural Pink
      case 'park':
      case 'nature':
        return { ...baseStyle, backgroundColor: '#26C6DA' }; // Nature Cyan
      case 'beach':
        return { ...baseStyle, backgroundColor: '#29B6F6' }; // Ocean Blue
      case 'mountain':
        return { ...baseStyle, backgroundColor: '#8D6E63' }; // Earth Brown
      case 'shopping':
        return { ...baseStyle, backgroundColor: '#FFCA28' }; // Shopping Gold
      case 'entertainment':
        return { ...baseStyle, backgroundColor: '#AB47BC' }; // Entertainment Purple
      case 'landmark':
      case 'viewpoint':
        return { ...baseStyle, backgroundColor: '#FF5722' }; // Landmark Orange
      case 'religious':
        return { ...baseStyle, backgroundColor: '#7E57C2' }; // Spiritual Purple
      case 'hospital':
        return { ...baseStyle, backgroundColor: '#F44336' }; // Emergency Red
      case 'sports':
        return { ...baseStyle, backgroundColor: '#4CAF50' }; // Sports Green
      case 'attraction':
      default:
        return { ...baseStyle, backgroundColor: '#E91E63' }; // Attraction Pink
    }
  };

  const getMarkerIcon = (type?: LocationType) => {
    switch (type) {
      case 'hotel':
      case 'accommodation':
        return '🏨';
      case 'restaurant':
        return '🍽️';
      case 'cafe':
        return '☕';
      case 'airport':
        return '✈️';
      case 'station':
      case 'transport':
        return '🚉';
      case 'museum':
        return '🏛️';
      case 'park':
      case 'nature':
        return '🌳';
      case 'beach':
        return '🏖️';
      case 'mountain':
        return '⛰️';
      case 'shopping':
        return '🛍️';
      case 'entertainment':
        return '🎭';
      case 'landmark':
      case 'viewpoint':
        return '🏛️';
      case 'religious':
        return '⛪';
      case 'hospital':
        return '🏥';
      case 'sports':
        return '⚽';
      case 'attraction':
      default:
        return '📍';
    }
  };

  return (
    <div
      style={getMarkerStyle(location.type)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = isSelected ? 'scale(1.1)' : 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isSelected ? 'scale(1.1)' : 'scale(1)';
      }}
      role="button"
      tabIndex={0}
      title={location.name || 'Location'}
    >
      {getMarkerIcon(location.type)}
    </div>
  );
};

// ==================== HELPER FUNCTIONS ====================
function getMarkerBackgroundColor(type?: LocationType): string {
  switch (type) {
    case 'hotel':
    case 'accommodation':
      return '#4A90E2';
    case 'restaurant':
      return '#FF6B6B';
    case 'cafe':
      return '#51CF66';
    case 'airport':
    case 'station':
    case 'transport':
      return '#9775FA';
    case 'museum':
      return '#F06292';
    case 'park':
    case 'nature':
      return '#26C6DA';
    case 'beach':
      return '#29B6F6';
    case 'mountain':
      return '#8D6E63';
    case 'shopping':
      return '#FFCA28';
    case 'entertainment':
      return '#AB47BC';
    case 'landmark':
    case 'viewpoint':
      return '#FF5722';
    case 'religious':
      return '#7E57C2';
    case 'hospital':
      return '#F44336';
    case 'sports':
      return '#4CAF50';
    case 'attraction':
    default:
      return '#E91E63';
  }
}

function getMarkerEmoji(type?: LocationType): string {
  switch (type) {
    case 'hotel':
    case 'accommodation':
      return '🏨';
    case 'restaurant':
      return '🍽️';
    case 'cafe':
      return '☕';
    case 'airport':
      return '✈️';
    case 'station':
    case 'transport':
      return '🚉';
    case 'museum':
      return '🏛️';
    case 'park':
    case 'nature':
      return '🌳';
    case 'beach':
      return '🏖️';
    case 'mountain':
      return '⛰️';
    case 'shopping':
      return '🛍️';
    case 'entertainment':
      return '🎭';
    case 'landmark':
    case 'viewpoint':
      return '🏛️';
    case 'religious':
      return '⛪';
    case 'hospital':
      return '🏥';
    case 'sports':
      return '⚽';
    case 'attraction':
    default:
      return '📍';
  }
}
// ==================== END HELPER FUNCTIONS ====================

// Enhanced marker renderer for Google Maps
export const createCustomMarkerElement = (location: Location, isSelected: boolean = false) => {
  const markerDiv = document.createElement('div');
  markerDiv.innerHTML = `
    <div style="
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #ffffff;
      font-weight: bold;
      cursor: pointer;
      background-color: ${getMarkerBackgroundColor(location.type)};
      box-shadow: ${isSelected 
        ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(74, 144, 226, 0.3)' 
        : '0 2px 8px rgba(0, 0, 0, 0.2)'};
      transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
      transition: all 0.2s ease-in-out;
      position: relative;
      z-index: ${isSelected ? '1000' : '100'};
    ">
      ${getMarkerEmoji(location.type)}
    </div>
  `;
  return markerDiv;
};