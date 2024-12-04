import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

// Define the shape of a location
interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

// Define the component props
interface GoogleMapComponentProps {
  locations: Location[]; // An array of locations to display
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ locations }) => {
  // Set up the map container style
  const mapContainerStyle = {
    width: "100%",
    height: "400px", // Adjust the height as per your design
  };

  // Set a default center for the map (e.g., first location or fallback to 0,0)
  const defaultCenter = {
    lat: locations[0]?.latitude || 0, // Default to the first location or 0
    lng: locations[0]?.longitude || 0,
  };

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10} // Default zoom level, adjust as needed
      >
        {/* Render markers for all locations */}
        {locations.map((location, index) => (
          <Marker
            key={index} // Unique key for each marker
            position={{
              lat: location.latitude,
              lng: location.longitude,
            }}
            label={location.name || ""} // Show the location name if available
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;

