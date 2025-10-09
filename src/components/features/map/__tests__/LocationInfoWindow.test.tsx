import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationInfoWindow from '../LocationInfoWindow';
import { Location } from '@/types/map';

describe('LocationInfoWindow', () => {
  const mockLocation: Location = {
    id: '1',
    name: 'Test Restaurant',
    latitude: 40.7128,
    longitude: -74.0060,
    type: 'restaurant',
    rating: 4.5,
    priceLevel: 2,
    photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    vicinity: '123 Main St, New York, NY',
    placeId: 'ChIJ1234567890',
    isOpen: true,
    userRatingsTotal: 150,
    phoneNumber: '+1-555-0123',
    website: 'https://example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    location: mockLocation,
    onGetDirections: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders location name and basic information', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, New York, NY')).toBeInTheDocument();
  });

  it('displays rating with star icon when available', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(150 reviews)')).toBeInTheDocument();
    
    // Check for star icon (using test ID or class)
    const starIcon = screen.getByText('4.5').previousElementSibling;
    expect(starIcon).toHaveClass('text-yellow-500');
  });

  it('does not display rating section when rating is not available', () => {
    const locationWithoutRating = { ...mockLocation, rating: undefined, userRatingsTotal: undefined };
    render(<LocationInfoWindow location={locationWithoutRating} onGetDirections={jest.fn()} />);

    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
  });

  it('displays price level with dollar signs', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    expect(screen.getByText('$$')).toBeInTheDocument();
  });

  it('applies correct color for different price levels', () => {
    const { rerender } = render(<LocationInfoWindow {...defaultProps} />);

    // Check that price level container has the correct color class
    const priceContainer = screen.getByText('$$').closest('div');
    expect(priceContainer).toHaveClass('text-yellow-600');

    // Test different price levels
    const expensiveLocation = { ...mockLocation, priceLevel: 4 as const };
    rerender(<LocationInfoWindow location={expensiveLocation} onGetDirections={jest.fn()} />);
    const expensivePriceContainer = screen.getByText('$$$$').closest('div');
    expect(expensivePriceContainer).toHaveClass('text-red-600');

    const cheapLocation = { ...mockLocation, priceLevel: 1 as const };
    rerender(<LocationInfoWindow location={cheapLocation} onGetDirections={jest.fn()} />);
    const cheapPriceContainer = screen.getByText('$').closest('div');
    expect(cheapPriceContainer).toHaveClass('text-green-600');
  });

  it('displays opening status correctly', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    expect(screen.getByText('Open now')).toBeInTheDocument();
    expect(screen.getByText('Open now')).toHaveClass('text-green-700');
  });

  it('displays closed status when location is closed', () => {
    const closedLocation = { ...mockLocation, isOpen: false };
    render(<LocationInfoWindow location={closedLocation} onGetDirections={jest.fn()} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toHaveClass('text-red-700');
  });

  it('does not display opening hours when not available', () => {
    const locationWithUnknownHours = { ...mockLocation, isOpen: undefined };
    render(<LocationInfoWindow location={locationWithUnknownHours} onGetDirections={jest.fn()} />);

    // When isOpen is undefined, the opening hours section should not render
    expect(screen.queryByText('Hours unknown')).not.toBeInTheDocument();
    expect(screen.queryByText('Open now')).not.toBeInTheDocument();
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });

  it('renders photo when available', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    const photo = screen.getByRole('img', { name: 'Test Restaurant' });
    expect(photo).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    expect(photo).toHaveClass('w-full', 'h-full', 'object-cover');
  });

  it('handles photo loading error gracefully', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    const photo = screen.getByRole('img', { name: 'Test Restaurant' });
    
    // Simulate image load error
    fireEvent.error(photo);

    // Image should be hidden after error
    expect(photo).toHaveStyle('display: none');
  });

  it('does not render photo section when no photos available', () => {
    const locationWithoutPhotos = { ...mockLocation, photos: undefined };
    render(<LocationInfoWindow location={locationWithoutPhotos} onGetDirections={jest.fn()} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('displays phone number when available', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
    
    // Phone number should be clickable link
    const phoneLink = screen.getByRole('link', { name: /555-0123/ });
    expect(phoneLink).toHaveAttribute('href', 'tel:+1-555-0123');
  });

  it('displays website link when available', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    const websiteLink = screen.getByRole('link', { name: /website/i });
    expect(websiteLink).toHaveAttribute('href', 'https://example.com');
    expect(websiteLink).toHaveAttribute('target', '_blank');
    expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('calls onGetDirections when directions button is clicked', () => {
    const onGetDirections = jest.fn();
    render(<LocationInfoWindow {...defaultProps} onGetDirections={onGetDirections} />);

    const directionsButton = screen.getByRole('button', { name: /directions/i });
    fireEvent.click(directionsButton);

    expect(onGetDirections).toHaveBeenCalledTimes(1);
    expect(onGetDirections).toHaveBeenCalledWith(mockLocation);
  });

  it('does not render directions button when onGetDirections is not provided', () => {
    render(<LocationInfoWindow location={mockLocation} />);

    expect(screen.queryByRole('button', { name: /directions/i })).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<LocationInfoWindow {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is not provided', () => {
    render(<LocationInfoWindow location={mockLocation} onGetDirections={jest.fn()} />);

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('handles location with minimal data', () => {
    const minimalLocation: Location = {
      id: '2',
      name: 'Minimal Location',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'attraction',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<LocationInfoWindow location={minimalLocation} />);

    expect(screen.getByText('Minimal Location')).toBeInTheDocument();
    expect(screen.queryByText(/\$+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles unknown location name', () => {
    const locationWithoutName = { ...mockLocation, name: undefined };
    render(<LocationInfoWindow location={locationWithoutName} />);

    expect(screen.getByText('Unknown Location')).toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    const container = screen.getByText('Test Restaurant').closest('.bg-white');
    expect(container).toHaveClass('bg-white', 'rounded-2xl', 'shadow-2xl', 'max-w-sm', 'w-80', 'overflow-hidden');
  });

  it('displays all action buttons when callbacks are provided', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    expect(screen.getByRole('button', { name: /directions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('handles empty photos array', () => {
    const locationWithEmptyPhotos = { ...mockLocation, photos: [] };
    render(<LocationInfoWindow location={locationWithEmptyPhotos} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('displays contact information icons correctly', () => {
    render(<LocationInfoWindow {...defaultProps} />);

    // Check for phone icon by looking for the parent div that contains both icon and link
    const phoneDiv = screen.getByText('+1-555-0123').closest('div');
    expect(phoneDiv?.querySelector('svg')).toBeInTheDocument();

    // Check for website icon
    const websiteDiv = screen.getByRole('link', { name: /website/i }).closest('div');
    expect(websiteDiv?.querySelector('svg')).toBeInTheDocument();
  });

  it('handles all price level scenarios', () => {
    const testCases = [
      { level: undefined, expected: '', color: 'text-gray-500' },
      { level: 1 as const, expected: '$', color: 'text-green-600' },
      { level: 2 as const, expected: '$$', color: 'text-yellow-600' },
      { level: 3 as const, expected: '$$$', color: 'text-orange-600' },
      { level: 4 as const, expected: '$$$$', color: 'text-red-600' },
    ];

    testCases.forEach(({ level, expected, color }) => {
      const testLocation = { ...mockLocation, priceLevel: level };
      const { unmount } = render(<LocationInfoWindow location={testLocation} />);
      
      if (expected) {
        const priceContainer = screen.getByText(expected).closest('div');
        expect(priceContainer).toHaveClass(color);
      } else {
        expect(screen.queryByText(/\$+/)).not.toBeInTheDocument();
      }
      
      unmount();
    });
  });
});
