import React, { useRef } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Location {
    latitude: number;
    longitude: number;
    name?: string;
}

interface MapboxComponentProps {
    locations: Location[];
}

const MapboxComponent: React.FC<MapboxComponentProps> = ({ locations }) => {
    const mapRef = useRef(null);

    return (
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
            {locations.map((location, index) => (
                <Marker
                    key={index}
                    latitude={location.latitude}
                    longitude={location.longitude}
                >
                    <div className="marker">
                        📍{/* Customize marker styling */}
                    </div>
                </Marker>
            ))}
        </Map>
    );
};

export default MapboxComponent;
