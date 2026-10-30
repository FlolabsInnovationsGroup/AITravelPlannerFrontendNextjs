import React, { useState, useEffect, useCallback } from 'react';
import { Location } from '@/types/map';
import { weatherService, WeatherData } from '@/services/WeatherService';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer } from 'lucide-react';

interface WeatherOverlayProps {
    locations: Location[];
    isVisible: boolean;
    onToggleVisibility: () => void;
}

interface WeatherLocation extends Location {
    weather?: WeatherData;
    isLoading?: boolean;
}

// ==================== HELPER COMPONENTS ====================
const WeatherCard: React.FC<{ location: WeatherLocation }> = ({ location }) => {
    const {weather} = location;
    
    if (location.isLoading) {
        return (
            <div className="border rounded-lg p-3 bg-gray-50 animate-pulse">
                <div className="font-medium text-sm text-gray-900 mb-1">
                    {location.name || 'Loading...'}
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
        );
    }

    if (!weather) {
        return (
            <div className="border rounded-lg p-3 bg-red-50 border-red-200">
                <div className="font-medium text-sm text-gray-900 mb-1">
                    {location.name || 'Unknown Location'}
                </div>
                <div className="text-xs text-red-600">Weather unavailable</div>
            </div>
        );
    }

    const getWeatherIcon = (icon: string, size = 16) => {
        const iconProps = { size };
        
        if (icon.includes('01')) return <Sun {...iconProps} className="text-yellow-500" />;
        if (icon.includes('02') || icon.includes('03') || icon.includes('04')) return <Cloud {...iconProps} className="text-gray-600" />;
        if (icon.includes('09') || icon.includes('10') || icon.includes('11')) return <CloudRain {...iconProps} className="text-blue-600" />;
        return <Cloud {...iconProps} className="text-gray-600" />;
    };

    return (
        <div className="border rounded-lg p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            {/* Location Name */}
            <div className="font-medium text-sm text-gray-900 mb-2 truncate">
                {location.name || weather.location.name}
            </div>
            
            {/* Current Weather */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {getWeatherIcon(weather.current.icon)}
                    <span className="text-lg font-bold text-gray-900">
                        {weather.current.temperature}°C
                    </span>
                </div>
                <div className="text-xs text-gray-600 capitalize">
                    {weather.current.description}
                </div>
            </div>
            
            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                    <Thermometer size={12} />
                    <span>Feels {weather.current.feelLike}°C</span>
                </div>
                <div className="flex items-center gap-1">
                    <Wind size={12} />
                    <span>{weather.current.windSpeed} km/h</span>
                </div>
                <div className="flex items-center gap-1">
                    <Droplets size={12} />
                    <span>{weather.current.humidity}%</span>
                </div>
            </div>

            {/* Forecast Preview (Next 2 Days) */}
            {weather.forecast.length > 0 && (
                <div className="mt-3 pt-2 border-t border-blue-200">
                    <div className="text-xs font-medium text-gray-700 mb-1">Next 2 Days</div>
                    <div className="grid grid-cols-2 gap-2">
                        {weather.forecast.slice(0, 2).map((day) => (
                            <div key={day.date} className="text-xs text-gray-600">
                                <div className="flex items-center gap-1 mb-1">
                                    {getWeatherIcon(day.icon, 12)}
                                    <span className="font-medium">
                                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                    </span>
                                </div>
                                <div>{day.temperature.min}° / {day.temperature.max}°</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
// ==================== END HELPER COMPONENTS ====================

const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ 
    locations, 
    isVisible, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onToggleVisibility, 
}) => {
    const [weatherLocations, setWeatherLocations] = useState<WeatherLocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch weather data for all locations
    const fetchWeatherData = useCallback(async () => {
        if (!locations.length) {
            setWeatherLocations([]);
            return;
        }

        setIsLoading(true);
        
        try {
            // Mark all locations as loading
            setWeatherLocations(locations.map(loc => ({ ...loc, isLoading: true })));

            // Fetch weather for all locations
            const weatherPromises = locations.map(async (location) => {
                try {
                    const weather = await weatherService.getWeatherData(
                        location.latitude, 
                        location.longitude, 
                        location.name
                    );
                    return { ...location, weather: weather || undefined, isLoading: false };
                } catch (error) {
                    console.error(`Failed to fetch weather for ${location.name}:`, error);
                    return { ...location, weather: undefined, isLoading: false };
                }
            });

            const results = await Promise.all(weatherPromises);
            setWeatherLocations(results);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            setWeatherLocations(locations.map(loc => ({ ...loc, isLoading: false })));
        } finally {
            setIsLoading(false);
        }
    }, [locations]);

    // Fetch weather when locations change and overlay is visible
    useEffect(() => {
        if (isVisible && locations.length > 0) {
            fetchWeatherData();
        }
    }, [locations, isVisible, fetchWeatherData]);

    // Get weather icon component - unused function
    // const getWeatherIcon = (icon: string, size = 20) => {
    //     const iconProps = { size, className: "text-blue-600" };
    //     
    //     if (icon.includes('01')) return <Sun {...iconProps} className="text-yellow-500" />;
    //     if (icon.includes('02') || icon.includes('03') || icon.includes('04')) return <Cloud {...iconProps} />;
    //     if (icon.includes('09') || icon.includes('10') || icon.includes('11')) return <CloudRain {...iconProps} />;
    //     return <Cloud {...iconProps} />;
    // };

    // Format temperature - unused function
    // const formatTemp = (temp: number) => `${temp}°C`;

    if (!isVisible) {
        return null;
    }

    return (
        <div className="absolute top-20 right-16 z-10">{/* Aligned with MapControls to avoid overlap */}

            {/* Weather Cards */}
            {weatherLocations.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-2 space-y-2">
                        {weatherLocations.map((location, index) => (
                            <WeatherCard key={location.id || index} location={location} />
                        ))}
                    </div>
                    
                    {isLoading && (
                        <div className="px-3 py-2 text-center text-sm text-gray-500 border-t">
                            Loading weather data...
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {weatherLocations.length === 0 && !isLoading && (
                <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <Cloud size={24} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                        No locations to show weather for
                    </p>
                </div>
            )}
        </div>
    );
};

export default WeatherOverlay;
