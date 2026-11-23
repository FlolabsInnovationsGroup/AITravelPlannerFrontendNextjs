import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Location } from '@/types/map';
import LocationSuggestions from '../LocationSuggestions';

describe('LocationSuggestions', () => {
  const mockSuggestions: Location[] = [
    {
      id: '1',
      name: 'Central Park',
      latitude: 40.7829,
      longitude: -73.9654,
      type: 'park',
      placeId: 'ChIJ1234567890',
      vicinity: 'New York, NY, USA',
      rating: 4.7,
      priceLevel: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Central Park Zoo',
      latitude: 40.7678,
      longitude: -73.9718,
      type: 'attraction',
      placeId: 'ChIJ0987654321',
      vicinity: 'Central Park, New York, NY, USA',
      rating: 4.2,
      priceLevel: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Central Park Conservancy',
      latitude: 40.7831,
      longitude: -73.9712,
      type: 'attraction',
      placeId: 'ChIJ1122334455',
      vicinity: 'Central Park, New York, NY, USA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    suggestions: mockSuggestions,
    onLocationSelect: jest.fn(),
    onDismiss: jest.fn(),
    searchTerm: 'Central Park',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when suggestions array is empty', () => {
    render(
      <LocationSuggestions
        suggestions={[]}
        onLocationSelect={jest.fn()}
        onDismiss={jest.fn()}
        searchTerm="test"
      />
    );

    expect(screen.queryByText(/Multiple locations found/)).not.toBeInTheDocument();
  });

  it('renders modal overlay and header with search term', () => {
    render(<LocationSuggestions {...defaultProps} />);

    expect(screen.getByText('Multiple locations found for "Central Park"')).toBeInTheDocument();
    expect(screen.getByText('Please select the location you meant:')).toBeInTheDocument();
    
    // Check for modal overlay
    const modalOverlay = screen.getByText('Multiple locations found for "Central Park"').closest('.fixed');
    expect(modalOverlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
  });

  it('renders all location suggestions', () => {
    render(<LocationSuggestions {...defaultProps} />);

    expect(screen.getByText('Central Park')).toBeInTheDocument();
    expect(screen.getByText('Central Park Zoo')).toBeInTheDocument();
    expect(screen.getByText('Central Park Conservancy')).toBeInTheDocument();
  });

  it('displays location addresses/vicinity when available', () => {
    render(<LocationSuggestions {...defaultProps} />);

    expect(screen.getByText('New York, NY, USA')).toBeInTheDocument();
    expect(screen.getAllByText('Central Park, New York, NY, USA')).toHaveLength(2); // Two locations have this address
  });

  it('displays ratings with star icons when available', () => {
    render(<LocationSuggestions {...defaultProps} />);

    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument();

    // Check for star icons using a more specific selector
    const starIcons = document.querySelectorAll('svg.text-yellow-500.fill-current');
    expect(starIcons.length).toBeGreaterThan(0);
  });

  it('does not display rating for locations without ratings', () => {
    const suggestionsWithoutRating = mockSuggestions.map(s => 
      s.id === '3' ? { ...s, rating: undefined } : s
    );

    render(
      <LocationSuggestions
        {...defaultProps}
        suggestions={suggestionsWithoutRating}
      />
    );

    // Should only show ratings for first two locations
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument();
    
    // Third location should not have rating display
    const conservancyButton = screen.getByText('Central Park Conservancy').closest('button');
    expect(conservancyButton?.textContent).not.toContain('.');
  });

  it('displays price levels with dollar signs', () => {
    render(<LocationSuggestions {...defaultProps} />);

    expect(screen.getByText('$$')).toBeInTheDocument(); // Central Park
    expect(screen.getByText('$')).toBeInTheDocument();  // Central Park Zoo
  });

  it('applies correct colors for different price levels', () => {
    render(<LocationSuggestions {...defaultProps} />);

    // Check that the price level containers have the correct color classes
    const twoDollarContainer = screen.getByText('$$').closest('div');
    expect(twoDollarContainer).toHaveClass('text-yellow-600');

    const oneDollarContainer = screen.getByText('$').closest('div');
    expect(oneDollarContainer).toHaveClass('text-green-600');
  });

  it('calls onLocationSelect when a location is clicked', () => {
    const onLocationSelect = jest.fn();
    render(<LocationSuggestions {...defaultProps} onLocationSelect={onLocationSelect} />);

    const firstLocation = screen.getByText('Central Park').closest('button');
    fireEvent.click(firstLocation!);

    expect(onLocationSelect).toHaveBeenCalledTimes(1);
    expect(onLocationSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it('calls onLocationSelect with correct location data', () => {
    const onLocationSelect = jest.fn();
    render(<LocationSuggestions {...defaultProps} onLocationSelect={onLocationSelect} />);

    const secondLocation = screen.getByText('Central Park Zoo').closest('button');
    fireEvent.click(secondLocation!);

    expect(onLocationSelect).toHaveBeenCalledWith(mockSuggestions[1]);
  });

  it('handles locations with missing or unknown names', () => {
    const suggestionsWithUnknownName = [
      { ...mockSuggestions[0], name: undefined },
      { ...mockSuggestions[1], name: '' },
    ];

    render(
      <LocationSuggestions
        {...defaultProps}
        suggestions={suggestionsWithUnknownName}
      />
    );

    const unknownLocationButtons = screen.getAllByText('Unknown Location');
    expect(unknownLocationButtons).toHaveLength(2);
  });

  it('uses placeId as key when available, falls back to index', () => {
    const suggestionsWithoutPlaceIds = mockSuggestions.map(s => ({ ...s, placeId: undefined }));
    
    // This test mainly ensures the component doesn't crash with missing placeIds
    expect(() => {
      render(
        <LocationSuggestions
          {...defaultProps}
          suggestions={suggestionsWithoutPlaceIds}
        />
      );
    }).not.toThrow();

    expect(screen.getByText('Central Park')).toBeInTheDocument();
  });

  it('applies correct CSS classes for modal and content', () => {
    render(<LocationSuggestions {...defaultProps} />);

    // Modal overlay
    const modalOverlay = screen.getByText('Multiple locations found for "Central Park"').closest('.fixed');
    expect(modalOverlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'flex', 'items-center', 'justify-center', 'z-50', 'p-4');

    // Modal content
    const modalContent = screen.getByText('Multiple locations found for "Central Park"').closest('.bg-white');
    expect(modalContent).toHaveClass('bg-white', 'rounded-lg', 'shadow-xl', 'max-w-md', 'w-full', 'max-h-96', 'overflow-hidden');

    // Header
    const header = screen.getByText('Multiple locations found for "Central Park"').closest('.p-4');
    expect(header).toHaveClass('p-4', 'border-b', 'bg-blue-50');
  });

  it('applies hover effects to location buttons', () => {
    render(<LocationSuggestions {...defaultProps} />);

    const locationButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Central Park')
    );

    locationButtons.forEach(button => {
      expect(button).toHaveClass('hover:bg-blue-50', 'transition-colors');
    });
  });

  it('handles scrollable content when many suggestions are present', () => {
    const manySuggestions = Array.from({ length: 20 }, (_, i) => ({
      ...mockSuggestions[0],
      id: `location-${i}`,
      name: `Location ${i}`,
      placeId: `place-${i}`,
    }));

    render(
      <LocationSuggestions
        {...defaultProps}
        suggestions={manySuggestions}
      />
    );

    // Check for scrollable container
    const scrollableContainer = screen.getByText('Location 0').closest('.max-h-80');
    expect(scrollableContainer).toHaveClass('max-h-80', 'overflow-y-auto');
  });

  it('maintains proper spacing and borders between suggestions', () => {
    render(<LocationSuggestions {...defaultProps} />);

    const suggestionButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Central Park')
    );

    suggestionButtons.forEach(button => {
      expect(button).toHaveClass('border-b', 'border-gray-100', 'last:border-b-0');
    });
  });

  it('displays map pin icons for each suggestion', () => {
    render(<LocationSuggestions {...defaultProps} />);

    // Each suggestion should have a map pin icon
    const mapPinIcons = screen.getAllByText('Central Park')[0]
      .closest('button')?.querySelector('.text-blue-600');
    
    expect(mapPinIcons).toBeInTheDocument();
  });

  it('handles suggestions with all optional fields populated', () => {
    const fullSuggestion: Location = {
      id: 'full-test',
      name: 'Complete Location',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'restaurant',
      placeId: 'complete-place-id',
      vicinity: 'Full Address, City, State',
      rating: 4.8,
      priceLevel: 3,
      userRatingsTotal: 500,
      phoneNumber: '+1-555-0123',
      website: 'https://example.com',
      isOpen: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <LocationSuggestions
        {...defaultProps}
        suggestions={[fullSuggestion]}
      />
    );

    expect(screen.getByText('Complete Location')).toBeInTheDocument();
    expect(screen.getByText('Full Address, City, State')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('$$$')).toBeInTheDocument();
  });

  it('handles edge case with empty search term', () => {
    render(<LocationSuggestions {...defaultProps} searchTerm="" />);

    expect(screen.getByText('Multiple locations found for ""')).toBeInTheDocument();
  });

  it('truncates long location names and addresses appropriately', () => {
    const longNameSuggestion: Location = {
      id: 'long-name',
      name: 'This is a very long location name that should be truncated properly',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'attraction',
      vicinity: 'This is a very long address that should also be truncated to prevent overflow',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <LocationSuggestions
        {...defaultProps}
        suggestions={[longNameSuggestion]}
      />
    );

    const nameElement = screen.getByText(/This is a very long location name/);
    expect(nameElement).toHaveClass('truncate');

    const addressElement = screen.getByText(/This is a very long address/);
    expect(addressElement).toHaveClass('truncate');
  });
});
