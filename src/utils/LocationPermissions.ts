/**
 * Mobile location permission utility
 * Handles geolocation permissions gracefully on mobile devices
 */

export interface LocationPermissionResult {
  granted: boolean;
  position?: GeolocationPosition;
  error?: string;
}

export class LocationPermissionManager {
  private static instance: LocationPermissionManager;
  
  public static getInstance(): LocationPermissionManager {
    if (!LocationPermissionManager.instance) {
      LocationPermissionManager.instance = new LocationPermissionManager();
    }
    return LocationPermissionManager.instance;
  }

  /**
   * Request location permission with user-friendly messaging
   */
  public async requestLocationPermission(): Promise<LocationPermissionResult> {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      return {
        granted: false,
        error: 'Geolocation is not supported by this browser'
      };
    }

    // Check current permission status
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'denied') {
          return {
            granted: false,
            error: 'Location access denied. Please enable location services in your browser settings.'
          };
        }
      } catch (e) {
        console.log('Permission API not fully supported, continuing with fallback');
      }
    }

    // Request location with timeout and proper error handling
    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: false, // Use less battery on mobile
        timeout: 10000, // 10 second timeout
        maximumAge: 300000 // Cache for 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            granted: true,
            position: position
          });
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. You can still search for places manually.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. You can still search for places manually.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. You can still search for places manually.';
              break;
          }

          resolve({
            granted: false,
            error: errorMessage
          });
        },
        options
      );
    });
  }

  /**
   * Check if user has previously granted location permission
   */
  public async hasLocationPermission(): Promise<boolean> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state === 'granted';
      } catch (e) {
        return false;
      }
    }
    return false;
  }
}