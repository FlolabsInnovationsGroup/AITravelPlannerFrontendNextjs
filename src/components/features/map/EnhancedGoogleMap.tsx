'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { Location } from "@/types/map";
import { 
  getMarkerConfig
  // PROFESSIONAL_MAP_STYLES // Unused import
} from "./ProfessionalMapMarkers";
import { getMapTheme } from './MapThemes';
import RichLocationPopup from './RichLocationPopup';

export interface RouteData {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  waypoints?: google.maps.DirectionsWaypoint[];
  travelMode?: google.maps.TravelMode;
}

interface EnhancedGoogleMapProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  className?: string;
  theme?: string;
  routeData?: RouteData | null;
  onRouteRendered?: (result: google.maps.DirectionsResult) => void;
}

// Unused interface
// interface GoogleMapsLibraries {
//   Map: typeof google.maps.Map;
//   AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
//   PinElement: typeof google.maps.marker.PinElement;
//   places?: any;
// }

const EnhancedGoogleMap: React.FC<EnhancedGoogleMapProps> = ({
  locations,
  onLocationSelect,
  className = "",
  theme = "modern",
  routeData = null,
  onRouteRendered
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>>(new Map());
  const markerClustererRef = useRef<MarkerClusterer | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<Location | null>(null);
  const [filteredLocationCount, setFilteredLocationCount] = useState(0);
  
  // Track user interaction to prevent auto-fitting when user is manually controlling zoom
  const [userInteracting, setUserInteracting] = useState(false);
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(0);
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Google Maps API
  const loadGoogleMapsAPI = useCallback(async () => {
    if (typeof google !== 'undefined' && google.maps) {
      setIsLoaded(true);
      return undefined;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker,places&v=beta`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps API:', error);
      console.error('❌ API URL:', script.src);
    };
    
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script might already be removed
      }
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => () => {
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
      
      // Cleanup directions renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      
      // Cleanup marker clusterer
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current.setMap(null);
        markerClustererRef.current = null;
      }
      
      // Cleanup markers - handle both AdvancedMarkerElement and Marker
      markersRef.current.forEach(marker => {
        if (marker instanceof google.maps.Marker) {
          marker.setMap(null);
        } else if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
          marker.map = null;
        }
      });
      markersRef.current.clear();
    }, []);

  // Initialize map
  const initializeMap = useCallback(async () => {
    console.log('🗺️ InitializeMap called');
    console.log('🗺️ Map ref:', mapRef.current ? 'Present' : 'Missing');
    console.log('🗺️ Is loaded:', isLoaded);
    console.log('🗺️ Map instance exists:', mapInstanceRef.current ? 'Yes' : 'No');
    
    // CRITICAL: Don't re-initialize if map already exists
    if (mapInstanceRef.current) {
      console.log('🔄 Map instance already exists - skipping re-initialization');
      return;
    }
    
    if (!mapRef.current || !isLoaded) {
      console.log('❌ Cannot initialize map - preconditions not met');
      return;
    }

    try {
      console.log('📥 Importing Google Maps libraries...');
      // Import required libraries
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      console.log('✅ Maps library imported');
      
      // Create map configuration
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      const hasValidMapId = mapId && mapId !== 'DEMO_MAP_ID' && mapId.trim() !== '';
      
      const mapConfig: google.maps.MapOptions = {
        zoom: 12,
        center: { lat: 40.7589, lng: -73.9851 }, // Default to NYC
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
        gestureHandling: 'greedy',
      };
      
      if (hasValidMapId) {
        mapConfig.mapId = mapId;
        console.log('✅ Using Map ID for Advanced Markers:', mapId);
      } else {
        // Add custom styles when not using a Map ID
        const selectedMapTheme = getMapTheme(theme);
        mapConfig.styles = selectedMapTheme.styles;
      }

      const map = new Map(mapRef.current, mapConfig);
      mapInstanceRef.current = map;
      
      console.log('✅ Map instance created successfully');
      console.log('🗺️ Map configuration:', {
        mapId: mapConfig.mapId || 'none (using styles)',
        center: mapConfig.center,
        zoom: mapConfig.zoom
      });

      // Add user interaction listeners to detect when user is manually controlling the map
      const handleUserInteraction = () => {
        setUserInteracting(true);
        setLastUserInteraction(Date.now());
        
        // Clear any existing timeout
        if (userInteractionTimeoutRef.current) {
          clearTimeout(userInteractionTimeoutRef.current);
        }
        
        // Set a timeout to mark user interaction as finished after 2 seconds of no activity
        userInteractionTimeoutRef.current = setTimeout(() => {
          setUserInteracting(false);
        }, 2000);
      };

      // Listen for zoom changes (user scrolling/pinching)
      map.addListener('zoom_changed', handleUserInteraction);
      
      // Listen for drag events (user panning the map)
      map.addListener('drag', handleUserInteraction);
      map.addListener('dragstart', handleUserInteraction);
      
      // Listen for bounds changes that might be user-initiated
      map.addListener('bounds_changed', () => {
        // Only mark as user interaction if it's been more than 500ms since last auto-fit
        // This helps distinguish user interaction from programmatic changes
        const now = Date.now();
        if (now - lastUserInteraction > 500) {
          handleUserInteraction();
        }
      });

      // Trigger marker updates for any pending locations
      if (locations.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        setTimeout(() => updateMarkers(), 100); // Small delay to ensure map is fully ready
      }

      // Add click listener for adding new locations (disabled to prevent accidental pin adding)
      // Users should add locations through chat or search instead
      // Uncomment if you want to enable click-to-add functionality:
      /*
      map.addListener('click', async (event: google.maps.MapMouseEvent) => {
        if (event.latLng && onLocationAdd) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Reverse geocoding to get address
          try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({
              location: { lat, lng }
            });

            if (result.results.length > 0) {
              const place = result.results[0];
              const newLocation: Location = {
                id: Date.now().toString(),
                name: place.formatted_address,
                latitude: lat,
                longitude: lng,
                vicinity: place.formatted_address,
                type: 'attraction' as LocationType,
              };

              onLocationAdd(newLocation);
            }
          } catch (error) {
            console.error('Geocoding failed:', error);
          }
        }
      });
      */

      // Auto-fit bounds if locations exist (only on initial load, not when user is interacting)
      if (locations.length > 0 && !userInteracting && (Date.now() - lastUserInteraction > 3000)) {
        const bounds = new google.maps.LatLngBounds();
        locations.forEach(location => {
          bounds.extend({ lat: location.latitude, lng: location.longitude });
        });
        map.fitBounds(bounds);
      }

    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    }
  }, [isLoaded]); // Removed onLocationAdd and locations to prevent re-initialization

  // Create professional marker
  const createMarker = useCallback(async (location: Location) => {
    if (!mapInstanceRef.current || !isLoaded) {
      return;
    }

    try {
      // Basic location validation - simplified from removed LocationValidationService
      const existingLocations = locations.filter(loc => loc.id !== location.id);
      const isDuplicate = existingLocations.some(existing => 
        Math.abs(existing.latitude - location.latitude) < 0.0001 && 
        Math.abs(existing.longitude - location.longitude) < 0.0001
      );
      
      // Basic validation result
      const validation = {
        isValid: !isDuplicate && location.latitude >= -90 && location.latitude <= 90 && 
                 location.longitude >= -180 && location.longitude <= 180,
        confidence: isDuplicate ? 5 : 95, // Simple confidence scoring
        issues: isDuplicate ? ['Duplicate location detected'] : []
      };
      
      // Always create markers but log warnings for very low confidence locations in dev mode only
      if (process.env.NODE_ENV === 'development' && (!validation.isValid || validation.confidence < 10)) {
        console.warn(`Location validation for "${location.name}":`, {
          issues: validation.issues,
          confidence: validation.confidence,
          coordinates: `${location.latitude}, ${location.longitude}`
        });
      }

      const config = getMarkerConfig(location.type, location);
      
      // Validate config
      if (!config || !config.background) {
        console.error('❌ Invalid marker config for location:', location.name, 'Type:', location.type, 'Config:', config);
        throw new Error(`Invalid marker configuration for ${location.name}`);
      }
      
      const isSelected = selectedLocation?.id === location.id;
      const isHovered = hoveredLocation?.id === location.id;

      // Validate coordinates
      const lat = Number(location.latitude);
      const lng = Number(location.longitude);
      
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        console.error('❌ Invalid coordinates for location:', location.name, { lat: location.latitude, lng: location.longitude });
        return;
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('❌ Coordinates out of range for location:', location.name, { lat, lng });
        return;
      }

      // Check if we have a valid Map ID for Advanced Markers (must match the map initialization check)
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      const hasValidMapId = mapId && mapId !== 'DEMO_MAP_ID' && mapId.trim() !== '';

      let marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

      if (hasValidMapId) {
        // Use Advanced Markers with Map ID
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        // Create professional pin element with modern styling
        let pinScaleMultiplier: number;
        if (isSelected) {
          pinScaleMultiplier = 1.4;
        } else if (isHovered) {
          pinScaleMultiplier = 1.15;
        } else {
          pinScaleMultiplier = 1.0;
        }
        
        const pinElement = new PinElement({
          background: isSelected ? '#0066FF' : (isHovered ? '#0080FF' : config.background),
          borderColor: isSelected ? '#FFFFFF' : (isHovered ? '#FFFFFF' : config.borderColor),
          glyphColor: '#FFFFFF',
          scale: config.scale * pinScaleMultiplier
          // No glyphText for cleaner, modern look like Mindtrip/Layla
        } as any);

        marker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: { lat, lng },
          content: pinElement.element,
          title: location.name,
          zIndex: isSelected ? 1000 : (isHovered ? 900 : 100),
          gmpClickable: true,
        });
      } else {
        // Fallback to regular Markers for development without Map ID
        // Create custom icon for regular marker
        let markerScaleMultiplier: number;
        if (isSelected) {
          markerScaleMultiplier = 1.3;
        } else if (isHovered) {
          markerScaleMultiplier = 1.1;
        } else {
          markerScaleMultiplier = 1.0;
        }
        // Use Google's built-in marker icon with custom color
        const markerIcon: google.maps.Icon = {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
              <path d="M16 0C7.2 0 0 7.2 0 16c0 13.6 16 32 16 32s16-18.4 16-32c0-8.8-7.2-16-16-16z" 
                    fill="${config.background}" 
                    stroke="${config.borderColor}" 
                    stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="${config.glyphColor || '#fff'}"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(32 * markerScaleMultiplier, 48 * markerScaleMultiplier),
          anchor: new google.maps.Point(16 * markerScaleMultiplier, 48 * markerScaleMultiplier)
        };

        marker = new google.maps.Marker({
          map: mapInstanceRef.current,
          position: { lat, lng },
          title: location.name,
          icon: markerIcon,
          clickable: true,
          zIndex: isSelected ? 1000 : (isHovered ? 900 : 100),
          visible: true,
          optimized: false
        });
      }

      // Add click listener (works for both marker types)
      marker.addListener('click', () => {
        setSelectedLocation(location);
        onLocationSelect?.(location);
      });

      // Add hover effects for both marker types
      marker.addListener('mouseover', () => {
        setHoveredLocation(location);
      });

      marker.addListener('mouseout', () => {
        setHoveredLocation(null);
      });

      // Store marker
      markersRef.current.set(location.id!, marker);

    } catch (error) {
      console.error('❌ Failed to create marker for', location.name, ':', error);
    }
  }, [isLoaded, selectedLocation, hoveredLocation, onLocationSelect]);

  // Update markers when locations change
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    // Safety check for locations array
    if (!locations || !Array.isArray(locations)) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Invalid locations prop:', locations);
      }
      return;
    }

    // Remove markers that no longer exist in locations
    const currentLocationIds = new Set(locations.map(loc => loc?.id).filter(Boolean));
    
    markersRef.current.forEach((marker, id) => {
      if (!currentLocationIds.has(id)) {
        // Handle both AdvancedMarkerElement and Marker
        if (marker instanceof google.maps.Marker) {
          marker.setMap(null);
        } else if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
          marker.map = null;
        }
        markersRef.current.delete(id);
      }
    });

    // Clear existing clusterer if it exists
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
      markerClustererRef.current.setMap(null);
      markerClustererRef.current = null;
    }

    // Add or update markers for current locations
    locations.forEach((location, index) => {
      if (!location) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ Location at index ${index} is null/undefined`);
        }
        return;
      }
      
      if (!location.id) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Location missing ID: ${location.name}`);
        }
        return;
      }
      
      if (!markersRef.current.has(location.id)) {
        try {
          createMarker(location);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ Failed to create marker for ${location.name}:`, error);
          }
        }
      }
    });
    
    // Initialize marker clustering if we have multiple locations
    if (locations.length > 5) {
      const markers = Array.from(markersRef.current.values());
      
      if (process.env.NODE_ENV === 'development' && !markerClustererRef.current) {
        console.log(`🔷 Initializing marker clustering for ${markers.length} markers`);
      }
      
      markerClustererRef.current = new MarkerClusterer({
        map: mapInstanceRef.current,
        markers: markers,
        algorithm: new SuperClusterAlgorithm({
          maxZoom: 15, // Cluster markers until zoom level 15
          radius: 120, // Cluster radius in pixels
        }),
        renderer: {
          render: ({ count, position }) => {
            // Custom cluster styling to match app theme
            const color = count > 10 ? '#3B82F6' : count > 5 ? '#60A5FA' : '#93C5FD';
            const size = count > 10 ? 60 : count > 5 ? 50 : 40;
            
            return new google.maps.Marker({
              position,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 0.9,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
                scale: size / 2,
              },
              label: {
                text: String(count),
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 'bold',
              },
              title: `${count} locations`,
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            });
          },
        },
      });
      
      console.log('✅ Marker clustering initialized');
    }

    // Smart bounds calculation with geographic clustering
    console.log(`🎯 FitBounds check: ${locations.length} locations, map ready: ${!!mapInstanceRef.current}`);
    console.log('📊 All locations being processed:', locations.map(loc => ({
      name: loc.name,
      id: loc.id,
      type: loc.type,
      coords: `${loc.latitude}, ${loc.longitude}`
    })));
    
    // Temporary frontend filter to exclude obviously irrelevant locations
    const filteredLocations = locations.filter(location => {
      if (!location.name) return false;
      
      const name = location.name.toLowerCase();
      const irrelevantKeywords = [
        'world avenue', 'built for', 'standing atelier', 'faires stuart', 
        'engineering mv', 'the heart', 'completed', 'avocats'
      ];
      
      const isIrrelevant = irrelevantKeywords.some(keyword => name.includes(keyword)) ||
        name.length < 3 || // Too short
        name.match(/^[a-z\s]{1,2}$/); // Single letters or very short words
        
      return !isIrrelevant;
    });
    
    const filteredCount = locations.length - filteredLocations.length;
    setFilteredLocationCount(filteredCount);
    
    if (filteredLocations.length > 0) {
      // Check if user is currently interacting with the map - if so, don't auto-fit bounds
      const now = Date.now();
      const timeSinceLastInteraction = now - lastUserInteraction;
      
      // Increased timeout to 10 seconds to allow auto-fit when adding first location
      if (userInteracting || (timeSinceLastInteraction < 10000 && locations.length > 1)) {
        return; // Skip bounds fitting to preserve user's zoom/position
      }
      
      // Calculate center and spread of filtered locations
      const lats = filteredLocations.map(loc => loc.latitude);
      const lngs = filteredLocations.map(loc => loc.longitude);
      const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
      const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
      
      // Calculate maximum distance from center
      const maxDistance = filteredLocations.reduce((max, location) => {
        const distance = Math.sqrt(
          (location.latitude - centerLat)**2 + 
          (location.longitude - centerLng)**2
        );
        return Math.max(max, distance);
      }, 0);
      
      // If locations are too spread out (more than ~100km), focus on main cluster
      if (maxDistance > 1.5) { // Roughly 150km threshold - much tighter for city-level viewing
        // Find the tightest cluster of nearby locations (city-level)
        const clusters: Location[][] = [];
        const processed = new Set<number>();
        
        filteredLocations.forEach((location, index) => {
          if (processed.has(index)) return;
          
          const cluster: Location[] = [location];
          processed.add(index);
          
          // Find nearby locations (within ~20km for city-level clustering)
          filteredLocations.forEach((otherLocation, otherIndex) => {
            if (processed.has(otherIndex)) return;
            
            const distance = Math.sqrt(
              (location.latitude - otherLocation.latitude)**2 + 
              (location.longitude - otherLocation.longitude)**2
            );
            
            if (distance < 0.2) { // Within ~20km for tight city clustering
              cluster.push(otherLocation);
              processed.add(otherIndex);
            }
          });
          
          clusters.push(cluster);
        });
        
        // Use the largest tight cluster for bounds
        const largestCluster = clusters.reduce((largest, current) => 
          current.length > largest.length ? current : largest, clusters[0]
        );
        
        const bounds = new google.maps.LatLngBounds();
        largestCluster.forEach((location: Location) => {
          const coords = { lat: location.latitude, lng: location.longitude };
          bounds.extend(coords);
        });
        
        // Add padding to ensure good zoom level for city viewing
        mapInstanceRef.current.fitBounds(bounds, 150);
        
      } else {
        // Normal bounds for nearby locations
        const bounds = new google.maps.LatLngBounds();
        filteredLocations.forEach((location, index) => {
          const coords = { lat: location.latitude, lng: location.longitude };
          bounds.extend(coords);
        });
        
        mapInstanceRef.current.fitBounds(bounds, 50);
      }
      
      // Ensure reasonable zoom levels
      google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
        const zoom = mapInstanceRef.current!.getZoom();
        
        if (zoom && zoom > 15) {
          mapInstanceRef.current!.setZoom(15);
        } else if (zoom && zoom < 8) {
          mapInstanceRef.current!.setZoom(8);
        }
      });
    }
  }, [locations, createMarker]);

  // Load Google Maps API on component mount
  useEffect(() => {
    loadGoogleMapsAPI();
  }, [loadGoogleMapsAPI]);

  // Initialize map when API is loaded (ONLY once)
  useEffect(() => {
    if (isLoaded && !mapInstanceRef.current) {
      console.log('🎯 Initializing map for the first time');
      initializeMap().catch(error => {
        console.error('❌ Map initialization failed:', error);
      });
    }
  }, [isLoaded, initializeMap]); // Include initializeMap to ensure proper initialization

  // Update markers when map instance becomes available (handles timing issue)
  // CRITICAL: Single useEffect to prevent duplicate marker rendering
  useEffect(() => {
    if (isLoaded && mapInstanceRef.current && locations.length > 0) {
      updateMarkers();
    }
  }, [isLoaded, locations, updateMarkers]);

  // Render route when routeData changes
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !routeData) {
      // Clear existing route if no route data
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      return;
    }

    // Initialize DirectionsService if needed
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }

    // Initialize DirectionsRenderer if needed
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false, // Show default markers for start/end
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
    }

    // Request directions
    const request: google.maps.DirectionsRequest = {
      origin: routeData.origin,
      destination: routeData.destination,
      travelMode: routeData.travelMode || google.maps.TravelMode.DRIVING,
      waypoints: routeData.waypoints || []
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRendererRef.current?.setDirections(result);
        if (onRouteRendered) {
          onRouteRendered(result);
        }
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }, [isLoaded, routeData, onRouteRendered]);

  // Update marker styles when selection changes
  useEffect(() => {
    markersRef.current.forEach(async (marker, locationId) => {
      const location = locations.find(loc => loc.id === locationId);
      if (!location) return;

      try {
        const { PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        const config = getMarkerConfig(location.type, location);
        const isSelected = selectedLocation?.id === location.id;
        const isHovered = hoveredLocation?.id === location.id;

        // Update pin element with new styling
        const pinElement = new PinElement({
          background: config.background,
          borderColor: config.borderColor,
          glyphColor: config.glyphColor,
          scale: config.scale * (() => {
            if (isSelected) return 1.3;
            if (isHovered) return 1.1;
            return 1.0;
          })(),
          glyphText: config.emoji
        } as any);

        // Create new marker to replace the old one - handle both marker types
        const rawMap = marker instanceof google.maps.Marker ? marker.getMap() : marker.map;
        const currentMap = (rawMap instanceof google.maps.Map) ? rawMap : null;
        const currentPosition = marker instanceof google.maps.Marker ? marker.getPosition() : marker.position;
        const currentTitle = marker instanceof google.maps.Marker ? marker.getTitle() : marker.title;
        
        // Remove old marker and create new one with updated content
        if (marker instanceof google.maps.Marker) {
          marker.setMap(null);
        } else if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
          marker.map = null;
        }
        
        const newMarker = new google.maps.marker.AdvancedMarkerElement({
          map: currentMap,
          position: currentPosition,
          content: pinElement.element,
          title: currentTitle
        });
        
        // Update the marker reference in the map
        markersRef.current.set(locationId, newMarker);
        
      } catch (error) {
        console.error('Failed to update marker style:', error);
      }
    });
  }, [selectedLocation, hoveredLocation, locations]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-8">
          <div className="text-gray-500 mb-2">🗺️</div>
          <div className="text-gray-600">Google Maps API key not configured</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px]"
        style={{ borderRadius: '8px' }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <div className="text-gray-600">Loading professional map...</div>
          </div>
        </div>
      )}

      {selectedLocation && (
        <RichLocationPopup
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}

      {/* Filtered Location Notification */}
      {filteredLocationCount > 0 && (
        <div className="absolute bottom-16 right-4 bg-orange-50 border border-orange-200 rounded-lg shadow-lg p-2 max-w-xs z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-orange-600 mr-1 text-sm">🚫</div>
              <div className="text-xs">
                <span className="font-medium text-orange-800">
                  {filteredLocationCount} irrelevant location{filteredLocationCount > 1 ? 's' : ''} hidden
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilteredLocationCount(0)}
              className="ml-2 text-orange-700 hover:text-orange-900 text-xs font-bold"
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-2 text-xs text-gray-600">
        {locations.length} locations
      </div>
    </div>
  );
};

export default EnhancedGoogleMap;