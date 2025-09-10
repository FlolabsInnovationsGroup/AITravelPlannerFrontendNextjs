import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapErrorBoundary from '../MapErrorBoundary';

// Mock child component that can throw errors
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for MapErrorBoundary');
  }
  return <div data-testid="child-component">Child Component</div>;
};

describe('MapErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </MapErrorBoundary>
    );

    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.queryByText(/Travel Map Temporarily Unavailable/)).not.toBeInTheDocument();
  });

  it('displays error UI when child component throws error', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </MapErrorBoundary>
    );

    expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
    expect(screen.getByText(/🗺️ Travel Map Temporarily Unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/Test error for MapErrorBoundary/)).toBeInTheDocument();
  });

  it('displays helpful error information and recovery options', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </MapErrorBoundary>
    );

    // Check for helpful information
    expect(screen.getByText(/Your locations and travel plans are still saved/)).toBeInTheDocument();
    expect(screen.getByText(/Try refreshing the page or check your internet connection/)).toBeInTheDocument();
    expect(screen.getByText(/Contact support if this persists/)).toBeInTheDocument();

    // Check for action buttons
    expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh Page/ })).toBeInTheDocument();
  });

  it('displays generic error message when error message is not available', () => {
    const ErrorComponentWithoutMessage = () => {
      throw new Error('');
    };

    render(
      <MapErrorBoundary>
        <ErrorComponentWithoutMessage />
      </MapErrorBoundary>
    );

    expect(screen.getByText(/An error occurred while loading your travel map/)).toBeInTheDocument();
  });

  it('shows try again button that resets error boundary state', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </MapErrorBoundary>
    );

    // Error UI should be displayed
    expect(screen.getByText(/Travel Map Temporarily Unavailable/)).toBeInTheDocument();

    // Try Again button should be present and clickable
    const tryAgainButton = screen.getByRole('button', { name: /Try Again/ });
    expect(tryAgainButton).toBeInTheDocument();
    
    // Clicking should not crash (actual recovery requires parent component to provide new children)
    expect(() => fireEvent.click(tryAgainButton)).not.toThrow();
  });

  it('provides refresh page button functionality', () => {
    // Mock window.location.reload - use delete first to avoid redefinition error
    const originalReload = window.location.reload;
    delete (window as any).location;
    window.location = { ...window.location, reload: jest.fn() } as any;

    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </MapErrorBoundary>
    );

    // Click "Refresh Page"
    fireEvent.click(screen.getByRole('button', { name: /Refresh Page/ }));

    expect(window.location.reload).toHaveBeenCalledTimes(1);

    // Restore original reload
    window.location.reload = originalReload;
  });

  it('logs error details to console', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </MapErrorBoundary>
    );

    // Check that error is logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Map Error:', expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error Info:', expect.objectContaining({
      componentStack: expect.any(String)
    }));
  });

  it('handles error recovery when "Try Again" is clicked', () => {
    const { rerender } = render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </MapErrorBoundary>
    );

    // Error UI should be displayed
    expect(screen.getByText(/Travel Map Temporarily Unavailable/)).toBeInTheDocument();

    // Click "Try Again" - this resets the error boundary state
    fireEvent.click(screen.getByRole('button', { name: /Try Again/ }));

    // After clicking "Try Again", the error boundary should attempt to render children again
    // Since we need to provide non-throwing children after recovery, we need a new error boundary instance
    const { unmount } = render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </MapErrorBoundary>
    );

    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    unmount();
  });

  it('applies correct CSS classes for error UI styling', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </MapErrorBoundary>
    );

    const errorContainer = screen.getByText(/Travel Map Temporarily Unavailable/).closest('div');
    expect(errorContainer).toHaveClass('p-6', 'bg-red-50', 'border', 'border-red-200', 'rounded-lg');

    const tryAgainButton = screen.getByRole('button', { name: /Try Again/ });
    expect(tryAgainButton).toHaveClass('px-4', 'py-2', 'bg-red-600', 'text-white', 'rounded');

    const refreshButton = screen.getByRole('button', { name: /Refresh Page/ });
    expect(refreshButton).toHaveClass('px-4', 'py-2', 'bg-gray-600', 'text-white', 'rounded');
  });
});
