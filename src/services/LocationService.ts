import { Location } from '@/types/map';
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { serviceConfig } from '@/config/service.config';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
const { maxRetries, initialDelay } = serviceConfig.api.retryConfig;

interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    shouldRetry: (error: AxiosError) => boolean;
}

class LocationServiceError extends Error {
    constructor(
        message: string,
        public readonly originalError?: Error,
        public readonly statusCode?: number
    ) {
        super(message);
        this.name = 'LocationServiceError';
    }
}

export class LocationService {
    private static instance: LocationService;
    private readonly apiClient: AxiosInstance;
    private readonly retryConfig: RetryConfig;

    private constructor() {
        this.apiClient = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 seconds
        });

        this.retryConfig = {
            maxRetries,
            initialDelay,
            shouldRetry: (error: AxiosError) => {
                // Retry on network errors or 5xx server errors
                if (!error.response) return true;
                const { status } = error.response;
                return status >= 500 && status < 600;
            }
        };

        // Add response interceptor for logging
        this.apiClient.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                this.logError(error);
                return Promise.reject(error);
            }
        );
    }

    private logError(error: AxiosError): void {
        const status = error.response?.status;
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        console.error(
            `❌ [${method}] ${url} failed with status ${status}:`,
            error.message
        );
    }

    private async executeWithRetry<T>(
        operation: () => Promise<AxiosResponse<T>>,
        retryAttempt = 0
    ): Promise<T> {
        try {
            const response = await operation();
            return response.data;
        } catch (error) {
            if (!(error instanceof AxiosError)) {
                throw new LocationServiceError(
                    'Unknown error occurred',
                    error instanceof Error ? error : new Error(String(error))
                );
            }

            if (
                retryAttempt < this.retryConfig.maxRetries &&
                this.retryConfig.shouldRetry(error)
            ) {
                const delay = this.retryConfig.initialDelay * Math.pow(2, retryAttempt);
                console.log(`🔄 Retrying request (${retryAttempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.executeWithRetry(operation, retryAttempt + 1);
            }

            throw new LocationServiceError(
                this.getErrorMessage(error),
                error,
                error.response?.status
            );
        }
    }

    private getErrorMessage(error: AxiosError): string {
        if (!error.response) {
            return 'Network error occurred. Please check your connection.';
        }

        switch (error.response.status) {
            case 400:
                return 'Invalid request. Please check your input.';
            case 401:
                return 'Authentication required. Please log in.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 429:
                return 'Too many requests. Please try again later.';
            case 500:
                return 'Server error occurred. Please try again later.';
            default:
                return `An error occurred (${error.response.status}). Please try again.`;
        }
    }

    public static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    public async addLocation(location: Omit<Location, 'id'>, sessionId: string): Promise<Location> {
        console.log('📍 Adding location:', { location, sessionId });
        const locationData = {
            ...location,
            sessionId: sessionId
        };
        console.log('📤 Sending location data:', locationData);
        
        const result = await this.executeWithRetry(() => 
            this.apiClient.post<Location>('/api/locations/add', locationData)
        );
        
        console.log('✅ Location added successfully:', result);
        return result;
    }

    public async removeLocation(locationId: string): Promise<void> {
        console.log('🗑️ Removing location:', locationId);
        await this.executeWithRetry(() =>
            this.apiClient.delete(`/api/locations/remove/${locationId}`)
        );
        console.log('✅ Location removed successfully');
    }

    public async clearLocations(sessionId: string): Promise<void> {
        console.log('🧹 Clearing locations for session:', sessionId);
        await this.executeWithRetry(() =>
            this.apiClient.delete(`/api/locations/clear/${sessionId}`)
        );
        console.log('✅ Locations cleared successfully');
    }

    public async getLocations(sessionId: string): Promise<Location[]> {
        console.log('📍 Fetching locations for session:', sessionId);
        const result = await this.executeWithRetry(() =>
            this.apiClient.get<Location[]>(`/api/locations/${sessionId}`)
        );
        console.log('✅ Locations fetched successfully:', result);
        return result;
    }
}
