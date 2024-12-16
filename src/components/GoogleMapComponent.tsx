import React from "react";
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

    const defaultCenter = {
        lat: locations[0]?.latitude || 0,
        lng: locations[0]?.longitude || 0,
    };

    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={10}
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
