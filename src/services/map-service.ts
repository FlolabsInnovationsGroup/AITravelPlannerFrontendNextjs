// Use the LatLngLiteral type from the Google Maps JavaScript API
type LatLngLiteral = {
    lat: number;
    lng: number;
  };
  
  // A mock map object to simulate the real map instance
  let mapInstance: google.maps.Map | null = null;
  let markers: google.maps.Marker[] = [];
  
  // Function to initialize the map
  export const setMapInstance = (map: google.maps.Map) => {
    mapInstance = map;
  };
  
  // Add a marker to the map
  export const addDotToMap = (location: LatLngLiteral) => {
    if (!mapInstance) {
      console.error("Map instance is not set. Please initialize the map.");
      return;
    }
  
    const marker = new google.maps.Marker({
      position: location,
      map: mapInstance,
    });
  
    markers.push(marker); // Keep track of all markers
    console.log("Marker added:", location);
  };
  
  // Remove a specific marker
  export const removeDotFromMap = (location: LatLngLiteral) => {
    if (!mapInstance) {
      console.error("Map instance is not set. Please initialize the map.");
      return;
    }
  
    const markerIndex = markers.findIndex(
      (marker) =>
        marker.getPosition()?.lat() === location.lat &&
        marker.getPosition()?.lng() === location.lng
    );
  
    if (markerIndex !== -1) {
      markers[markerIndex].setMap(null); // Remove marker from map
      markers.splice(markerIndex, 1); // Remove marker from array
      console.log("Marker removed:", location);
    } else {
      console.warn("No marker found at location:", location);
    }
  };
  
  // Clear all markers from the map
  export const clearMap = () => {
    if (!mapInstance) {
      console.error("Map instance is not set. Please initialize the map.");
      return;
    }
  
    markers.forEach((marker) => marker.setMap(null)); // Remove all markers from map
    markers = []; // Clear the markers array
    console.log("All markers cleared from the map.");
  };
  
  // Adjust map center
  export const centerMap = (location: LatLngLiteral) => {
    if (!mapInstance) {
      console.error("Map instance is not set. Please initialize the map.");
      return;
    }
  
    mapInstance.panTo(location);
    console.log("Map centered at:", location);
  };
  