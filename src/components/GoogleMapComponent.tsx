import React, { useEffect } from "react";
import {GoogleMap, LoadScript, Marker} from "@react-google-maps/api";
import { Location } from '@/lib/api';

interface GoogleMapComponentProps {
    locations: Location[];
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({locations}) => {
    const mapContainerStyle = {
        width: "100%",
        height: "400px",
    };


//Default center coordinates for the map
    const defaultCenter = {
        lat: 0, // Adjust as needed
        lng: 0, // Adjust as needed
    };


//Debugging to ensure locations update correctly
    useEffect(() => {
        console.log("Updated locations:", locations);
    }, [locations]);
    
    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                    locations.length > 0
                        ? { lat: locations[0].latitude, lng: locations[0].longitude }
                        : defaultCenter // Reset to default center if no locations
                }
                zoom={locations.length > 0 ? 10 : 2} // Adjust zoom level when no location
            >
                {locations.map((location) => (
                    <Marker
                        key={location.id}
                        position={{
                            lat: location.latitude,
                            lng: location.longitude,
                        }}
                        label={location.name || ""}
                    />
                ))}
            </GoogleMap>
        </LoadScript>
    );
};

export default GoogleMapComponent;
