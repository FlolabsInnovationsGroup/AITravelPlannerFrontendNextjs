import React from 'react';
import { Location } from '@/types/map';
import { MapPin, Star, DollarSign, Clock } from 'lucide-react';

interface LocationSuggestionsProps {
    suggestions: Location[];
    onLocationSelect: (location: Location) => void;
    onDismiss: () => void;
    searchTerm: string;
}

const LocationSuggestions: React.FC<LocationSuggestionsProps> = ({ 
    suggestions, 
    onLocationSelect, 
    onDismiss,
    searchTerm 
}) => {
    if (suggestions.length === 0) return null;

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-blue-50">
                    <h3 className="font-semibold text-gray-900">
                        Multiple locations found for "{searchTerm}"
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Please select the location you meant:
                    </p>
                </div>

                {/* Suggestions List */}
                <div className="max-h-80 overflow-y-auto">
                    {suggestions.map((location, index) => (
                        <button
                            type="button"
                            key={location.placeId || index}
                            onClick={() => onLocationSelect(location)}
                            className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    <MapPin size={16} className="text-blue-600" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    {/* Location Name */}
                                    <div className="font-medium text-gray-900 truncate">
                                        {location.name || 'Unknown Location'}
                                    </div>
                                    
                                    {/* Address */}
                                    {location.vicinity && (
                                        <div className="text-sm text-gray-600 truncate mt-1">
                                            {location.vicinity}
                                        </div>
                                    )}
                                    
                                    {/* Rating and Price */}
                                    <div className="flex items-center gap-3 mt-2">
                                        {location.rating && (
                                            <div className="flex items-center gap-1">
                                                <Star size={12} className="text-yellow-500 fill-current" />
                                                <span className="text-xs font-medium">{location.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                        
                                        {location.priceLevel && (
                                            <div className={`flex items-center gap-1 ${getPriceLevelColor(location.priceLevel)}`}>
                                                <DollarSign size={12} />
                                                <span className="text-xs font-medium">{getPriceLevelText(location.priceLevel)}</span>
                                            </div>
                                        )}
                                        
                                        {/* Location Type Badge */}
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                            {location.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onLocationSelect(suggestions[0])}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Use First Option
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationSuggestions;
