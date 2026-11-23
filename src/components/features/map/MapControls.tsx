import React from 'react';
import { Location } from '@/types/map';
import { EyeOff, Eye } from 'lucide-react';

interface MapControlsProps {
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    isWeatherVisible: boolean;
    onToggleWeather: () => void;
    locations: Location[];
    map?: google.maps.Map | null;
}

const MapControls: React.FC<MapControlsProps> = ({
    isFullscreen,
    onToggleFullscreen,
    isWeatherVisible,
    onToggleWeather,
    locations,
    map
}) => {
    const handleZoomIn = () => {
        if (map) {
            const currentZoom = map.getZoom() || 0;
            map.setZoom(currentZoom + 1);
        }
    };

    const handleZoomOut = () => {
        if (map) {
            const currentZoom = map.getZoom() || 0;
            map.setZoom(currentZoom - 1);
        }
    };
    return (
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
            {/* Zoom Controls */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <button
                    type="button"
                    onClick={handleZoomIn}
                    className="block w-10 h-10 hover:bg-gray-50 transition-colors border-b border-gray-200 flex items-center justify-center"
                    title="Zoom In"
                    aria-label="Zoom In"
                >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={handleZoomOut}
                    className="block w-10 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
                    title="Zoom Out"
                    aria-label="Zoom Out"
                >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                    </svg>
                </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
                type="button"
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
                    type="button"
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
