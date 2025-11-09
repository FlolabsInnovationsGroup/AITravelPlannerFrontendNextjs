'use client';

import { LocationType } from '@/types/map';

// Professional marker configuration based on research and best practices
export interface MarkerConfig {
  background: string;
  borderColor: string;
  glyphColor: string;
  scale: number;
  svgIcon?: string;
  emoji?: string;
}

// Color palette based on modern travel app design (inspired by MindTrip, Layla)
const MARKER_COLORS = {
  primary: '#2563EB',     // Professional blue
  secondary: '#7C3AED',   // Purple
  success: '#059669',     // Green
  warning: '#D97706',     // Orange
  danger: '#DC2626',      // Red
  info: '#0891B2',        // Cyan
  dark: '#374151',        // Dark gray
  light: '#F3F4F6',       // Light gray
  accent: '#EC4899',      // Pink
  teal: '#0D9488',        // Teal
};

// Professional marker configurations for each location type
export const MARKER_CONFIGS: Record<LocationType | 'default', MarkerConfig> = {
  hotel: {
    background: MARKER_COLORS.primary,
    borderColor: '#1E40AF',
    glyphColor: 'white',
    scale: 1.2,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    emoji: '🏨'
  },
  accommodation: {
    background: MARKER_COLORS.primary,
    borderColor: '#1E40AF',
    glyphColor: 'white',
    scale: 1.2,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🏠'
  },
  restaurant: {
    background: MARKER_COLORS.warning,
    borderColor: '#B45309',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🍽️'
  },
  cafe: {
    background: MARKER_COLORS.success,
    borderColor: '#047857',
    glyphColor: 'white',
    scale: 1.0,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '☕'
  },
  airport: {
    background: MARKER_COLORS.secondary,
    borderColor: '#5B21B6',
    glyphColor: 'white',
    scale: 1.4,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '✈️'
  },
  station: {
    background: MARKER_COLORS.secondary,
    borderColor: '#5B21B6',
    glyphColor: 'white',
    scale: 1.2,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🚉'
  },
  transport: {
    background: MARKER_COLORS.secondary,
    borderColor: '#5B21B6',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🚌'
  },
  museum: {
    background: MARKER_COLORS.accent,
    borderColor: '#BE185D',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🏛️'
  },
  park: {
    background: MARKER_COLORS.success,
    borderColor: '#047857',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🌳'
  },
  nature: {
    background: MARKER_COLORS.teal,
    borderColor: '#0F766E',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🌿'
  },
  beach: {
    background: MARKER_COLORS.info,
    borderColor: '#0E7490',
    glyphColor: 'white',
    scale: 1.2,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🏖️'
  },
  mountain: {
    background: MARKER_COLORS.dark,
    borderColor: '#1F2937',
    glyphColor: 'white',
    scale: 1.3,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '⛰️'
  },
  shopping: {
    background: '#F59E0B',
    borderColor: '#D97706',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🛍️'
  },
  entertainment: {
    background: MARKER_COLORS.accent,
    borderColor: '#BE185D',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🎭'
  },
  landmark: {
    background: MARKER_COLORS.danger,
    borderColor: '#B91C1C',
    glyphColor: 'white',
    scale: 1.3,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🏛️'
  },
  viewpoint: {
    background: MARKER_COLORS.danger,
    borderColor: '#B91C1C',
    glyphColor: 'white',
    scale: 1.2,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '👁️'
  },
  religious: {
    background: MARKER_COLORS.secondary,
    borderColor: '#5B21B6',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '⛪'
  },
  hospital: {
    background: MARKER_COLORS.danger,
    borderColor: '#B91C1C',
    glyphColor: 'white',
    scale: 1.2,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '🏥'
  },
  sports: {
    background: MARKER_COLORS.success,
    borderColor: '#047857',
    glyphColor: 'white',
    scale: 1.1,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '⚽'
  },
  attraction: {
    background: MARKER_COLORS.danger,
    borderColor: '#B91C1C',
    glyphColor: 'white',
    scale: 1.2,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '⭐'
  },
  default: {
    background: MARKER_COLORS.primary,
    borderColor: '#1E40AF',
    glyphColor: 'white',
    scale: 1.0,
    svgIcon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    emoji: '📍'
  }
};

// Determine if a location is popular based on rating and reviews
export function isPopularLocation(location: any): boolean {
  return (
    location.rating && 
    location.rating >= 4.5 && 
    location.userRatingsTotal && 
    location.userRatingsTotal > 100
  );
}

// Get enhanced marker configuration for a location
export function getMarkerConfig(type?: LocationType, location?: any): MarkerConfig {
  const baseConfig = MARKER_CONFIGS[type || 'default'];
  
  // Enhance config for popular locations
  if (location && isPopularLocation(location)) {
    return {
      ...baseConfig,
      scale: baseConfig.scale * 1.2, // Make popular locations 20% larger
      background: '#FF6B35', // Special orange color for popular places
      borderColor: '#DC2626', // Red border for emphasis
      emoji: '⭐' // Star emoji for popular places
    };
  }
  
  return baseConfig;
}

// Create professional SVG marker element
export function createProfessionalMarker(
  type?: LocationType,
  isSelected: boolean = false,
  isHovered: boolean = false
): HTMLElement {
  const config = getMarkerConfig(type);
  const scale = config.scale * (isSelected ? 1.3 : isHovered ? 1.1 : 1.0);
  
  const markerElement = document.createElement('div');
  markerElement.className = 'professional-marker';
  markerElement.style.cssText = `
    width: ${32 * scale}px;
    height: ${32 * scale}px;
    background: ${config.background};
    border: 2px solid ${config.borderColor};
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    position: relative;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transition: all 0.2s ease;
    cursor: pointer;
  `;

  // Add glyph container (rotated back to normal)
  const glyphContainer = document.createElement('div');
  glyphContainer.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    font-size: ${14 * scale}px;
    color: ${config.glyphColor};
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  `;
  
  glyphContainer.textContent = config.emoji || '📍';
  markerElement.appendChild(glyphContainer);

  // Add hover and selection effects
  markerElement.addEventListener('mouseenter', () => {
    markerElement.style.transform = `rotate(-45deg) scale(1.1)`;
    markerElement.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
  });

  markerElement.addEventListener('mouseleave', () => {
    const currentScale = isSelected ? 1.3 : 1.0;
    markerElement.style.transform = `rotate(-45deg) scale(${currentScale})`;
    markerElement.style.boxShadow = isSelected 
      ? '0 6px 12px rgba(0,0,0,0.3)' 
      : '0 4px 8px rgba(0,0,0,0.2)';
  });

  return markerElement;
}

// Professional clustering styles
export const CLUSTER_STYLES = [
  {
    textColor: 'white',
    textSize: 12,
    url: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${MARKER_COLORS.primary}" stroke="white" stroke-width="2"/>
      </svg>
    `),
    height: 40,
    width: 40,
  },
  {
    textColor: 'white',
    textSize: 14,
    url: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="23" fill="${MARKER_COLORS.warning}" stroke="white" stroke-width="2"/>
      </svg>
    `),
    height: 50,
    width: 50,
  },
  {
    textColor: 'white',
    textSize: 16,
    url: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="${MARKER_COLORS.danger}" stroke="white" stroke-width="2"/>
      </svg>
    `),
    height: 60,
    width: 60,
  },
];

// Modern map styling (inspired by Uber, Airbnb, etc.)
export const PROFESSIONAL_MAP_STYLES = [
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ saturation: 36 }, { color: '#333333' }, { lightness: 40 }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'on' }, { color: '#ffffff' }, { lightness: 16 }]
  },
  {
    featureType: 'all',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fefefe' }, { lightness: 20 }]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#fefefe' }, { lightness: 17 }, { weight: 1.2 }]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }, { lightness: 21 }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#dedede' }, { lightness: 21 }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }, { lightness: 17 }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }, { lightness: 18 }]
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }, { lightness: 16 }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#f2f2f2' }, { lightness: 19 }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
  }
];

export { MARKER_COLORS };

export default {
  getMarkerConfig,
  createProfessionalMarker,
  CLUSTER_STYLES,
  PROFESSIONAL_MAP_STYLES,
  MARKER_CONFIGS,
  MARKER_COLORS
};