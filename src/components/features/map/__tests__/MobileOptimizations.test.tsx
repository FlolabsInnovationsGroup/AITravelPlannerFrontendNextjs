import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileMapControls, MobileTravelQuickActions } from '../MobileOptimizations';

describe('MobileMapControls', () => {
  const mockOnFullscreen = jest.fn();
  const mockOnLocationMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mobile control buttons', () => {
    render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen={false}
      />
    );

    expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    expect(screen.getByLabelText('Center on my location')).toBeInTheDocument();
  });

  it('shows correct fullscreen button state when not fullscreen', () => {
    render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen={false}
      />
    );

    const fullscreenButton = screen.getByLabelText('Enter fullscreen');
    expect(fullscreenButton).toBeInTheDocument();
  });

  it('shows correct fullscreen button state when fullscreen', () => {
    render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen
      />
    );

    const exitFullscreenButton = screen.getByLabelText('Exit fullscreen');
    expect(exitFullscreenButton).toBeInTheDocument();
  });

  it('calls onFullscreen when fullscreen button is clicked', () => {
    render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen={false}
      />
    );

    const fullscreenButton = screen.getByLabelText('Enter fullscreen');
    fireEvent.click(fullscreenButton);

    expect(mockOnFullscreen).toHaveBeenCalledTimes(1);
  });

  it('calls onLocationMode when location button is clicked', () => {
    render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen={false}
      />
    );

    const locationButton = screen.getByLabelText('Center on my location');
    fireEvent.click(locationButton);

    expect(mockOnLocationMode).toHaveBeenCalledTimes(1);
  });

  it('applies correct CSS classes for mobile visibility', () => {
    const { container } = render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen={false}
      />
    );

    const controlsContainer = container.firstChild as HTMLElement;
    expect(controlsContainer).toHaveClass('md:hidden');
    expect(controlsContainer).toHaveClass('fixed');
    expect(controlsContainer).toHaveClass('bottom-4');
    expect(controlsContainer).toHaveClass('right-4');
  });

  it('applies active states correctly on button press', () => {
    render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen={false}
      />
    );

    const fullscreenButton = screen.getByLabelText('Enter fullscreen');
    const locationButton = screen.getByLabelText('Center on my location');

    expect(fullscreenButton).toHaveClass('active:bg-gray-100');
    expect(locationButton).toHaveClass('active:bg-blue-700');
  });

  it('renders different icons for fullscreen states', () => {
    const { rerender } = render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen={false}
      />
    );

    // Check expand icon is present when not fullscreen
    let fullscreenButton = screen.getByLabelText('Enter fullscreen');
    let svg = fullscreenButton.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');

    // Check close/exit icon when fullscreen
    rerender(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen
      />
    );

    fullscreenButton = screen.getByLabelText('Exit fullscreen');
    svg = fullscreenButton.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('maintains proper z-index for overlay positioning', () => {
    const { container } = render(
      <MobileMapControls
        onFullscreen={mockOnFullscreen}
        onLocationMode={mockOnLocationMode}
        isFullscreen={false}
      />
    );

    const controlsContainer = container.firstChild as HTMLElement;
    expect(controlsContainer).toHaveClass('z-20');
  });
});

describe('MobileTravelQuickActions', () => {
  const mockOnFindNearby = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all quick action buttons', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Hotels')).toBeInTheDocument();
    expect(screen.getByText('Sights')).toBeInTheDocument();
    expect(screen.getByText('Gas')).toBeInTheDocument();
  });

  it('displays correct icons for each action', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    expect(screen.getByText('🍽️')).toBeInTheDocument(); // Food
    expect(screen.getByText('🏨')).toBeInTheDocument(); // Hotels
    expect(screen.getByText('📸')).toBeInTheDocument(); // Sights
    expect(screen.getByText('⛽')).toBeInTheDocument(); // Gas
  });

  it('calls onFindNearby with correct type when food button is clicked', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    const foodButton = screen.getByText('Food').closest('button');
    fireEvent.click(foodButton!);

    expect(mockOnFindNearby).toHaveBeenCalledWith('restaurant');
  });

  it('calls onFindNearby with correct type when hotels button is clicked', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    const hotelsButton = screen.getByText('Hotels').closest('button');
    fireEvent.click(hotelsButton!);

    expect(mockOnFindNearby).toHaveBeenCalledWith('lodging');
  });

  it('calls onFindNearby with correct type when sights button is clicked', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    const sightsButton = screen.getByText('Sights').closest('button');
    fireEvent.click(sightsButton!);

    expect(mockOnFindNearby).toHaveBeenCalledWith('tourist_attraction');
  });

  it('calls onFindNearby with correct type when gas button is clicked', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    const gasButton = screen.getByText('Gas').closest('button');
    fireEvent.click(gasButton!);

    expect(mockOnFindNearby).toHaveBeenCalledWith('gas_station');
  });

  it('applies correct mobile-only visibility class', () => {
    const { container } = render(
      <MobileTravelQuickActions onFindNearby={mockOnFindNearby} />
    );

    const quickActionsContainer = container.firstChild as HTMLElement;
    expect(quickActionsContainer).toHaveClass('md:hidden');
  });

  it('applies grid layout for action buttons', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    // Find the grid container (the div containing all buttons)
    const foodButton = screen.getByText('Food').closest('button');
    const gridContainer = foodButton?.parentElement;
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('grid-cols-4');
  });

  it('applies active state styling to buttons', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    const foodButton = screen.getByText('Food').closest('button');
    expect(foodButton).toHaveClass('active:bg-gray-100');
  });

  it('maintains proper button structure with icon and label', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      // Each button should have flex column layout
      expect(button).toHaveClass('flex', 'flex-col', 'items-center');
      
      // Should contain both icon (emoji) and text label
      const children = Array.from(button.children);
      expect(children.length).toBe(2); // icon span + label span
    });
  });

  it('handles multiple rapid clicks correctly', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    const foodButton = screen.getByText('Food').closest('button');
    
    // Simulate rapid clicks
    fireEvent.click(foodButton!);
    fireEvent.click(foodButton!);
    fireEvent.click(foodButton!);

    expect(mockOnFindNearby).toHaveBeenCalledTimes(3);
    expect(mockOnFindNearby).toHaveBeenCalledWith('restaurant');
  });

  it('renders with proper semantic structure for accessibility', () => {
    render(<MobileTravelQuickActions onFindNearby={mockOnFindNearby} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);

    // Each button should be accessible and have meaningful text
    expect(screen.getByRole('button', { name: /food/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hotels/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sights/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gas/i })).toBeInTheDocument();
  });
});
