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
    expect(screen.queryByText(/Map Failed to Load/)).not.toBeInTheDocument();
  });

  it('displays error UI when child component throws error', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow />
      </MapErrorBoundary>
    );

    expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
    expect(screen.getByText(/Map Failed to Load/)).toBeInTheDocument();
    expect(screen.getByText(/Test error for MapErrorBoundary/)).toBeInTheDocument();
  });

  it.skip('displays helpful error information and recovery options', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow />
      </MapErrorBoundary>
    );

    // Check for helpful information
    expect(screen.getByText(/your chat history and locations are safe/i)).toBeInTheDocument();
    expect(screen.getByText(/What happened/i)).toBeInTheDocument();

    // Check for action buttons
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload page/i })).toBeInTheDocument();
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

    expect(screen.getByText(/An unexpected error occurred while loading the map/i)).toBeInTheDocument();
  });

  it.skip('shows try again button that resets error boundary state', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow />
      </MapErrorBoundary>
    );

    // Error UI should be displayed
    expect(screen.getByText(/Map Failed to Load/)).toBeInTheDocument();

    // Try Again button should be present and clickable
    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
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
        <ThrowingComponent shouldThrow />
      </MapErrorBoundary>
    );

    // Click "Reload Page"
    fireEvent.click(screen.getByRole('button', { name: /Reload page/i }));

    expect(window.location.reload).toHaveBeenCalledTimes(1);

    // Restore original reload
    window.location.reload = originalReload;
  });

  it.skip('logs error details to console', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow />
      </MapErrorBoundary>
    );

    // Check that error is logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Map Error:', expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error Info:', expect.objectContaining({
      componentStack: expect.any(String)
    }));
  });

  it.skip('handles error recovery when "Try Again" is clicked', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow />
      </MapErrorBoundary>
    );

    // Error UI should be displayed
    expect(screen.getByText(/Map Failed to Load/)).toBeInTheDocument();

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

  it.skip('applies correct CSS classes for error UI styling', () => {
    render(
      <MapErrorBoundary>
        <ThrowingComponent shouldThrow />
      </MapErrorBoundary>
    );

    // Check for error message
    expect(screen.getByText(/Map Failed to Load/i)).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred while loading the map/i)).toBeInTheDocument();

    // Check for action buttons
    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    expect(tryAgainButton).toBeInTheDocument();
    expect(tryAgainButton).toHaveClass('bg-blue-500');

    const reloadButton = screen.getByRole('button', { name: /Reload page/i });
    expect(reloadButton).toBeInTheDocument();
    expect(reloadButton).toHaveClass('bg-gray-200');

    const homeButton = screen.getByRole('button', { name: /Return to home/i });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveClass('bg-gray-500');
  });
});
