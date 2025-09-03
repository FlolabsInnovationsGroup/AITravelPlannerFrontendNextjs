import { Location, LocationType } from '@/types/map';

type PlaceResult = google.maps.places.PlaceResult;

interface LocationExtractionResult {
    extractedLocation?: Location;
    suggestedPlaces?: PlaceResult[];
    error?: string;
}

export class LocationExtractionService {
    private readonly placesApiKey: string;
    private geocoder: google.maps.Geocoder | null = null;
    private placesService: google.maps.places.PlacesService | null = null;

    constructor() {
        this.placesApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    }

    private async initializeServices(): Promise<void> {
        // Wait for window.google to be defined
        if (typeof window === 'undefined' || !window.google?.maps) {
            throw new Error('Google Maps not loaded');
        }

        if (!this.geocoder || !this.placesService) {
            this.geocoder = new google.maps.Geocoder();
            const tempDiv = document.createElement('div');
            const map = new google.maps.Map(tempDiv, {
                center: { lat: 0, lng: 0 },
                zoom: 1
            });
            this.placesService = new google.maps.places.PlacesService(map);
        }
    }

    public async extractLocationFromMessage(message: string): Promise<LocationExtractionResult> {
        try {
            await this.initializeServices();

            // Improved regex to find potential place names with better matching
            const placeRegex = /(?:(?:in|at|to|from|visit|near|show|find|about)\s+(?:the\s+)?|^)([A-Z][a-zA-Z\s-]+)(?=[.,]|$|\s|on\sthe\smap)/gi;
            const matches = [...message.matchAll(placeRegex)];

            if (matches.length === 0) {
                return { error: "No location found in message" };
            }

            if (!this.placesService) {
                return { error: "Google Maps services not initialized" };
            }

            // Get the first match (most likely the main location)
            const placeName = matches[0][1].trim();
            
            // Search for the place using Places API
            const searchRequest: google.maps.places.TextSearchRequest = {
                query: placeName,
                type: 'tourist_attraction' // Can be adjusted based on context
            };

            return new Promise((resolve) => {
                if (!this.placesService) {
                    resolve({ error: "Places service not initialized" });
                    return;
                }

                this.placesService.textSearch(searchRequest, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        const place = results[0];
                        if (place.geometry?.location) {
                            const extractedLocation: Location = {
                                latitude: place.geometry.location.lat(),
                                longitude: place.geometry.location.lng(),
                                name: place.name || placeName,
                                type: this.inferLocationType(place.types || [])
                            };
                            resolve({ 
                                extractedLocation,
                                suggestedPlaces: results.slice(1)
                            });
                        } else {
                            resolve({ error: "Could not get location coordinates" });
                        }
                    } else {
                        resolve({ error: "Place not found" });
                    }
                });
            });
        } catch (error) {
            return { error: "Error extracting location" };
        }
    }

    private inferLocationType(placeTypes: string[]): LocationType {
        if (placeTypes.includes('lodging')) return 'hotel';
        if (placeTypes.includes('restaurant')) return 'restaurant';
        if (placeTypes.includes('cafe')) return 'cafe';
        if (placeTypes.includes('transit_station')) return 'transport';
        return 'attraction';
    }
}
