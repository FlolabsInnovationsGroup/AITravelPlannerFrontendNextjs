import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';

interface SearchBoxProps {
    onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
    placeholder?: string;
    onError?: (error: string) => void;
    onLoadingChange?: (isLoading: boolean) => void;
    map?: google.maps.Map | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const SearchBox: React.FC<SearchBoxProps> = ({ 
    onPlaceSelected, 
    placeholder = "Search locations...",
    onError,
    onLoadingChange 
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);

    const handleError = useCallback((errorMessage: string) => {
        setError(errorMessage);
        onError?.(errorMessage);
    }, [onError]);

    const handleLoadingChange = useCallback((loading: boolean) => {
        setIsLoading(loading);
        onLoadingChange?.(loading);
    }, [onLoadingChange]);

    const initializeAutocomplete = useCallback(async (retryAttempt = 0) => {
        if (retryAttempt >= MAX_RETRIES) {
            handleError('Failed to initialize location search after multiple attempts');
            return;
        }

        if (!window.google?.maps?.places) {
            console.error('Google Maps Places API not loaded, retrying...');
            setTimeout(() => initializeAutocomplete(retryAttempt + 1), RETRY_DELAY * (retryAttempt + 1));
            return;
        }

        if (inputRef.current && !autocompleteRef.current) {
            try {
                setError(null);
                handleLoadingChange(true);

                const options: google.maps.places.AutocompleteOptions = {
                    fields: ['name', 'geometry', 'types', 'formatted_address', 'place_id'],
                    strictBounds: false,
                    types: ['geocode', 'establishment'],
                };

                autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options);

                autocompleteRef.current.addListener('place_changed', () => {
                    handleLoadingChange(true);
                    try {
                        const place = autocompleteRef.current?.getPlace();
                        if (place?.geometry) {
                            onPlaceSelected(place);
                            setError(null);
                        } else {
                            throw new Error('No location details available');
                        }
                    } catch (error) {
                        handleError(error instanceof Error ? error.message : 'Failed to get place details');
                    } finally {
                        handleLoadingChange(false);
                    }
                });

                // Add prediction_changed listener for suggestions
                const sessionToken = new google.maps.places.AutocompleteSessionToken();
                const service = new google.maps.places.AutocompleteService();

                const debouncedFetchPredictions = debounce((input: string) => {
                    if (input.length < 3) return;
                    
                    service.getPlacePredictions({
                        input,
                        sessionToken,
                    }, (predictions, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            setSuggestions(predictions);
                        } else {
                            setSuggestions([]);
                            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS && input.length > 2) {
                                handleError('No matching locations found');
                            }
                        }
                    });
                }, 300);

                inputRef.current.addEventListener('input', (e) => {
                    const value = (e.target as HTMLInputElement).value;
                    debouncedFetchPredictions(value);
                    // Clear error when user starts typing again
                    if (error) setError(null);
                });

                handleLoadingChange(false);
                setRetryCount(0);
            } catch (error) {
                console.error('Error initializing autocomplete:', error);
                handleError('Failed to initialize location search');
                setTimeout(() => initializeAutocomplete(retryAttempt + 1), RETRY_DELAY * (retryAttempt + 1));
            }
        }
    }, [handleError, handleLoadingChange, onPlaceSelected]);

    // Initialize autocomplete on mount
    useEffect(() => {
        initializeAutocomplete();

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [initializeAutocomplete]);

    return (
        <div className="absolute top-4 left-4 z-10 w-96 max-w-[calc(100%-2rem)]">
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    className={`
                        w-full 
                        bg-white/90 
                        backdrop-blur-sm 
                        shadow-lg 
                        transition-all 
                        duration-200
                        ${isLoading ? 'pr-10' : ''} 
                        ${error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary'}
                    `}
                    disabled={isLoading}
                    aria-label="Location search"
                    aria-describedby={error ? "search-error" : undefined}
                />
                
                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                    </div>
                )}

                {/* Retry indicator when retrying */}
                {retryCount > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-xs text-gray-500">
                        Retrying... ({retryCount}/{MAX_RETRIES})
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div 
                    id="search-error"
                    role="alert"
                    className="mt-1 text-sm text-red-500 bg-white/90 backdrop-blur-sm p-2 rounded border border-red-200"
                >
                    <span className="font-medium">Error:</span> {error}
                </div>
            )}

            {/* Suggestions dropdown */}
            <div className={`
                mt-1 
                transition-all 
                duration-200 
                ease-in-out 
                ${suggestions.length > 0 && !error && !isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
            `}>
                <div className="bg-white shadow-lg rounded-md overflow-hidden backdrop-blur-sm bg-white/90">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.place_id}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 ease-in-out"
                            onClick={() => {
                                if (inputRef.current) {
                                    inputRef.current.value = suggestion.description;
                                    setSuggestions([]);
                                    // Trigger the place selection
                                    if (autocompleteRef.current) {
                                        google.maps.event.trigger(autocompleteRef.current, 'place_changed');
                                    }
                                }
                            }}
                        >
                            <p className="text-sm text-gray-900 font-medium">{suggestion.structured_formatting?.main_text}</p>
                            <p className="text-xs text-gray-500">{suggestion.structured_formatting?.secondary_text}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchBox;
