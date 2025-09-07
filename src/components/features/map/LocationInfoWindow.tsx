import React from 'react';
import { Location } from '@/types/map';
import { Star, Clock, Phone, Globe, MapPin, DollarSign } from 'lucide-react';

interface LocationInfoWindowProps {
    location: Location;
    onGetDirections?: (location: Location) => void;
    onClose?: () => void;
}

const LocationInfoWindow: React.FC<LocationInfoWindowProps> = ({ 
    location, 
    onGetDirections,
    onClose 
}) => {
    const getPriceLevelText = (level?: number) => {
        if (!level) return '';
        return '$'.repeat(level);
    };

    const getPriceLevelColor = (level?: number) => {
        switch (level) {
            case 1: return 'text-green-600';
            case 2: return 'text-yellow-600';
            case 3: return 'text-orange-600';
            case 4: return 'text-red-600';
            default: return 'text-gray-500';
        }
    };

    const formatRating = (rating?: number, total?: number) => {
        if (!rating) return null;
        return (
            <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                {total && <span className="text-gray-500 text-sm">({total} reviews)</span>}
            </div>
        );
    };

    const getStatusColor = (isOpen?: boolean) => {
        if (isOpen === undefined) return 'text-gray-500';
        return isOpen ? 'text-green-600' : 'text-red-600';
    };

    const getStatusText = (isOpen?: boolean) => {
        if (isOpen === undefined) return 'Hours unknown';
        return isOpen ? 'Open now' : 'Closed';
    };

    return (
        <div className="bg-white rounded-lg shadow-lg max-w-sm w-80 overflow-hidden">
            {/* Header with photo */}
            {location.photos && location.photos.length > 0 && (
                <div className="relative h-32 bg-gray-200">
                    <img 
                        src={location.photos[0]} 
                        alt={location.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Hide image if it fails to load
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                </div>
            )}
            
            {/* Content */}
            <div className="p-4">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 flex-1 pr-2">
                        {location.name || 'Unknown Location'}
                    </h3>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    )}
                </div>
                
                {/* Rating and Price */}
                <div className="flex items-center justify-between mb-3">
                    {formatRating(location.rating, location.userRatingsTotal)}
                    {location.priceLevel && (
                        <div className={`flex items-center gap-1 ${getPriceLevelColor(location.priceLevel)}`}>
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium">{getPriceLevelText(location.priceLevel)}</span>
                        </div>
                    )}
                </div>
                
                {/* Address */}
                {location.vicinity && (
                    <div className="flex items-start gap-2 mb-3 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{location.vicinity}</span>
                    </div>
                )}
                
                {/* Opening Hours */}
                {location.isOpen !== undefined && (
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className={`text-sm font-medium ${getStatusColor(location.isOpen)}`}>
                            {getStatusText(location.isOpen)}
                        </span>
                    </div>
                )}
                
                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                    {location.phoneNumber && (
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <a 
                                href={`tel:${location.phoneNumber}`}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {location.phoneNumber}
                            </a>
                        </div>
                    )}
                    
                    {location.website && (
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-500" />
                            <a 
                                href={location.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Visit website
                            </a>
                        </div>
                    )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                    {onGetDirections && (
                        <button
                            onClick={() => onGetDirections(location)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Get Directions
                        </button>
                    )}
                    
                    {location.placeId && (
                        <a
                            href={`https://www.google.com/maps/place/?q=place_id:${location.placeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            View on Google Maps
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationInfoWindow;
