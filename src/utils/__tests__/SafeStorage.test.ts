import { SafeStorage } from '../SafeStorage';

describe('SafeStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('setItem and getItem', () => {
    it('should store and retrieve items', () => {
      const result = SafeStorage.setItem('test-key', 'test-value');
      
      expect(result).toBe(true);
      expect(SafeStorage.getItem('test-key')).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      expect(SafeStorage.getItem('non-existent')).toBeNull();
    });

    it('should overwrite existing values', () => {
      SafeStorage.setItem('test-key', 'value1');
      SafeStorage.setItem('test-key', 'value2');
      
      expect(SafeStorage.getItem('test-key')).toBe('value2');
    });
  });

  describe('removeItem', () => {
    it('should remove items from storage', () => {
      SafeStorage.setItem('test-key', 'test-value');
      expect(SafeStorage.getItem('test-key')).toBe('test-value');
      
      SafeStorage.removeItem('test-key');
      expect(SafeStorage.getItem('test-key')).toBeNull();
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => SafeStorage.removeItem('non-existent')).not.toThrow();
    });
  });

  describe('quota handling', () => {
    it('should handle QuotaExceededError gracefully', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Mock localStorage.setItem to throw QuotaExceededError
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
      let callCount = 0;
      
      mockSetItem.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        // Second call succeeds (after cleanup)
        return;
      });

      const result = SafeStorage.setItem('test-key', 'test-value');
      
      // Should succeed after cleanup and retry
      expect(result).toBe(true);
      expect(callCount).toBe(2); // First fails, second succeeds after cleanup
      mockSetItem.mockRestore();
      warnSpy.mockRestore();
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should return false if retry also fails', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Mock localStorage.setItem to always throw QuotaExceededError
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
      mockSetItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = SafeStorage.setItem('test-key', 'test-value');
      expect(result).toBe(false);
      mockSetItem.mockRestore();
      warnSpy.mockRestore();
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('emergency cleanup', () => {
    it('should preserve recent items during cleanup', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Create many old sessions
      for (let i = 0; i < 20; i++) {
        localStorage.setItem(`chat_session_old_${i}`, JSON.stringify({ data: `old-${i}` }));
      }
      
      // Create recent sessions
      localStorage.setItem('chat_session_recent_1', JSON.stringify({ data: 'recent-1' }));
      localStorage.setItem('chat_session_recent_2', JSON.stringify({ data: 'recent-2' }));
      
      // Trigger quota error to force cleanup
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
      let callCount = 0;
      
      mockSetItem.mockImplementation((key, value) => {
        callCount++;
        if (callCount === 1) {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        // Allow subsequent calls
        localStorage.setItem(key, value);
      });

      SafeStorage.setItem('new-item', 'new-value');
      
      // Recent items should still exist
      expect(localStorage.getItem('chat_session_recent_1')).not.toBeNull();
      expect(localStorage.getItem('chat_session_recent_2')).not.toBeNull();
      mockSetItem.mockRestore();
      warnSpy.mockRestore();
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should not throw when localStorage is unavailable', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Mock localStorage to throw
      const mockGetItem = jest.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      expect(() => SafeStorage.getItem('test-key')).not.toThrow();
      expect(SafeStorage.getItem('test-key')).toBeNull();
      mockGetItem.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('large data handling', () => {
    it('should handle storing large strings', () => {
      const largeString = 'x'.repeat(1000);
      
      const result = SafeStorage.setItem('large-data', largeString);
      
      expect(result).toBe(true);
      expect(SafeStorage.getItem('large-data')).toBe(largeString);
    });

  });
});
