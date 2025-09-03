
import React, { useRef, useEffect, useState, forwardRef } from "react";
import Map, { Marker, Popup, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { Location, LocationType } from "@/types/map";

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapboxComponentProps {
    locations: Location[];
    isFullScreen: boolean;
    onMarkerClick?: (location: Location) => void;
}

const markerColors: Record<LocationType, string> = {
    attraction: '#FF4B4B',
    cafe: '#4CAF50',
    hotel: '#2196F3',
    restaurant: '#FF9800',
    transport: '#9C27B0'
};

const MapboxComponent = forwardRef<MapRef, MapboxComponentProps>(({ locations, isFullScreen }, mapRef) => {
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    // Adjust map bounds dynamically based on markers
    useEffect(() => {
        if (mapRef && "current" in mapRef && mapRef.current && locations.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            locations.forEach((location) => {
                bounds.extend([location.longitude, location.latitude]);
            });
            mapRef.current.fitBounds(bounds, { padding: 50 });
        }
    }, [locations, mapRef]);

    // Resize map when fullscreen mode is toggled
    useEffect(() => {
        if (mapRef && "current" in mapRef && mapRef.current) {
            mapRef.current.resize();
        }
    }, [isFullScreen]);

    return (
        <div className="relative h-full w-full">
            <Map
                ref={mapRef}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                initialViewState={{
                    latitude: locations.length > 0 ? locations[0].latitude : 40.7128,
                    longitude: locations.length > 0 ? locations[0].longitude : -74.0060,
                    zoom: locations.length > 0 ? 10 : 2,
                }}
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            >
                {/* Render markers */}
                {locations.map((location, index) => (
                    <Marker
                        key={index}
                        latitude={location.latitude}
                        longitude={location.longitude}
                        onClick={() => setSelectedLocation(location)}
                    >
                        <div
                            style={{ backgroundColor: location.type ? markerColors[location.type] : '#2196F3' }}
                            className="marker w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                            title={location.name || "Marker"}
                        />
                    </Marker>
                ))}

                {/* Render popup for selected marker */}
                {selectedLocation && (
                    <Popup
                        latitude={selectedLocation.latitude}
                        longitude={selectedLocation.longitude}
                        onClose={() => setSelectedLocation(null)}
                        closeOnClick={false}
                        anchor="top"
                    >
                        <div className="p-2">
                            <h3 className="font-bold text-lg">{selectedLocation.name || "Location"}</h3>
                            {selectedLocation.type && (
                                <p className="text-sm text-gray-600 capitalize mb-2">Type: {selectedLocation.type}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                ({selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)})
                            </p>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
});

MapboxComponent.displayName = "MapboxComponent";

export default MapboxComponent;
