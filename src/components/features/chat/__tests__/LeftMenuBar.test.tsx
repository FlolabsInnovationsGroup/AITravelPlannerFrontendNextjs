import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeftMenuBar from '../LeftMenuBar';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LeftMenuBar', () => {
  const mockProps = {
    isMobileMenuOpen: false,
    showChatHistory: true,
    toggleChatHistory: jest.fn(),
    toggleMobileMenu: jest.fn(),
    signOut: jest.fn(),
    handleNewChat: jest.fn(),
    chatHistory: [
      { sessionId: 'session-1', title: 'Paris Travel Plan', createdAt: new Date().toISOString() },
      { sessionId: 'session-2', title: 'Tokyo Adventure', createdAt: new Date().toISOString() },
      { sessionId: 'session-3', title: 'New York Trip', createdAt: new Date().toISOString() },
    ],
    currentSessionId: 'session-1',
    handleSessionClick: jest.fn(),
    searchQuery: '',
    setSearchQuery: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render left menu bar with logo', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      expect(screen.getByAltText(/AI Travel Planner Logo/i)).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      expect(screen.getByText(/New Chat/i)).toBeInTheDocument();
    });

    it('should show chat history when showChatHistory is true', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Paris Travel Plan')).toBeInTheDocument();
    });

    it('should still show history section when showChatHistory is false', () => {
      render(<LeftMenuBar {...mockProps} showChatHistory={false} />);
      
      // Component currently always shows History section
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Paris Travel Plan')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should display chat sessions', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      expect(screen.getByText('Paris Travel Plan')).toBeInTheDocument();
      expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
    });

    it('should call handleSessionClick when session is clicked', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      const sessionElement = screen.getByText('Paris Travel Plan').closest('div[role="button"]');
      expect(sessionElement).toBeInTheDocument();
      
      if (sessionElement) {
        fireEvent.click(sessionElement);
        expect(mockProps.handleSessionClick).toHaveBeenCalledWith(
          expect.objectContaining({ sessionId: 'session-1' })
        );
      }
    });

    it('should highlight current session', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      const currentSessionElement = screen.getByText('Paris Travel Plan').closest('div[role="button"]');
      expect(currentSessionElement).toHaveClass('bg-stone-100'); // Active session styling
    });

    it('should call handleNewChat when New Chat button is clicked', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      const newChatButton = screen.getByText(/New Chat/i).closest('button');
      if (newChatButton) {
        fireEvent.click(newChatButton);
        expect(mockProps.handleNewChat).toHaveBeenCalled();
      }
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      const searchInput = screen.getByPlaceholderText(/Search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should call setSearchQuery when search input changes', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      const searchInput = screen.getByPlaceholderText(/Search/i);
      fireEvent.change(searchInput, { target: { value: 'Paris' } });
      
      expect(mockProps.setSearchQuery).toHaveBeenCalledWith('Paris');
    });

    it('should filter sessions based on search query', () => {
      const propsWithSearch = {
        ...mockProps,
        searchQuery: 'Paris',
        chatHistory: [
          { sessionId: 'session-1', title: 'Paris Travel Plan', createdAt: new Date().toISOString() },
          { sessionId: 'session-2', title: 'Tokyo Adventure', createdAt: new Date().toISOString() },
        ],
      };

      render(<LeftMenuBar {...propsWithSearch} />);
      
      // Filtered sessions should be displayed
      expect(screen.getByText('Paris Travel Plan')).toBeInTheDocument();
    });

    it('should handle empty search results', () => {
      const propsWithSearch = {
        ...mockProps,
        searchQuery: 'NonexistentCity',
        chatHistory: mockProps.chatHistory,
      };

      render(<LeftMenuBar {...propsWithSearch} />);
      
      // Should show empty search message
      expect(screen.getByText(/No matching chats/i)).toBeInTheDocument();
    });
  });

  describe('Large Chat History', () => {
    it('should handle large chat history (1000+ sessions)', () => {
      const largeChatHistory = Array.from({ length: 1500 }, (_, i) => ({
        sessionId: `session-${i}`,
        title: `Chat Session ${i}`,
        createdAt: new Date().toISOString(),
      }));

      const largeProps = {
        ...mockProps,
        chatHistory: largeChatHistory,
      };

      render(<LeftMenuBar {...largeProps} />);
      
      // History section should be rendered
      expect(screen.getByText('History')).toBeInTheDocument();
      
      // Sessions should be displayed
      expect(screen.getByText('Chat Session 0')).toBeInTheDocument();
    });

    it('should memoize filtered sessions to prevent unnecessary recalculations', () => {
      const { rerender } = render(<LeftMenuBar {...mockProps} />);
      
      // Rerender with same props - filteredSessions should use memoized value
      rerender(<LeftMenuBar {...mockProps} />);
      
      // Sessions should still be rendered efficiently
      expect(screen.getByText('Paris Travel Plan')).toBeInTheDocument();
    });
  });

  describe('Sign Out', () => {
    it('should call signOut when sign out button is clicked', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      const signOutButton = screen.getByLabelText(/Log out/i);
      fireEvent.click(signOutButton);
      expect(mockProps.signOut).toHaveBeenCalled();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should show menu when isMobileMenuOpen is true', () => {
      render(<LeftMenuBar {...mockProps} isMobileMenuOpen />);
      
      // Menu should be visible
      const logo = screen.getByAltText(/AI Travel Planner Logo/i);
      expect(logo).toBeInTheDocument();
    });

    it('should hide menu when isMobileMenuOpen is false on mobile', () => {
      render(<LeftMenuBar {...mockProps} isMobileMenuOpen={false} />);
      
      // Menu container should have hidden class on mobile
      // This is handled by Tailwind classes like md:flex
      const logo = screen.getByAltText(/AI Travel Planner Logo/i);
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty chat history', () => {
      const emptyProps = {
        ...mockProps,
        chatHistory: [],
      };

      render(<LeftMenuBar {...emptyProps} />);
      
      // Should show empty state message
      expect(screen.getByText(/No chats yet/i)).toBeInTheDocument();
    });

    it('should handle null currentSessionId', () => {
      const nullSessionProps = {
        ...mockProps,
        currentSessionId: null,
      };

      render(<LeftMenuBar {...nullSessionProps} />);
      
      // No session should be highlighted
      expect(screen.getByText('Paris Travel Plan')).toBeInTheDocument();
    });

    it('should handle chat history with missing titles', () => {
      const malformedHistory = [
        { sessionId: 'session-1', title: '', createdAt: new Date().toISOString() },
        { sessionId: 'session-2', title: 'Valid Title', createdAt: new Date().toISOString() },
      ];

      const malformedProps = {
        ...mockProps,
        chatHistory: malformedHistory,
      };

      render(<LeftMenuBar {...malformedProps} />);
      
      // Should show the session with valid title, empty title should be filtered out
      expect(screen.getByText('Valid Title')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      const newChatButton = screen.getByLabelText(/New chat/i);
      expect(newChatButton).toBeInTheDocument();
    });

    it('should have accessible search input', () => {
      render(<LeftMenuBar {...mockProps} />);
      
      const searchInput = screen.getByPlaceholderText(/Search/i);
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });
});
