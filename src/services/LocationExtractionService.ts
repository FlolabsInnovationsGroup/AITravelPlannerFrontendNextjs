import { Location, LocationType } from '@/types/map';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface LocationExtractionResult {
    extractedLocation?: Location;
    error?: string;
    suggestedPlaces?: Location[];
}

export class LocationExtractionService {
    #initialized = false;

    #initPromise: Promise<void> = Promise.resolve();

    constructor() {
        if (typeof window !== 'undefined') {
            this.#initPromise = this.#initialize();
        }
    }

    async #initialize(): Promise<void> {
        if (this.#initialized) return;
        this.#initialized = true;
    }

    // eslint-disable-next-line class-methods-use-this
    #getLocationType(types: string[]): LocationType {
        if (types.includes('lodging') || types.includes('hotel') || types.includes('accommodation')) return 'hotel';
        if (types.includes('restaurant') || types.includes('food') || types.includes('meal_takeaway') || types.includes('catering.restaurant')) return 'restaurant';
        if (types.includes('cafe') || types.includes('bakery') || types.includes('catering.cafe')) return 'cafe';
        if (types.includes('airport') || types.includes('aeroway')) return 'airport';
        if (types.includes('train_station') || types.includes('railway')) return 'station';
        if (types.includes('bus_station') || types.includes('transit_station') || types.includes('public_transport')) return 'station';
        if (types.includes('museum') || types.includes('entertainment.museum')) return 'museum';
        if (types.includes('park') || types.includes('natural_feature') || types.includes('leisure.park')) return 'park';
        if (types.includes('beach') || types.includes('natural.beach')) return 'beach';
        if (types.includes('shopping_mall') || types.includes('store') || types.includes('commercial.shopping_mall')) return 'shopping';
        if (types.includes('night_club') || types.includes('bar') || types.includes('entertainment')) return 'entertainment';
        if (types.includes('church') || types.includes('cemetery') || types.includes('historical') || types.includes('heritage')) return 'landmark';
        if (types.includes('scenic_lookout') || types.includes('observation_deck')) return 'viewpoint';
        if (types.includes('tourist_attraction') || types.includes('point_of_interest') || types.includes('tourism')) return 'attraction';
        if (types.includes('locality') || types.includes('administrative_area_level_1') ||
            types.includes('administrative_area_level_2') || types.includes('country') ||
            types.includes('political') || types.includes('city') || types.includes('populated_place')) return 'attraction';
        return 'attraction';
    }

    async #searchPlacesAPI(locationName: string, centerLocation?: { lat: number; lng: number }): Promise<Location[]> {
        try {
            let url = `${API_URL}/api/geoapify/autocomplete?text=${encodeURIComponent(locationName)}`;
            if (centerLocation) {
                url += `&bias=proximity:${centerLocation.lng},${centerLocation.lat}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Autocomplete request failed: ${response.status}`);
            }

            const data = await response.json();
            const features = data.features || data.results || [];

            const locations: Location[] = features.slice(0, 3).map((feature: any) => {
                const props = feature.properties || feature;
                const lat = props.lat ?? feature.geometry?.coordinates?.[1] ?? 0;
                const lon = props.lon ?? feature.geometry?.coordinates?.[0] ?? 0;
                const categories = props.categories || [];
                const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('chatSessionId') : null;

                return {
                    id: `${props.place_id || `${lat}-${lon}`}-${Date.now()}`,
                    latitude: lat,
                    longitude: lon,
                    name: props.name || (props.formatted || '').split(',')[0] || locationName,
                    type: this.#getLocationType(Array.isArray(categories) ? categories : []),
                    sessionId: sessionId || undefined,
                    placeId: props.place_id,
                    vicinity: props.formatted || props.formatted_address || '',
                } as Location;
            }).filter((loc: Location) => loc.latitude !== 0 || loc.longitude !== 0);

            return locations;
        } catch (error) {
            return [];
        }
    }

    async extractMultipleLocationsFromMessage(message: string): Promise<Location[]> {
        try {
            if (typeof window === 'undefined') {
                throw new Error('Cannot extract location in server-side context');
            }

            await this.#initPromise;

            const cityPatterns = [
                /\b(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Boston|El Paso|Detroit|Nashville|Portland|Memphis|Oklahoma City|Las Vegas|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Mesa|Sacramento|Atlanta|Kansas City|Colorado Springs|Omaha|Raleigh|Miami|Long Beach|Virginia Beach|Oakland|Minneapolis|Tulsa|Arlington|Tampa|New Orleans|Wichita|Cleveland|Bakersfield|Aurora|Anaheim|Honolulu|Santa Ana|Riverside|Corpus Christi|Lexington|Stockton|Henderson|Saint Paul|St. Louis|Cincinnati|Pittsburgh|Anchorage|Greensboro|Plano|Lincoln|Orlando|Irvine|Newark|Durham|Chula Vista|Toledo|Fort Wayne|St. Petersburg|Laredo|Jersey City|Chandler|Madison|Lubbock|Scottsdale|Reno|Buffalo|Gilbert|Glendale|North Las Vegas|Winston-Salem|Chesapeake|Norfolk|Fremont|Garland|Irving|Hialeah|Richmond|Boise|Spokane|Baton Rouge|Tacoma|San Bernardino|Modesto|Fontana|Des Moines|Moreno Valley|Santa Clarita|Fayetteville|Birmingham|Oxnard|Rochester|Port St. Lucie|Grand Rapids|Huntsville|Salt Lake City|Frisco|Yonkers|Amarillo|Glendale|Huntington Beach|McKinney|Montgomery|Augusta|Aurora|Akron|Little Rock|Tempe|Columbus|Overland Park|Grand Prairie|Tallahassee|Cape Coral|Mobile|Knoxville|Shreveport|Worcester|Ontario|Vancouver|Sioux Falls|Chattanooga|Brownsville|Fort Lauderdale|Providence|Newport News|Rancho Cucamonga|Santa Rosa|Peoria|Oceanside|Elk Grove|Salem|Pembroke Pines|Eugene|Garden Grove|Cary|Fort Collins|Corona|Springfield|Jackson|Alexandria|Hayward|Clarksville|Lakewood|Lancaster|Salinas|Palmdale|Hollywood|Pasadena|Pomona|Escondido|Sunnyvale|Killeen|Naperville|Torrance|Paterson|Rockford|Savannah|Bridgeport|Mesquite|Syracuse|McAllen|Pasadena|Joliet|Kansas City|Tokyo|Paris|London|Berlin|Rome|Madrid|Amsterdam|Sydney|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|Barcelona|Florence|Naples|Milan|Venice|Bologna|Turin|Palermo|Genoa|Verona|Pisa|Siena|Lucca|Munich|Hamburg|Cologne|Frankfurt|Stuttgart|Düsseldorf|Leipzig|Dortmund|Essen|Bremen|Dresden|Hannover|Nuremberg)\b/gi,
                /(?:[\d*\-•]\.?\s*)?(?:Day \d+[:-]?\s*)?([A-Z][a-zA-Z\s]+)(?:\s*[-–]\s*[^\n]*)?/g,
                /(?:from|visit|explore|discover|tour|start in|begin in|end in|finish in|travel to|head to|go to|arrive in)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:and|to|then|before|after)\s+([A-Z][a-zA-Z\s]+?))?/gi,
                /\b([A-Z][a-zA-Z\s]+?)\s*,\s*([A-Z][a-zA-Z\s]+?)\s*(?:,\s*and\s+|\s+and\s+|,\s*)([A-Z][a-zA-Z\s]+?)\b/gi,
                /Day\s+\d+[:-]?\s*([A-Z][a-zA-Z\s]+?)(?:\s*[-–]|\n|$)/gi,
                /(?:cities?|destinations?|places?)[:-]?\s*([A-Z][a-zA-Z\s]+?)(?:\s*,\s*([A-Z][a-zA-Z\s]+?))*(?:\s*,?\s*and\s+([A-Z][a-zA-Z\s]+?))?/gi,
            ];

            const foundCities = new Set<string>();

            cityPatterns.forEach((pattern) => {
                let match = pattern.exec(message);
                while (match !== null) {
                    for (let i = 1; i < match.length; i += 1) {
                        if (match[i] && this.#isValidLocationName(match[i])) {
                            foundCities.add(match[i].trim());
                        }
                    }
                    match = pattern.exec(message);
                }
            });

            if (foundCities.size === 0) {
                const generalPattern = /\b([A-Z][a-z]{1,19})(?:\s+([A-Z][a-z]{1,19}))*\b/g;
                let generalMatch = generalPattern.exec(message);
                while (generalMatch !== null) {
                    const fullMatch = generalMatch[0];
                    if (this.#isValidLocationName(fullMatch) && this.#couldBeCity(fullMatch)) {
                        foundCities.add(fullMatch);
                    }
                    generalMatch = generalPattern.exec(message);
                }
            }

            const locationResults = await Promise.all(
                Array.from(foundCities).map(async (cityName) => {
                    try {
                        const cityCoords = this.#getCityCoordinates(cityName);
                        if (cityCoords) {
                            return {
                                id: `${cityName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                                latitude: cityCoords.lat,
                                longitude: cityCoords.lng,
                                name: cityName,
                                type: 'attraction' as LocationType,
                                sessionId: sessionStorage.getItem('chatSessionId') || undefined,
                            };
                        }
                        const result = await this.extractLocationFromMessage(cityName);
                        return result.extractedLocation || null;
                    } catch {
                        return null;
                    }
                }),
            );

            return locationResults.filter((loc: any) => loc !== null) as Location[];
        } catch {
            return [];
        }
    }

    async extractLocationFromMessage(message: string): Promise<LocationExtractionResult> {
        try {
            if (typeof window === 'undefined') {
                throw new Error('Cannot extract location in server-side context');
            }

            await this.#initPromise;

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
                'unforgettable', 'incredible', 'amazing', 'wonderful', 'perfect', 'special',
            ];

            const patterns = [
                /(?:add|show|display|put)\s+(.*?)\s+(?:to|on|in)\s+(?:the\s+)?map/i,
                /(?:where|what|find|show)\s+(?:is|are)\s+(.*?)(?:\s+(?:located|situated|found))?\??$/i,
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?(Tokyo|Paris|London|Berlin|Rome|Madrid|Amsterdam|Sydney|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|Barcelona|Florence|Milan|Naples|Bologna|Turin|Venice|Palermo|Genoa|Verona|Pisa|Siena|Lucca|Perugia|Assisi)(?:\s*,?\s*(?:Japan|France|UK|USA|Germany|Italy|Spain|Netherlands|Australia|Austria|Hungary|Belgium|Ireland|Scotland|Sweden|Denmark|Norway|Finland|Poland|Portugal|Greece|Turkey|Russia))?/i,
                /(?:located|situated)\s+(?:in|at|near)\s+([A-Za-z][A-Za-z\s-]+)/i,
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?([A-Za-z\s-]+(?:Tower|Monument|Palace|Castle|Temple|Church|Cathedral|Museum|Park|Square|Bridge|Station)[A-Za-z\s-]*)/i,
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?([A-Z][A-Za-z\s-]+(?:,\s*)?(?:Japan|France|UK|USA|Germany|Italy|Spain|Netherlands|Australia|Canada|China|India|Brazil))/i,
                /(?:in|at|to|from|visit|near|about)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*,?\s*(?:Japan|France|UK|USA|Germany|Italy|Spain|Netherlands|Australia|Canada|China|India|Brazil)?)/i,
                /^([A-Z][A-Za-z\s-]+(?:,\s*(?:Japan|France|UK|USA|Germany|Italy|Spain|Netherlands|Australia|Canada|China|India|Brazil))?)(?=[.,!]|$|\s+(?:is|has|offers|provides))/i,
            ];

            let locationName = '';

            patterns.find((pattern) => {
                const match = message.match(pattern);
                if (match?.[1]) {
                    const candidate = match[1].trim();
                    const candidateLower = candidate.toLowerCase();
                    const isBlacklisted = phraseBlacklist.some(
                        (phrase) =>
                            candidateLower === phrase ||
                            candidateLower.includes(phrase) ||
                            phrase.includes(candidateLower),
                    );
                    if (!isBlacklisted && this.#isValidLocationName(candidate)) {
                        locationName = candidate;
                        return true;
                    }
                }
                return false;
            });

            if (!locationName) {
                return { error: 'No location found in message' };
            }

            // Try Geoapify autocomplete via backend proxy
            let placesResults: Location[] = [];
            try {
                const cityContext = this.#detectCityContext(message);
                const centerLocation = cityContext ? this.#getCityCoordinates(cityContext) : null;
                placesResults = await this.#searchPlacesAPI(locationName, centerLocation || undefined);
            } catch {
                // Continue with geocoding fallback
            }

            if (placesResults.length > 0) {
                return {
                    extractedLocation: placesResults[0],
                    suggestedPlaces: placesResults.slice(1),
                };
            }

            // Fallback to geocoding via backend proxy
            try {
                const cityContext = this.#detectCityContext(message);
                const searchQuery = cityContext ? `${locationName}, ${cityContext}` : locationName;

                const response = await fetch(
                    `${API_URL}/api/geoapify/geocode?text=${encodeURIComponent(searchQuery)}`,
                );

                if (!response.ok) {
                    return { error: 'Could not find location coordinates' };
                }

                const data = await response.json();
                const features = data.features || data.results || [];

                if (features.length === 0) {
                    return { error: 'Could not find location coordinates' };
                }

                const best = features[0];
                const props = best.properties || best;
                const lat = props.lat ?? best.geometry?.coordinates?.[1];
                const lon = props.lon ?? best.geometry?.coordinates?.[0];

                if (lat == null || lon == null) {
                    return { error: 'Could not find location coordinates' };
                }

                const sessionId = sessionStorage.getItem('chatSessionId');

                const extractedLocation: Location = {
                    id: `geocoder-${Date.now()}`,
                    latitude: lat,
                    longitude: lon,
                    name: props.name || (props.formatted || '').split(',')[0] || locationName,
                    type: this.#getLocationType(props.categories || props.types || []),
                    sessionId: sessionId || undefined,
                };

                return { extractedLocation, suggestedPlaces: [] };
            } catch {
                return { error: 'Failed to geocode location' };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error extracting location';
            return { error: errorMessage };
        }
    }

    // eslint-disable-next-line class-methods-use-this
    #detectCityContext(message: string): string | null {
        const cityPatterns = [
            /\bin\s+(Paris|London|New York|Tokyo|Rome|Barcelona|Madrid|Berlin|Amsterdam|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|St\.\s*Petersburg)/gi,
            /\bat\s+(Paris|London|New York|Tokyo|Rome|Barcelona|Madrid|Berlin|Amsterdam|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|St\.\s*Petersburg)/gi,
            /\bto\s+(Paris|London|New York|Tokyo|Rome|Barcelona|Madrid|Berlin|Amsterdam|Vienna|Prague|Budapest|Brussels|Dublin|Edinburgh|Stockholm|Copenhagen|Oslo|Helsinki|Warsaw|Lisbon|Athens|Istanbul|Moscow|St\.\s*Petersburg)/gi,
        ];

        let cityName: string | undefined;
        cityPatterns.find((pattern) => {
            const match = message.match(pattern);
            if (match?.[1]) {
                [, cityName] = match;
                return true;
            }
            return false;
        });

        if (cityName) return cityName;

        const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('chatSessionId') : null;
        if (sessionId) return 'Paris';

        return null;
    }

    // eslint-disable-next-line class-methods-use-this
    #getCityCoordinates(city: string): { lat: number; lng: number } | null {
        const cityCoords: Record<string, { lat: number; lng: number }> = {
            Paris: { lat: 48.8566, lng: 2.3522 },
            London: { lat: 51.5074, lng: -0.1278 },
            'New York': { lat: 40.7128, lng: -74.006 },
            Tokyo: { lat: 35.6762, lng: 139.6503 },
            Rome: { lat: 41.9028, lng: 12.4964 },
            Barcelona: { lat: 41.3851, lng: 2.1734 },
            Madrid: { lat: 40.4168, lng: -3.7038 },
            Berlin: { lat: 52.52, lng: 13.405 },
            Amsterdam: { lat: 52.3676, lng: 4.9041 },
            Vienna: { lat: 48.2082, lng: 16.3738 },
            Prague: { lat: 50.0755, lng: 14.4378 },
            Budapest: { lat: 47.4979, lng: 19.0402 },
            Brussels: { lat: 50.8503, lng: 4.3517 },
            Dublin: { lat: 53.3498, lng: -6.2603 },
            Edinburgh: { lat: 55.9533, lng: -3.1883 },
            Stockholm: { lat: 59.3293, lng: 18.0686 },
            Copenhagen: { lat: 55.6761, lng: 12.5683 },
            Oslo: { lat: 59.9139, lng: 10.7522 },
            Helsinki: { lat: 60.1699, lng: 24.9384 },
            Warsaw: { lat: 52.2297, lng: 21.0122 },
            Lisbon: { lat: 38.7223, lng: -9.1393 },
            Athens: { lat: 37.9838, lng: 23.7275 },
            Istanbul: { lat: 41.0082, lng: 28.9784 },
            Moscow: { lat: 55.7558, lng: 37.6173 },
            'St. Petersburg': { lat: 59.9311, lng: 30.3609 },
        };

        return cityCoords[city] || null;
    }

    // eslint-disable-next-line class-methods-use-this
    #couldBeCity(candidate: string): boolean {
        const cleaned = candidate.trim().toLowerCase();
        const definitivelyNotCities = [
            'perfect', 'amazing', 'wonderful', 'beautiful', 'stunning', 'incredible', 'fantastic', 'excellent',
            'great', 'good', 'best', 'nice', 'lovely', 'awesome', 'super', 'special', 'unique', 'memorable',
            'adventure', 'journey', 'trip', 'vacation', 'holiday', 'travel', 'experience', 'destination',
            'morning', 'afternoon', 'evening', 'night', 'today', 'tomorrow', 'yesterday', 'weekend',
            'family', 'friends', 'people', 'person', 'group', 'couple', 'children', 'kids', 'adults',
            'time', 'day', 'days', 'week', 'month', 'year', 'season', 'weather', 'climate',
            'food', 'restaurant', 'hotel', 'museum', 'park', 'beach', 'mountain', 'river', 'lake',
        ];
        return !definitivelyNotCities.includes(cleaned) && cleaned.length >= 3 && cleaned.length <= 25;
    }

    // eslint-disable-next-line class-methods-use-this
    #isValidLocationName(candidate: string): boolean {
        if (candidate.length < 2 || candidate.length > 100) return false;
        if (!/^[A-Za-z]/.test(candidate)) return false;

        const commonWords = ['make', 'take', 'get', 'put', 'see', 'do', 'go', 'come', 'have', 'be', 'will', 'can', 'should', 'would', 'could', 'may', 'might'];
        if (commonWords.includes(candidate.toLowerCase())) return false;

        const pronounsArticles = ['it', 'the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'our', 'their'];
        if (pronounsArticles.includes(candidate.toLowerCase())) return false;

        const actionWords = ['unforgettable', 'amazing', 'incredible', 'wonderful', 'perfect', 'special', 'great', 'awesome', 'fantastic'];
        if (actionWords.includes(candidate.toLowerCase())) return false;

        if (/\b(make|take|get|put|see|do|go|come|have|be|will|can|should|would|could|may|might)\s+(it|that|this)\b/i.test(candidate)) return false;

        if (!/^[A-Za-z][A-Za-z0-9\s\-'.,()]+$/.test(candidate)) return false;

        return true;
    }
}
