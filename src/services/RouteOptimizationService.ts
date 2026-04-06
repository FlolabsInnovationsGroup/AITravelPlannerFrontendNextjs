import { Location } from '@/types/map';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface OptimizedRoute {
    locations: Location[];
    totalDistance: number; // in kilometers
    totalDuration: number; // in minutes
    waypoints: { lat: number; lng: number }[];
    routeGeometry?: [number, number][]; // lat,lng pairs for polyline
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
    travelMode: 'drive' | 'walk' | 'bicycle' | 'transit';
    avoidHighways?: boolean;
    avoidTolls?: boolean;
    optimizeWaypoints?: boolean;
}

class RouteOptimizationService {
    /**
     * Optimize route through multiple locations
     */
    async optimizeRoute(
        locations: Location[],
        options: RouteOptimizationOptions = { travelMode: 'drive' },
    ): Promise<OptimizedRoute | null> {
        if (locations.length < 2) return null;

        try {
            if (locations.length > 8) {
                return await this.optimizeWithTSP(locations, options);
            }
            return await this.optimizeWithBackendAPI(locations, options);
        } catch (error) {
            console.error('Route optimization failed:', error);
            return null;
        }
    }

    /**
     * Call the backend proxy for directions
     */
    private async optimizeWithBackendAPI(
        locations: Location[],
        options: RouteOptimizationOptions,
    ): Promise<OptimizedRoute | null> {
        const waypointsParam = locations
            .map((loc) => `${loc.latitude},${loc.longitude}`)
            .join('|');

        try {
            const response = await fetch(
                `${API_URL}/api/geoapify/directions?waypoints=${encodeURIComponent(waypointsParam)}&mode=${options.travelMode}`,
            );

            if (!response.ok) {
                throw new Error(`Directions request failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const geometry = feature.geometry?.coordinates?.[0] || [];
                const properties = feature.properties || {};

                const routeGeometry: [number, number][] = geometry.map(
                    (coord: number[]) => [coord[1], coord[0]] as [number, number],
                );

                const totalDistance = (properties.distance || 0) / 1000;
                const totalDuration = (properties.time || 0) / 60;

                return {
                    locations,
                    totalDistance: Math.round(totalDistance * 10) / 10,
                    totalDuration: Math.round(totalDuration),
                    waypoints: locations.map((loc) => ({
                        lat: loc.latitude,
                        lng: loc.longitude,
                    })),
                    routeGeometry,
                };
            }

            return this.fallbackOptimize(locations);
        } catch (error) {
            console.error('Backend directions API failed:', error);
            return this.fallbackOptimize(locations);
        }
    }

    /**
     * TSP approach for larger location sets using Haversine distances
     */
    private async optimizeWithTSP(
        locations: Location[],
        options: RouteOptimizationOptions,
    ): Promise<OptimizedRoute | null> {
        try {
            const distanceMatrix = this.buildHaversineMatrix(locations);
            const optimizedOrder = this.nearestNeighborTSP(distanceMatrix);
            const optimizedLocations = optimizedOrder.map((index) => locations[index]);

            let routeGeometry: [number, number][] | undefined;
            try {
                const directResult = await this.optimizeWithBackendAPI(
                    optimizedLocations,
                    options,
                );
                if (directResult?.routeGeometry) {
                    routeGeometry = directResult.routeGeometry;
                }
            } catch {
                // Fall back to straight-line geometry
            }

            return {
                locations: optimizedLocations,
                totalDistance: this.calculateTotalDistance(distanceMatrix, optimizedOrder),
                totalDuration: this.calculateTotalDuration(distanceMatrix, optimizedOrder),
                waypoints: optimizedLocations.map((loc) => ({
                    lat: loc.latitude,
                    lng: loc.longitude,
                })),
                routeGeometry,
            };
        } catch (error) {
            console.error('TSP optimization failed:', error);
            return null;
        }
    }

    /**
     * Fallback: return locations as-is with Haversine distances
     */
    private fallbackOptimize(locations: Location[]): OptimizedRoute {
        const matrix = this.buildHaversineMatrix(locations);
        const order = locations.map((_, i) => i);

        return {
            locations,
            totalDistance: this.calculateTotalDistance(matrix, order),
            totalDuration: this.calculateTotalDuration(matrix, order),
            waypoints: locations.map((loc) => ({
                lat: loc.latitude,
                lng: loc.longitude,
            })),
        };
    }

    /**
     * Build a distance matrix using Haversine formula
     */
    private buildHaversineMatrix(locations: Location[]): number[][] {
        const n = locations.length;
        const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

        for (let i = 0; i < n; i += 1) {
            for (let j = 0; j < n; j += 1) {
                if (i !== j) {
                    matrix[i][j] = this.haversineDistance(locations[i], locations[j]);
                }
            }
        }

        return matrix;
    }

    /**
     * Haversine distance in km
     */
    // eslint-disable-next-line class-methods-use-this
    private haversineDistance(loc1: Location, loc2: Location): number {
        const R = 6371;
        const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
        const dLng = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((loc1.latitude * Math.PI) / 180) *
                Math.cos((loc2.latitude * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Nearest Neighbor TSP heuristic
     */
    // eslint-disable-next-line class-methods-use-this
    private nearestNeighborTSP(distanceMatrix: number[][]): number[] {
        const n = distanceMatrix.length;
        const visited = new Array(n).fill(false);
        const path = [0];
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
        const averageSpeed = 50; // km/h
        const totalDistance = this.calculateTotalDistance(distanceMatrix, path);
        return Math.round((totalDistance / averageSpeed) * 60);
    }

    /**
     * Simple route between two locations
     */
    async getSimpleRoute(
        origin: Location,
        destination: Location,
        travelMode: 'drive' | 'walk' | 'bicycle' | 'transit' = 'drive',
    ): Promise<OptimizedRoute | null> {
        return this.optimizeRoute([origin, destination], { travelMode });
    }
}

export const routeOptimizationService = new RouteOptimizationService();
export default routeOptimizationService;
