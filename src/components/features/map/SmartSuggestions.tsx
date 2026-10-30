import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Location, LocationType } from '@/types/map';
import { MapPin, Clock, Star, Camera, X, Plus, Sparkles } from 'lucide-react';

interface SmartSuggestionsProps {
  currentLocation?: Location;
  map?: google.maps.Map | null;
  onLocationSelect: (location: Location) => void;
  onAddToTrip: (location: Location) => void;
}

interface SuggestionCard {
  id: string;
  name: string;
  category: LocationType;
  rating?: number;
  priceLevel?: number;
  distance?: number;
  travelTime?: string;
  imageUrl?: string;
  isOpen?: boolean;
  position: { lat: number; lng: number };
  reason: string;
  tags: string[];
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  currentLocation,
  map,
  onLocationSelect,
  onAddToTrip
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: '✨' },
    { id: 'restaurant', name: 'Dining', icon: '🍽️' },
    { id: 'attraction', name: 'Sights', icon: '🏛️' },
    { id: 'hotel', name: 'Stay', icon: '🏨' },
    { id: 'cafe', name: 'Coffee', icon: '☕' },
    { id: 'shopping', name: 'Shop', icon: '🛍️' },
    { id: 'entertainment', name: 'Fun', icon: '🎭' }
  ];

  // ==================== HELPER FUNCTIONS ====================
  // These must be defined before generateSmartSuggestions uses them
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Convert to meters
  };

  const mapGoogleTypeToOurType = (googleType: string): LocationType => {
    const typeMap: { [key: string]: LocationType } = {
      'tourist_attraction': 'attraction',
      'restaurant': 'restaurant',
      'lodging': 'hotel',
      'cafe': 'cafe',
      'museum': 'museum',
      'park': 'park',
      'shopping_mall': 'shopping',
      'night_club': 'entertainment',
      'bar': 'entertainment'
    };
    return typeMap[googleType] || 'attraction';
  };

  // Generate AI-like reason text for suggestions
  const generateReasonText = (place: google.maps.places.PlaceResult, timeContext: string): string => {
    const reasons = {
      morning: [
        'Perfect for your morning exploration',
        'Great way to start your day',
        'Popular morning spot nearby'
      ],
      afternoon: [
        'Ideal for your afternoon adventure',
        'Highly rated by travelers like you',
        'A must-see while you\'re here'
      ],
      evening: [
        'Perfect evening destination',
        'Great nightlife spot',
        'Romantic evening option'
      ]
    };

    const contextReasons = reasons[timeContext as keyof typeof reasons] || reasons.afternoon;
    return contextReasons[Math.floor(Math.random() * contextReasons.length)];
  };

  // Generate contextual tags
  const generateTags = (place: google.maps.places.PlaceResult, timeContext: string): string[] => {
    const tags = [];
    
    if (place.rating && place.rating > 4.2) tags.push('Highly Rated');
    if (place.price_level === 1) tags.push('Budget Friendly');
    if (place.price_level === 4) tags.push('Premium');
    if (place.opening_hours?.isOpen()) tags.push('Open Now');
    if (timeContext === 'morning' && place.types?.includes('cafe')) tags.push('Morning Perfect');
    if (timeContext === 'evening' && place.types?.includes('restaurant')) tags.push('Dinner Ready');
    
    return tags.slice(0, 2); // Limit to 2 tags
  };

  // ==================== END HELPER FUNCTIONS ====================

  // Smart suggestion algorithm inspired by Mindtrip's AI recommendations
  const generateSmartSuggestions = useCallback(async () => {
    if (!currentLocation || !map) return;

    setIsLoading(true);

    try {
      // Get Places service
      const placesService = new google.maps.places.PlacesService(map);
      
      // Define search parameters based on current location and user context
      const searchParams = {
        location: new google.maps.LatLng(currentLocation.latitude, currentLocation.longitude),
        radius: 2000, // 2km radius
        types: ['tourist_attraction', 'restaurant', 'cafe', 'museum', 'park', 'shopping_mall'],
        openNow: undefined as boolean | undefined
      };

      // Get time of day for context-aware suggestions
      const hour = new Date().getHours();
      let timeContext: string;
      if (hour < 11) {
        timeContext = 'morning';
      } else if (hour < 17) {
        timeContext = 'afternoon';
      } else {
        timeContext = 'evening';
      }

      // Adjust search based on time context
      if (timeContext === 'morning') {
        searchParams.types = ['cafe', 'park', 'tourist_attraction', 'museum'];
      } else if (timeContext === 'evening') {
        searchParams.types = ['restaurant', 'bar', 'night_club', 'entertainment'];
        searchParams.openNow = true;
      }

      // Perform nearby search
      placesService.nearbySearch(searchParams, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const nearbySuggestions = results.slice(0, 8).map((place, index): SuggestionCard => {
            const distance = calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              place.geometry?.location?.lat() || 0,
              place.geometry?.location?.lng() || 0
            );

            return {
              id: place.place_id || `suggestion-${index}`,
              name: place.name || 'Unknown Place',
              category: mapGoogleTypeToOurType(place.types?.[0] || 'establishment'),
              rating: place.rating,
              priceLevel: place.price_level as 1 | 2 | 3 | 4,
              distance: Math.round(distance),
              travelTime: `${Math.round(distance / 80)} min walk`, // Rough walking time
              imageUrl: place.photos?.[0]?.getUrl({ maxWidth: 300, maxHeight: 200 }),
              isOpen: place.opening_hours?.isOpen(),
              position: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              },
              reason: generateReasonText(place, timeContext),
              tags: generateTags(place, timeContext)
            };
          });

          setSuggestions(nearbySuggestions);
        }
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      setIsLoading(false);
    }
  }, [currentLocation, map]);

  // Generate suggestions when location changes
  useEffect(() => {
    if (currentLocation && map) {
      generateSmartSuggestions();
    }
  }, [currentLocation, map, generateSmartSuggestions]);

  // Filter suggestions by category
  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  if (!currentLocation) {
    return null;
  }

  return (
    <div className={`absolute ${isExpanded ? 'inset-4' : 'bottom-4 left-4 right-4'} bg-white rounded-2xl shadow-2xl border-0 transition-all duration-300 z-30`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-900">Smart Suggestions</h3>
            <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full font-medium">
              AI Powered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              {isExpanded ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              type="button"
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`${isExpanded ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => onLocationSelect({
                  id: suggestion.id,
                  name: suggestion.name,
                  latitude: suggestion.position.lat,
                  longitude: suggestion.position.lng,
                  type: suggestion.category,
                  rating: suggestion.rating,
                  priceLevel: suggestion.priceLevel as 1 | 2 | 3 | 4 | undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onLocationSelect({
                      id: suggestion.id,
                      name: suggestion.name,
                      latitude: suggestion.position.lat,
                      longitude: suggestion.position.lng,
                      type: suggestion.category,
                      rating: suggestion.rating,
                      priceLevel: suggestion.priceLevel as 1 | 2 | 3 | 4 | undefined,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${suggestion.name}`}
              >
                {/* Image/Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0">
                  {suggestion.imageUrl ? (
                    <Image 
                      src={suggestion.imageUrl} 
                      alt={suggestion.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span>{categories.find(c => c.id === suggestion.category)?.icon || '📍'}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">{suggestion.name}</h4>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToTrip({
                          id: suggestion.id,
                          name: suggestion.name,
                          latitude: suggestion.position.lat,
                          longitude: suggestion.position.lng,
                          type: suggestion.category,
                          rating: suggestion.rating,
                          priceLevel: suggestion.priceLevel as 1 | 2 | 3 | 4 | undefined,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        });
                      }}
                      className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>

                  <p className="text-xs text-purple-600 font-medium mt-1">{suggestion.reason}</p>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {suggestion.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>{suggestion.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {suggestion.distance && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{suggestion.distance}m</span>
                      </div>
                    )}
                    {suggestion.isOpen !== undefined && (
                      <div className={`flex items-center gap-1 ${suggestion.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                        <Clock className="w-3 h-3" />
                        <span>{suggestion.isOpen ? 'Open' : 'Closed'}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {suggestion.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {suggestion.tags.map(tag => (
                        <span 
                          key={tag}
                          className="bg-white text-xs px-2 py-1 rounded-full text-gray-600 border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredSuggestions.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No suggestions found for this area</p>
                <p className="text-xs">Try a different location or category</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSuggestions;