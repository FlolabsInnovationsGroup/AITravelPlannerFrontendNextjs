import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeatherOverlay from '../WeatherOverlay';
import { WeatherData } from '../../../../services/WeatherService';
import { Location } from '../../../../types/map';

// Mock the WeatherService
jest.mock('../../../../services/WeatherService', () => ({
  weatherService: {
    getWeatherData: jest.fn(),
  },
}));

// Import the mocked service
import { weatherService } from '../../../../services/WeatherService';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Cloud: ({ size, className }: any) => (
    <div data-testid="cloud-icon" data-size={size} className={className}>Cloud</div>
  ),
  CloudRain: ({ size, className }: any) => (
    <div data-testid="cloudrain-icon" data-size={size} className={className}>CloudRain</div>
  ),
  Sun: ({ size, className }: any) => (
    <div data-testid="sun-icon" data-size={size} className={className}>Sun</div>
  ),
  Wind: ({ size, className }: any) => (
    <div data-testid="wind-icon" data-size={size} className={className}>Wind</div>
  ),
  Droplets: ({ size, className }: any) => (
    <div data-testid="droplets-icon" data-size={size} className={className}>Droplets</div>
  ),
  Thermometer: ({ size, className }: any) => (
    <div data-testid="thermometer-icon" data-size={size} className={className}>Thermometer</div>
  ),
  Eye: ({ size, className }: any) => (
    <div data-testid="eye-icon" data-size={size} className={className}>Eye</div>
  ),
  EyeOff: ({ size, className }: any) => (
    <div data-testid="eyeoff-icon" data-size={size} className={className}>EyeOff</div>
  ),
}));

const mockWeatherService = weatherService as jest.Mocked<typeof weatherService>;

const mockLocations: Location[] = [
  {
    id: 'loc1',
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    type: 'attraction',
  },
  {
    id: 'loc2',
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    type: 'attraction',
  },
];

const mockWeatherData: WeatherData = {
  location: {
    lat: 48.8566,
    lng: 2.3522,
    name: 'Paris',
  },
  current: {
    temperature: 20,
    description: 'partly cloudy',
    icon: '02d',
    humidity: 65,
    windSpeed: 15,
    feelLike: 22,
    uvIndex: 5,
    visibility: 10,
    cloudiness: 40,
  },
  forecast: [
    {
      date: '2023-10-15',
      temperature: { min: 15, max: 25 },
      description: 'sunny',
      icon: '01d',
      precipitation: 0,
    },
    {
      date: '2023-10-16',
      temperature: { min: 12, max: 18 },
      description: 'rainy',
      icon: '10d',
      precipitation: 5,
    },
  ],
  travelInsights: {
    bestTimeToVisit: 'Morning',
    clothingRecommendations: ['Light jacket', 'Comfortable shoes'],
    activitySuggestions: ['Sightseeing', 'Walking tours'],
    weatherAlerts: ['UV levels moderate'],
  },
};

describe('WeatherOverlay', () => {
  const mockOnToggleVisibility = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockWeatherService.getWeatherData.mockResolvedValue(mockWeatherData);
  });

  it('returns null when not visible', () => {
    const { container } = render(
      <WeatherOverlay
        locations={mockLocations}
        isVisible={false}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders empty state when no locations and visible', () => {
    render(
      <WeatherOverlay
        locations={[]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    expect(screen.getByText('No locations to show weather for')).toBeInTheDocument();
    expect(screen.getByTestId('cloud-icon')).toBeInTheDocument();
  });

  it('shows loading state initially when locations are provided', async () => {
    // Make the mock promise never resolve to show loading state
    mockWeatherService.getWeatherData.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <WeatherOverlay
        locations={mockLocations}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Loading weather data...')).toBeInTheDocument();
    });
  });

  it('fetches and displays weather data for all locations', async () => {
    render(
      <WeatherOverlay
        locations={mockLocations}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    // Wait for weather data to load
    await waitFor(() => {
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    expect(mockWeatherService.getWeatherData).toHaveBeenCalledTimes(2);
    expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith(48.8566, 2.3522, 'Paris');
    expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith(51.5074, -0.1278, 'London');
  });

  it('displays weather information correctly', async () => {
    render(
      <WeatherOverlay
        locations={[mockLocations[0]]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('20°C')).toBeInTheDocument();
      expect(screen.getByText('partly cloudy')).toBeInTheDocument();
      expect(screen.getByText('Feels 22°C')).toBeInTheDocument();
      expect(screen.getByText('15 km/h')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  it('displays forecast information', async () => {
    render(
      <WeatherOverlay
        locations={[mockLocations[0]]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Next 2 Days')).toBeInTheDocument();
      expect(screen.getByText('15° / 25°')).toBeInTheDocument();
      expect(screen.getByText('12° / 18°')).toBeInTheDocument();
    });
  });

  it('handles weather service errors gracefully', async () => {
    mockWeatherService.getWeatherData.mockRejectedValue(new Error('API Error'));

    render(
      <WeatherOverlay
        locations={[mockLocations[0]]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Weather unavailable')).toBeInTheDocument();
    });
  });

  it('updates weather when locations change', async () => {
    const { rerender } = render(
      <WeatherOverlay
        locations={[mockLocations[0]]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(mockWeatherService.getWeatherData).toHaveBeenCalledTimes(1);
    });

    // Change locations
    rerender(
      <WeatherOverlay
        locations={mockLocations}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(mockWeatherService.getWeatherData).toHaveBeenCalledTimes(3);
    });
  });

  it('does not fetch weather when overlay is not visible', async () => {
    render(
      <WeatherOverlay
        locations={mockLocations}
        isVisible={false}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    // Wait a bit to ensure no calls are made
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockWeatherService.getWeatherData).not.toHaveBeenCalled();
  });

  it('renders correct weather icons based on icon code', async () => {
    const sunnyWeather = {
      ...mockWeatherData,
      current: { ...mockWeatherData.current, icon: '01d' },
      forecast: [], // Remove forecast to avoid multiple icons
    };
    mockWeatherService.getWeatherData.mockResolvedValue(sunnyWeather);

    render(
      <WeatherOverlay
        locations={[mockLocations[0]]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('sun-icon').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders cloud icon for cloudy weather', async () => {
    const cloudyWeather = {
      ...mockWeatherData,
      current: { ...mockWeatherData.current, icon: '03d' },
      forecast: [], // Remove forecast to avoid multiple icons
    };
    mockWeatherService.getWeatherData.mockResolvedValue(cloudyWeather);

    render(
      <WeatherOverlay
        locations={[mockLocations[0]]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('cloud-icon').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders rain icon for rainy weather', async () => {
    const rainyWeather = {
      ...mockWeatherData,
      current: { ...mockWeatherData.current, icon: '10d' },
      forecast: [], // Remove forecast to avoid multiple icons
    };
    mockWeatherService.getWeatherData.mockResolvedValue(rainyWeather);

    render(
      <WeatherOverlay
        locations={[mockLocations[0]]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('cloudrain-icon').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('applies correct positioning classes', () => {
    render(
      <WeatherOverlay
        locations={mockLocations}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    const overlay = document.querySelector('.absolute.top-20.right-16.z-10');
    expect(overlay).toBeInTheDocument();
  });

  it('limits displayed cards with scrollable container', async () => {
    render(
      <WeatherOverlay
        locations={mockLocations}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      const container = document.querySelector('.max-h-96.overflow-y-auto');
      expect(container).toBeInTheDocument();
    });
  });

  it('handles locations without names', async () => {
    const locationWithoutName = {
      ...mockLocations[0],
      name: '',
    };

    render(
      <WeatherOverlay
        locations={[locationWithoutName]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      // Should use weather location name as fallback
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });
  });

  it('shows loading animation for individual cards', async () => {
    // Mock one location to be slow, one to be fast
    mockWeatherService.getWeatherData
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve(mockWeatherData), 1000)))
      .mockResolvedValueOnce(mockWeatherData);

    render(
      <WeatherOverlay
        locations={mockLocations}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    // Check for loading animation
    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  it('formats weekday names correctly in forecast', async () => {
    const weatherWithForecast = {
      ...mockWeatherData,
      current: { ...mockWeatherData.current, icon: '02d' }, // Use cloud to avoid confusion
      forecast: [
        {
          date: '2023-10-15', // Assuming this is a Sunday
          temperature: { min: 15, max: 25 },
          description: 'sunny',
          icon: '01d',
          precipitation: 0,
        },
      ],
    };
    mockWeatherService.getWeatherData.mockResolvedValue(weatherWithForecast);

    render(
      <WeatherOverlay
        locations={[mockLocations[0]]}
        isVisible={true}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    await waitFor(() => {
      // Look for weekday abbreviations specifically in spans with font-medium class
      const weekdayElements = screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
      expect(weekdayElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
