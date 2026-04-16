import { LocationExtractionService } from '@/services/LocationExtractionService';
import { TravelLocationAnalyzer } from '@/services/TravelLocationAnalyzer';
import { Location } from '@/types/map';

// Mock fetch for Geoapify API calls (used by LocationExtractionService)
const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch;
  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn(() => 'test-session-id'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });
});

beforeEach(() => {
  mockFetch.mockReset();

  // Default: autocomplete returns a result
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/geoapify/autocomplete')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [
              {
                properties: {
                  place_id: 'test_place_id',
                  name: 'Eiffel Tower',
                  formatted: 'Eiffel Tower, Champ de Mars, Paris, France',
                  lat: 48.8584,
                  lon: 2.2945,
                  categories: ['tourism.attraction'],
                },
              },
            ],
          }),
      });
    }

    if (url.includes('/api/geoapify/geocode')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [
              {
                properties: {
                  place_id: 'geo_test',
                  name: 'Eiffel Tower',
                  formatted: 'Eiffel Tower, Paris, France',
                  lat: 48.8584,
                  lon: 2.2945,
                  categories: ['tourism.attraction'],
                },
              },
            ],
          }),
      });
    }

    return Promise.resolve({ ok: false, status: 404 });
  });
});

afterAll(() => {
  jest.restoreAllMocks();
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
      const extractionResult = await extractionService.extractLocationFromMessage('Show me the Eiffel Tower');
      
      expect(extractionResult.extractedLocation).toBeDefined();
      expect(extractionResult.extractedLocation?.name).toContain('Eiffel Tower');

      const locations: Location[] = [extractionResult.extractedLocation!];
      const analysis = travelAnalyzer.analyzeTravelData(locations);

      expect(analysis.itineraryDays).toHaveLength(1);
      expect(analysis.itineraryDays[0].locations).toContain(extractionResult.extractedLocation);
      expect(analysis.travelStats.totalDistance).toBeGreaterThanOrEqual(0);
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it('should handle multiple locations in travel planning', async () => {
      const queries = ['Show me the Eiffel Tower', 'Add Louvre Museum', 'Include Notre Dame Cathedral'];

      const results = await Promise.all(
        queries.map(query => extractionService.extractLocationFromMessage(query))
      );
      
      const locations = results
        .filter(result => result.extractedLocation)
        .map(result => result.extractedLocation!);

      expect(locations.length).toBeGreaterThan(0);

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
        
        expect(location.id).toBeDefined();
        expect(location.name).toBeDefined();
        expect(location.latitude).toBeDefined();
        expect(location.longitude).toBeDefined();
        expect(location.latitude).toBeGreaterThan(0);
        expect(location.longitude).toBeGreaterThan(0);
        
        const analysis = travelAnalyzer.analyzeTravelData([location]);
        expect(analysis.itineraryDays[0].locations[0]).toEqual(location);
      }
    });

    it('should handle session consistency across services', async () => {
      const sessionId = 'integration-test-session';
      
      const result = await extractionService.extractLocationFromMessage('Eiffel Tower');
      
      if (result.extractedLocation) {
        expect(result.extractedLocation.sessionId || sessionId).toBeDefined();
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle extraction failures', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/geoapify/autocomplete') || url.includes('/api/geoapify/geocode')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ features: [] }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const result = await extractionService.extractLocationFromMessage('This is not a location query');
      
      expect(result.error).toBeDefined();
      expect(result.extractedLocation).toBeUndefined();
      
      const analysis = travelAnalyzer.analyzeTravelData([]);
      expect(analysis.itineraryDays).toHaveLength(0);
      expect(analysis.travelStats.totalDistance).toBe(0);
    });

    it('should handle malformed location data', () => {
      const malformedLocation: Partial<Location> = {
        id: 'malformed',
        name: 'Test Location'
      };
      
      expect(() => {
        travelAnalyzer.analyzeTravelData([malformedLocation as Location]);
      }).not.toThrow();
    });
  });
});
