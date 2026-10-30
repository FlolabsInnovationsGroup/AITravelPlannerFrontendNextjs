import { LocationValidationService } from '../LocationValidationService';

describe('LocationValidationService', () => {
  describe('validateLocation', () => {
    it('should validate correct location data', () => {
      const validLocation = {
        id: '1',
        name: 'Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        type: 'attraction' as const,
        sessionId: 'session-123'
      };

      const result = LocationValidationService.validateLocation(validLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized?.name).toBe('Paris');
    });

    it('should reject null/undefined location', () => {
      const result = LocationValidationService.validateLocation(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Location object is null or undefined');
    });

    it('should reject non-number latitude', () => {
      const invalidLocation = {
        id: '1',
        name: 'Test',
        latitude: "48.8566" as any, // String instead of number
        longitude: 2.3522,
        type: 'attraction' as const
      };

      const result = LocationValidationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Latitude must be a number');
    });

    it('should reject NaN coordinates', () => {
      const invalidLocation = {
        id: '1',
        name: 'Test',
        latitude: NaN,
        longitude: NaN,
        type: 'attraction' as const
      };

      const result = LocationValidationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Latitude is NaN');
      expect(result.errors).toContain('Longitude is NaN');
    });

    it('should reject out-of-range latitude', () => {
      const invalidLocation = {
        id: '1',
        name: 'Test',
        latitude: 91, // Invalid: max is 90
        longitude: 2.3522,
        type: 'attraction' as const
      };

      const result = LocationValidationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Latitude must be between -90 and 90');
    });

    it('should reject out-of-range longitude', () => {
      const invalidLocation = {
        id: '1',
        name: 'Test',
        latitude: 48.8566,
        longitude: 181, // Invalid: max is 180
        type: 'attraction' as const
      };

      const result = LocationValidationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Longitude must be between -180 and 180');
    });

    it('should sanitize long location names', () => {
      const longName = 'A'.repeat(150);
      const location = {
        id: '1',
        name: longName,
        latitude: 48.8566,
        longitude: 2.3522,
        type: 'attraction' as const
      };

      const result = LocationValidationService.validateLocation(location);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBeDefined();
      // Sanitized location always has a name (never undefined)
      expect(result.sanitized?.name?.length).toBeLessThanOrEqual(103); // 100 + "..."
      expect(result.sanitized?.name).toContain('...');
    });

    it('should trim whitespace from names', () => {
      const location = {
        id: '1',
        name: '  Paris  ',
        latitude: 48.8566,
        longitude: 2.3522,
        type: 'attraction' as const
      };

      const result = LocationValidationService.validateLocation(location);

      expect(result.isValid).toBe(true);
      expect(result.sanitized?.name).toBe('Paris');
    });

    it('should use "Unnamed Location" for missing names', () => {
      const location = {
        id: '1',
        latitude: 48.8566,
        longitude: 2.3522,
        type: 'attraction' as const
      };

      const result = LocationValidationService.validateLocation(location);

      expect(result.isValid).toBe(true);
      expect(result.sanitized?.name).toBe('Unnamed Location');
    });
  });

  describe('areCoordinatesValid', () => {
    it('should return true for valid coordinates', () => {
      expect(LocationValidationService.areCoordinatesValid(48.8566, 2.3522)).toBe(true);
      expect(LocationValidationService.areCoordinatesValid(0, 0)).toBe(true);
      expect(LocationValidationService.areCoordinatesValid(-90, -180)).toBe(true);
      expect(LocationValidationService.areCoordinatesValid(90, 180)).toBe(true);
    });

    it('should return false for NaN coordinates', () => {
      expect(LocationValidationService.areCoordinatesValid(NaN, 2.3522)).toBe(false);
      expect(LocationValidationService.areCoordinatesValid(48.8566, NaN)).toBe(false);
      expect(LocationValidationService.areCoordinatesValid(NaN, NaN)).toBe(false);
    });

    it('should return false for non-number coordinates', () => {
      expect(LocationValidationService.areCoordinatesValid("48.8566" as any, 2.3522)).toBe(false);
      expect(LocationValidationService.areCoordinatesValid(48.8566, "2.3522" as any)).toBe(false);
    });

    it('should return false for out-of-range coordinates', () => {
      expect(LocationValidationService.areCoordinatesValid(91, 2.3522)).toBe(false);
      expect(LocationValidationService.areCoordinatesValid(-91, 2.3522)).toBe(false);
      expect(LocationValidationService.areCoordinatesValid(48.8566, 181)).toBe(false);
      expect(LocationValidationService.areCoordinatesValid(48.8566, -181)).toBe(false);
    });
  });

  describe('validateSession', () => {
    it('should return true when session IDs match', () => {
      const location = {
        id: '1',
        name: 'Test',
        latitude: 48.8566,
        longitude: 2.3522,
        sessionId: 'session-123'
      };

      expect(LocationValidationService.validateSession(location, 'session-123')).toBe(true);
    });

    it('should return false when session IDs do not match', () => {
      const location = {
        id: '1',
        name: 'Test',
        latitude: 48.8566,
        longitude: 2.3522,
        sessionId: 'session-123'
      };

      expect(LocationValidationService.validateSession(location, 'session-456')).toBe(false);
    });

    it('should return false when location has no sessionId (strict validation)', () => {
      const location = {
        id: '1',
        name: 'Test',
        latitude: 48.8566,
        longitude: 2.3522
      };

      // LocationValidationService requires sessionId to be present
      expect(LocationValidationService.validateSession(location as any, 'session-123')).toBe(false);
    });
  });

  describe('validateBatch', () => {
    it('should validate batch of locations', () => {
      const locations = [
        {
          id: '1',
          name: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
          type: 'attraction' as const
        },
        {
          id: '2',
          name: 'London',
          latitude: 51.5074,
          longitude: -0.1278,
          type: 'attraction' as const
        }
      ];

      const result = LocationValidationService.validateBatch(locations);

      expect(result.valid.length).toBe(2);
      expect(result.invalid.length).toBe(0);
      expect(result.valid.length).toBe(2);
      expect(result.invalid.length).toBe(0);
    });

    it('should separate valid and invalid locations', () => {
      const locations = [
        {
          id: '1',
          name: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
          type: 'attraction' as const
        },
        {
          id: '2',
          name: 'Invalid',
          latitude: NaN,
          longitude: 2.3522,
          type: 'attraction' as const
        },
        {
          id: '3',
          name: 'Out of Range',
          latitude: 91,
          longitude: 2.3522,
          type: 'attraction' as const
        }
      ];

      const result = LocationValidationService.validateBatch(locations);

      expect(result.valid.length).toBe(1);
      expect(result.invalid.length).toBe(2);
      expect(result.valid[0].name).toBe('Paris');
    });

    it('should include error details for invalid locations', () => {
      const locations = [
        {
          id: '1',
          name: 'Invalid',
          latitude: NaN,
          longitude: 181,
          type: 'attraction' as const
        }
      ];

      const result = LocationValidationService.validateBatch(locations);

      expect(result.invalid.length).toBe(1);
      expect(result.invalid[0].errors).toContain('Latitude is NaN');
      expect(result.invalid[0].errors).toContain('Longitude must be between -180 and 180');
    });
  });

  describe('sanitizeName', () => {
    it('should trim whitespace', () => {
      expect(LocationValidationService.sanitizeName('  Paris  ')).toBe('Paris');
    });

    it('should truncate long names', () => {
      const longName = 'A'.repeat(150);
      const result = LocationValidationService.sanitizeName(longName);
      
      expect(result.length).toBeLessThanOrEqual(103);
      expect(result).toContain('...');
    });

    it('should handle empty strings', () => {
      expect(LocationValidationService.sanitizeName('')).toBe('Unnamed Location');
      expect(LocationValidationService.sanitizeName('   ')).toBe('Unnamed Location');
    });

    it('should preserve names under max length', () => {
      const normalName = 'Eiffel Tower';
      expect(LocationValidationService.sanitizeName(normalName)).toBe('Eiffel Tower');
    });
  });
});
