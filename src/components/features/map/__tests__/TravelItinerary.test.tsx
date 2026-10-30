// src/components/features/map/__tests__/TravelItinerary.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Location } from '@/types/map';
import TravelItinerary from '../TravelItinerary';

// Mock the TravelLocationAnalyzer service since it's imported in the component
jest.mock('../../../../services/TravelLocationAnalyzer', () => ({
  travelAnalyzer: {
    analyzeTravelData: jest.fn().mockReturnValue({
      itineraryDays: [
        {
          day: 1,
          date: '2024-01-01',
          locations: [
            {
              id: '1',
              name: 'Louvre Museum',
              latitude: 48.8606,
              longitude: 2.3376,
              type: 'museum',
              rating: 4.8
            }
          ],
          totalDistance: 15.5,
          estimatedTime: 480,
          travelTime: 60,
          theme: 'Cultural'
        }
      ],
      travelStats: {
        totalLocations: 1,
        totalDistance: 15.5,
        totalTime: 540,
        averageRating: 4.6,
        locationBreakdown: {
          attraction: 0,
          restaurant: 0,
          hotel: 0,
          museum: 1,
          park: 0,
          cafe: 0,
          shopping: 0,
          entertainment: 0,
          transport: 0,
          beach: 0
        },
        priceRange: {
          min: 0,
          max: 50,
          average: 25
        }
      },
      recommendations: [
        {
          type: 'time_warning',
          priority: 'medium',
          message: 'Visit popular attractions early in the morning to avoid crowds'
        }
      ]
    }),
    createOptimizedItinerary: jest.fn().mockReturnValue([]),
    formatTime: jest.fn().mockImplementation((minutes: number) => {
      if (minutes < 60) {
        return `${minutes}m`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }),
    formatDistance: jest.fn().mockImplementation((meters: number) => {
      if (meters < 1000) {
        return `${meters}m`;
      }
      const km = (meters / 1000).toFixed(1);
      return `${km}km`;
    })
  }
}));

describe('TravelItinerary Component', () => {
  const mockLocations: Location[] = [
    {
      id: '1',
      name: 'Louvre Museum',
      latitude: 48.8606,
      longitude: 2.3376,
      type: 'museum',
      rating: 4.8
    },
    {
      id: '2', 
      name: 'Café de Flore',
      latitude: 48.8542,
      longitude: 2.3320,
      type: 'cafe',
      rating: 4.3
    }
  ];

  const mockProps = {
    locations: mockLocations,
    onLocationSelect: jest.fn(),
    onLocationRemove: jest.fn(),
    onOptimizeRoute: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<TravelItinerary {...mockProps} />);
    expect(screen.getByText(/Travel Itinerary/)).toBeInTheDocument();
  });

  it('displays locations in the itinerary', () => {
    render(<TravelItinerary {...mockProps} />);
    expect(screen.getByText('Louvre Museum')).toBeInTheDocument();
    // Note: Only the mock location from analyzeTravelData is shown, not both input locations
  });

  it('shows travel analysis with day information', () => {
    render(<TravelItinerary {...mockProps} />);
    
    const showAnalysisButton = screen.getByText('Show Analysis');
    fireEvent.click(showAnalysisButton);
    
    expect(screen.getByText(/Day 1/)).toBeInTheDocument();
    expect(screen.getByText(/Cultural/)).toBeInTheDocument();
  });

  it('handles empty locations gracefully', () => {
    render(<TravelItinerary {...mockProps} locations={[]} />);
    
    expect(screen.getByText('No Itinerary Yet')).toBeInTheDocument();
    expect(screen.getByText(/Start adding locations/)).toBeInTheDocument();
  });

  it('displays travel recommendations when analysis is shown', () => {
    render(<TravelItinerary {...mockProps} />);
    
    const showAnalysisButton = screen.getByText('Show Analysis');
    fireEvent.click(showAnalysisButton);
    
    expect(screen.getByText(/visit popular attractions early/i)).toBeInTheDocument();
  });
});
