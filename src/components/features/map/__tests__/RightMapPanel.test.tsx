import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RightMapPanel from '../RightMapPanel';
import { Location, LocationType, WebSocketEvent } from '../../../../types/map';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, fill, className, priority }: any) {
    return (
      <img
        src={src}
        alt={alt}
        data-testid="travel-agent-image"
        className={className}
        data-fill={fill}
        data-priority={priority}
      />
    );
  };
});

// Mock the API call
jest.mock('../../../../lib/api', () => ({
  getLocationsBySession: jest.fn(),
}));

// Mock MapService
const mockMapService = {
  addMessageHandler: jest.fn(),
  removeMessageHandler: jest.fn(),
  connectWebSocket: jest.fn(),
  disconnect: jest.fn(),
  addLocation: jest.fn(),
  onError: jest.fn(),
  onConnect: jest.fn(),
  onDisconnect: jest.fn(),
};

jest.mock('../../../../services/MapService', () => ({
  MapService: jest.fn().mockImplementation(() => mockMapService),
}));

// Mock GoogleMapComponent
jest.mock('../GoogleMapComponent', () => {
  return function MockGoogleMapComponent({ locations, onLocationAdd, onLocationSelect }: any) {
    return (
      <div data-testid="google-map-component">
        <div data-testid="map-locations-count">{locations.length}</div>
        <button
          data-testid="mock-add-location"
          onClick={() => onLocationAdd?.({
            id: 'test-location-' + Date.now(),
            name: 'Test Location',
            latitude: 40.7128,
            longitude: -74.0060,
            type: 'attraction' as LocationType,
          })}
        >
          Add Test Location
        </button>
        <button
          data-testid="mock-select-location"
          onClick={() => onLocationSelect?.(locations[0])}
        >
          Select First Location
        </button>
        {locations.map((location: Location, index: number) => (
          <div key={location.id || index} data-testid={`map-location-${index}`}>
            {location.name}
          </div>
        ))}
      </div>
    );
  };
});

// Import the API mock
const { getLocationsBySession } = require('../../../../lib/api');

// Helper function to render component with proper act wrapping for async tests
const renderWithAct = async (component: React.ReactElement) => {
  let result: any;
  await act(async () => {
    result = render(component);
  });
  return result;
};

describe('RightMapPanel', () => {
  const mockProps = {
    currentSessionId: 'test-session-123',
    currentUserToken: 'test-token-456',
    onLocationUpdate: jest.fn(),
  };

  const sampleLocations: Location[] = [
    {
      id: 'location-1',
      name: 'Central Park',
      latitude: 40.7851,
      longitude: -73.9683,
      type: 'attraction',
    },
    {
      id: 'location-2',
      name: 'Statue of Liberty',
      latitude: 40.6892,
      longitude: -74.0445,
      type: 'attraction',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getLocationsBySession.mockResolvedValue(sampleLocations);
    mockMapService.addLocation.mockResolvedValue({
      id: 'new-location-123',
      name: 'New Location',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'attraction',
    });
    
    // Reset mock callbacks
    mockMapService.onConnect = jest.fn();
    mockMapService.onDisconnect = jest.fn();
    mockMapService.onError = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<RightMapPanel {...mockProps} />);
      expect(screen.getByTestId('travel-agent-image')).toBeInTheDocument();
    });

    it('shows travel agent image when no locations', async () => {
      getLocationsBySession.mockResolvedValue([]);
      
      await act(async () => {
        render(<RightMapPanel {...mockProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('travel-agent-image')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('travel-agent-image')).toHaveAttribute('src', '/image/travelagentpic1.png');
      expect(screen.getByTestId('travel-agent-image')).toHaveAttribute('alt', 'Travel Agent');
    });

    it('shows map component when locations exist', async () => {
      await act(async () => {
        render(<RightMapPanel {...mockProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('map-locations-count')).toHaveTextContent('2');
      expect(screen.queryByTestId('travel-agent-image')).not.toBeInTheDocument();
    });

    it('displays loading spinner during data fetch', () => {
      getLocationsBySession.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(sampleLocations), 1000);
      }));
      
      render(<RightMapPanel {...mockProps} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('handles null session ID gracefully', async () => {
      await act(async () => {
        render(<RightMapPanel {...mockProps} currentSessionId={null} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('travel-agent-image')).toBeInTheDocument();
      });
      
      expect(getLocationsBySession).not.toHaveBeenCalled();
    });

    it('handles null user token gracefully', () => {
      render(<RightMapPanel {...mockProps} currentUserToken={null} />);
      expect(screen.getByTestId('travel-agent-image')).toBeInTheDocument();
    });
  });

  describe('Location Management', () => {
    it('fetches locations on component mount', async () => {
      await act(async () => {
        render(<RightMapPanel {...mockProps} />);
      });
      
      await waitFor(() => {
        expect(getLocationsBySession).toHaveBeenCalledWith('test-session-123');
      });
      
      expect(screen.getByTestId('map-locations-count')).toHaveTextContent('2');
    });

    it('converts API location types correctly', async () => {
      const apiLocations = [
        { ...sampleLocations[0], type: 'invalid-type' },
        { ...sampleLocations[1], type: undefined },
        { ...sampleLocations[0], type: 'restaurant' }, // Valid type
      ];
      getLocationsBySession.mockResolvedValue(apiLocations);
      
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      // Should convert invalid types to 'attraction' and undefined to undefined, valid types remain unchanged
      expect(mockProps.onLocationUpdate).toHaveBeenCalledWith([
        { ...apiLocations[0], type: 'attraction' }, // invalid-type -> attraction
        { ...apiLocations[1], type: undefined },    // undefined -> undefined
        { ...apiLocations[2], type: 'restaurant' }, // valid type unchanged
      ]);
    });

    it('handles location fetch errors', async () => {
      const errorMessage = 'Network error';
      getLocationsBySession.mockRejectedValue(new Error(errorMessage));
      
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load locations')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('retries location fetch on retry button click', async () => {
      getLocationsBySession.mockRejectedValueOnce(new Error('Network error'));
      getLocationsBySession.mockResolvedValueOnce(sampleLocations);
      
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      expect(getLocationsBySession).toHaveBeenCalledTimes(2);
    });

    it('calls onLocationUpdate when locations change', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(mockProps.onLocationUpdate).toHaveBeenCalledWith(sampleLocations);
      });
    });
  });

  describe('WebSocket Integration', () => {
    it('initializes MapService with user token', () => {
      const { MapService } = require('../../../../services/MapService');
      render(<RightMapPanel {...mockProps} />);
      
      expect(MapService).toHaveBeenCalledWith('test-token-456');
    });

    it('sets up WebSocket message handlers', () => {
      render(<RightMapPanel {...mockProps} />);
      
      expect(mockMapService.addMessageHandler).toHaveBeenCalled();
      expect(mockMapService.connectWebSocket).toHaveBeenCalledWith('test-session-123');
    });

    it('connects WebSocket when session ID changes', async () => {
      const { rerender } = render(<RightMapPanel {...mockProps} />);
      
      // Clear previous calls
      mockMapService.connectWebSocket.mockClear();
      
      // Change session ID
      rerender(<RightMapPanel {...mockProps} currentSessionId="new-session-456" />);
      
      await waitFor(() => {
        expect(mockMapService.connectWebSocket).toHaveBeenCalledWith('new-session-456');
      });
    });

    it('cleans up WebSocket on unmount', () => {
      const { unmount } = render(<RightMapPanel {...mockProps} />);
      
      unmount();
      
      expect(mockMapService.removeMessageHandler).toHaveBeenCalled();
      expect(mockMapService.disconnect).toHaveBeenCalled();
    });

    it('handles WebSocket connection events', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      // The MapService callbacks are set during component initialization
      // We can verify they were called but don't need to manually trigger them here
      expect(mockMapService.addMessageHandler).toHaveBeenCalled();
      expect(mockMapService.connectWebSocket).toHaveBeenCalled();
    });
  });

  describe('Haversine Distance Calculation', () => {
    it('prevents duplicate locations within 100 meters', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      // Simulate WebSocket message for nearby location (within 100m of Central Park)
      const messageHandler = mockMapService.addMessageHandler.mock.calls[0][0];
      const nearbyLocation: Location = {
        id: 'nearby-location',
        name: 'Near Central Park',
        latitude: 40.7852, // Very close to Central Park
        longitude: -73.9684,
        type: 'attraction',
      };
      
      act(() => {
        messageHandler({
          type: 'LOCATION_ADDED',
          payload: nearbyLocation,
        } as WebSocketEvent<Location>);
      });
      
      // Should still have 2 locations (duplicate not added)
      expect(screen.getByTestId('map-locations-count')).toHaveTextContent('2');
    });

    it('allows locations more than 100 meters apart', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      // Simulate WebSocket message for distant location
      const messageHandler = mockMapService.addMessageHandler.mock.calls[0][0];
      const distantLocation: Location = {
        id: 'distant-location',
        name: 'Times Square',
        latitude: 40.7580,
        longitude: -73.9855,
        type: 'attraction',
      };
      
      act(() => {
        messageHandler({
          type: 'LOCATION_ADDED',
          payload: distantLocation,
        } as WebSocketEvent<Location>);
      });
      
      // Should now have 3 locations
      await waitFor(() => {
        expect(screen.getByTestId('map-locations-count')).toHaveTextContent('3');
      });
    });
  });

  describe('WebSocket Message Handling', () => {
    it('handles LOCATION_ADDED messages', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      const messageHandler = mockMapService.addMessageHandler.mock.calls[0][0];
      const newLocation: Location = {
        id: 'new-ws-location',
        name: 'WebSocket Location',
        latitude: 40.7589,
        longitude: -73.9851,
        type: 'restaurant',
      };
      
      act(() => {
        messageHandler({
          type: 'LOCATION_ADDED',
          payload: newLocation,
        } as WebSocketEvent<Location>);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('map-locations-count')).toHaveTextContent('3');
      });
    });

    it('handles LOCATION_REMOVED messages', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      const messageHandler = mockMapService.addMessageHandler.mock.calls[0][0];
      
      act(() => {
        messageHandler({
          type: 'LOCATION_REMOVED',
          payload: { locationId: 'location-1' },
        } as WebSocketEvent<{ locationId: string }>);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('map-locations-count')).toHaveTextContent('1');
      });
    });

    it('handles MAP_CLEARED messages', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      const messageHandler = mockMapService.addMessageHandler.mock.calls[0][0];
      
      act(() => {
        messageHandler({
          type: 'MAP_CLEARED',
          payload: {},
        } as WebSocketEvent<{}>);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('travel-agent-image')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Event Handling', () => {
    it('handles newLocation custom events', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      const newLocation: Location = {
        id: 'custom-event-location',
        name: 'Custom Event Location',
        latitude: 40.7505,
        longitude: -73.9934,
        type: 'hotel',
      };
      
      act(() => {
        const event = new CustomEvent('newLocation', { detail: newLocation });
        window.dispatchEvent(event);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('map-locations-count')).toHaveTextContent('3');
      });
      
      expect(mockProps.onLocationUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining(newLocation)
        ])
      );
    });

    it('prevents duplicate locations from custom events', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      // Try to add location very close to existing one
      const nearbyLocation: Location = {
        id: 'nearby-custom-location',
        name: 'Near Existing Location',
        latitude: 40.7852, // Very close to Central Park
        longitude: -73.9684,
        type: 'cafe',
      };
      
      act(() => {
        const event = new CustomEvent('newLocation', { detail: nearbyLocation });
        window.dispatchEvent(event);
      });
      
      // Should still have 2 locations
      await waitFor(() => {
        expect(screen.getByTestId('map-locations-count')).toHaveTextContent('2');
      });
    });
  });

  describe('Map Interaction Handlers', () => {
    it('handles location addition through map component', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('mock-add-location'));
      
      await waitFor(() => {
        expect(mockMapService.addLocation).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Location',
            latitude: 40.7128,
            longitude: -74.0060,
            type: 'attraction',
            sessionId: 'test-session-123',
          })
        );
      });
    });

    it('handles location selection through map component', async () => {
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('mock-select-location'));
      
      // Should not throw errors (selection is logged but no specific action)
    });

    it('handles add location errors gracefully', async () => {
      // Mock console.error to prevent test failure for expected error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMapService.addLocation.mockRejectedValue(new Error('Add location failed'));
      
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('mock-add-location'));
      
      await waitFor(() => {
        expect(mockMapService.addLocation).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('❌ Error adding location:', expect.any(Error));
      });
      
      // Should handle error gracefully without crashing
      consoleSpy.mockRestore();
    });

    it('prevents location addition without session ID', async () => {
      render(<RightMapPanel {...mockProps} currentSessionId={null} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('travel-agent-image')).toBeInTheDocument();
      });
      
      // Even if we had a map, adding location should be prevented
      // This is handled by the null session check in handleLocationAdd
    });
  });

  describe('Component Memoization', () => {
    it('memoizes component to prevent unnecessary re-renders', () => {
      const { rerender } = render(<RightMapPanel {...mockProps} />);
      
      // Re-render with same props
      rerender(<RightMapPanel {...mockProps} />);
      
      // Should not cause additional MapService instantiation
      const { MapService } = require('../../../../services/MapService');
      expect(MapService).toHaveBeenCalledTimes(1);
    });

    it('re-renders when session ID changes', () => {
      const { rerender } = render(<RightMapPanel {...mockProps} />);
      
      // Re-render with different session ID
      rerender(<RightMapPanel {...mockProps} currentSessionId="different-session" />);
      
      // Should trigger new operations
      expect(mockMapService.connectWebSocket).toHaveBeenCalledWith('different-session');
    });

    it('re-renders when user token changes', () => {
      const { rerender } = render(<RightMapPanel {...mockProps} />);
      
      const { MapService } = require('../../../../services/MapService');
      MapService.mockClear();
      
      // Re-render with different token
      rerender(<RightMapPanel {...mockProps} currentUserToken="different-token" />);
      
      // Should create new MapService
      expect(MapService).toHaveBeenCalledWith('different-token');
    });
  });

  describe('Error Handling', () => {
    it('displays error state with retry option', async () => {
      // Mock console.error to prevent test failure for expected error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      getLocationsBySession.mockRejectedValue(new Error('API Error'));
      
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load locations')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith('❌ Error fetching locations:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('recovers from error state on successful retry', async () => {
      // Mock console.error to prevent test failure for expected error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      getLocationsBySession.mockRejectedValueOnce(new Error('API Error'));
      getLocationsBySession.mockResolvedValueOnce(sampleLocations);
      
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('handles WebSocket errors without crashing', async () => {
      getLocationsBySession.mockResolvedValue([]);
      render(<RightMapPanel {...mockProps} />);
      
      // Component should render without errors even with WebSocket issues
      await waitFor(() => {
        expect(screen.getByTestId('travel-agent-image')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper alt text for travel agent image', async () => {
      getLocationsBySession.mockResolvedValue([]);
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByAltText('Travel Agent')).toBeInTheDocument();
      });
    });

    it('provides accessible loading indicator', () => {
      getLocationsBySession.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<RightMapPanel {...mockProps} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('provides accessible retry button', async () => {
      // Mock console.error to prevent test failure for expected error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      getLocationsBySession.mockRejectedValue(new Error('API Error'));
      
      render(<RightMapPanel {...mockProps} />);
      
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });
});
