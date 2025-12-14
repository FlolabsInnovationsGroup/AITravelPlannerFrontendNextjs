/**
 * 🔒 FIX 5.1: Safe localStorage wrapper with quota error handling
 * Prevents app crashes when localStorage is full (5-10MB limit)
 */

export class SafeStorage {
  private static STORAGE_VERSION = '1.0.0';

  private static VERSION_KEY = 'app_storage_version';
  
  /**
   * Safely set item in localStorage with quota error handling
   */
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      // QuotaExceededError
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('⚠️ localStorage quota exceeded. Attempting cleanup...');
        
        // Try to free up space by removing old data
        this.performEmergencyCleanup();
        
        // Retry once after cleanup
        try {
          localStorage.setItem(key, value);
          console.log('✅ Successfully saved after cleanup');
          return true;
        } catch (retryError) {
          console.error('❌ localStorage quota exceeded even after cleanup');
          
          // Show user-friendly error
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('storage-quota-exceeded', {
              detail: { key, size: value.length }
            });
            window.dispatchEvent(event);
          }
          
          return false;
        }
      }
      
      // Other localStorage errors (disabled, security, etc.)
      console.error('localStorage error:', error);
      return false;
    }
  }
  
  /**
   * Safely get item from localStorage
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Safely remove item from localStorage
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
  
  /**
   * 🔒 FIX 5.1: Emergency cleanup when quota exceeded
   */
  private static performEmergencyCleanup(): void {
    try {
      // Remove performance metrics (non-critical data)
      localStorage.removeItem('performance_metrics');
      
      // Clean up old rate limit data
      const keysToCheck = Object.keys(localStorage);
      keysToCheck.forEach(key => {
        if (key.startsWith('rate_limit_') || key.startsWith('guest_token_rate_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              // Remove rate limit data older than 1 hour
              if (parsed.timestamp && Date.now() - parsed.timestamp > 3600000) {
                localStorage.removeItem(key);
              }
            } catch {
              // Invalid data, remove it
              localStorage.removeItem(key);
            }
          }
        }
      });
      
      console.log('🧹 Emergency cleanup completed');
    } catch (error) {
      console.error('Error during emergency cleanup:', error);
    }
  }
  
  /**
   * 🔒 FIX 5.3: Check and migrate storage version
   */
  static checkAndMigrate(): void {
    try {
      const currentVersion = localStorage.getItem(this.VERSION_KEY);
      
      if (!currentVersion) {
        // First time user or fresh install
        localStorage.setItem(this.VERSION_KEY, this.STORAGE_VERSION);
        return;
      }
      
      if (currentVersion !== this.STORAGE_VERSION) {
        console.log(`📦 Migrating storage from ${currentVersion} to ${this.STORAGE_VERSION}`);
        this.migrateData(currentVersion, this.STORAGE_VERSION);
        localStorage.setItem(this.VERSION_KEY, this.STORAGE_VERSION);
      }
    } catch (error) {
      console.error('Error checking storage version:', error);
    }
  }
  
  /**
   * 🔒 FIX 5.3: Data migration logic for breaking changes
   */
  private static migrateData(fromVersion: string, toVersion: string): void {
    // Example migration logic
    if (fromVersion < '1.0.0' && toVersion >= '1.0.0') {
      // Migration from pre-1.0 to 1.0
      // Add migration logic here when needed
      console.log('No migrations needed for 1.0.0');
    }
    
    // Future migrations would go here
    // if (fromVersion < '2.0.0' && toVersion >= '2.0.0') { ... }
  }
  
  /**
   * Get current storage usage (approximate)
   */
  static getStorageSize(): number {
    let total = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        total += value.length + key.length;
      }
    });
    return total;
  }
  
  /**
   * Check if storage is approaching quota (>80% full, assuming 5MB limit)
   */
  static isStorageNearFull(): boolean {
    const size = this.getStorageSize();
    const ESTIMATED_QUOTA = 5 * 1024 * 1024; // 5MB
    return size > ESTIMATED_QUOTA * 0.8;
  }
}

// Initialize storage version check on import
if (typeof window !== 'undefined') {
  SafeStorage.checkAndMigrate();
}
