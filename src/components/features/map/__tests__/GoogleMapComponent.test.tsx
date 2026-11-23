// src/components/features/map/__tests__/GoogleMapComponent.simple.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Location } from '../../../../types/map';

// Import the component after mocking
import GoogleMapComponent from '../GoogleMapComponent';

// Mock the entire @react-google-maps/api library to avoid DOM issues
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children, onLoad }: any) => {
    // Simulate map loading - do not spread props onto div (invalid DOM attrs cause React setInitialProperties to throw)
    React.useEffect(() => {
      if (onLoad) {
        const mockMapInstance = {
          setCenter: jest.fn(),
          setZoom: jest.fn(),
          fitBounds: jest.fn(),
          addListener: jest.fn()
        };
        onLoad(mockMapInstance);
      }
    }, [onLoad]);
    return <div data-testid="google-map">{children}</div>;
  },
  LoadScript: ({ children }: any) => <div data-testid="load-script">{children}</div>,
  useLoadScript: () => ({ isLoaded: true, loadError: null })
}));

// Mock @googlemaps/markerclusterer
jest.mock('@googlemaps/markerclusterer', () => ({
  MarkerClusterer: jest.fn().mockImplementation(() => ({
    addMarkers: jest.fn(),
    clearMarkers: jest.fn(),
    setMap: jest.fn()
  }))
}));

// Mock child components that might have complex implementations
jest.mock('../SearchBox', () => function MockSearchBox() {
    return <div data-testid="search-box" />;
  });

jest.mock('../MapErrorBoundary', () => function MockMapErrorBoundary({ children }: any) {
    return <div data-testid="map-error-boundary">{children}</div>;
  });

jest.mock('../LocationInfoWindow', () => function MockLocationInfoWindow() {
    return <div data-testid="location-info-window" />;
  });

jest.mock('../WeatherOverlay', () => function MockWeatherOverlay() {
    return <div data-testid="weather-overlay" />;
  });

jest.mock('../RoutePanel', () => function MockRoutePanel() {
    return <div data-testid="route-panel" />;
  });

jest.mock('../MapControls', () => function MockMapControls() {
    return <div data-testid="map-controls" />;
  });

// Mock Google Maps API services
const mockPlacesService = {
  textSearch: jest.fn(),
  getDetails: jest.fn()
};

const mockGoogleMaps = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(() => ({
      setMap: jest.fn(),
      setPosition: jest.fn(),
      addListener: jest.fn(),
      getPosition: jest.fn(() => ({ lat: () => 0, lng: () => 0 }))
    })),
    InfoWindow: jest.fn(() => ({
      open: jest.fn(),
      close: jest.fn(),
      setContent: jest.fn()
    })),
    LatLngBounds: jest.fn(() => ({
      extend: jest.fn()
    })),
    LatLng: jest.fn((lat, lng) => ({ lat: () => lat, lng: () => lng })),
    Size: jest.fn((width, height) => ({ width, height })),
    Point: jest.fn((x, y) => ({ x, y })),
    Animation: {
      DROP: 'drop',
      BOUNCE: 'bounce'
    },
    places: {
      PlacesService: jest.fn(() => mockPlacesService),
      PlacesServiceStatus: {
        OK: 'OK'
      }
    },
    MapTypeId: {
      ROADMAP: 'roadmap'
    },
    event: {
      addListener: jest.fn()
    }
  }
};

// Mock global google object
Object.defineProperty(window, 'google', {
  value: mockGoogleMaps,
  writable: true
});

// Mock map service for WebSocket integration
const mockMapService = {
  onLocationAdded: jest.fn(),
  onLocationRemoved: jest.fn(),
  onMapCleared: jest.fn(),
  disconnect: jest.fn()
};

// Mock the map service
jest.mock('../../../../services/MapService', () => ({
    MapService: {
      getInstance: () => mockMapService
    }
  }));

describe('GoogleMapComponent - DOM Safe Tests', () => {
  const mockLocations: Location[] = [
    {
      id: '1',
      name: 'Test Location 1',
      latitude: 48.8566,
      longitude: 2.3522,
      vicinity: 'Paris, France',
      type: 'attraction',
      rating: 4.5
    },
    {
      id: '2', 
      name: 'Test Location 2',
      latitude: 51.5074,
      longitude: -0.1278,
      vicinity: 'London, UK',
      type: 'restaurant',
      rating: 4.0
    }
  ];

  const mockProps = {
    locations: mockLocations,
    onLocationAdd: jest.fn(),
    onLocationSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders map component without crashing', () => {
    render(<GoogleMapComponent {...mockProps} />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  it('renders the google map component', () => {
    render(<GoogleMapComponent {...mockProps} />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.getByTestId('map-error-boundary')).toBeInTheDocument();
  });

  it('renders all main components', () => {
    render(<GoogleMapComponent {...mockProps} />);
    expect(screen.getByTestId('map-error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('search-box')).toBeInTheDocument();
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.getByTestId('weather-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('route-panel')).toBeInTheDocument();
    expect(screen.getByTestId('map-controls')).toBeInTheDocument();
  });

  it('handles empty locations array', () => {
    const emptyProps = { ...mockProps, locations: [] };
    render(<GoogleMapComponent {...emptyProps} />);
    
    const mapContainer = screen.getByTestId('google-map');
    expect(mapContainer).toBeInTheDocument();
  });

  it('handles missing callback props gracefully', () => {
    const minimalProps = { locations: mockLocations };
    render(<GoogleMapComponent {...minimalProps} />);
    
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  it('renders with different location types', () => {
    const locationsWithTypes: Location[] = [
      { ...mockLocations[0], type: 'hotel' },
      { ...mockLocations[1], type: 'museum' },
    ];
    
    render(<GoogleMapComponent {...mockProps} locations={locationsWithTypes} />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  it('handles various props correctly', () => {
    render(<GoogleMapComponent {...mockProps} />);
    
    // Verify component renders with props
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  it('renders within error boundary wrapper', () => {
    render(<GoogleMapComponent {...mockProps} />);
    expect(screen.getByTestId('map-error-boundary')).toBeInTheDocument();
  });

  it('handles invalid location data gracefully', () => {
    const invalidLocations: Location[] = [
      {
        id: '1',
        name: '',
        latitude: NaN,
        longitude: NaN,
        vicinity: '',
        type: 'attraction'
      }
    ];
    
    const propsWithInvalidLocations = { ...mockProps, locations: invalidLocations };
    render(<GoogleMapComponent {...propsWithInvalidLocations} />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  it('cleans up properly on unmount', () => {
    const { unmount } = render(<GoogleMapComponent {...mockProps} />);
    unmount();
    
    // Component should unmount without errors
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument();
  });

  // Test that the component properly handles props updates
  it('updates when locations prop changes', () => {
    const { rerender } = render(<GoogleMapComponent {...mockProps} />);
    
    const newLocations: Location[] = [
      {
        id: '3',
        name: 'New Location',
        latitude: 40.7128,
        longitude: -74.0060,
        vicinity: 'New York, USA',
        type: 'hotel',
        rating: 4.2
      }
    ];

    rerender(<GoogleMapComponent {...mockProps} locations={newLocations} />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  // Test location type variations
  it('handles all supported location types', () => {
    const allLocationTypes: Location[] = [
      { id: '1', name: 'Hotel', latitude: 0, longitude: 0, vicinity: 'Test', type: 'hotel' },
      { id: '2', name: 'Restaurant', latitude: 0, longitude: 0, vicinity: 'Test', type: 'restaurant' },
      { id: '3', name: 'Cafe', latitude: 0, longitude: 0, vicinity: 'Test', type: 'cafe' },
      { id: '4', name: 'Museum', latitude: 0, longitude: 0, vicinity: 'Test', type: 'museum' },
      { id: '5', name: 'Park', latitude: 0, longitude: 0, vicinity: 'Test', type: 'park' },
      { id: '6', name: 'Beach', latitude: 0, longitude: 0, vicinity: 'Test', type: 'beach' },
      { id: '7', name: 'Shopping', latitude: 0, longitude: 0, vicinity: 'Test', type: 'shopping' },
      { id: '8', name: 'Airport', latitude: 0, longitude: 0, vicinity: 'Test', type: 'airport' },
      { id: '9', name: 'Attraction', latitude: 0, longitude: 0, vicinity: 'Test', type: 'attraction' }
    ];
    
    render(<GoogleMapComponent {...mockProps} locations={allLocationTypes} />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });
});
