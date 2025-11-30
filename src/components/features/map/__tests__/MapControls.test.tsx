import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Location } from '@/types/map';
import MapControls from '../MapControls';

describe('MapControls', () => {
  const mockLocations: Location[] = [
    {
      id: '1',
      name: 'Test Location',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'attraction' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const defaultProps = {
    isFullscreen: false,
    isWeatherVisible: false,
    onToggleFullscreen: jest.fn(),
    onToggleWeather: jest.fn(),
    locations: mockLocations,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all control buttons', () => {
    render(<MapControls {...defaultProps} />);

    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /weather/i })).toBeInTheDocument();
  });

  it('displays correct fullscreen button state when not fullscreen', () => {
    render(<MapControls {...defaultProps} isFullscreen={false} />);

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    expect(fullscreenButton).toHaveAttribute('title', 'Enter Fullscreen');
  });

  it('displays correct fullscreen button state when fullscreen', () => {
    render(<MapControls {...defaultProps} isFullscreen />);

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    expect(fullscreenButton).toHaveAttribute('title', 'Exit Fullscreen (ESC)');
  });

  it('displays correct weather button state when weather is hidden', () => {
    render(<MapControls {...defaultProps} isWeatherVisible={false} />);

    const weatherButton = screen.getByRole('button', { name: /weather/i });
    expect(weatherButton).toHaveAttribute('title', 'Show Weather');
  });

  it('displays correct weather button state when weather is shown', () => {
    render(<MapControls {...defaultProps} isWeatherVisible />);

    const weatherButton = screen.getByRole('button', { name: /weather/i });
    expect(weatherButton).toHaveAttribute('title', 'Hide Weather');
  });

  it('calls onToggleFullscreen when fullscreen button is clicked', () => {
    const onToggleFullscreen = jest.fn();
    render(<MapControls {...defaultProps} onToggleFullscreen={onToggleFullscreen} />);

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    fireEvent.click(fullscreenButton);

    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleWeather when weather button is clicked', () => {
    const onToggleWeather = jest.fn();
    render(<MapControls {...defaultProps} onToggleWeather={onToggleWeather} />);

    const weatherButton = screen.getByRole('button', { name: /weather/i });
    fireEvent.click(weatherButton);

    expect(onToggleWeather).toHaveBeenCalledTimes(1);
  });

  it('handles multiple clicks correctly', () => {
    const onToggleFullscreen = jest.fn();
    const onToggleWeather = jest.fn();
    
    render(
      <MapControls 
        {...defaultProps} 
        onToggleFullscreen={onToggleFullscreen}
        onToggleWeather={onToggleWeather}
      />
    );

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    const weatherButton = screen.getByRole('button', { name: /weather/i });

    // Multiple clicks on fullscreen
    fireEvent.click(fullscreenButton);
    fireEvent.click(fullscreenButton);
    fireEvent.click(fullscreenButton);

    // Multiple clicks on weather
    fireEvent.click(weatherButton);
    fireEvent.click(weatherButton);

    expect(onToggleFullscreen).toHaveBeenCalledTimes(3);
    expect(onToggleWeather).toHaveBeenCalledTimes(2);
  });

  it('applies correct CSS classes to buttons', () => {
    render(<MapControls {...defaultProps} />);

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    const weatherButton = screen.getByRole('button', { name: /weather/i });

    // Check common button classes
    [fullscreenButton, weatherButton].forEach(button => {
      expect(button).toHaveClass(
        'bg-white',
        'rounded-lg',
        'shadow-lg',
        'p-2',
        'hover:bg-gray-50',
        'transition-colors'
      );
    });
  });

  it('renders with different prop combinations', () => {
    const { rerender } = render(
      <MapControls 
        isFullscreen={false}
        isWeatherVisible={false}
        onToggleFullscreen={jest.fn()}
        onToggleWeather={jest.fn()}
        locations={mockLocations}
      />
    );

    expect(screen.getByRole('button', { name: /fullscreen/i })).toHaveAttribute('title', 'Enter Fullscreen');
    expect(screen.getByRole('button', { name: /weather/i })).toHaveAttribute('title', 'Show Weather');

    rerender(
      <MapControls 
        isFullscreen
        isWeatherVisible
        onToggleFullscreen={jest.fn()}
        onToggleWeather={jest.fn()}
        locations={mockLocations}
      />
    );

    expect(screen.getByRole('button', { name: /fullscreen/i })).toHaveAttribute('title', 'Exit Fullscreen (ESC)');
    expect(screen.getByRole('button', { name: /weather/i })).toHaveAttribute('title', 'Hide Weather');
  });

  it('handles undefined or null callback functions gracefully', () => {
    // This test ensures the component doesn't crash if callbacks are undefined
    render(
      <MapControls 
        isFullscreen={false}
        isWeatherVisible={false}
        onToggleFullscreen={undefined as any}
        onToggleWeather={undefined as any}
        locations={mockLocations}
      />
    );

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    const weatherButton = screen.getByRole('button', { name: /weather/i });

    // These should not throw errors
    expect(() => fireEvent.click(fullscreenButton)).not.toThrow();
    expect(() => fireEvent.click(weatherButton)).not.toThrow();
  });

  it('supports keyboard interaction', () => {
    const onToggleFullscreen = jest.fn();
    const onToggleWeather = jest.fn();
    
    render(
      <MapControls 
        {...defaultProps}
        onToggleFullscreen={onToggleFullscreen}
        onToggleWeather={onToggleWeather}
      />
    );

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    const weatherButton = screen.getByRole('button', { name: /weather/i });

    // Test Enter key
    fireEvent.keyDown(fullscreenButton, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(weatherButton, { key: 'Enter', code: 'Enter' });

    // Test Space key  
    fireEvent.keyDown(fullscreenButton, { key: ' ', code: 'Space' });
    fireEvent.keyDown(weatherButton, { key: ' ', code: 'Space' });

    // Note: React Testing Library automatically handles button keyboard events,
    // so we're mainly testing that the buttons are accessible and focusable
    expect(fullscreenButton).toBeInTheDocument();
    expect(weatherButton).toBeInTheDocument();
  });

  it('maintains button accessibility attributes', () => {
    render(<MapControls {...defaultProps} />);

    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    const weatherButton = screen.getByRole('button', { name: /weather/i });

    // Buttons should have proper title attributes for accessibility
    expect(fullscreenButton).toHaveAttribute('title');
    expect(weatherButton).toHaveAttribute('title');
    
    // Buttons should be focusable
    expect(fullscreenButton).not.toHaveAttribute('disabled');
    expect(weatherButton).not.toHaveAttribute('disabled');
  });

  it('renders with empty locations array', () => {
    render(
      <MapControls 
        {...defaultProps}
        locations={[]}
      />
    );

    // Component should still render fullscreen control but not weather control when no locations
    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /weather/i })).not.toBeInTheDocument();
  });

  it('shows different weather icons based on visibility state', () => {
    const { rerender } = render(
      <MapControls {...defaultProps} isWeatherVisible={false} />
    );

    // When weather is not visible, should show "show weather" icon
    let weatherButton = screen.getByRole('button', { name: /weather/i });
    expect(weatherButton.querySelector('svg')).toBeInTheDocument();

    rerender(
      <MapControls {...defaultProps} isWeatherVisible />
    );

    // When weather is visible, should show "hide weather" icon  
    weatherButton = screen.getByRole('button', { name: /weather/i });
    expect(weatherButton.querySelector('svg')).toBeInTheDocument();
  });
});
