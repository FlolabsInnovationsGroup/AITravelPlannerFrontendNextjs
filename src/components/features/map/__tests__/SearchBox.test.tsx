import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBox from '../SearchBox';

// Mock the UI Input component
jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ ...props }, ref) => (
    <input ref={ref} {...props} />
  ))
}));

// Mock fetch for Geoapify API calls
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        features: [
          {
            properties: {
              place_id: 'test_place_1',
              name: 'Test Place',
              formatted: 'Test Place, Test City',
              lat: 40.7128,
              lon: -74.006,
              categories: ['tourism.attraction'],
              result_type: 'amenity',
            },
          },
        ],
      }),
  }),
) as jest.Mock;

global.fetch = mockFetch;

describe('SearchBox Component - Core Functionality', () => {
  const mockOnPlaceSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnPlaceSelected.mockClear();
    mockFetch.mockClear();
  });

  describe('Basic Rendering', () => {
    test('renders with required props', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    test('renders with custom placeholder', () => {
      const placeholder = 'Search for places...';
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} placeholder={placeholder} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', placeholder);
    });

    test('renders with default placeholder', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Search destinations, hotels, restaurants...');
    });

    test('has proper input type', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('Input Interactions', () => {
    test('handles text input', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New York' } });
      
      expect(input).toHaveValue('New York');
    });

    test('handles focus events', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      
      // Ensure the input is focusable and not disabled
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
      
      // Use user interaction instead of fireEvent for more realistic focus behavior
      input.focus();
      
      expect(input).toHaveFocus();
    });

    test('handles blur events', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      expect(document.activeElement).not.toBe(input);
    });

    test('handles keyboard events', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      const input = screen.getByRole('textbox');
      
      // Should not throw errors
      expect(() => {
        fireEvent.keyDown(input, { key: 'Enter' });
        fireEvent.keyDown(input, { key: 'Escape' });
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'ArrowUp' });
      }).not.toThrow();
    });

    test('handles empty input', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });
      
      expect(input).toHaveValue('');
    });
  });

  describe('Callback Props', () => {
    test('accepts onError callback', () => {
      const onError = jest.fn();
      
      expect(() => {
        render(<SearchBox onPlaceSelected={mockOnPlaceSelected} onError={onError} />);
      }).not.toThrow();
    });

    test('accepts onLoadingChange callback', () => {
      const onLoadingChange = jest.fn();
      
      expect(() => {
        render(<SearchBox onPlaceSelected={mockOnPlaceSelected} onLoadingChange={onLoadingChange} />);
      }).not.toThrow();
    });

    test('works with all callback props', () => {
      const onError = jest.fn();
      const onLoadingChange = jest.fn();
      
      expect(() => {
        render(
          <SearchBox 
            onPlaceSelected={mockOnPlaceSelected}
            onError={onError}
            onLoadingChange={onLoadingChange}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('handles special characters', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      const specialText = '123 Main St. #456 & Co. (NYC)';
      fireEvent.change(input, { target: { value: specialText } });
      
      expect(input).toHaveValue(specialText);
    });

    test('handles long text input', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      const longText = 'A very long address that might overflow the input field and cause issues if not handled properly';
      fireEvent.change(input, { target: { value: longText } });
      
      expect(input).toHaveValue(longText);
    });

    test('handles unicode characters', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      const unicodeText = 'Café Münchën 東京 🏢';
      fireEvent.change(input, { target: { value: unicodeText } });
      
      expect(input).toHaveValue(unicodeText);
    });

    test('handles rapid input changes', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      
      // Rapid typing simulation
      const textSequence = ['N', 'Ne', 'New', 'New ', 'New Y', 'New Yo', 'New Yor', 'New York'];
      textSequence.forEach(text => {
        fireEvent.change(input, { target: { value: text } });
      });
      
      expect(input).toHaveValue('New York');
    });

    test('handles cut/copy/paste operations', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      
      // Simulate paste operation
      fireEvent.change(input, { target: { value: 'Pasted Address' } });
      expect(input).toHaveValue('Pasted Address');
      
      // Simulate clearing
      fireEvent.change(input, { target: { value: '' } });
      expect(input).toHaveValue('');
    });
  });

  describe('Component Lifecycle', () => {
    test('mounts without errors', () => {
      expect(() => {
        render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      }).not.toThrow();
    });

    test('unmounts cleanly', () => {
      const { unmount } = render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('handles prop updates', () => {
      const { rerender } = render(
        <SearchBox onPlaceSelected={mockOnPlaceSelected} placeholder="Initial" />
      );
      
      rerender(
        <SearchBox onPlaceSelected={mockOnPlaceSelected} placeholder="Updated" />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Updated');
    });

    test('handles multiple re-renders', () => {
      const { rerender } = render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      // Multiple re-renders shouldn't cause errors
      for (let i = 0; i < 5; i += 1) {
        rerender(<SearchBox onPlaceSelected={mockOnPlaceSelected} key={i} />);
      }
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles fetch failures gracefully', () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      expect(() => {
        render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      }).not.toThrow();
    });

    test('handles invalid input gracefully', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      
      // Test various potentially problematic inputs
      const problematicInputs = [
        null,
        undefined,
        '',
        '   ',
        '<script>alert("test")</script>',
        'SELECT * FROM users;',
        '../../etc/passwd'
      ];
      
      problematicInputs.forEach(testInput => {
        expect(() => {
          fireEvent.change(input, { target: { value: testInput || '' } });
        }).not.toThrow();
      });
    });
  });

  describe('Performance', () => {
    test('handles rapid focus/blur cycles', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      
      // Rapid focus/blur cycles
      for (let i = 0; i < 10; i += 1) {
        fireEvent.focus(input);
        fireEvent.blur(input);
      }
      
      expect(input).toBeInTheDocument();
    });

    test('handles rapid typing without performance issues', () => {
      render(<SearchBox onPlaceSelected={mockOnPlaceSelected} />);
      
      const input = screen.getByRole('textbox');
      const start = Date.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 50; i += 1) {
        fireEvent.change(input, { target: { value: `test${i}` } });
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
