import React from 'react';
import { Location } from '@/types/map';
import { Cloud, EyeOff, Eye } from 'lucide-react';

interface MapControlsProps {
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    isWeatherVisible: boolean;
    onToggleWeather: () => void;
    locations: Location[];
}

const MapControls: React.FC<MapControlsProps> = ({
    isFullscreen,
    onToggleFullscreen,
    isWeatherVisible,
    onToggleWeather,
    locations
}) => {
    return (
        <div className="absolute top-4 right-16 z-30 flex flex-col gap-2">{/* Moved left to avoid Google Maps controls */}
            {/* Fullscreen Toggle */}
            <button
                onClick={onToggleFullscreen}
                className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
                title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
            >
                {isFullscreen ? (
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                )}
            </button>

            {/* Weather Toggle */}
            {locations.length > 0 && (
                <button
                    onClick={onToggleWeather}
                    className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
                    title={isWeatherVisible ? "Hide Weather" : "Show Weather"}
                >
                    {isWeatherVisible ? (
                        <Eye size={20} className="text-blue-600" />
                    ) : (
                        <EyeOff size={20} className="text-gray-600" />
                    )}
                </button>
            )}
        </div>
    );
};

export default MapControls;
