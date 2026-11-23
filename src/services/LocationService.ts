/* eslint-disable max-classes-per-file */
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

    // eslint-disable-next-line class-methods-use-this
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
                const delay = this.retryConfig.initialDelay * 2**retryAttempt;
                
                await new Promise(resolve => { setTimeout(resolve, delay); });
                return this.executeWithRetry(operation, retryAttempt + 1);
            }

            throw new LocationServiceError(
                this.getErrorMessage(error),
                error,
                error.response?.status
            );
        }
    }

    // eslint-disable-next-line class-methods-use-this
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
        const locationData = {
            ...location,
            sessionId
        };
        
        const result = await this.executeWithRetry(() => 
            this.apiClient.post<Location>('/api/locations/add', locationData)
        );
        
        return result;
    }

    public async removeLocation(locationId: string): Promise<void> {
        await this.executeWithRetry(() =>
            this.apiClient.delete(`/api/locations/remove/${locationId}`)
        );
    }

    public async clearLocations(sessionId: string): Promise<void> {
        await this.executeWithRetry(() =>
            this.apiClient.delete(`/api/locations/clear/${sessionId}`)
        );
    }

    public async getLocations(sessionId: string): Promise<Location[]> {
        const result = await this.executeWithRetry(() =>
            this.apiClient.get<Location[]>(`/api/locations/${sessionId}`)
        );
        return result;
    }
}
