import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript, LoadScriptProps } from "@react-google-maps/api";
import { Location, LocationType } from "@/types/map";
import SearchBox from "./SearchBox";

interface GoogleMapComponentProps {
    locations: Location[];
    onLocationAdd?: (location: Location) => void;
    onLocationSelect?: (location: Location) => void;
}

// Define libraries array and ensure it has the correct types
// Updated to use modern Places library
const libraries: LoadScriptProps["libraries"] = ["places"];

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ locations, onLocationAdd, onLocationSelect }) => {
    const mapContainerStyle = {
        width: "100%",
        height: "100%",
        position: "relative" as const,
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
                // Add click handler for the marker
                if (onLocationSelect) {
                    marker.addListener('click', () => onLocationSelect(location));
                }
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
                <SearchBox
                    onPlaceSelected={(place) => {
                        if (place.geometry?.location && onLocationAdd) {
                            // Determine the location type based on place types
                            const determineLocationType = (placeTypes: string[] | undefined): LocationType => {
                                if (!placeTypes) return 'attraction';
                                if (placeTypes.includes('lodging')) return 'hotel';
                                if (placeTypes.includes('restaurant')) return 'restaurant';
                                if (placeTypes.includes('cafe')) return 'cafe';
                                if (placeTypes.includes('transit_station')) return 'transport';
                                return 'attraction';
                            };
                            
                            const newLocation: Location = {
                                latitude: place.geometry.location.lat(),
                                longitude: place.geometry.location.lng(),
                                name: place.name || "",
                                type: determineLocationType(place.types || undefined)
                            };
                            onLocationAdd(newLocation);
                        }
                    }}
                />
            </GoogleMap>
        </LoadScript>
    );
};

export default GoogleMapComponent;
