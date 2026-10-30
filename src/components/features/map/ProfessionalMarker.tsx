'use client';

import React from 'react';
import { Location, LocationType } from '@/types/map';
import { 
  Bed, 
  Utensils, 
  Coffee, 
  Plane, 
  Train, 
  Building2, 
  TreePine, 
  Waves, 
  Mountain, 
  ShoppingBag, 
  Theater, 
  Camera, 
  Church, 
  Hospital, 
  Gamepad2,
  Star
} from 'lucide-react';

interface ProfessionalMarkerProps {
  location: Location;
  onClick: () => void;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

// Professional marker design inspired by MindTrip, Layla, and Airbnb
const ProfessionalMarker: React.FC<ProfessionalMarkerProps> = ({ 
  location, 
  onClick, 
  isSelected = false,
  size = 'medium',
  showLabel = false 
}) => {
  const getMarkerConfig = (type?: LocationType) => {
    const configs = {
      hotel: { icon: Bed, color: '#2563EB', bgColor: '#EFF6FF', label: 'Hotel' },
      accommodation: { icon: Bed, color: '#2563EB', bgColor: '#EFF6FF', label: 'Stay' },
      restaurant: { icon: Utensils, color: '#DC2626', bgColor: '#FEF2F2', label: 'Dine' },
      cafe: { icon: Coffee, color: '#059669', bgColor: '#ECFDF5', label: 'Café' },
      airport: { icon: Plane, color: '#7C3AED', bgColor: '#F3E8FF', label: 'Airport' },
      station: { icon: Train, color: '#7C3AED', bgColor: '#F3E8FF', label: 'Station' },
      transport: { icon: Train, color: '#7C3AED', bgColor: '#F3E8FF', label: 'Transport' },
      museum: { icon: Building2, color: '#DB2777', bgColor: '#FDF2F8', label: 'Museum' },
      park: { icon: TreePine, color: '#16A34A', bgColor: '#F0FDF4', label: 'Park' },
      nature: { icon: TreePine, color: '#16A34A', bgColor: '#F0FDF4', label: 'Nature' },
      beach: { icon: Waves, color: '#0EA5E9', bgColor: '#F0F9FF', label: 'Beach' },
      mountain: { icon: Mountain, color: '#A3A3A3', bgColor: '#F9FAFB', label: 'Mountain' },
      shopping: { icon: ShoppingBag, color: '#F59E0B', bgColor: '#FFFBEB', label: 'Shopping' },
      entertainment: { icon: Theater, color: '#8B5CF6', bgColor: '#F5F3FF', label: 'Entertainment' },
      landmark: { icon: Camera, color: '#EF4444', bgColor: '#FEF2F2', label: 'Landmark' },
      viewpoint: { icon: Camera, color: '#EF4444', bgColor: '#FEF2F2', label: 'Viewpoint' },
      religious: { icon: Church, color: '#6366F1', bgColor: '#EEF2FF', label: 'Religious' },
      hospital: { icon: Hospital, color: '#DC2626', bgColor: '#FEF2F2', label: 'Hospital' },
      sports: { icon: Gamepad2, color: '#059669', bgColor: '#ECFDF5', label: 'Sports' },
      attraction: { icon: Star, color: '#F59E0B', bgColor: '#FFFBEB', label: 'Attraction' },
    };

    return configs[type || 'attraction'] || configs.attraction;
  };

  const getSizeConfig = () => {
    const configs = {
      small: { size: 24, iconSize: 12, labelOffset: 28 },
      medium: { size: 32, iconSize: 16, labelOffset: 36 },
      large: { size: 40, iconSize: 20, labelOffset: 44 }
    };
    return configs[size];
  };

  const config = getMarkerConfig(location.type);
  const sizeConfig = getSizeConfig();
  const IconComponent = config.icon;

  const markerStyle: React.CSSProperties = {
    position: 'relative',
    cursor: 'pointer',
    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: isSelected ? 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25))' : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))',
    zIndex: isSelected ? 1000 : 999,
  };

  const markerBodyStyle: React.CSSProperties = {
    width: sizeConfig.size,
    height: sizeConfig.size,
    backgroundColor: 'white',
    border: `2px solid ${config.color}`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: isSelected 
      ? `0 0 0 4px ${config.color}20, 0 4px 12px rgba(0, 0, 0, 0.2)` 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: sizeConfig.labelOffset,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    color: config.color,
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    border: `1px solid ${config.color}`,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    opacity: showLabel ? 1 : 0,
    visibility: showLabel ? 'visible' : 'hidden',
    transition: 'opacity 0.2s ease, visibility 0.2s ease',
  };

  // Price badge for hotels/restaurants
  const showPriceBadge = location.priceLevel && ['hotel', 'accommodation', 'restaurant'].includes(location.type || '');
  const priceBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: config.color,
    color: 'white',
    width: 18,
    height: 18,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '700',
    border: '2px solid white',
  };

  // Rating badge for rated locations
  const showRatingBadge = location.rating && location.rating > 0;
  const ratingBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#F59E0B',
    color: 'white',
    padding: '2px 4px',
    borderRadius: '8px',
    fontSize: '9px',
    fontWeight: '700',
    border: '2px solid white',
    minWidth: '20px',
    textAlign: 'center',
  };

  return (
    <div 
      style={markerStyle} 
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Marker for ${location.name || 'location'}`}
    >
      {/* Main marker body */}
      <div style={markerBodyStyle}>
        <IconComponent 
          size={sizeConfig.iconSize} 
          color={config.color}
          strokeWidth={2.5}
        />
        
        {/* Price badge */}
        {showPriceBadge && (
          <div style={priceBadgeStyle}>
            {'$'.repeat(location.priceLevel || 1)}
          </div>
        )}
        
        {/* Rating badge */}
        {showRatingBadge && (
          <div style={ratingBadgeStyle}>
            {location.rating?.toFixed(1)}
          </div>
        )}
      </div>

      {/* Location label */}
      <div style={labelStyle}>
        {config.label}
      </div>

      {/* Pulse animation for selected marker */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: sizeConfig.size + 20,
            height: sizeConfig.size + 20,
            border: `2px solid ${config.color}`,
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
            opacity: 0.6,
            zIndex: -1,
          }}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.6;
            }
            70% {
              transform: translate(-50%, -50%) scale(1.4);
              opacity: 0;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  );
};

export default ProfessionalMarker;