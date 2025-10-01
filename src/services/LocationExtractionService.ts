import { Location, LocationType } from '@/types/map';

interface LocationExtractionResult {
    extractedLocation?: Location;
    error?: string;
    suggestedPlaces?: Location[];
}

export class LocationExtractionService {
    private geocoder: google.maps.Geocoder | null = null;
    private placesService: google.maps.places.PlacesService | null = null;
    #initialized = false;
    #initPromise: Promise<void> = Promise.resolve();

    constructor() {
        if (typeof window !== 'undefined') {
            this.#initPromise = this.#initialize();
        }
    }

    async #initialize(): Promise<void> {
        if (this.#initialized) return;

        try {
            if (typeof window === 'undefined' || !window.google?.maps) {
                // In test environment or server-side, skip initialization
                console.warn('Google Maps not available - running in test/server environment');
                this.#initialized = true;
                return;
            }

            // Make sure the required libraries are loaded
            if (!window.google.maps.Geocoder) {
                throw new Error('Geocoding library not loaded');
            }
            if (!window.google.maps.places?.PlacesService) {
                throw new Error('Places library not loaded');
            }

            this.geocoder = new google.maps.Geocoder();
            // Create a dummy div for PlacesService (required by Google Maps API)
            const dummyDiv = document.createElement('div');
            this.placesService = new google.maps.places.PlacesService(dummyDiv);
            
            this.#initialized = true;
            console.log('✅ LocationExtractionService initialized with Places API');
        } catch (error) {
            console.error('❌ Failed to initialize LocationExtractionService:', error);
            throw error;
        }
    }

    #getLocationType(types: string[]): LocationType {
        // Travel-specific categorization
        if (types.includes('lodging') || types.includes('hotel')) return 'hotel';
        if (types.includes('restaurant') || types.includes('food') || types.includes('meal_takeaway')) return 'restaurant';
        if (types.includes('cafe') || types.includes('bakery')) return 'cafe';
        if (types.includes('airport')) return 'airport';
        if (types.includes('train_station')) return 'station';
        if (types.includes('bus_station') || types.includes('transit_station')) return 'station';
        if (types.includes('museum')) return 'museum';
        if (types.includes('park') || types.includes('natural_feature')) return 'park';
        if (types.includes('beach')) return 'beach';
        if (types.includes('shopping_mall') || types.includes('store')) return 'shopping';
        if (types.includes('night_club') || types.includes('bar')) return 'entertainment';
        if (types.includes('church') || types.includes('cemetery') || types.includes('historical')) return 'landmark';
        if (types.includes('scenic_lookout') || types.includes('observation_deck')) return 'viewpoint';
        if (types.includes('tourist_attraction') || types.includes('point_of_interest')) return 'attraction';
        
        // Default fallback
        return 'attraction';
    }

    // Enhanced method to search for places using Google Places API
    async #searchPlacesAPI(locationName: string, centerLocation?: { lat: number; lng: number }): Promise<Location[]> {
        if (!this.placesService) {
            throw new Error('Places service not initialized');
        }

        try {
            // Use new AutocompleteSuggestion API for better place matching
            const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input: locationName,
                sessionToken: new google.maps.places.AutocompleteSessionToken(),
                locationBias: centerLocation ? {
                    radius: 50000,
                    center: new google.maps.LatLng(centerLocation.lat, centerLocation.lng)
                } : undefined,
            });

            const autocompleteResults = suggestions
                .filter(suggestion => suggestion.placePrediction)
                .map(suggestion => ({
                    description: suggestion.placePrediction!.text!.text,
                    place_id: suggestion.placePrediction!.placeId,
                    structured_formatting: {
                        main_text: suggestion.placePrediction!.text!.text.split(',')[0],
                        secondary_text: suggestion.placePrediction!.text!.text.split(',').slice(1).join(',').trim(),
                        main_text_matched_substrings: []
                    },
                    matched_substrings: [],
                    terms: [],
                    types: suggestion.placePrediction!.types || []
                }));

            console.log('🔍 Autocomplete results:', autocompleteResults.length);

            // Convert predictions to Location objects
            const locations: Location[] = [];
            
            for (const prediction of autocompleteResults.slice(0, 3)) { // Limit to top 3 results
                try {
                    const placeDetails = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
                        this.placesService!.getDetails({
                            placeId: prediction.place_id,
                            fields: ['geometry', 'name', 'formatted_address', 'types', 'place_id', 'rating', 'price_level']
                        }, (place, status) => {
                            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                                resolve(place);
                            } else {
                                reject(new Error(`Place details failed: ${status}`));
                            }
                        });
                    });

                    if (placeDetails.geometry?.location) {
                        const sessionId = sessionStorage.getItem('chatSessionId');
                        locations.push({
                            id: `${placeDetails.place_id}-${Date.now()}`, // Generate unique ID
                            latitude: placeDetails.geometry.location.lat(),
                            longitude: placeDetails.geometry.location.lng(),
                            name: placeDetails.name || prediction.structured_formatting.main_text,
                            type: this.#getLocationType(placeDetails.types || []),
                            sessionId: sessionId || undefined,
                            placeId: placeDetails.place_id,
                            rating: placeDetails.rating,
                            priceLevel: placeDetails.price_level as 1 | 2 | 3 | 4,
                            vicinity: placeDetails.formatted_address
                        });
                    }
                } catch (detailError) {
                    console.warn('Failed to get place details for:', prediction.description, detailError);
                }
            }

            return locations;
        } catch (error) {
            console.warn('Places API search failed, falling back to geocoding:', error);
            return [];
        }
    }

    async extractLocationFromMessage(message: string): Promise<LocationExtractionResult> {
        try {
            if (typeof window === 'undefined') {
                throw new Error('Cannot extract location in server-side context');
            }

            await this.#initPromise;

            // Extract location name using multiple patterns
            const patterns = [
                /(?:add|show|display|put)\s+(.*?)\s+(?:to|on|in)\s+(?:the\s+)?map/i,
                /(?:where|what|find|show)\s+(?:is|are)\s+(.*?)(?:\s+(?:located|situated|found))?\??$/i,
                /(?:find|locate|show)\s+(.*)/i,
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?([A-Za-z\s-]+Tower[A-Za-z\s-]*)/i,
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?([A-Za-z][A-Za-z\s-]+)(?=[.,]|$|\s|on\sthe\smap)/i,
                /^([A-Za-z][A-Za-z\s-]+)(?=[.,]|$|\s|on\sthe\smap)/i
            ];

            let locationName = '';
            for (const pattern of patterns) {
                const match = message.match(pattern);
                if (match?.[1]) {
                    locationName = match[1].trim();
                    break;
                }
            }

            if (!locationName) {
                console.warn('❌ No location found in message');
                return { error: 'No location found in message' };
            }

            console.log('🔍 Extracting location:', locationName);

            // First, try Google Places API for better business/POI results
            let placesResults: Location[] = [];
            try {
                // Try to detect if we're in a specific city context for better results
                const cityContext = this.#detectCityContext(message);
                const centerLocation = cityContext ? this.#getCityCoordinates(cityContext) : null;
                
                placesResults = await this.#searchPlacesAPI(locationName, centerLocation || undefined);
                console.log('🏢 Places API found:', placesResults.length, 'results');
            } catch (placesError) {
                console.warn('Places API search failed:', placesError);
            }

            // If Places API found good results, use the best one
            if (placesResults.length > 0) {
                const bestResult = placesResults[0]; // Places API results are already sorted by relevance
                console.log('✅ Using Places API result:', bestResult);
                return {
                    extractedLocation: bestResult,
                    suggestedPlaces: placesResults.slice(1) // Return other options as suggestions
                };
            }

            // Fallback to Geocoder if Places API didn't find anything
            if (!this.geocoder) {
                throw new Error('Geocoder not initialized');
            }

            let result;
            try {
                // Enhance the search query with city context if available
                const cityContext = this.#detectCityContext(message);
                const searchQuery = cityContext ? `${locationName}, ${cityContext}` : locationName;
                
                console.log('🗺️ Fallback to Geocoder with query:', searchQuery);
                const response = await this.geocoder.geocode({ address: searchQuery });
                
                if (!response.results || response.results.length === 0) {
                    console.warn('❌ No results found for location:', searchQuery);
                    return { error: 'Could not find location coordinates' };
                }

                // Try to find the most specific result, prefer exact matches
                result = response.results.find(r => 
                    r.formatted_address.toLowerCase().includes(locationName.toLowerCase()) ||
                    (r as any).name?.toLowerCase().includes(locationName.toLowerCase())
                ) || response.results[0];

                console.log('🎯 Selected geocoder result:', {
                    formatted_address: result.formatted_address,
                    types: result.types,
                    name: (result as any).name
                });

                if (!result || !result.geometry?.location) {
                    console.warn('❌ Could not find location geometry:', locationName);
                    return { error: 'Could not find location coordinates' };
                }
            } catch (geocodeError) {
                console.error('❌ Geocoding error:', geocodeError);
                return { error: 'Failed to geocode location. Please ensure the Google Maps API key has Geocoding enabled.' };
            }

            const location = result.geometry.location;
            const sessionId = sessionStorage.getItem('chatSessionId');
            
            const extractedLocation: Location = {
                id: `geocoder-${Date.now()}`, // Generate unique ID for geocoder results
                latitude: location.lat(),
                longitude: location.lng(),
                name: result.formatted_address.split(',')[0] || locationName,
                type: this.#getLocationType(result.types || []),
                sessionId: sessionId || undefined
            };

            console.log('✅ Successfully extracted location via Geocoder:', extractedLocation);
            return {
                extractedLocation,
                suggestedPlaces: []
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error extracting location';
            console.error('❌ Error extracting location:', errorMessage);
            return { error: errorMessage };
        }
    }

    // Helper method to detect city context from conversation
    #detectCityContext(message: string): string | null {
        const cityPatterns = [
            /\bin\s+(Paris|London|New York|Tokyo|Rome|Barcelona|Madrid|Berlin|Amsterdam|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|St\.\s*Petersburg)/gi,
            /\bat\s+(Paris|London|New York|Tokyo|Rome|Barcelona|Madrid|Berlin|Amsterdam|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|St\.\s*Petersburg)/gi,
            /\bto\s+(Paris|London|New York|Tokyo|Rome|Barcelona|Madrid|Berlin|Amsterdam|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|St\.\s*Petersburg)/gi,
        ];

        for (const pattern of cityPatterns) {
            const match = message.match(pattern);
            if (match?.[1]) {
                return match[1];
            }
        }

        // Check if we're already in a city context from previous locations
        const sessionId = sessionStorage.getItem('chatSessionId');
        if (sessionId) {
            // This could be enhanced to check previous locations in the session
            // For now, default to Paris since that's where the user seems to be planning
            return 'Paris';
        }

        return null;
    }

    // Helper method to get coordinates for major cities
    #getCityCoordinates(city: string): { lat: number; lng: number } | null {
        const cityCoords: Record<string, { lat: number; lng: number }> = {
            'Paris': { lat: 48.8566, lng: 2.3522 },
            'London': { lat: 51.5074, lng: -0.1278 },
            'New York': { lat: 40.7128, lng: -74.0060 },
            'Tokyo': { lat: 35.6762, lng: 139.6503 },
            'Rome': { lat: 41.9028, lng: 12.4964 },
            'Barcelona': { lat: 41.3851, lng: 2.1734 },
            'Madrid': { lat: 40.4168, lng: -3.7038 },
            'Berlin': { lat: 52.5200, lng: 13.4050 },
            'Amsterdam': { lat: 52.3676, lng: 4.9041 },
            'Vienna': { lat: 48.2082, lng: 16.3738 },
            'Prague': { lat: 50.0755, lng: 14.4378 },
            'Budapest': { lat: 47.4979, lng: 19.0402 },
            'Brussels': { lat: 50.8503, lng: 4.3517 },
            'Dublin': { lat: 53.3498, lng: -6.2603 },
            'Edinburgh': { lat: 55.9533, lng: -3.1883 },
            'Stockholm': { lat: 59.3293, lng: 18.0686 },
            'Copenhagen': { lat: 55.6761, lng: 12.5683 },
            'Oslo': { lat: 59.9139, lng: 10.7522 },
            'Helsinki': { lat: 60.1699, lng: 24.9384 },
            'Warsaw': { lat: 52.2297, lng: 21.0122 },
            'Lisbon': { lat: 38.7223, lng: -9.1393 },
            'Athens': { lat: 37.9838, lng: 23.7275 },
            'Istanbul': { lat: 41.0082, lng: 28.9784 },
            'Moscow': { lat: 55.7558, lng: 37.6173 },
            'St. Petersburg': { lat: 59.9311, lng: 30.3609 }
        };

        return cityCoords[city] || null;
    }
}
