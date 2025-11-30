import { Location } from '@/types/map';

export interface OptimizedRoute {
    locations: Location[];
    totalDistance: number; // in kilometers
    totalDuration: number; // in minutes
    waypoints: google.maps.DirectionsWaypoint[];
    route: google.maps.DirectionsRoute | null;
    travelInsights?: TravelRouteInsights;
    estimatedCost?: RouteCostEstimate;
}

export interface TravelRouteInsights {
    bestTimeOfDay: string;
    difficultyLevel: 'Easy' | 'Moderate' | 'Challenging';
    recommendedDuration: string;
    highlights: string[];
    tips: string[];
}

export interface RouteCostEstimate {
    fuelCost?: number;
    tollCost?: number;
    transitCost?: number;
    currency: string;
}

export interface RouteOptimizationOptions {
    travelMode: google.maps.TravelMode;
    avoidHighways?: boolean;
    avoidTolls?: boolean;
    optimizeWaypoints?: boolean;
}

class RouteOptimizationService {
    private directionsService: google.maps.DirectionsService | null = null;

    private distanceMatrixService: google.maps.DistanceMatrixService | null = null;

    constructor() {
        if (typeof google !== 'undefined') {
            this.initializeServices();
        }
    }

    private initializeServices() {
        this.directionsService = new google.maps.DirectionsService();
        this.distanceMatrixService = new google.maps.DistanceMatrixService();
    }

    /**
     * Initialize services when Google Maps is loaded
     */
    initialize() {
        if (!this.directionsService || !this.distanceMatrixService) {
            this.initializeServices();
        }
    }

    /**
     * Optimize route through multiple locations using Google's waypoint optimization
     */
    async optimizeRoute(
        locations: Location[], 
        options: RouteOptimizationOptions = { travelMode: google.maps.TravelMode.DRIVING }
    ): Promise<OptimizedRoute | null> {
        if (!this.directionsService || locations.length < 2) {
            return null;
        }

        try {
            // If we have many locations, use distance matrix + TSP for better optimization
            if (locations.length > 8) {
                return await this.optimizeWithTSP(locations, options);
            }

            // For smaller sets, use Google's built-in optimization
            return await this.optimizeWithGoogleAPI(locations, options);
        } catch (error) {
            console.error('Route optimization failed:', error);
            return null;
        }
    }

    /**
     * Use Google's built-in waypoint optimization (up to 25 waypoints)
     */
    private async optimizeWithGoogleAPI(
        locations: Location[], 
        options: RouteOptimizationOptions
    ): Promise<OptimizedRoute | null> {
        const origin = locations[0];
        const destination = locations[locations.length - 1];
        const waypoints = locations.slice(1, -1).map(location => ({
            location: new google.maps.LatLng(location.latitude, location.longitude),
            stopover: true
        }));

        return new Promise((resolve) => {
            this.directionsService!.route({
                origin: new google.maps.LatLng(origin.latitude, origin.longitude),
                destination: new google.maps.LatLng(destination.latitude, destination.longitude),
                waypoints,
                optimizeWaypoints: options.optimizeWaypoints !== false,
                travelMode: options.travelMode,
                avoidHighways: options.avoidHighways || false,
                avoidTolls: options.avoidTolls || false,
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    const route = result.routes[0];
                    const optimizedOrder = result.routes[0].waypoint_order || [];
                    
                    // Reorder locations based on optimization
                    const optimizedLocations = [
                        origin,
                        ...optimizedOrder.map(index => locations[index + 1]),
                        destination
                    ];

                    // Calculate total distance and duration
                    let totalDistance = 0;
                    let totalDuration = 0;
                    
                    route.legs.forEach(leg => {
                        if (leg.distance) totalDistance += leg.distance.value / 1000; // Convert to km
                        if (leg.duration) totalDuration += leg.duration.value / 60; // Convert to minutes
                    });

                    resolve({
                        locations: optimizedLocations,
                        totalDistance: Math.round(totalDistance * 10) / 10,
                        totalDuration: Math.round(totalDuration),
                        waypoints,
                        route
                    });
                } else {
                    console.error('Directions request failed:', status);
                    resolve(null);
                }
            });
        });
    }

    /**
     * Use Traveling Salesman Problem (TSP) approach for larger location sets
     */
    private async optimizeWithTSP(
        locations: Location[], 
        options: RouteOptimizationOptions
    ): Promise<OptimizedRoute | null> {
        try {
            // Get distance matrix for all locations
            const distanceMatrix = await this.getDistanceMatrix(locations, options.travelMode);
            if (!distanceMatrix) return null;

            // Apply nearest neighbor TSP heuristic
            const optimizedOrder = this.nearestNeighborTSP(distanceMatrix);
            const optimizedLocations = optimizedOrder.map(index => locations[index]);

            // Get the actual route for the optimized order
            const route = await this.getRouteForOrder(optimizedLocations, options);

            return {
                locations: optimizedLocations,
                totalDistance: this.calculateTotalDistance(distanceMatrix, optimizedOrder),
                totalDuration: this.calculateTotalDuration(distanceMatrix, optimizedOrder),
                waypoints: optimizedLocations.slice(1, -1).map(location => ({
                    location: new google.maps.LatLng(location.latitude, location.longitude),
                    stopover: true
                })),
                route
            };
        } catch (error) {
            console.error('TSP optimization failed:', error);
            return null;
        }
    }

    /**
     * Get distance matrix for all locations
     */
    private async getDistanceMatrix(
        locations: Location[], 
        travelMode: google.maps.TravelMode
    ): Promise<number[][] | null> {
        if (!this.distanceMatrixService) return null;

        const origins = locations.map(loc => new google.maps.LatLng(loc.latitude, loc.longitude));
        const destinations = origins;

        return new Promise((resolve) => {
            this.distanceMatrixService!.getDistanceMatrix({
                origins,
                destinations,
                travelMode,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            }, (result, status) => {
                if (status === google.maps.DistanceMatrixStatus.OK && result) {
                    const matrix: number[][] = [];
                    
                    result.rows.forEach((row, i) => {
                        matrix[i] = [];
                        row.elements.forEach((element, j) => {
                            if (element.status === 'OK' && element.distance) {
                                matrix[i][j] = element.distance.value / 1000; // Convert to km
                            } else {
                                // Fallback to Euclidean distance
                                matrix[i][j] = this.euclideanDistance(locations[i], locations[j]);
                            }
                        });
                    });
                    
                    resolve(matrix);
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Euclidean distance fallback
     */
    // eslint-disable-next-line class-methods-use-this
    private euclideanDistance(loc1: Location, loc2: Location): number {
        const R = 6371; // Earth's radius in km
        const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
        const dLng = (loc2.longitude - loc1.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Nearest Neighbor TSP heuristic
     */
    // eslint-disable-next-line class-methods-use-this
    private nearestNeighborTSP(distanceMatrix: number[][]): number[] {
        const n = distanceMatrix.length;
        const visited = new Array(n).fill(false);
        const path = [0]; // Start from first location
        visited[0] = true;

        for (let i = 1; i < n; i += 1) {
            let nearest = -1;
            let minDistance = Infinity;

            for (let j = 0; j < n; j += 1) {
                if (!visited[j] && distanceMatrix[path[path.length - 1]][j] < minDistance) {
                    nearest = j;
                    minDistance = distanceMatrix[path[path.length - 1]][j];
                }
            }

            if (nearest !== -1) {
                path.push(nearest);
                visited[nearest] = true;
            }
        }

        return path;
    }

    /**
     * Calculate total distance for a given path
     */
    // eslint-disable-next-line class-methods-use-this
    private calculateTotalDistance(distanceMatrix: number[][], path: number[]): number {
        let total = 0;
        for (let i = 0; i < path.length - 1; i += 1) {
            total += distanceMatrix[path[i]][path[i + 1]];
        }
        return Math.round(total * 10) / 10;
    }

    /**
     * Calculate total duration for a given path (estimate)
     */
    private calculateTotalDuration(distanceMatrix: number[][], path: number[]): number {
        const averageSpeed = 50; // km/h - rough estimate
        const totalDistance = this.calculateTotalDistance(distanceMatrix, path);
        return Math.round((totalDistance / averageSpeed) * 60); // Convert to minutes
    }

    /**
     * Get actual route for optimized order
     */
    private async getRouteForOrder(
        locations: Location[], 
        options: RouteOptimizationOptions
    ): Promise<google.maps.DirectionsRoute | null> {
        if (!this.directionsService || locations.length < 2) return null;

        const origin = locations[0];
        const destination = locations[locations.length - 1];
        const waypoints = locations.slice(1, -1).map(location => ({
            location: new google.maps.LatLng(location.latitude, location.longitude),
            stopover: true
        }));

        return new Promise((resolve) => {
            this.directionsService!.route({
                origin: new google.maps.LatLng(origin.latitude, origin.longitude),
                destination: new google.maps.LatLng(destination.latitude, destination.longitude),
                waypoints,
                optimizeWaypoints: false, // Don't re-optimize, we already have the order
                travelMode: options.travelMode,
                avoidHighways: options.avoidHighways || false,
                avoidTolls: options.avoidTolls || false,
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    resolve(result.routes[0]);
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Simple route between two locations
     */
    async getSimpleRoute(
        origin: Location, 
        destination: Location,
        travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
    ): Promise<OptimizedRoute | null> {
        return this.optimizeRoute([origin, destination], { travelMode });
    }
}

export const routeOptimizationService = new RouteOptimizationService();
export default routeOptimizationService;
