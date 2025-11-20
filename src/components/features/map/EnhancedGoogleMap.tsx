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

interface EnhancedGoogleMapProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  className?: string;
  theme?: string;
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
  theme = "modern"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>>(new Map());
  const markerClustererRef = useRef<MarkerClusterer | null>(null);
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
    console.log('🗺️ LoadGoogleMapsAPI called');
    console.log('🗺️ Google Maps API key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
    
    if (typeof google !== 'undefined' && google.maps) {
      console.log('✅ Google Maps API already loaded');
      setIsLoaded(true);
      return undefined;
    }

    console.log('📥 Loading Google Maps API...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker,places&v=beta`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps API loaded successfully');
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

      // Only set mapId if we have a valid one (required for Advanced Markers)
      // Without a valid Map ID, we'll fall back to standard markers
      if (mapId && mapId !== 'DEMO_MAP_ID' && mapId.trim() !== '') {
        mapConfig.mapId = mapId;
        console.log('✅ Using Map ID for Advanced Markers:', mapId);
      } else {
        console.log('⚠️ No valid Map ID - will use standard markers');
        // Add custom styles when not using a Map ID
        const selectedMapTheme = getMapTheme(theme);
        mapConfig.styles = selectedMapTheme.styles;
      }

      console.log('🗺️ Creating Google Map with config:', mapConfig);
      const map = new Map(mapRef.current, mapConfig);
      console.log('✅ Google Map instance created');

      mapInstanceRef.current = map;
      console.log('✅ Map instance stored in ref');

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
        console.log('🎯 Map initialized - creating markers for', locations.length, 'pending locations');
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
        console.log(`🎯 Initial bounds fitting for ${locations.length} locations`);
        const bounds = new google.maps.LatLngBounds();
        locations.forEach(location => {
          bounds.extend({ lat: location.latitude, lng: location.longitude });
        });
        map.fitBounds(bounds);
      } else if (locations.length > 0) {
        console.log(`🙋‍♂️ Skipping initial bounds fitting - user recently interacted or is currently interacting`);
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
    console.log('🏗️ CreateMarker called for:', location.name);
    console.log('🗺️ Map loaded:', isLoaded, 'Map instance:', mapInstanceRef.current ? 'Available' : 'Not available');
    
    if (!mapInstanceRef.current || !isLoaded) {
      console.log('❌ Cannot create marker - map not ready');
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
      
      // Always create markers but show warnings for very low confidence locations
      if (!validation.isValid || validation.confidence < 10) {
        console.warn(`Location validation for "${location.name}":`, {
          issues: validation.issues,
          confidence: validation.confidence,
          coordinates: `${location.latitude}, ${location.longitude}`
        });
      }

      const config = getMarkerConfig(location.type, location);
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
        console.log('📥 Importing advanced marker library...');
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        console.log('✅ Advanced marker library imported');

        // Create professional pin element with modern styling
        console.log('🎨 Creating PinElement with config:', config);
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
        console.log('✅ PinElement created:', pinElement);

        console.log('📍 Creating AdvancedMarkerElement with position:', { lat, lng });
        marker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: { lat, lng },
          content: pinElement.element,
          title: location.name,
          zIndex: isSelected ? 1000 : (isHovered ? 900 : 100),
          gmpClickable: true,
        });
        console.log('✅ AdvancedMarkerElement created');
      } else {
        // Fallback to regular Markers for development without Map ID
        console.log('📥 Using regular Marker (no Map ID available)');
        
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

        console.log('📍 Creating regular Marker with position:', { lat, lng });
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
        console.log('✅ Regular Marker created');
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
      console.log('✅ Marker created successfully for:', location.name, 'Total markers:', markersRef.current.size);

    } catch (error) {
      console.error('❌ Failed to create marker for', location.name, ':', error);
    }
  }, [isLoaded, selectedLocation, hoveredLocation, onLocationSelect]);

  // Update markers when locations change
  const updateMarkers = useCallback(() => {
    console.log('🔄 UpdateMarkers called');
    console.log('🗺️ Map instance available:', mapInstanceRef.current ? 'Yes' : 'No');
    
    if (!mapInstanceRef.current) {
      console.log('❌ No map instance available, skipping marker update');
      return;
    }

    console.log('📍 Processing', locations.length, 'locations for markers');

    // Remove markers that no longer exist in locations
    const currentLocationIds = new Set(locations.map(loc => loc.id).filter(Boolean));
    console.log('🎯 Current location IDs:', Array.from(currentLocationIds));
    console.log('📍 Existing markers:', Array.from(markersRef.current.keys()));
    
    markersRef.current.forEach((marker, id) => {
      if (!currentLocationIds.has(id)) {
        console.log('🗑️ Removing marker for location:', id);
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
    locations.forEach(location => {
      console.log('🔍 Processing location:', location.name, 'ID:', location.id, 'Coords:', location.latitude, location.longitude);
      if (location.id && !markersRef.current.has(location.id)) {
        console.log('➕ Creating new marker for:', location.name);
        createMarker(location);
      } else if (location.id) {
        console.log('✅ Marker already exists for:', location.name);
      } else {
        console.log('⚠️ Location missing ID:', location.name);
      }
    });

    // Initialize marker clustering if we have multiple locations
    if (locations.length > 5) {
      const markers = Array.from(markersRef.current.values());
      console.log(`🔷 Initializing marker clustering for ${markers.length} markers`);
      
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
        
      if (isIrrelevant) {
        console.warn(`🚫 Filtering out irrelevant location: "${location.name}"`);
        return false;
      }
      return true;
    });
    
    const filteredCount = locations.length - filteredLocations.length;
    console.log(`🎯 After filtering: ${filteredLocations.length}/${locations.length} locations remain`);
    setFilteredLocationCount(filteredCount);
    
    if (filteredLocations.length > 0) {
      // Check if user is currently interacting with the map - if so, don't auto-fit bounds
      const now = Date.now();
      const timeSinceLastInteraction = now - lastUserInteraction;
      
      // Increased timeout to 10 seconds to allow auto-fit when adding first location
      if (userInteracting || (timeSinceLastInteraction < 10000 && locations.length > 1)) {
        console.log(`🙋‍♂️ User is interacting with map (${timeSinceLastInteraction}ms ago) - skipping auto-fit bounds`);
        return; // Skip bounds fitting to preserve user's zoom/position
      }
      
      console.log(`🗺️ Creating smart bounds for ${filteredLocations.length} filtered locations`);
      
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
      
      console.log(`📊 Location spread analysis: center(${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}), maxDistance: ${maxDistance.toFixed(4)}`);
      
      // If locations are too spread out (more than ~100km), focus on main cluster
      if (maxDistance > 1.5) { // Roughly 150km threshold - much tighter for city-level viewing
        console.log(`🌍 Locations too spread out (${maxDistance.toFixed(2)}°), focusing on tightest cluster`);
        
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
        
        console.log(`🎯 Using tightest cluster of ${largestCluster.length} locations for city-level bounds`);
        
        const bounds = new google.maps.LatLngBounds();
        largestCluster.forEach((location: Location) => {
          const coords = { lat: location.latitude, lng: location.longitude };
          bounds.extend(coords);
          console.log(`📍 Cluster bounds extended with: ${location.name} at ${coords.lat}, ${coords.lng}`);
        });
        
        // Add padding to ensure good zoom level for city viewing
        mapInstanceRef.current.fitBounds(bounds, 150);
        
      } else {
        // Normal bounds for nearby locations
        console.log(`🗺️ Locations are clustered, using all ${filteredLocations.length} filtered locations`);
        const bounds = new google.maps.LatLngBounds();
        filteredLocations.forEach((location, index) => {
          const coords = { lat: location.latitude, lng: location.longitude };
          bounds.extend(coords);
          console.log(`📍 Bounds extended with location ${index + 1}: ${location.name} at ${coords.lat}, ${coords.lng}`);
        });
        
        mapInstanceRef.current.fitBounds(bounds, 50);
      }
      
      console.log(`✅ Smart bounds applied successfully`);
      
      // Ensure reasonable zoom levels
      google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
        const zoom = mapInstanceRef.current!.getZoom();
        console.log(`🔍 Zoom after fitBounds: ${zoom}`);
        
        if (zoom && zoom > 15) {
          console.log(`⚡ Limiting zoom to 15 for travel overview (was ${zoom})`);
          mapInstanceRef.current!.setZoom(15);
        } else if (zoom && zoom < 8) {
          console.log(`⚡ Ensuring minimum zoom of 8 for city detail (was ${zoom})`);
          mapInstanceRef.current!.setZoom(8);
        }
      });
    } else {
      console.log(`⚠️ No locations to fit bounds for`);
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
      initializeMap();
    }
  }, [isLoaded]); // Removed initializeMap from dependencies to prevent re-initialization

  // Update markers when map instance becomes available (handles timing issue)
  useEffect(() => {
    if (isLoaded && mapInstanceRef.current && locations.length > 0) {
      console.log('🎯 Map instance ready - updating pending markers for', locations.length, 'locations');
      updateMarkers();
    }
  }, [isLoaded, locations, updateMarkers]);

  // Update markers when locations change - but only if map is ready
  useEffect(() => {
    console.log('🗺️ Locations changed in EnhancedGoogleMap:', locations.length, 'locations');
    console.log('🗺️ Location details:', locations);
    console.log('🗺️ Map loaded:', isLoaded);
    console.log('🗺️ Map instance:', mapInstanceRef.current ? 'Available' : 'Not available');
    
    // Only update markers if both map is loaded AND map instance is available
    if (isLoaded && mapInstanceRef.current) {
      console.log('✅ Map ready - updating markers');
      updateMarkers();
    } else {
      console.log('⏳ Map not ready - deferring marker update');
    }
  }, [locations, updateMarkers, isLoaded]);

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