import React, { useState, useCallback, useEffect } from 'react';
import { Location } from '@/types/map';
import { routeOptimizationService, OptimizedRoute, RouteOptimizationOptions } from '@/services/RouteOptimizationService';
import { 
    Route, 
    Car, 
    Bike, 
    MapPin, 
    Clock, 
    Navigation, 
    Settings, 
    X,
    Loader2
} from 'lucide-react';

interface RoutePanelProps {
    locations: Location[];
    onRouteChange?: (route: OptimizedRoute | null) => void;
    onLocationAdd?: (location: Location) => void;
    map?: google.maps.Map | null;
}

const RoutePanel: React.FC<RoutePanelProps> = ({ 
    locations, 
    onRouteChange, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onLocationAdd, 
    map 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
    const [options, setOptions] = useState<RouteOptimizationOptions>({
        travelMode: google.maps?.TravelMode?.DRIVING || 'DRIVING' as google.maps.TravelMode,
        optimizeWaypoints: true,
        avoidHighways: false,
        avoidTolls: false
    });
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    // Initialize route optimization service when map is ready
    useEffect(() => {
        if (map) {
            routeOptimizationService.initialize();
            
            // Initialize directions renderer
            const renderer = new google.maps.DirectionsRenderer({
                suppressMarkers: false, // Show route markers
                draggable: false,
                polylineOptions: {
                    strokeColor: '#4285F4',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                }
            });
            renderer.setMap(map);
            setDirectionsRenderer(renderer);

            return () => {
                renderer.setMap(null);
            };
        }
        return undefined;
    }, [map]);

    // Optimize route when locations or options change
    const optimizeRoute = useCallback(async () => {
        if (locations.length < 2) {
            setOptimizedRoute(null);
            if (directionsRenderer) {
                directionsRenderer.setDirections({ routes: [] } as any);
            }
            return;
        }

        setIsLoading(true);
        try {
            const route = await routeOptimizationService.optimizeRoute(locations, options);
            setOptimizedRoute(route);
            
            if (route?.route && directionsRenderer) {
                directionsRenderer.setDirections({
                    routes: [route.route],
                    request: {} as any
                } as google.maps.DirectionsResult);
            }
            
            if (onRouteChange) {
                onRouteChange(route);
            }
        } catch (error) {
            console.error('Failed to optimize route:', error);
            setOptimizedRoute(null);
        } finally {
            setIsLoading(false);
        }
    }, [locations, options, directionsRenderer, onRouteChange]);

    // Auto-optimize when locations change (if panel is open)
    useEffect(() => {
        if (isOpen && locations.length >= 2) {
            optimizeRoute();
        }
    }, [locations, isOpen, optimizeRoute]);

    // Clear route when panel closes
    useEffect(() => {
        if (!isOpen && directionsRenderer) {
            directionsRenderer.setDirections({ routes: [] } as any);
            setOptimizedRoute(null);
            if (onRouteChange) {
                onRouteChange(null);
            }
        }
    }, [isOpen, directionsRenderer, onRouteChange]);

    const getTravelModeIcon = (mode: google.maps.TravelMode) => {
        switch (mode) {
            case google.maps.TravelMode.DRIVING:
                return <Car size={16} />;
            case google.maps.TravelMode.BICYCLING:
                return <Bike size={16} />;
            case google.maps.TravelMode.WALKING:
                return <Navigation size={16} />;
            case google.maps.TravelMode.TRANSIT:
                return <MapPin size={16} />;
            default:
                return <Car size={16} />;
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDistance = (km: number) => {
        if (km < 1) {
            return `${Math.round(km * 1000)}m`;
        }
        return `${km.toFixed(1)}km`;
    };

    if (locations.length < 2) {
        // For single location or no locations, show minimal or no UI
        if (locations.length === 0) {
            return null; // Don't show anything when no locations
        }
        
        // For 1 location, show very minimal badge
        return (
            <div className="absolute bottom-4 left-4 z-10">
                <div className="bg-white/90 backdrop-blur-sm rounded-md shadow-sm px-2 py-1 text-xs text-gray-600 border">
                    📍 {locations.length} location • Add more for route planning
                </div>
            </div>
        );
    }

    return (
        <div className="absolute bottom-4 left-4 z-10">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 text-white rounded-lg shadow-lg p-3 hover:bg-blue-700 transition-colors flex items-center gap-2"
                    title="Optimize Route"
                >
                    <Route size={20} />
                    <span className="font-medium">Optimize Route</span>
                </button>
            )}

            {/* Route Panel */}
            {isOpen && (
                <div className="bg-white rounded-lg shadow-lg w-80 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-blue-50">
                        <div className="flex items-center gap-2">
                            <Route size={20} className="text-blue-600" />
                            <h3 className="font-semibold text-gray-900">Route Optimization</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Travel Mode Selection */}
                        <div>
                            <div className="block text-sm font-medium text-gray-700 mb-2">
                                Travel Mode
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { mode: google.maps?.TravelMode?.DRIVING || 'DRIVING' as google.maps.TravelMode, label: 'Driving' },
                                    { mode: google.maps?.TravelMode?.WALKING || 'WALKING' as google.maps.TravelMode, label: 'Walking' },
                                    { mode: google.maps?.TravelMode?.BICYCLING || 'BICYCLING' as google.maps.TravelMode, label: 'Cycling' },
                                    { mode: google.maps?.TravelMode?.TRANSIT || 'TRANSIT' as google.maps.TravelMode, label: 'Transit' }
                                ].map(({ mode, label }) => (
                                    <button
                                        type="button"
                                        key={mode}
                                        onClick={() => setOptions(prev => ({ ...prev, travelMode: mode }))}
                                        className={`flex items-center gap-2 p-2 rounded-md text-sm font-medium transition-colors ${
                                            options.travelMode === mode
                                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {getTravelModeIcon(mode)}
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Options */}
                        <div>
                            <div className="block text-sm font-medium text-gray-700 mb-2">
                                <Settings size={16} className="inline mr-1" />
                                Options
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="optimize-waypoints"
                                        type="checkbox"
                                        checked={options.optimizeWaypoints}
                                        onChange={(e) => setOptions(prev => ({ 
                                            ...prev, 
                                            optimizeWaypoints: e.target.checked 
                                        }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="optimize-waypoints" className="ml-2 text-sm text-gray-700">Optimize waypoint order</label>
                                </div>
                                
                                {options.travelMode === google.maps?.TravelMode?.DRIVING && (
                                    <>
                                        <div className="flex items-center">
                                            <input
                                                id="avoid-highways"
                                                type="checkbox"
                                                checked={options.avoidHighways}
                                                onChange={(e) => setOptions(prev => ({ 
                                                    ...prev, 
                                                    avoidHighways: e.target.checked 
                                                }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="avoid-highways" className="ml-2 text-sm text-gray-700">Avoid highways</label>
                                        </div>
                                        
                                        <div className="flex items-center">
                                            <input
                                                id="avoid-tolls"
                                                type="checkbox"
                                                checked={options.avoidTolls}
                                                onChange={(e) => setOptions(prev => ({ 
                                                    ...prev, 
                                                    avoidTolls: e.target.checked 
                                                }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="avoid-tolls" className="ml-2 text-sm text-gray-700">Avoid tolls</label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Optimize Button */}
                        <button
                            type="button"
                            onClick={optimizeRoute}
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Optimizing...
                                </>
                            ) : (
                                <>
                                    <Navigation size={16} />
                                    Optimize Route
                                </>
                            )}
                        </button>

                        {/* Route Summary */}
                        {optimizedRoute && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <h4 className="font-medium text-green-800 mb-2">Optimized Route</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-green-700">
                                        <MapPin size={14} />
                                        <span>{formatDistance(optimizedRoute.totalDistance)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-700">
                                        <Clock size={14} />
                                        <span>{formatDuration(optimizedRoute.totalDuration)}</span>
                                    </div>
                                </div>
                                
                                {/* Location Order */}
                                <div className="mt-3">
                                    <div className="text-xs font-medium text-green-800 mb-1">Route Order:</div>
                                    <div className="space-y-1">
                                        {optimizedRoute.locations.map((location, index) => (
                                            <div key={location.id || index} className="flex items-center gap-2 text-xs text-green-700">
                                                <div className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                                                    {index + 1}
                                                </div>
                                                <span className="truncate">{location.name || 'Unknown Location'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoutePanel;
