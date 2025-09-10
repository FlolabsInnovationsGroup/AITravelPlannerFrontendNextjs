import { Location, LocationType } from '@/types/map';

export interface TravelAnalysis {
    itineraryDays: ItineraryDay[];
    travelStats: TravelStats;
    recommendations: TravelRecommendation[];
}

export interface ItineraryDay {
    day: number;
    date?: string;
    locations: Location[];
    totalDistance: number;
    estimatedTime: number;
    travelTime: number;
    theme?: string;
}

export interface TravelStats {
    totalLocations: number;
    totalDistance: number;
    totalTime: number;
    averageRating: number;
    locationBreakdown: Record<LocationType, number>;
    priceRange: {
        min: number;
        max: number;
        average: number;
    };
}

export interface TravelRecommendation {
    type: 'route_optimization' | 'missing_category' | 'time_warning' | 'budget_tip';
    message: string;
    priority: 'low' | 'medium' | 'high';
}

export class TravelLocationAnalyzer {
    
    /**
     * Calculates the Haversine distance between two points
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) * 
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    /**
     * Estimates time spent at a location based on type
     */
    private getLocationTime(type?: LocationType): number {
        switch (type) {
            case 'museum':
                return 120; // 2 hours
            case 'park':
                return 90;  // 1.5 hours
            case 'attraction':
                return 60;  // 1 hour
            case 'restaurant':
                return 90;  // 1.5 hours
            case 'cafe':
                return 30;  // 30 minutes
            case 'shopping':
                return 120; // 2 hours
            case 'beach':
                return 180; // 3 hours
            case 'viewpoint':
                return 45;  // 45 minutes
            case 'historic_site':
                return 75;  // 1.25 hours
            case 'hotel':
                return 0;   // Stay location
            case 'nightlife':
                return 120; // 2 hours
            default:
                return 60;  // 1 hour default
        }
    }

    /**
     * Gets travel theme for a day based on location types
     */
    private getDayTheme(locations: Location[]): string {
        const types = locations.map(loc => loc.type).filter(Boolean);
        const typeCounts = types.reduce((acc, type) => {
            acc[type!] = (acc[type!] || 0) + 1;
            return acc;
        }, {} as Record<LocationType, number>);

        const dominantType = Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0];

        switch (dominantType) {
            case 'museum':
            case 'historic_site':
                return 'Cultural Exploration';
            case 'park':
            case 'beach':
            case 'viewpoint':
                return 'Nature & Relaxation';
            case 'restaurant':
            case 'cafe':
                return 'Culinary Adventure';
            case 'shopping':
            case 'nightlife':
                return 'Urban Experience';
            case 'attraction':
                return 'Sightseeing Tour';
            default:
                return 'Mixed Activities';
        }
    }

    /**
     * Optimizes route using nearest neighbor heuristic
     */
    private optimizeRoute(locations: Location[]): Location[] {
        if (locations.length <= 2) return locations;

        // Find hotels first (start/end points)
        const hotels = locations.filter(loc => loc.type === 'hotel');
        const otherLocations = locations.filter(loc => loc.type !== 'hotel');

        if (otherLocations.length === 0) return locations;

        const startPoint = hotels[0] || otherLocations[0];
        const remaining = otherLocations.filter(loc => loc !== startPoint);
        const optimized = [startPoint];

        let current = startPoint;
        while (remaining.length > 0) {
            let nearestIndex = 0;
            let minDistance = Infinity;

            for (let i = 0; i < remaining.length; i++) {
                const distance = this.calculateDistance(
                    current.latitude, current.longitude,
                    remaining[i].latitude, remaining[i].longitude
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = i;
                }
            }

            current = remaining[nearestIndex];
            optimized.push(current);
            remaining.splice(nearestIndex, 1);
        }

        // Add end hotel if different from start
        if (hotels.length > 1 && hotels[1] !== startPoint) {
            optimized.push(hotels[1]);
        }

        return optimized;
    }

    /**
     * Creates daily itinerary with optimal routing
     */
    createOptimizedItinerary(locations: Location[], locationsPerDay: number = 6): ItineraryDay[] {
        if (locations.length === 0) return [];

        const optimizedLocations = this.optimizeRoute(locations);
        const days: ItineraryDay[] = [];

        for (let i = 0; i < optimizedLocations.length; i += locationsPerDay) {
            const dayLocations = optimizedLocations.slice(i, i + locationsPerDay);
            let totalDistance = 0;
            let totalTime = 0;
            let travelTime = 0;

            // Calculate distances and times
            for (let j = 0; j < dayLocations.length; j++) {
                const location = dayLocations[j];
                totalTime += this.getLocationTime(location.type);

                if (j > 0) {
                    const prevLocation = dayLocations[j - 1];
                    const distance = this.calculateDistance(
                        prevLocation.latitude, prevLocation.longitude,
                        location.latitude, location.longitude
                    );
                    totalDistance += distance;
                    travelTime += Math.ceil(distance / 1000 * 4); // ~4 minutes per km
                }
            }

            days.push({
                day: Math.floor(i / locationsPerDay) + 1,
                locations: dayLocations,
                totalDistance,
                estimatedTime: totalTime,
                travelTime,
                theme: this.getDayTheme(dayLocations)
            });
        }

        return days;
    }

    /**
     * Analyzes travel data and provides insights
     */
    analyzeTravelData(locations: Location[]): TravelAnalysis {
        const itineraryDays = this.createOptimizedItinerary(locations);
        
        // Calculate overall stats
        const totalLocations = locations.length;
        const totalDistance = itineraryDays.reduce((sum, day) => sum + day.totalDistance, 0);
        const totalTime = itineraryDays.reduce((sum, day) => sum + day.estimatedTime + day.travelTime, 0);
        
        const ratingsOnly = locations.filter(loc => loc.rating).map(loc => loc.rating!);
        const averageRating = ratingsOnly.length > 0 
            ? ratingsOnly.reduce((sum, rating) => sum + rating, 0) / ratingsOnly.length
            : 0;

        // Location type breakdown
        const locationBreakdown = locations.reduce((acc, loc) => {
            const type = loc.type || 'attraction';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<LocationType, number>);

        // Price analysis
        const priceLevels = locations.filter(loc => loc.priceLevel).map(loc => loc.priceLevel!);
        const priceRange = {
            min: priceLevels.length > 0 ? Math.min(...priceLevels) : 0,
            max: priceLevels.length > 0 ? Math.max(...priceLevels) : 0,
            average: priceLevels.length > 0 
                ? priceLevels.reduce((sum, price) => sum + price, 0) / priceLevels.length
                : 0
        };

        const travelStats: TravelStats = {
            totalLocations,
            totalDistance,
            totalTime,
            averageRating,
            locationBreakdown,
            priceRange
        };

        // Generate recommendations
        const recommendations = this.generateRecommendations(locations, itineraryDays);

        return {
            itineraryDays,
            travelStats,
            recommendations
        };
    }

    /**
     * Generates travel recommendations based on analysis
     */
    private generateRecommendations(locations: Location[], days: ItineraryDay[]): TravelRecommendation[] {
        const recommendations: TravelRecommendation[] = [];

        // Check for overpacked days
        days.forEach(day => {
            if (day.estimatedTime + day.travelTime > 12 * 60) { // More than 12 hours
                recommendations.push({
                    type: 'time_warning',
                    message: `Day ${day.day} is packed with ${Math.round((day.estimatedTime + day.travelTime) / 60)} hours of activities. Consider reducing locations for a more relaxed experience.`,
                    priority: 'high'
                });
            }
        });

        // Check for missing essential categories
        const types = locations.map(loc => loc.type).filter(Boolean);
        if (!types.includes('restaurant') && !types.includes('cafe')) {
            recommendations.push({
                type: 'missing_category',
                message: 'Consider adding some restaurants or cafes to your itinerary for meal planning.',
                priority: 'medium'
            });
        }

        if (!types.includes('hotel') && locations.length > 3) {
            recommendations.push({
                type: 'missing_category',
                message: 'Add accommodation to your itinerary for better trip planning.',
                priority: 'medium'
            });
        }

        // Budget recommendations
        const expensiveLocations = locations.filter(loc => loc.priceLevel && loc.priceLevel >= 3);
        if (expensiveLocations.length > locations.length * 0.7) {
            recommendations.push({
                type: 'budget_tip',
                message: 'Your itinerary includes many expensive locations. Consider mixing in some budget-friendly options.',
                priority: 'low'
            });
        }

        // Route optimization suggestion
        if (locations.length > 5) {
            recommendations.push({
                type: 'route_optimization',
                message: 'Your route has been optimized to minimize travel time. Consider the suggested order for the best experience.',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    /**
     * Formats travel time in a readable format
     */
    formatTime(minutes: number): string {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    /**
     * Formats distance in a readable format
     */
    formatDistance(meters: number): string {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    }
}

export const travelAnalyzer = new TravelLocationAnalyzer();
