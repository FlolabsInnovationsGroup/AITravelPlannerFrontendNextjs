import { Location, LocationType } from '@/types/map';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    sanitized?: Location;
}

/**
 * Centralized service for validating and sanitizing location data
 * Ensures data integrity before adding locations to map state
 */
export class LocationValidationService {
    private static readonly VALID_TYPES: LocationType[] = [
        'attraction', 'cafe', 'hotel', 'restaurant', 'transport',
        'park', 'museum', 'beach', 'mountain', 'landmark',
        'shopping', 'entertainment', 'religious', 'hospital',
        'airport', 'station', 'viewpoint', 'nature', 'sports',
        'accommodation'
    ];

    private static readonly MAX_NAME_LENGTH = 100;

    private static readonly MIN_LATITUDE = -90;

    private static readonly MAX_LATITUDE = 90;

    private static readonly MIN_LONGITUDE = -180;

    private static readonly MAX_LONGITUDE = 180;

    /**
     * Validates and sanitizes a location object
     * @param location - Location object to validate
     * @returns ValidationResult with isValid flag, errors array, and sanitized location
     */
    static validateLocation(location: any): ValidationResult {
        const errors: string[] = [];

        // Check if location object exists
        if (!location) {
            return { isValid: false, errors: ['Location object is null or undefined'] };
        }

        // Validate latitude
        if (typeof location.latitude !== 'number') {
            errors.push('Latitude must be a number');
        } else if (Number.isNaN(location.latitude)) {
            errors.push('Latitude is NaN');
        } else if (location.latitude < this.MIN_LATITUDE || location.latitude > this.MAX_LATITUDE) {
            errors.push(`Latitude must be between ${this.MIN_LATITUDE} and ${this.MAX_LATITUDE}`);
        }

        // Validate longitude
        if (typeof location.longitude !== 'number') {
            errors.push('Longitude must be a number');
        } else if (Number.isNaN(location.longitude)) {
            errors.push('Longitude is NaN');
        } else if (location.longitude < this.MIN_LONGITUDE || location.longitude > this.MAX_LONGITUDE) {
            errors.push(`Longitude must be between ${this.MIN_LONGITUDE} and ${this.MAX_LONGITUDE}`);
        }

        // If coordinate validation failed, return early
        if (errors.length > 0) {
            return { isValid: false, errors };
        }

        // Sanitize name
        let sanitizedName = location.name || 'Unnamed Location';
        if (typeof sanitizedName === 'string') {
            sanitizedName = sanitizedName.trim();
            if (sanitizedName.length > this.MAX_NAME_LENGTH) {
                sanitizedName = `${sanitizedName.substring(0, this.MAX_NAME_LENGTH)}...`;
            }
        } else {
            sanitizedName = 'Unnamed Location';
        }

        // Validate and sanitize type
        const sanitizedType = this.VALID_TYPES.includes(location.type as LocationType)
            ? (location.type as LocationType)
            : 'attraction';

        // Sanitize optional fields
        const sanitizedRating = typeof location.rating === 'number' && !Number.isNaN(location.rating)
            ? Math.max(0, Math.min(5, location.rating)) // Clamp between 0-5
            : location.rating;

        const sanitizedPriceLevel = [1, 2, 3, 4].includes(location.priceLevel)
            ? location.priceLevel
            : undefined;

        // Build sanitized location
        const sanitized: Location = {
            ...location,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            name: sanitizedName,
            type: sanitizedType,
            rating: sanitizedRating,
            priceLevel: sanitizedPriceLevel,
        };

        return {
            isValid: true,
            errors: [],
            sanitized
        };
    }

    /**
     * Validates that a location belongs to the expected session
     * @param location - Location object with sessionId
     * @param expectedSessionId - Expected session ID
     * @returns true if session IDs match, false otherwise
     */
    static validateSession(location: Location, expectedSessionId: string | null): boolean {
        if (!expectedSessionId) {
            console.warn('No expected session ID provided for validation');
            return false;
        }

        if (!location.sessionId) {
            console.warn('Location missing sessionId:', location.name);
            return false;
        }

        return location.sessionId === expectedSessionId;
    }

    /**
     * Validates a batch of locations
     * @param locations - Array of locations to validate
     * @returns Object with valid and invalid locations
     */
    static validateBatch(locations: any[]): {
        valid: Location[];
        invalid: Array<{ location: any; errors: string[] }>;
    } {
        const valid: Location[] = [];
        const invalid: Array<{ location: any; errors: string[] }> = [];

        locations.forEach(location => {
            const result = this.validateLocation(location);
            if (result.isValid && result.sanitized) {
                valid.push(result.sanitized);
            } else {
                invalid.push({ location, errors: result.errors });
            }
        });

        return { valid, invalid };
    }

    /**
     * Quick check if coordinates are valid without full validation
     * @param latitude - Latitude value
     * @param longitude - Longitude value
     * @returns true if coordinates are valid numbers in range
     */
    static areCoordinatesValid(latitude: any, longitude: any): boolean {
        return (
            typeof latitude === 'number' &&
            typeof longitude === 'number' &&
            !Number.isNaN(latitude) &&
            !Number.isNaN(longitude) &&
            latitude >= this.MIN_LATITUDE &&
            latitude <= this.MAX_LATITUDE &&
            longitude >= this.MIN_LONGITUDE &&
            longitude <= this.MAX_LONGITUDE
        );
    }

    /**
     * Sanitizes a location name
     * @param name - Location name to sanitize
     * @returns Sanitized name
     */
    static sanitizeName(name: string | undefined): string {
        if (!name || typeof name !== 'string') {
            return 'Unnamed Location';
        }

        const trimmed = name.trim();
        if (trimmed.length === 0) {
            return 'Unnamed Location';
        }

        if (trimmed.length > this.MAX_NAME_LENGTH) {
            return `${trimmed.substring(0, this.MAX_NAME_LENGTH)}...`;
        }

        return trimmed;
    }
}
