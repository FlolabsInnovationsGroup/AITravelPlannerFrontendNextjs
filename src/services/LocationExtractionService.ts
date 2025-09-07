import { Location, LocationType } from '@/types/map';

interface LocationExtractionResult {
    extractedLocation?: Location;
    error?: string;
    suggestedPlaces?: Location[];
}

export class LocationExtractionService {
    private geocoder: google.maps.Geocoder | null = null;
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
                throw new Error('Google Maps not loaded');
            }

            // Make sure the Geocoding library is loaded
            if (!window.google.maps.Geocoder) {
                throw new Error('Geocoding library not loaded');
            }

            this.geocoder = new google.maps.Geocoder();
            this.#initialized = true;
            console.log('✅ LocationExtractionService initialized');
        } catch (error) {
            console.error('❌ Failed to initialize LocationExtractionService:', error);
            throw error;
        }
    }

    #getLocationType(types: string[]): LocationType {
        if (types.includes('lodging')) return 'hotel';
        if (types.includes('restaurant')) return 'restaurant';
        if (types.includes('cafe')) return 'cafe';
        if (types.includes('transit_station')) return 'transport';
        if (types.includes('tourist_attraction')) return 'attraction';
        if (types.includes('natural_feature')) return 'attraction';
        if (types.includes('point_of_interest')) return 'attraction';
        return 'attraction';
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

            if (!this.geocoder) {
                throw new Error('Geocoder not initialized');
            }

            let result;
            try {
                const response = await this.geocoder.geocode({ address: locationName });
                
                if (!response.results || response.results.length === 0) {
                    console.warn('❌ No results found for location:', locationName);
                    return { error: 'Could not find location coordinates' };
                }

                // Try to find the most specific result, prefer exact matches
                result = response.results.find(r => 
                    r.formatted_address.toLowerCase().includes(locationName.toLowerCase()) ||
                    r.name?.toLowerCase().includes(locationName.toLowerCase())
                ) || response.results[0];

                console.log('🎯 Selected result:', {
                    formatted_address: result.formatted_address,
                    types: result.types,
                    name: result.name
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
            // Get session ID from storage
            const sessionId = sessionStorage.getItem('chatSessionId');
            
            const extractedLocation: Location = {
                latitude: location.lat(),
                longitude: location.lng(),
                name: result.formatted_address.split(',')[0] || locationName,
                type: this.#getLocationType(result.types || []),
                sessionId: sessionId || undefined
            };

            console.log('✅ Successfully extracted location:', extractedLocation);
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
}
