import React, { useState, useMemo } from 'react';
import { Location, LocationType } from '@/types/map';
import { travelAnalyzer, TravelAnalysis } from '@/services/TravelLocationAnalyzer';
import { MapPin, Clock, Star, DollarSign, Phone, Globe, Navigation, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

interface TravelItineraryProps {
    locations: Location[];
    onLocationSelect?: (location: Location) => void;
    onLocationRemove?: (locationId: string) => void;
    onOptimizeRoute?: (optimizedLocations: Location[]) => void;
}

// Remove duplicate interface - unused
// interface ItineraryDay {
//     day: number;
//     locations: Location[];
//     totalDistance?: number;
//     estimatedTime?: number;
// }

const getLocationTypeIcon = (type?: LocationType) => {
    switch (type) {
        case 'hotel':
        case 'accommodation': return '🏨';
        case 'restaurant': return '🍽️';
        case 'cafe': return '☕';
        case 'museum': return '🏛️';
        case 'park':
        case 'nature': return '🌳';
        case 'beach': return '🏖️';
        case 'mountain': return '⛰️';
        case 'shopping': return '🛍️';
        case 'entertainment': return '�';
        case 'landmark': return '�️';
        case 'viewpoint': return '🏔️';
        case 'airport': return '✈️';
        case 'station':
        case 'transport': return '🚂';
        case 'religious': return '⛪';
        case 'hospital': return '🏥';
        case 'sports': return '⚽';
        case 'attraction':
        default: return '📍';
    }
};

const formatLocationCategory = (type?: LocationType): string => {
    if (!type) return 'Attraction';
    return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

const TravelItinerary: React.FC<TravelItineraryProps> = ({
    locations,
    onLocationSelect,
    onLocationRemove,
    onOptimizeRoute
}) => {
    const [selectedDay, setSelectedDay] = useState(1);
    const [sortBy, setSortBy] = useState<'type' | 'distance' | 'rating'>('type');
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Smart travel analysis
    const travelAnalysis: TravelAnalysis = useMemo(() => travelAnalyzer.analyzeTravelData(locations), [locations]);

    // Use smart analysis instead of manual grouping
    const itineraryDays = useMemo(() => travelAnalysis.itineraryDays, [travelAnalysis]);

    const currentDayData = itineraryDays.find(day => day.day === selectedDay);

    const renderLocationCard = (location: Location, index: number) => (
        <div
            key={location.id || index}
            className="bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 border-blue-500 hover:shadow-lg transition-shadow cursor-pointer"
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
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{getLocationTypeIcon(location.type)}</div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                            {location.name || 'Unnamed Location'}
                        </h3>
                        <p className="text-sm text-blue-600 mb-2">
                            {formatLocationCategory(location.type)}
                        </p>
                        
                        {/* Location Details */}
                        <div className="space-y-1">
                            {location.rating && (
                                <div className="flex items-center space-x-1 text-sm text-yellow-600">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span>{location.rating.toFixed(1)}</span>
                                    {location.userRatingsTotal && (
                                        <span className="text-gray-500">
                                            ({location.userRatingsTotal} reviews)
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            {location.priceLevel && (
                                <div className="flex items-center space-x-1 text-sm text-green-600">
                                    <DollarSign className="h-4 w-4" />
                                    <span>{'$'.repeat(location.priceLevel)}</span>
                                </div>
                            )}
                            
                            {location.vicinity && (
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    <span className="truncate">{location.vicinity}</span>
                                </div>
                            )}
                            
                            {location.isOpen !== undefined && (
                                <div className={`flex items-center space-x-1 text-sm ${
                                    location.isOpen ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    <Clock className="h-4 w-4" />
                                    <span>{location.isOpen ? 'Open now' : 'Closed'}</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center space-x-2 mt-3">
                            {location.phoneNumber && (
                                <a 
                                    href={`tel:${location.phoneNumber}`}
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Phone className="h-4 w-4" />
                                </a>
                            )}
                            {location.website && (
                                <a 
                                    href={location.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Globe className="h-4 w-4" />
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
                                    window.open(url, '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Get directions"
                            >
                                <Navigation className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Remove button */}
                {onLocationRemove && location.id && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onLocationRemove(location.id!);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove location"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );

    if (locations.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Itinerary Yet</h3>
                <p className="text-gray-600">
                    Start adding locations by typing in the chat or searching on the map!
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Travel Itinerary ({locations.length} locations)
                    </h2>
                    <div className="flex space-x-2">
                        {onOptimizeRoute && (
                            <button
                                type="button"
                                onClick={() => {
                                    const optimizedItinerary = travelAnalyzer.createOptimizedItinerary(locations);
                                    const optimizedLocations = optimizedItinerary.flatMap(day => day.locations);
                                    onOptimizeRoute(optimizedLocations);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                                Optimize Route
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                showAnalysis 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <TrendingUp className="h-4 w-4 inline mr-1" />
                            {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
                        </button>
                    </div>
                </div>
                
                {/* Day selector */}
                <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-gray-600">Day:</span>
                    {itineraryDays.map((day) => (
                        <button
                            type="button"
                            key={day.day}
                            onClick={() => setSelectedDay(day.day)}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                selectedDay === day.day
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {day.day}
                        </button>
                    ))}
                </div>
                
                {/* Sort options */}
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'type' | 'distance' | 'rating')}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                        <option value="type">Category</option>
                        <option value="rating">Rating</option>
                        <option value="distance">Distance</option>
                    </select>
                </div>
            </div>
            
            {/* Smart Travel Analysis Section */}
            {showAnalysis && (
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Travel Stats */}
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <h4 className="font-medium text-gray-900 mb-2">Travel Overview</h4>
                            <div className="space-y-1 text-sm">
                                <p><strong>Total Distance:</strong> {travelAnalyzer.formatDistance(travelAnalysis.travelStats.totalDistance)}</p>
                                <p><strong>Total Time:</strong> {travelAnalyzer.formatTime(travelAnalysis.travelStats.totalTime)}</p>
                                {travelAnalysis.travelStats.averageRating > 0 && (
                                    <p><strong>Average Rating:</strong> ⭐ {travelAnalysis.travelStats.averageRating.toFixed(1)}</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Location Breakdown */}
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <h4 className="font-medium text-gray-900 mb-2">Location Types</h4>
                            <div className="space-y-1 text-sm">
                                {Object.entries(travelAnalysis.travelStats.locationBreakdown)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 3)
                                    .map(([type, count]) => (
                                        <p key={type}>
                                            <span className="mr-1">{getLocationTypeIcon(type as LocationType)}</span>
                                            {formatLocationCategory(type as LocationType)}: {count}
                                        </p>
                                    ))}
                            </div>
                        </div>
                        
                        {/* Budget Info */}
                        {travelAnalysis.travelStats.priceRange.average > 0 && (
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h4 className="font-medium text-gray-900 mb-2">Budget Overview</h4>
                                <div className="space-y-1 text-sm">
                                    <p><strong>Price Range:</strong> {'$'.repeat(travelAnalysis.travelStats.priceRange.min)} - {'$'.repeat(travelAnalysis.travelStats.priceRange.max)}</p>
                                    <p><strong>Average:</strong> {'$'.repeat(Math.round(travelAnalysis.travelStats.priceRange.average))}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Recommendations */}
                    {travelAnalysis.recommendations.length > 0 && (
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Travel Recommendations
                            </h4>
                            <div className="space-y-2">
                                {travelAnalysis.recommendations.map((rec) => (
                                    <div key={`${rec.priority}-${rec.message}`} className={(() => {
                                        if (rec.priority === 'high') return 'p-2 rounded text-sm bg-red-50 text-red-800';
                                        if (rec.priority === 'medium') return 'p-2 rounded text-sm bg-yellow-50 text-yellow-800';
                                        return 'p-2 rounded text-sm bg-blue-50 text-blue-800';
                                    })()}>
                                        {rec.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Day content */}
            <div className="p-4">
                {currentDayData && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">
                                Day {currentDayData.day} ({currentDayData.locations.length} locations)
                                {currentDayData.theme && (
                                    <span className="ml-2 text-sm text-blue-600 font-normal">
                                        • {currentDayData.theme}
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                {currentDayData.estimatedTime && (
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {travelAnalyzer.formatTime(currentDayData.estimatedTime + currentDayData.travelTime)}
                                    </div>
                                )}
                                {currentDayData.totalDistance && (
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {travelAnalyzer.formatDistance(currentDayData.totalDistance)}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {currentDayData.locations.map((location, index) => 
                                renderLocationCard(location, index)
                            )}
                        </div>
                    </>
                )}
                
                {!currentDayData && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No locations for this day</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TravelItinerary;
