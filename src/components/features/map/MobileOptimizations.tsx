import React from 'react';

/**
 * Mobile-specific optimizations for travel planning maps
 * This component provides touch-friendly interfaces for mobile users
 */

export const MobileMapControls: React.FC<{
    onFullscreen: () => void;
    onLocationMode: () => void;
    isFullscreen: boolean;
}> = ({ onFullscreen, onLocationMode, isFullscreen }) => {
    return (
        <div className="md:hidden fixed bottom-4 right-4 z-20 flex flex-col gap-2">
            {/* Mobile-optimized control buttons */}
            <button
                onClick={onFullscreen}
                className="bg-white shadow-lg rounded-full p-3 border border-gray-200 active:bg-gray-100"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
                {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                )}
            </button>
            
            <button
                onClick={onLocationMode}
                className="bg-blue-600 text-white shadow-lg rounded-full p-3 active:bg-blue-700"
                aria-label="Center on my location"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
    );
};

export const MobileTravelQuickActions: React.FC<{
    onFindNearby: (type: string) => void;
}> = ({ onFindNearby }) => {
    const quickActions = [
        { type: 'restaurant', label: 'Food', icon: '🍽️' },
        { type: 'lodging', label: 'Hotels', icon: '🏨' },
        { type: 'tourist_attraction', label: 'Sights', icon: '📸' },
        { type: 'gas_station', label: 'Gas', icon: '⛽' },
    ];

    return (
        <div className="md:hidden bg-white border-t border-gray-200 p-3">
            <div className="grid grid-cols-4 gap-2">
                {quickActions.map((action) => (
                    <button
                        key={action.type}
                        onClick={() => onFindNearby(action.type)}
                        className="flex flex-col items-center p-3 rounded-lg border border-gray-200 active:bg-gray-100"
                    >
                        <span className="text-xl mb-1">{action.icon}</span>
                        <span className="text-xs font-medium text-gray-700">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default {
    MobileMapControls,
    MobileTravelQuickActions
};
