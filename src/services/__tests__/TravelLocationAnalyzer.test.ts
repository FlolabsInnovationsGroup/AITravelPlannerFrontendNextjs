// src/services/__tests__/TravelLocationAnalyzer.test.ts
import { Location } from '@/types/map';
import { TravelLocationAnalyzer } from '../TravelLocationAnalyzer';

describe('TravelLocationAnalyzer', () => {
  let analyzer: TravelLocationAnalyzer;
  
  beforeEach(() => {
    analyzer = new TravelLocationAnalyzer();
  });

  describe('createOptimizedItinerary', () => {
    it('should create optimized itinerary with proper day organization', () => {
      const locations: Location[] = [
        { id: '1', name: 'Hotel Paris', latitude: 48.8566, longitude: 2.3522, type: 'hotel' },
        { id: '2', name: 'Louvre Museum', latitude: 48.8606, longitude: 2.3376, type: 'museum' },
        { id: '3', name: 'Restaurant', latitude: 48.8584, longitude: 2.3445, type: 'restaurant' },
        { id: '4', name: 'Arc de Triomphe', latitude: 48.8738, longitude: 2.2950, type: 'attraction' },
        { id: '5', name: 'Park', latitude: 48.8449, longitude: 2.3600, type: 'park' }
      ];

      const itinerary = analyzer.createOptimizedItinerary(locations, 3);
      
      expect(itinerary.length).toBeGreaterThan(0);
      expect(itinerary[0].day).toBe(1);
      expect(itinerary[0].locations.length).toBeLessThanOrEqual(3);
      expect(itinerary[0].totalDistance).toBeGreaterThanOrEqual(0);
      expect(itinerary[0].estimatedTime).toBeGreaterThan(0);
      expect(itinerary[0].theme).toBeDefined();
    });

    it('should handle empty locations array', () => {
      const itinerary = analyzer.createOptimizedItinerary([]);
      expect(itinerary).toEqual([]);
    });

    it('should handle single location', () => {
      const locations: Location[] = [
        { id: '1', name: 'Single Location', latitude: 0, longitude: 0, type: 'museum' }
      ];

      const itinerary = analyzer.createOptimizedItinerary(locations);
      
      expect(itinerary).toHaveLength(1);
      expect(itinerary[0].locations).toHaveLength(1);
      expect(itinerary[0].totalDistance).toBe(0);
    });
  });

  describe('analyzeTravelData', () => {
    it('should provide comprehensive travel analysis', () => {
      const locations: Location[] = [
        { id: '1', name: 'Hotel Paris', latitude: 48.8566, longitude: 2.3522, type: 'hotel', rating: 4.5, priceLevel: 3 },
        { id: '2', name: 'Louvre Museum', latitude: 48.8606, longitude: 2.3376, type: 'museum', rating: 4.8, priceLevel: 2 },
        { id: '3', name: 'Restaurant', latitude: 48.8584, longitude: 2.3445, type: 'restaurant', rating: 4.2, priceLevel: 4 }
      ];

      const analysis = analyzer.analyzeTravelData(locations);
      
      expect(analysis.travelStats.totalLocations).toBe(3);
      expect(analysis.travelStats.totalDistance).toBeGreaterThanOrEqual(0);
      expect(analysis.travelStats.totalTime).toBeGreaterThan(0);
      expect(analysis.travelStats.averageRating).toBeCloseTo(4.5, 1);
      expect(analysis.travelStats.locationBreakdown.hotel).toBe(1);
      expect(analysis.travelStats.locationBreakdown.museum).toBe(1);
      expect(analysis.travelStats.locationBreakdown.restaurant).toBe(1);
      expect(analysis.travelStats.priceRange.min).toBe(2);
      expect(analysis.travelStats.priceRange.max).toBe(4);
      expect(analysis.itineraryDays.length).toBeGreaterThan(0);
      expect(analysis.recommendations).toBeDefined();
    });

    it('should handle locations without ratings and price levels', () => {
      const locations: Location[] = [
        { id: '1', name: 'Location 1', latitude: 0, longitude: 0, type: 'park' },
        { id: '2', name: 'Location 2', latitude: 1, longitude: 1, type: 'museum' }
      ];

      const analysis = analyzer.analyzeTravelData(locations);
      
      expect(analysis.travelStats.averageRating).toBe(0);
      expect(analysis.travelStats.priceRange.min).toBe(0);
      expect(analysis.travelStats.priceRange.max).toBe(0);
      expect(analysis.travelStats.priceRange.average).toBe(0);
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      expect(analyzer.formatTime(30)).toBe('30m');
      expect(analyzer.formatTime(60)).toBe('1h');
      expect(analyzer.formatTime(90)).toBe('1h 30m');
      expect(analyzer.formatTime(120)).toBe('2h');
      expect(analyzer.formatTime(150)).toBe('2h 30m');
    });
  });

  describe('formatDistance', () => {
    it('should format distance correctly', () => {
      expect(analyzer.formatDistance(500)).toBe('500m');
      expect(analyzer.formatDistance(1000)).toBe('1.0km');
      expect(analyzer.formatDistance(1500)).toBe('1.5km');
      expect(analyzer.formatDistance(2300)).toBe('2.3km');
    });
  });

  describe('integration tests', () => {
    it('should handle a realistic travel scenario', () => {
      const locations: Location[] = [
        { 
          id: '1', 
          name: 'Grand Hotel', 
          latitude: 48.8566, 
          longitude: 2.3522, 
          type: 'hotel', 
          rating: 4.2, 
          priceLevel: 3 
        },
        { 
          id: '2', 
          name: 'Louvre Museum', 
          latitude: 48.8606, 
          longitude: 2.3376, 
          type: 'museum', 
          rating: 4.8, 
          priceLevel: 2 
        },
        { 
          id: '3', 
          name: 'Café de Flore', 
          latitude: 48.8542, 
          longitude: 2.3320, 
          type: 'cafe', 
          rating: 4.3, 
          priceLevel: 3 
        },
        { 
          id: '4', 
          name: 'Eiffel Tower', 
          latitude: 48.8584, 
          longitude: 2.2945, 
          type: 'attraction', 
          rating: 4.6, 
          priceLevel: 1 
        },
        { 
          id: '5', 
          name: 'Le Jules Verne', 
          latitude: 48.8583, 
          longitude: 2.2944, 
          type: 'restaurant', 
          rating: 4.1, 
          priceLevel: 4 
        },
        { 
          id: '6', 
          name: 'Luxembourg Gardens', 
          latitude: 48.8462, 
          longitude: 2.3371, 
          type: 'park', 
          rating: 4.7, 
          priceLevel: 1 
        }
      ];

      const analysis = analyzer.analyzeTravelData(locations);
      
      // Verify comprehensive analysis
      expect(analysis.travelStats.totalLocations).toBe(6);
      expect(analysis.travelStats.averageRating).toBeGreaterThan(4);
      expect(analysis.itineraryDays.length).toBeGreaterThan(0);
      
      // Verify itinerary structure
      const totalDayLocations = analysis.itineraryDays.reduce((sum, day) => sum + day.locations.length, 0);
      expect(totalDayLocations).toBe(6);
      
      // Verify each day has proper structure
      analysis.itineraryDays.forEach(day => {
        expect(day.day).toBeGreaterThan(0);
        expect(day.locations.length).toBeGreaterThan(0);
        expect(day.estimatedTime).toBeGreaterThanOrEqual(0);
        expect(day.travelTime).toBeGreaterThanOrEqual(0);
        expect(day.totalDistance).toBeGreaterThanOrEqual(0);
        expect(day.theme).toBeTruthy();
      });
      
      // Verify recommendations are generated
      expect(analysis.recommendations.length).toBeGreaterThanOrEqual(0);
      
      // Verify location type breakdown
      expect(analysis.travelStats.locationBreakdown.hotel).toBe(1);
      expect(analysis.travelStats.locationBreakdown.museum).toBe(1);
      expect(analysis.travelStats.locationBreakdown.cafe).toBe(1);
      expect(analysis.travelStats.locationBreakdown.attraction).toBe(1);
      expect(analysis.travelStats.locationBreakdown.restaurant).toBe(1);
      expect(analysis.travelStats.locationBreakdown.park).toBe(1);
    });

    it('should generate appropriate recommendations for different scenarios', () => {
      // Scenario 1: Many expensive locations
      const expensiveLocations: Location[] = [
        { id: '1', name: 'Expensive Restaurant', latitude: 0, longitude: 0, type: 'restaurant', priceLevel: 4 },
        { id: '2', name: 'Luxury Hotel', latitude: 0.1, longitude: 0.1, type: 'hotel', priceLevel: 4 },
        { id: '3', name: 'High-end Shopping', latitude: 0.2, longitude: 0.2, type: 'shopping', priceLevel: 4 }
      ];
      
      const expensiveAnalysis = analyzer.analyzeTravelData(expensiveLocations);
      const budgetRecommendation = expensiveAnalysis.recommendations.find(r => r.type === 'budget_tip');
      expect(budgetRecommendation).toBeDefined();

      // Scenario 2: Missing accommodation
      const noHotelLocations: Location[] = [
        { id: '1', name: 'Museum 1', latitude: 0, longitude: 0, type: 'museum' },
        { id: '2', name: 'Museum 2', latitude: 0.1, longitude: 0.1, type: 'museum' },
        { id: '3', name: 'Museum 3', latitude: 0.2, longitude: 0.2, type: 'museum' },
        { id: '4', name: 'Museum 4', latitude: 0.3, longitude: 0.3, type: 'museum' }
      ];
      
      const noHotelAnalysis = analyzer.analyzeTravelData(noHotelLocations);
      const hotelRecommendation = noHotelAnalysis.recommendations.find(r => 
        r.type === 'missing_category' && r.message.includes('accommodation')
      );
      expect(hotelRecommendation).toBeDefined();
    });
  });
});
