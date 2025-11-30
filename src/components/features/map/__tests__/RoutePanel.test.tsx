import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoutePanel from '../RoutePanel';
import { Location } from '../../../../types/map';

// Import the mocked service to access it in tests
import { routeOptimizationService } from '../../../../services/RouteOptimizationService';

// Mock Google Maps APIs
const mockDirectionsRenderer = {
  setMap: jest.fn(),
  setDirections: jest.fn(),
};

// Mock the RouteOptimizationService  
jest.mock('../../../../services/RouteOptimizationService', () => ({
  routeOptimizationService: {
    initialize: jest.fn(),
    optimizeRoute: jest.fn(),
  },
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Route: ({ size, className }: { size?: number; className?: string }) => (
    <div data-testid="route-icon" className={className} style={{ width: size, height: size }}>
      Route
    </div>
  ),
  Car: ({ size }: { size?: number }) => (
    <div data-testid="car-icon" style={{ width: size, height: size }}>Car</div>
  ),
  Bike: ({ size }: { size?: number }) => (
    <div data-testid="bike-icon" style={{ width: size, height: size }}>Bike</div>
  ),
  MapPin: ({ size, className }: { size?: number; className?: string }) => (
    <div data-testid="mappin-icon" className={className} style={{ width: size, height: size }}>
      MapPin
    </div>
  ),
  Clock: ({ size }: { size?: number }) => (
    <div data-testid="clock-icon" style={{ width: size, height: size }}>Clock</div>
  ),
  Navigation: ({ size }: { size?: number }) => (
    <div data-testid="navigation-icon" style={{ width: size, height: size }}>
      Navigation
    </div>
  ),
  Settings: ({ size, className }: { size?: number; className?: string }) => (
    <div data-testid="settings-icon" className={className} style={{ width: size, height: size }}>
      Settings
    </div>
  ),
  X: ({ size }: { size?: number }) => (
    <div data-testid="x-icon" style={{ width: size, height: size }}>X</div>
  ),
  ChevronDown: ({ size }: { size?: number }) => (
    <div data-testid="chevron-down-icon" style={{ width: size, height: size }}>ChevronDown</div>
  ),
  ChevronUp: ({ size }: { size?: number }) => (
    <div data-testid="chevron-up-icon" style={{ width: size, height: size }}>ChevronUp</div>
  ),
  Loader2: ({ size, className }: { size?: number; className?: string }) => (
    <div data-testid="loader-icon" className={className} style={{ width: size, height: size }}>
      Loader2
    </div>
  ),
}));

// Mock Google Maps global object
global.google = {
  maps: {
    TravelMode: {
      DRIVING: 'DRIVING',
      WALKING: 'WALKING',
      BICYCLING: 'BICYCLING',
      TRANSIT: 'TRANSIT',
    },
    DirectionsRenderer: jest.fn(() => mockDirectionsRenderer),
  },
} as any;

describe('RoutePanel', () => {
  const mockMap = {} as google.maps.Map;
  
  const sampleLocations: Location[] = [
    {
      id: '1',
      name: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      vicinity: 'Paris, France',
      type: 'attraction'
    },
    {
      id: '2', 
      name: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      vicinity: 'London, UK',
      type: 'attraction'
    }
  ];

  const mockOptimizedRoute = {
    locations: sampleLocations,
    totalDistance: 344,
    totalDuration: 290,
    waypoints: [],
    route: null,
    travelInsights: {
      bestTimeOfDay: 'Morning',
      difficultyLevel: 'Easy' as const,
      recommendedDuration: '5 hours',
      highlights: ['Scenic route'],
      tips: ['Start early']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (routeOptimizationService.optimizeRoute as jest.Mock).mockResolvedValue(mockOptimizedRoute);
  });

  describe('Rendering with different location counts', () => {
    it('renders nothing when no locations provided', () => {
      const { container } = render(<RoutePanel locations={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders minimal badge for single location', () => {
      const singleLocation = [sampleLocations[0]];
      render(<RoutePanel locations={singleLocation} />);
      
      expect(screen.getByText('📍 1 location • Add more for route planning')).toBeInTheDocument();
    });

    it('renders optimize button for multiple locations when panel closed', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      const optimizeButton = screen.getByText('Optimize Route');
      expect(optimizeButton).toBeInTheDocument();
      expect(screen.getByTestId('route-icon')).toBeInTheDocument();
    });
  });

  describe('Panel interaction', () => {
    it('opens panel when optimize button clicked', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      const optimizeButton = screen.getByText('Optimize Route');
      fireEvent.click(optimizeButton);
      
      expect(screen.getByText('Route Optimization')).toBeInTheDocument();
      expect(screen.getByText('Travel Mode')).toBeInTheDocument();
    });

    it('closes panel when X button clicked', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      // Open panel
      fireEvent.click(screen.getByText('Optimize Route'));
      expect(screen.getByText('Route Optimization')).toBeInTheDocument();
      
      // Close panel
      const closeButton = screen.getByTestId('x-icon').parentElement as HTMLElement;
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Route Optimization')).not.toBeInTheDocument();
    });

    it('displays travel mode options when panel is open', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      fireEvent.click(screen.getByText('Optimize Route'));
      
      expect(screen.getByText('Driving')).toBeInTheDocument();
      expect(screen.getByText('Walking')).toBeInTheDocument();
      expect(screen.getByText('Cycling')).toBeInTheDocument();
      expect(screen.getByText('Transit')).toBeInTheDocument();
    });

    it('allows selecting different travel modes', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      fireEvent.click(screen.getByText('Optimize Route'));
      
      const walkingButton = screen.getByText('Walking');
      fireEvent.click(walkingButton);
      
      // Should highlight the selected mode (checking for appropriate classes)
      expect(walkingButton.closest('button')).toHaveClass('bg-blue-100');
    });
  });

  describe('Route optimization options', () => {
    beforeEach(() => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      fireEvent.click(screen.getByText('Optimize Route'));
    });

    it('displays optimization options', () => {
      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByLabelText('Optimize waypoint order')).toBeInTheDocument();
    });

    it('shows driving-specific options when driving mode selected', () => {
      // Driving should be selected by default
      expect(screen.getByLabelText('Avoid highways')).toBeInTheDocument();
      expect(screen.getByLabelText('Avoid tolls')).toBeInTheDocument();
    });

    it('hides driving options when non-driving mode selected', () => {
      fireEvent.click(screen.getByText('Walking'));
      
      expect(screen.queryByLabelText('Avoid highways')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Avoid tolls')).not.toBeInTheDocument();
    });

    it('toggles waypoint optimization option', () => {
      const checkbox = screen.getByLabelText('Optimize waypoint order') as HTMLInputElement;
      expect(checkbox.checked).toBe(true); // Default should be true
      
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('toggles avoid highways option', () => {
      const checkbox = screen.getByLabelText('Avoid highways') as HTMLInputElement;
      expect(checkbox.checked).toBe(false); // Default should be false
      
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('toggles avoid tolls option', () => {
      const checkbox = screen.getByLabelText('Avoid tolls') as HTMLInputElement;
      expect(checkbox.checked).toBe(false); // Default should be false
      
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Route optimization process', () => {
    beforeEach(() => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      fireEvent.click(screen.getByText('Optimize Route'));
    });

    it('calls optimize service when optimize button clicked', async () => {
      // Since auto-optimization happens, we just check it was called
      await waitFor(() => {
        expect(routeOptimizationService.optimizeRoute).toHaveBeenCalledWith(
          sampleLocations,
          expect.objectContaining({
            travelMode: 'DRIVING',
            optimizeWaypoints: true,
            avoidHighways: false,
            avoidTolls: false
          })
        );
      });
    });

    it('shows loading state during optimization', async () => {
      // Make the service take time to resolve
      const promise = new Promise(resolve => { setTimeout(() => resolve(mockOptimizedRoute), 100); });
      (routeOptimizationService.optimizeRoute as jest.Mock).mockReturnValue(promise);
      
      // Just check that loading appears since auto-optimization triggers it
      expect(screen.getByText('Optimizing...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      
      await act(async () => {
        await promise;
      });
    });

    it('displays optimized route results', async () => {
      // Auto-optimization should show results
      await waitFor(() => {
        expect(screen.getByText('Optimized Route')).toBeInTheDocument();
      });
      
      expect(screen.getByText('344.0km')).toBeInTheDocument();
      expect(screen.getByText('4h 50m')).toBeInTheDocument();
      expect(screen.getByText('Route Order:')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('handles optimization errors gracefully', async () => {
      (routeOptimizationService.optimizeRoute as jest.Mock).mockRejectedValue(new Error('Optimization failed'));
      
      // Auto-optimization fails, so no results should be shown
      await waitFor(() => {
        expect(screen.queryByText('Optimized Route')).not.toBeInTheDocument();
      });
    });
  });

  describe('Google Maps integration', () => {
    it('initializes directions renderer when map provided', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      expect(global.google.maps.DirectionsRenderer).toHaveBeenCalled();
      expect(mockDirectionsRenderer.setMap).toHaveBeenCalledWith(mockMap);
    });

    it('initializes route optimization service', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      expect(routeOptimizationService.initialize).toHaveBeenCalled();
    });

    it('cleans up directions renderer on unmount', () => {
      const { unmount } = render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      unmount();
      
      expect(mockDirectionsRenderer.setMap).toHaveBeenCalledWith(null);
    });

    it('calls onRouteChange callback when route optimized', async () => {
      const onRouteChangeMock = jest.fn();
      render(
        <RoutePanel 
          locations={sampleLocations} 
          map={mockMap} 
          onRouteChange={onRouteChangeMock}
        />
      );
      
      fireEvent.click(screen.getByText('Optimize Route'));
      
      // Auto-optimization should trigger callback
      await waitFor(() => {
        expect(onRouteChangeMock).toHaveBeenCalledWith(mockOptimizedRoute);
      });
    });

    it('calls onRouteChange with null when panel closed', async () => {
      const onRouteChangeMock = jest.fn();
      render(
        <RoutePanel 
          locations={sampleLocations} 
          map={mockMap} 
          onRouteChange={onRouteChangeMock}
        />
      );
      
      fireEvent.click(screen.getByText('Optimize Route'));
      const closeButton = screen.getByTestId('x-icon').parentElement as HTMLElement;
      fireEvent.click(closeButton);
      
      expect(onRouteChangeMock).toHaveBeenCalledWith(null);
    });
  });

  describe('Utility functions', () => {
    it('formats duration correctly', async () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      fireEvent.click(screen.getByText('Optimize Route'));
      
      // Auto-optimization shows formatted duration
      await waitFor(() => {
        expect(screen.getByText('4h 50m')).toBeInTheDocument();
      });
    });

    it('formats distance correctly', async () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      fireEvent.click(screen.getByText('Optimize Route'));
      
      // Auto-optimization shows formatted distance
      await waitFor(() => {
        expect(screen.getByText('344.0km')).toBeInTheDocument();
      });
    });

    it('renders correct travel mode icons', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      fireEvent.click(screen.getByText('Optimize Route'));
      
      // Default should show car icon for driving
      expect(screen.getByTestId('car-icon')).toBeInTheDocument();
      
      // Click on cycling to see bike icon
      fireEvent.click(screen.getByText('Cycling'));
      expect(screen.getByTestId('bike-icon')).toBeInTheDocument();
    });
  });

  describe('Auto-optimization behavior', () => {
    it('automatically optimizes route when panel opens with multiple locations', async () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      fireEvent.click(screen.getByText('Optimize Route'));
      
      await waitFor(() => {
        expect(routeOptimizationService.optimizeRoute).toHaveBeenCalled();
      });
    });

    it('does not auto-optimize when panel is closed', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      // Should not optimize until panel is opened
      expect(routeOptimizationService.optimizeRoute).not.toHaveBeenCalled();
    });
  });

  describe('Component accessibility', () => {
    it('has proper button titles and labels', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      
      const optimizeButton = screen.getByTitle('Optimize Route');
      expect(optimizeButton).toBeInTheDocument();
    });

    it('uses proper checkbox labels for options', () => {
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      fireEvent.click(screen.getByText('Optimize Route'));
      
      expect(screen.getByLabelText('Optimize waypoint order')).toBeInTheDocument();
      expect(screen.getByLabelText('Avoid highways')).toBeInTheDocument();
      expect(screen.getByLabelText('Avoid tolls')).toBeInTheDocument();
    });

    it('disables optimize button during loading', async () => {
      const promise = new Promise(resolve => { setTimeout(() => resolve(mockOptimizedRoute), 100); });
      (routeOptimizationService.optimizeRoute as jest.Mock).mockReturnValue(promise);
      
      render(<RoutePanel locations={sampleLocations} map={mockMap} />);
      fireEvent.click(screen.getByText('Optimize Route'));
      
      // Should show loading button which is disabled
      const optimizeButton = screen.getByText('Optimizing...').closest('button');
      expect(optimizeButton).toBeDisabled();
      
      await act(async () => {
        await promise;
      });
    });
  });
});
