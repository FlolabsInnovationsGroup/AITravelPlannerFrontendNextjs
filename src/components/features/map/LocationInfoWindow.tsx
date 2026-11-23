import React from 'react';
import Image from 'next/image';
import { Location } from '@/types/map';
import { Star, Clock, Phone, Globe, MapPin, DollarSign, X, ExternalLink, Users, Navigation } from 'lucide-react';

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

    // Unused function - kept for reference
    // const getStatusColor = (isOpen?: boolean) => {
    //     if (isOpen === undefined) return 'text-gray-500';
    //     return isOpen ? 'text-green-600' : 'text-red-600';
    // };

    const getStatusText = (isOpen?: boolean) => {
        if (isOpen === undefined) return 'Hours unknown';
        return isOpen ? 'Open now' : 'Closed';
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-80 overflow-hidden border-0 backdrop-blur-sm">
            {/* Header with photo and gradient overlay */}
            <div className="relative h-40 bg-gradient-to-br from-blue-400 to-purple-600">
                {location.photos && location.photos.length > 0 ? (
                    <Image 
                        src={location.photos[0]} 
                        alt={location.name || 'Location photo'}
                        width={320}
                        height={160}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Show gradient background if image fails to load
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                ) : (
                    // Fallback content with location type icon when no photos available
                    <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-80" />
                            <p className="text-sm opacity-75 font-medium">{location.type || 'Location'}</p>
                        </div>
                    </div>
                )}
                
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                
                {/* Close button on image */}
                {onClose && (
                    <button 
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            {/* Content */}
            <div className="p-5">
                {/* Title and Close (if no photo) */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-900 flex-1 pr-2 leading-tight">
                        {location.name || 'Unknown Location'}
                    </h3>
                    {onClose && (!location.photos || location.photos.length === 0) && (
                        <button 
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                {/* Rating and Price in modern card style */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {formatRating(location.rating, location.userRatingsTotal)}
                        {location.priceLevel && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getPriceLevelColor(location.priceLevel)} bg-gray-50`}>
                                <DollarSign className="w-3 h-3" />
                                <span>{getPriceLevelText(location.priceLevel)}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Opening status badge */}
                    {location.isOpen !== undefined && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            location.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            <Clock className="w-3 h-3" />
                            {getStatusText(location.isOpen)}
                        </div>
                    )}
                </div>
                
                {/* Address */}
                {location.vicinity && (
                    <div className="flex items-start gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                        <span className="text-sm text-gray-700 leading-relaxed">{location.vicinity}</span>
                    </div>
                )}
                
                {/* Contact Info in modern card design */}
                {(location.phoneNumber || location.website) && (
                    <div className="space-y-2 mb-5">
                        {location.phoneNumber && (
                            <div className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                </div>
                                <a 
                                    href={`tel:${location.phoneNumber}`}
                                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                                >
                                    {location.phoneNumber}
                                </a>
                            </div>
                        )}
                        
                        {location.website && (
                            <div className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-blue-600" />
                                </div>
                                <a 
                                    href={location.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center gap-1"
                                >
                                    Visit website
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Action Buttons - Mindtrip style */}
                <div className="flex flex-col gap-2">
                    {onGetDirections && (
                        <button
                            type="button"
                            onClick={() => onGetDirections(location)}
                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <Navigation className="w-4 h-4" />
                            Get Directions
                        </button>
                    )}
                    
                    <div className="flex gap-2">
                        {location.placeId && (
                            <a
                                href={`https://www.google.com/maps/place/?q=place_id:${location.placeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-gray-300 hover:bg-gray-50 transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Google Maps
                            </a>
                        )}
                        
                        {/* Additional action button for future features */}
                        <button type="button" className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-gray-300 hover:bg-gray-50 transition-all">
                            <Users className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationInfoWindow;
