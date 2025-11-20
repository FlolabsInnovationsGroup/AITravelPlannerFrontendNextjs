import { useState, useCallback } from 'react';
import axios from 'axios';
import { getToken } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

interface RouteInfo {
  origin: string;
  destination: string;
  totalDistance: string;
  totalDuration: string;
  steps: DirectionStep[];
  warnings?: string[];
  summary?: string;
}

interface UseDirectionsResult {
  routeInfo: RouteInfo | null;
  isLoading: boolean;
  error: string | null;
  fetchDirections: (origin: string, destination: string, mode?: string) => Promise<void>;
  clearDirections: () => void;
}

export const useDirections = (): UseDirectionsResult => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDirections = useCallback(async (
    origin: string, 
    destination: string, 
    mode: string = 'driving'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await axios.post(`${API_BASE_URL}/api/directions`, {
        origin,
        destination,
        mode
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];

        const steps: DirectionStep[] = leg.steps.map((step: any) => ({
          instruction: step.html_instructions || step.instructions,
          distance: step.distance?.text || '',
          duration: step.duration?.text || '',
          maneuver: step.maneuver
        }));

        setRouteInfo({
          origin: leg.start_address,
          destination: leg.end_address,
          totalDistance: leg.distance?.text || '',
          totalDuration: leg.duration?.text || '',
          steps,
          warnings: route.warnings,
          summary: route.summary
        });
      } else {
        setError('No route found');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch directions';
      setError(errorMessage);
      setRouteInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearDirections = useCallback(() => {
    setRouteInfo(null);
    setError(null);
  }, []);

  return {
    routeInfo,
    isLoading,
    error,
    fetchDirections,
    clearDirections
  };
};
