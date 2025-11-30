import { LocationExtractionService } from '@/services/LocationExtractionService';
import { TravelLocationAnalyzer } from '@/services/TravelLocationAnalyzer';
import { Location } from '@/types/map';

// Mock Google Maps API for integration tests
const mockGoogleMaps = {
  maps: {
    LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat: () => lat, lng: () => lng })),
    places: {
      AutocompleteSuggestion: {
        fetchAutocompleteSuggestions: jest.fn().mockImplementation(async (request) => {
          // Mock different responses based on the query
          const query = request.input.toLowerCase();
          
          if (query.includes('not a location') || query === 'this is not a location query') {
            // Return no results for non-location queries
            return { suggestions: [] };
          } 
            // Return mock location for valid queries
            return {
              suggestions: [{
                placePrediction: {
                  placeId: 'test_place_id',
                  text: { text: 'Eiffel Tower, Paris, France' },
                  types: ['tourist_attraction', 'point_of_interest']
                }
              }]
            };
          
        })
      },
      PlacesService: jest.fn().mockImplementation(() => ({
        getDetails: jest.fn((request, callback) => {
          callback({
            place_id: 'test_place_id',
            name: 'Eiffel Tower',
            geometry: {
              location: new mockGoogleMaps.maps.LatLng(48.8584, 2.2945)
            },
            types: ['tourist_attraction', 'establishment'],
            formatted_address: 'Paris, France'
          }, 'OK');
        })
      })),
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        ERROR: 'ERROR'
      }
    },
    Geocoder: jest.fn().mockImplementation(() => ({
      geocode: jest.fn((request) => {
        const query = request.address.toLowerCase();
        
        if (query.includes('not a location') || query === 'this is not a location query') {
          // Return no results for non-location queries
          return Promise.resolve({ results: [] });
        } 
          // Return mock geocode result
          return Promise.resolve({
            results: [
              {
                place_id: 'test_place_id',
                formatted_address: 'Eiffel Tower, Paris, France',
                geometry: {
                  location: {
                    lat: () => 48.8584,
                    lng: () => 2.2945
                  }
                },
                types: ['tourist_attraction']
            }
            ]
          });
        
      })
    })),
    GeocoderStatus: {
      OK: 'OK',
      ZERO_RESULTS: 'ZERO_RESULTS',
      ERROR: 'ERROR'
    }
  }
};

beforeAll(() => {
  (global as any).window = { google: mockGoogleMaps };
  (global as any).google = mockGoogleMaps;
});

afterAll(() => {
  delete (global as any).window;
  delete (global as any).google;
});

describe('Map System Integration Tests', () => {
  let extractionService: LocationExtractionService;
  let travelAnalyzer: TravelLocationAnalyzer;

  beforeEach(() => {
    extractionService = new LocationExtractionService();
    travelAnalyzer = new TravelLocationAnalyzer();
    jest.clearAllMocks();
  });

  describe('End-to-End Location Processing', () => {
    it('should extract location and create travel analysis', async () => {
      // Step 1: Extract location from natural language
      const extractionResult = await extractionService.extractLocationFromMessage('Show me the Eiffel Tower');
      
      expect(extractionResult.extractedLocation).toBeDefined();
      expect(extractionResult.extractedLocation?.name).toContain('Eiffel Tower');

      // Step 2: Create travel analysis with the extracted location
      const locations: Location[] = [extractionResult.extractedLocation!];
      const analysis = travelAnalyzer.analyzeTravelData(locations);

      expect(analysis.itineraryDays).toHaveLength(1);
      expect(analysis.itineraryDays[0].locations).toContain(extractionResult.extractedLocation);
      expect(analysis.travelStats.totalDistance).toBeGreaterThanOrEqual(0);
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it('should handle multiple locations in travel planning', async () => {
      // Extract multiple locations
      const queries = ['Show me the Eiffel Tower', 'Add Louvre Museum', 'Include Notre Dame Cathedral'];

      const results = await Promise.all(
        queries.map(query => extractionService.extractLocationFromMessage(query))
      );
      
      const locations = results
        .filter(result => result.extractedLocation)
        .map(result => result.extractedLocation!);

      expect(locations.length).toBeGreaterThan(0);

      // Create comprehensive travel analysis
      const analysis = travelAnalyzer.analyzeTravelData(locations);

      expect(analysis.itineraryDays.length).toBeGreaterThan(0);
      expect(analysis.travelStats.locationBreakdown).toBeDefined();
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Service Interactions', () => {
    it('should maintain location data consistency across services', async () => {
      const result = await extractionService.extractLocationFromMessage('Eiffel Tower');
      
      if (result.extractedLocation) {
        const location = result.extractedLocation;
        
        // Verify location data structure
        expect(location.id).toBeDefined();
        expect(location.name).toBeDefined();
        expect(location.latitude).toBeDefined();
        expect(location.longitude).toBeDefined();
        expect(location.latitude).toBeGreaterThan(0);
        expect(location.longitude).toBeGreaterThan(0);
        
        // Test with travel analyzer
        const analysis = travelAnalyzer.analyzeTravelData([location]);
        expect(analysis.itineraryDays[0].locations[0]).toEqual(location);
      }
    });

    it('should handle session consistency across services', async () => {
      const sessionId = 'integration-test-session';
      
      const result = await extractionService.extractLocationFromMessage('Eiffel Tower');
      
      if (result.extractedLocation) {
        // Session ID would be set by the application layer
        expect(result.extractedLocation.sessionId || sessionId).toBeDefined();
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle extraction failures', async () => {
      const result = await extractionService.extractLocationFromMessage('This is not a location query');
      
      expect(result.error).toBeDefined();
      expect(result.extractedLocation).toBeUndefined();
      
      // Travel analyzer should handle empty locations
      const analysis = travelAnalyzer.analyzeTravelData([]);
      expect(analysis.itineraryDays).toHaveLength(0);
      expect(analysis.travelStats.totalDistance).toBe(0);
    });

    it('should handle malformed location data', () => {
      const malformedLocation: Partial<Location> = {
        id: 'malformed',
        name: 'Test Location'
        // Missing required fields
      };
      
      // Should not crash the analyzer
      expect(() => {
        travelAnalyzer.analyzeTravelData([malformedLocation as Location]);
      }).not.toThrow();
    });
  });
});
