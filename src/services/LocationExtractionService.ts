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
            // TODO: Migrate to google.maps.places.Place API when ready - PlacesService is deprecated as of March 2025
            const dummyDiv = document.createElement('div');
            this.placesService = new google.maps.places.PlacesService(dummyDiv);
            
            this.#initialized = true;
        } catch (error) {
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
        // Geographic locations - cities, countries, localities
        if (types.includes('locality') || types.includes('administrative_area_level_1') || 
            types.includes('administrative_area_level_2') || types.includes('country') ||
            types.includes('political')) return 'attraction';
        
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
                    // Place details failed - skip this prediction
                }
            }

            return locations;
        } catch (error) {
            return [];
        }
    }

    // New method to extract multiple locations from AI responses
    async extractMultipleLocationsFromMessage(message: string): Promise<Location[]> {
        try {
            if (typeof window === 'undefined') {
                throw new Error('Cannot extract location in server-side context');
            }

            await this.#initPromise;

            // Enhanced patterns to find multiple cities in travel itineraries
            const cityPatterns = [
                // Major world cities pattern (expanded with more international cities)
                /\b(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Boston|El Paso|Detroit|Nashville|Portland|Memphis|Oklahoma City|Las Vegas|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Mesa|Sacramento|Atlanta|Kansas City|Colorado Springs|Omaha|Raleigh|Miami|Long Beach|Virginia Beach|Oakland|Minneapolis|Tulsa|Arlington|Tampa|New Orleans|Wichita|Cleveland|Bakersfield|Aurora|Anaheim|Honolulu|Santa Ana|Riverside|Corpus Christi|Lexington|Stockton|Henderson|Saint Paul|St. Louis|Cincinnati|Pittsburgh|Anchorage|Greensboro|Plano|Lincoln|Orlando|Irvine|Newark|Durham|Chula Vista|Toledo|Fort Wayne|St. Petersburg|Laredo|Jersey City|Chandler|Madison|Lubbock|Scottsdale|Reno|Buffalo|Gilbert|Glendale|North Las Vegas|Winston-Salem|Chesapeake|Norfolk|Fremont|Garland|Irving|Hialeah|Richmond|Boise|Spokane|Baton Rouge|Tacoma|San Bernardino|Modesto|Fontana|Des Moines|Moreno Valley|Santa Clarita|Fayetteville|Birmingham|Oxnard|Rochester|Port St. Lucie|Grand Rapids|Huntsville|Salt Lake City|Frisco|Yonkers|Amarillo|Glendale|Huntington Beach|McKinney|Montgomery|Augusta|Aurora|Akron|Little Rock|Tempe|Columbus|Overland Park|Grand Prairie|Tallahassee|Cape Coral|Mobile|Knoxville|Shreveport|Worcester|Ontario|Vancouver|Sioux Falls|Chattanooga|Brownsville|Fort Lauderdale|Providence|Newport News|Rancho Cucamonga|Santa Rosa|Peoria|Oceanside|Elk Grove|Salem|Pembroke Pines|Eugene|Garden Grove|Cary|Fort Collins|Corona|Springfield|Jackson|Alexandria|Hayward|Clarksville|Lakewood|Lancaster|Salinas|Palmdale|Hollywood|Pasadena|Pomona|Escondido|Sunnyvale|Killeen|Naperville|Torrance|Paterson|Rockford|Savannah|Bridgeport|Mesquite|Syracuse|McAllen|Pasadena|Joliet|Kansas City|Thornton|Fullerton|Carrollton|Midland|Concord|Visalia|Thousand Oaks|Simi Valley|Stamford|Olathe|Cedar Rapids|Elizabeth|Hampton|Miramar|Coral Springs|Sterling Heights|Kent|Abilene|West Jordan|Topeka|Denton|San Buenaventura|Waco|El Monte|Dayton|Fargo|Pearland|Richardson|Miami Gardens|League City|Lowell|Elgin|West Valley City|Round Rock|McKinney|Beaumont|Independence|Murfreesboro|Ann Arbor|High Point|Columbia|Clearwater|Westminster|Billings|Peoria|Arvada|Centennial|Pueblo|Fairfield|West Palm Beach|Richardson|Athens|Wilmington|Cambridge|Carlsbad|Allentown|Norwich|Tokyo|Paris|London|Berlin|Rome|Madrid|Amsterdam|Sydney|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|Barcelona|Florence|Naples|Milan|Venice|Bologna|Turin|Palermo|Genoa|Verona|Pisa|Siena|Lucca|Prato|Modena|Parma|Padua|Trieste|Brescia|Catania|Bari|Munich|Hamburg|Cologne|Frankfurt|Stuttgart|Düsseldorf|Leipzig|Dortmund|Essen|Bremen|Dresden|Hannover|Nuremberg|Duisburg|Bochum|Wuppertal|Bielefeld|Bonn|Münster|Mannheim|Augsburg|Wiesbaden|Gelsenkirchen|Aachen|Mönchengladbach|Braunschweig|Chemnitz|Kiel|Halle|Magdeburg|Freiburg|Krefeld|Lübeck|Mainz|Erfurt|Oberhausen|Rostock|Kassel|Hagen|Potsdam|Saarbrücken|Hamm|Ludwigshafen|Mülheim|Oldenburg|Leverkusen|Osnabrück|Solingen|Heidelberg|Herne|Neuss|Darmstadt|Paderborn|Regensburg|Ingolstadt|Würzburg|Fürth|Wolfsburg|Offenbach|Ulm|Heilbronn|Pforzheim|Göttingen|Bottrop|Trier|Recklinghausen|Reutlingen|Bremerhaven|Koblenz|Bergisch|Gladbach|Jena|Remscheid|Erlangen|Moers|Siegen|Hildesheim|Salzgitter)\b/gi,
                
                // Pattern for travel-style lists with bullet points or numbers
                /(?:[\d\*\-•]\.?\s*)?(?:Day \d+[:\-]?\s*)?([A-Z][a-zA-Z\s]+)(?:\s*[\-–]\s*[^\n]*)?/g,
                
                // Pattern for "From X to Y" or "X and Y" 
                /(?:from|visit|explore|discover|tour|start in|begin in|end in|finish in|travel to|head to|go to|arrive in)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:and|to|then|before|after)\s+([A-Z][a-zA-Z\s]+?))?/gi,
                
                // Pattern for lists: "X, Y, and Z" or "X, Y, Z"
                /\b([A-Z][a-zA-Z\s]+?)\s*,\s*([A-Z][a-zA-Z\s]+?)\s*(?:,\s*and\s+|\s+and\s+|,\s*)([A-Z][a-zA-Z\s]+?)\b/gi,
                
                // Pattern for itinerary format: "Day 1: City", "Day 2: Another City"
                /Day\s+\d+[:\-]?\s*([A-Z][a-zA-Z\s]+?)(?:\s*[\-–]|\n|$)/gi,
                
                // Pattern for simple city lists in parentheses or after colons
                /(?:cities?|destinations?|places?)[:\-]?\s*([A-Z][a-zA-Z\s]+?)(?:\s*,\s*([A-Z][a-zA-Z\s]+?))*(?:\s*,?\s*and\s+([A-Z][a-zA-Z\s]+?))?/gi
            ];

            const foundCities = new Set<string>();

            // Extract cities using patterns
            cityPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(message)) !== null) {
                    for (let i = 1; i < match.length; i++) {
                        if (match[i] && this.#isValidLocationName(match[i])) {
                            foundCities.add(match[i].trim());
                        }
                    }
                }
            });

            // If no cities found with specific patterns, try a more general approach
            if (foundCities.size === 0) {
                // Look for any capitalized words that could be cities (2-20 characters)
                const generalPattern = /\b([A-Z][a-z]{1,19})(?:\s+([A-Z][a-z]{1,19}))*\b/g;
                let generalMatch;
                while ((generalMatch = generalPattern.exec(message)) !== null) {
                    const fullMatch = generalMatch[0];
                    if (this.#isValidLocationName(fullMatch) && this.#couldBeCity(fullMatch)) {
                        foundCities.add(fullMatch);
                    }
                }
            }

            // Convert city names to Location objects
            const locations: Location[] = [];
            for (const cityName of foundCities) {
                try {
                    const cityCoords = this.#getCityCoordinates(cityName);
                    if (cityCoords) {
                        locations.push({
                            id: `${cityName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                            latitude: cityCoords.lat,
                            longitude: cityCoords.lng,
                            name: cityName,
                            type: 'attraction' as LocationType,
                            sessionId: sessionStorage.getItem('chatSessionId') || undefined
                        });
                    } else {
                        // Try geocoding for unknown cities
                        const result = await this.extractLocationFromMessage(cityName);
                        if (result.extractedLocation) {
                            locations.push(result.extractedLocation);
                        }
                    }
                } catch (error) {
                    // City geocoding failed - skip
                }
            }

            return locations;
        } catch (error) {
            return [];
        }
    }

    async extractLocationFromMessage(message: string): Promise<LocationExtractionResult> {
        try {
            if (typeof window === 'undefined') {
                throw new Error('Cannot extract location in server-side context');
            }

            await this.#initPromise;

            // Blacklist of common phrases that should not be treated as locations
            const phraseBlacklist = [
                'make it', 'make it unforgettable', 'make it perfect', 'make it special', 'make it amazing',
                'take it', 'take it easy', 'keep it', 'keep it simple', 'get it', 'put it',
                'love it', 'need it', 'want it', 'see it', 'do it', 'try it', 'use it',
                'like it', 'have it', 'give it', 'find it', 'show it', 'tell it',
                'book it', 'plan it', 'enjoy it', 'experience it', 'discover it',
                'the best', 'the most', 'the perfect', 'the amazing', 'the wonderful',
                'very good', 'very nice', 'so good', 'so nice', 'really good', 'really nice',
                'family adventure', 'family fun', 'family time', 'family trip',
                'adventure time', 'adventure trip', 'adventure tour',
                'unforgettable', 'incredible', 'amazing', 'wonderful', 'perfect', 'special'
            ];

            // Extract location name using multiple patterns
            const patterns = [
                // Explicit map-related commands
                /(?:add|show|display|put)\s+(.*?)\s+(?:to|on|in)\s+(?:the\s+)?map/i,
                
                // Questions about locations
                /(?:where|what|find|show)\s+(?:is|are)\s+(.*?)(?:\s+(?:located|situated|found))?\??$/i,
                
                // High-priority known major cities (HIGHEST PRIORITY - prevents false matches)
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?(Tokyo|Paris|London|Berlin|Rome|Madrid|Amsterdam|Sydney|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|Barcelona|Florence|Milan|Naples|Bologna|Turin|Venice|Palermo|Genoa|Verona|Pisa|Siena|Lucca|Perugia|Assisi)(?:\s*,?\s*(?:Japan|France|UK|USA|Germany|Italy|Spain|Netherlands|Australia|Austria|Hungary|Belgium|Ireland|Scotland|Sweden|Denmark|Norway|Finland|Poland|Portugal|Greece|Turkey|Russia))?/i,
                
                // More specific location patterns (removed the overly broad "find" pattern)
                /(?:located|situated)\s+(?:in|at|near)\s+([A-Za-z][A-Za-z\s-]+)/i,
                
                // Specific landmark patterns (towers, monuments, etc.)
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?([A-Za-z\s-]+(?:Tower|Monument|Palace|Castle|Temple|Church|Cathedral|Museum|Park|Square|Bridge|Station)[A-Za-z\s-]*)/i,
                
                // City/country patterns with prepositions
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?([A-Z][A-Za-z\s-]+(?:,\s*)?(?:Japan|France|UK|USA|Germany|Italy|Spain|Netherlands|Australia|Canada|China|India|Brazil))/i,
                
                // Direct city/country mentions
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*,?\s*(?:Japan|France|UK|USA|Germany|Italy|Spain|Netherlands|Australia|Canada|China|India|Brazil)?)/i,
                
                // Beginning of message location (more restrictive)
                /^([A-Z][A-Za-z\s-]+(?:,\s*(?:Japan|France|UK|USA|Germany|Italy|Spain|Netherlands|Australia|Canada|China|India|Brazil))?)(?=[.,!]|$|\s+(?:is|has|offers|provides))/i
            ];

            let locationName = '';
            for (const pattern of patterns) {
                const match = message.match(pattern);
                if (match?.[1]) {
                    const candidate = match[1].trim();
                    
                    // Check against blacklist
                    const candidateLower = candidate.toLowerCase();
                    const isBlacklisted = phraseBlacklist.some(phrase => 
                        candidateLower === phrase || 
                        candidateLower.includes(phrase) || 
                        phrase.includes(candidateLower)
                    );
                    
                    if (!isBlacklisted && this.#isValidLocationName(candidate)) {
                        locationName = candidate;
                        break;
                    }
                }
            }

            if (!locationName) {
                return { error: 'No location found in message' };
            }

            // First, try Google Places API for better business/POI results
            let placesResults: Location[] = [];
            try {
                // Try to detect if we're in a specific city context for better results
                const cityContext = this.#detectCityContext(message);
                const centerLocation = cityContext ? this.#getCityCoordinates(cityContext) : null;
                
                placesResults = await this.#searchPlacesAPI(locationName, centerLocation || undefined);
            } catch (placesError) {
                // Places API search failed - continue with geocoding fallback
            }

            // If Places API found good results, use the best one
            if (placesResults.length > 0) {
                const bestResult = placesResults[0]; // Places API results are already sorted by relevance
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
                
                const response = await this.geocoder.geocode({ address: searchQuery });
                
                if (!response.results || response.results.length === 0) {
                    return { error: 'Could not find location coordinates' };
                }

                // Try to find the most specific result, prefer exact matches
                result = response.results.find(r => 
                    r.formatted_address.toLowerCase().includes(locationName.toLowerCase()) ||
                    (r as any).name?.toLowerCase().includes(locationName.toLowerCase())
                ) || response.results[0];

                if (!result || !result.geometry?.location) {
                    return { error: 'Could not find location coordinates' };
                }
            } catch (geocodeError) {
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

            return {
                extractedLocation,
                suggestedPlaces: []
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error extracting location';
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

    // Validate if a candidate string could be a valid location name
    #couldBeCity(candidate: string): boolean {
        const cleaned = candidate.trim().toLowerCase();
        
        // Skip common words that are definitely not cities
        const definitivelyNotCities = [
            'perfect', 'amazing', 'wonderful', 'beautiful', 'stunning', 'incredible', 'fantastic', 'excellent',
            'great', 'good', 'best', 'nice', 'lovely', 'awesome', 'super', 'special', 'unique', 'memorable',
            'adventure', 'journey', 'trip', 'vacation', 'holiday', 'travel', 'experience', 'destination',
            'morning', 'afternoon', 'evening', 'night', 'today', 'tomorrow', 'yesterday', 'weekend',
            'family', 'friends', 'people', 'person', 'group', 'couple', 'children', 'kids', 'adults',
            'time', 'day', 'days', 'week', 'month', 'year', 'season', 'weather', 'climate',
            'food', 'restaurant', 'hotel', 'museum', 'park', 'beach', 'mountain', 'river', 'lake'
        ];
        
        return !definitivelyNotCities.includes(cleaned) && cleaned.length >= 3 && cleaned.length <= 25;
    }

    #isValidLocationName(candidate: string): boolean {
        // Basic length check
        if (candidate.length < 2 || candidate.length > 100) {
            return false;
        }

        // Should start with a letter
        if (!/^[A-Za-z]/.test(candidate)) {
            return false;
        }

        // Should not be all lowercase common words
        const commonWords = ['make', 'take', 'get', 'put', 'see', 'do', 'go', 'come', 'have', 'be', 'will', 'can', 'should', 'would', 'could', 'may', 'might'];
        if (commonWords.includes(candidate.toLowerCase())) {
            return false;
        }

        // Should not contain only pronouns/articles
        const pronounsArticles = ['it', 'the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'our', 'their'];
        if (pronounsArticles.includes(candidate.toLowerCase())) {
            return false;
        }

        // Should not be action words that commonly appear in travel requests
        const actionWords = ['unforgettable', 'amazing', 'incredible', 'wonderful', 'perfect', 'special', 'great', 'awesome', 'fantastic'];
        if (actionWords.includes(candidate.toLowerCase())) {
            return false;
        }

        // Should not contain obvious non-location patterns
        if (/\b(make|take|get|put|see|do|go|come|have|be|will|can|should|would|could|may|might)\s+(it|that|this)\b/i.test(candidate)) {
            return false;
        }

        // Valid location names typically have:
        // - Capital letters (proper nouns)
        // - May contain spaces, hyphens, apostrophes
        // - May contain numbers (for addresses)
        if (!/^[A-Za-z][A-Za-z0-9\s\-'.,()]+$/.test(candidate)) {
            return false;
        }

        return true;
    }
}
