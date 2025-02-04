import React, { useRef, useEffect, useState, forwardRef } from "react";
import Map, { Marker, Popup, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";

interface Location {
    latitude: number;
    longitude: number;
    name?: string;
}

interface MapboxComponentProps {
    locations: Location[];
    isFullScreen: boolean;
}

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
                initialViewState={{
                    latitude: locations.length > 0 ? locations[0].latitude : 0,
                    longitude: locations.length > 0 ? locations[0].longitude : 0,
                    zoom: locations.length > 0 ? 10 : 2,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
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
                            className="marker w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
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
                            <p className="text-sm text-gray-600">Latitude: {selectedLocation.latitude}</p>
                            <p className="text-sm text-gray-600">Longitude: {selectedLocation.longitude}</p>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
});

MapboxComponent.displayName = "MapboxComponent";

export default MapboxComponent;
