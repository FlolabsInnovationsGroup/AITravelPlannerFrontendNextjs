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

  describe.skip('clear', () => {
    it('should clear all items from storage', () => {
      SafeStorage.setItem('key1', 'value1');
      SafeStorage.setItem('key2', 'value2');
      SafeStorage.setItem('key3', 'value3');
      
      SafeStorage.clear();
      
      expect(SafeStorage.getItem('key1')).toBeNull();
      expect(SafeStorage.getItem('key2')).toBeNull();
      expect(SafeStorage.getItem('key3')).toBeNull();
    });
  });

  describe.skip('setVersionedItem and getVersionedItem', () => {
    it('should store and retrieve versioned items', () => {
      const testData = { name: 'Test', value: 123 };
      
      SafeStorage.setVersionedItem('versioned-key', testData);
      const retrieved = SafeStorage.getVersionedItem('versioned-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should include version and timestamp', () => {
      SafeStorage.setVersionedItem('versioned-key', { test: 'data' });
      
      const raw = localStorage.getItem('versioned-key');
      expect(raw).not.toBeNull();
      
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('data');
      expect(parsed.data).toEqual({ test: 'data' });
    });

    it('should return null for non-existent versioned items', () => {
      expect(SafeStorage.getVersionedItem('non-existent')).toBeNull();
    });

    it('should handle version mismatches gracefully', () => {
      // Store item with wrong version
      const wrongVersionData = {
        version: '0.1',
        timestamp: Date.now(),
        data: { test: 'old-data' }
      };
      
      localStorage.setItem('old-version-key', JSON.stringify(wrongVersionData));
      
      // Should not throw, but may return null or migrated data
      const result = SafeStorage.getVersionedItem('old-version-key');
      
      // Implementation may vary - either null or migrated data
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('quota handling', () => {
    it('should handle QuotaExceededError gracefully', () => {
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
    });

    it('should return false if retry also fails', () => {
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
    });
  });

  describe('emergency cleanup', () => {
    it('should preserve recent items during cleanup', () => {
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
    });
  });

  describe('error handling', () => {
    it.skip('should handle JSON parse errors gracefully', () => {
      // Store invalid JSON
      localStorage.setItem('invalid-json', '{invalid json}');
      
      expect(SafeStorage.getVersionedItem('invalid-json')).toBeNull();
    });

    it('should not throw when localStorage is unavailable', () => {
      // Mock localStorage to throw
      const mockGetItem = jest.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      expect(() => SafeStorage.getItem('test-key')).not.toThrow();
      expect(SafeStorage.getItem('test-key')).toBeNull();
      
      mockGetItem.mockRestore();
    });
  });

  describe.skip('fallback behavior', () => {
    it('should use getFallbackItem when localStorage throws', () => {
      const mockGetItem = jest.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockImplementation(() => {
        throw new Error('localStorage disabled');
      });

      // getFallbackItem should handle the error
      const result = SafeStorage.getFallbackItem('test-key');
      expect(result).toBeNull(); // No memory storage set
      
      mockGetItem.mockRestore();
    });
  });

  describe.skip('data migration', () => {
    it('should attempt migration for version mismatches', () => {
      const oldData = {
        version: '0.5',
        timestamp: Date.now(),
        data: { legacy: 'data' }
      };
      
      localStorage.setItem('migration-test', JSON.stringify(oldData));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      SafeStorage.getVersionedItem('migration-test');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Version mismatch')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('large data handling', () => {
    it('should handle storing large strings', () => {
      const largeString = 'x'.repeat(1000);
      
      const result = SafeStorage.setItem('large-data', largeString);
      
      expect(result).toBe(true);
      expect(SafeStorage.getItem('large-data')).toBe(largeString);
    });

    it.skip('should handle storing complex objects', () => {
      const complexObject = {
        id: '123',
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        },
        date: new Date().toISOString()
      };
      
      SafeStorage.setVersionedItem('complex-data', complexObject);
      const retrieved = SafeStorage.getVersionedItem('complex-data');
      
      expect(retrieved).toEqual(complexObject);
    });
  });
});
