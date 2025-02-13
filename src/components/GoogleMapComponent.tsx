import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript, LoadScriptProps } from "@react-google-maps/api";
import { Location } from "@/lib/api";

interface GoogleMapComponentProps {
    locations: Location[];
}

// Define libraries array and ensure it has the correct types
const libraries: LoadScriptProps["libraries"] = ["marker"];

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ locations }) => {
    const mapContainerStyle = {
        width: "100%",
        height: "100%",
    };
    

    const defaultCenter = {
        lat: 0,
        lng: 0,
    };

    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [isMapReady, setIsMapReady] = useState(false);

    // Clear all existing markers
    const clearMarkers = () => {
        markersRef.current.forEach((marker) => {
            marker.setMap(null);
        });
        markersRef.current = [];
        console.log("All markers cleared.");
    };

    // Add markers to the map
    const addMarkers = () => {
        if (!mapRef.current) {
            console.warn("Map reference is null. Skipping marker addition.");
            return;
        }

        locations.forEach((location) => {
            if (location.latitude && location.longitude) {
                const marker = new google.maps.Marker({
                    position: { lat: location.latitude, lng: location.longitude },
                    map: mapRef.current,
                    title: location.name || "",
                });
                markersRef.current.push(marker);
            } else {
                console.warn("Invalid location data. Skipping marker:", location);
            }
        });

        console.log("Markers added:", markersRef.current);
    };

    // Effect to handle markers when locations change
    useEffect(() => {
        if (!isMapReady) {
            console.warn("Map instance is not ready. Skipping marker updates.");
            return;
        }

        clearMarkers();
        addMarkers();
    }, [locations, isMapReady]);

    // Handle map load
    const handleMapLoad = (map: google.maps.Map) => {
        console.log("Map loaded:", map);
        mapRef.current = map;
        setIsMapReady(true);
    };

    // Handle map unmount
    const handleMapUnmount = () => {
        console.log("Map unmounted");
        clearMarkers();
        mapRef.current = null;
        setIsMapReady(false);
    };

    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
            libraries={libraries} // Use the pre-defined libraries constant
        >
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                    locations.length > 0
                        ? { lat: locations[0].latitude, lng: locations[0].longitude }
                        : defaultCenter
                }
                zoom={locations.length > 0 ? 10 : 2}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
            >
                {/* Add additional map components or overlays here if needed */}
            </GoogleMap>
        </LoadScript>
    );
};

export default GoogleMapComponent;
