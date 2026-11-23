import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Location } from '@/types/map';
import RichLocationPopup from './RichLocationPopup';

// Mock Next.js Image component
jest.mock('next/image', () => function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  });

const mockLocation: Location = {
  id: 'test-location-1',
  name: 'Eiffel Tower',
  latitude: 48.8584,
  longitude: 2.2945,
  type: 'attraction',
  // Rich data fields
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
    'https://example.com/photo3.jpg'
  ],
  rating: 4.6,
  userRatingsTotal: 142593,
  priceLevel: 2,
  phoneNumber: '+33 8 92 70 12 39',
  website: 'https://www.toureiffel.paris/en',
  vicinity: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris, France',
  placeId: 'ChIJLU7jZClu5kcR4PcOOO6p3I0',
  isOpen: true,
  openingHours: {
    isOpen: true,
    weekdayText: [
      'Monday: 9:30 AM – 11:45 PM',
      'Tuesday: 9:30 AM – 11:45 PM',
      'Wednesday: 9:30 AM – 11:45 PM',
      'Thursday: 9:30 AM – 11:45 PM',
      'Friday: 9:30 AM – 11:45 PM',
      'Saturday: 9:30 AM – 11:45 PM',
      'Sunday: 9:30 AM – 11:45 PM'
    ]
  }
};

const mockLocationMinimal: Location = {
  id: 'test-location-2',
  name: 'Simple Cafe',
  latitude: 48.8566,
  longitude: 2.3522,
  type: 'cafe'
  // No rich data - test graceful fallback
};

describe('RichLocationPopup', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  test('renders rich location data correctly', () => {
    render(
      <RichLocationPopup
        location={mockLocation}
        onClose={mockOnClose}
      />
    );

    // Check basic info
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
    expect(screen.getByText('Champ de Mars, 5 Av. Anatole France, 75007 Paris, France')).toBeInTheDocument();
    
    // Check rating
    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('(142,593 reviews)')).toBeInTheDocument();
    
    // Check popular badge
    expect(screen.getByText('Popular')).toBeInTheDocument();
    
    // Check contact info
    expect(screen.getByText('+33 8 92 70 12 39')).toBeInTheDocument();
    
    // Check photos
    const photos = screen.getAllByRole('img');
    expect(photos.length).toBeGreaterThan(0);
    
    // Check opening hours
    expect(screen.getByText('Open now')).toBeInTheDocument();
  });

  test('handles minimal location data gracefully', () => {
    render(
      <RichLocationPopup
        location={mockLocationMinimal}
        onClose={mockOnClose}
      />
    );

    // Should still render basic info
    expect(screen.getByText('Simple Cafe')).toBeInTheDocument();
    
    // Should not crash when optional fields are missing
    expect(() => screen.getByText('Popular')).toThrow();
  });

  test('photo carousel navigation works', () => {
    render(
      <RichLocationPopup
        location={mockLocation}
        onClose={mockOnClose}
      />
    );

    // Find navigation buttons
    const nextButton = screen.getByLabelText(/next photo/i);
    const prevButton = screen.getByLabelText(/previous photo/i);

    // Test navigation
    fireEvent.click(nextButton);
    fireEvent.click(prevButton);
    
    // Should not crash
    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeInTheDocument();
  });

  test('close button works', () => {
    render(
      <RichLocationPopup
        location={mockLocation}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('website and phone links work', () => {
    render(
      <RichLocationPopup
        location={mockLocation}
        onClose={mockOnClose}
      />
    );

    const websiteLink = screen.getByRole('link', { name: /visit website/i });
    const phoneLink = screen.getByRole('link', { name: /call/i });
    
    expect(websiteLink).toHaveAttribute('href', 'https://www.toureiffel.paris/en');
    expect(phoneLink).toHaveAttribute('href', 'tel:+33 8 92 70 12 39');
  });
});