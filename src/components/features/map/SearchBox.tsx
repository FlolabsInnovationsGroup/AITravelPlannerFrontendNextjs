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
    placeholder = "Search destinations, hotels, restaurants...",
    onError,
    onLoadingChange 
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showManualReset, setShowManualReset] = useState(false);

    const handleError = useCallback((errorMessage: string) => {
        setError(errorMessage);
        onError?.(errorMessage);
    }, [onError]);

    const handleLoadingChange = useCallback((loading: boolean) => {
        setIsLoading(loading);
        onLoadingChange?.(loading);
        
        if (!loading) {
            setShowManualReset(false);
        }
    }, [onLoadingChange]);

    // Show manual reset button after prolonged loading
    useEffect(() => {
        if (isLoading) {
            const resetTimeout = setTimeout(() => {
                setShowManualReset(true);
            }, 8000);
            return () => clearTimeout(resetTimeout);
        } else {
            setShowManualReset(false);
        }
    }, [isLoading]);

    const handleManualReset = useCallback(() => {
        setIsLoading(false);
        setShowManualReset(false);
        setError(null);
        setRetryCount(0);
        onLoadingChange?.(false);
        // Manual reset triggered by user
    }, [onLoadingChange]);

    const initializeAutocomplete = useCallback(async (retryAttempt = 0) => {
        if (retryAttempt >= MAX_RETRIES) {
            handleError('Failed to initialize location search after multiple attempts');
            handleLoadingChange(false); // Ensure loading stops on max retries
            return;
        }

        if (!window.google?.maps?.places) {
            console.error('Google Maps Places API not loaded, retrying...');
            setRetryCount(retryAttempt + 1);
            handleLoadingChange(false); // Reset loading state before retry
            setTimeout(() => {
                handleLoadingChange(true); // Set loading for retry
                initializeAutocomplete(retryAttempt + 1);
            }, RETRY_DELAY * (retryAttempt + 1));
            return;
        }

        if (inputRef.current && !autocompleteRef.current) {
            try {
                setError(null);
                handleLoadingChange(true);

                // Travel-optimized autocomplete options
                const options: google.maps.places.AutocompleteOptions = {
                    fields: [
                        'name', 'geometry', 'types', 'formatted_address', 'place_id',
                        'rating', 'user_ratings_total', 'price_level', 'opening_hours',
                        'photos', 'formatted_phone_number', 'website', 'vicinity'
                    ],
                    strictBounds: false,
                    types: ['geocode', 'establishment'], // Include both addresses and businesses
                    componentRestrictions: undefined, // Allow worldwide search for travel
                };

                autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options);

                autocompleteRef.current.addListener('place_changed', () => {
                    // Set timeout to prevent stuck loading states
                    const loadingTimeout = setTimeout(() => {
                        console.warn('Place selection timed out, resetting loading state');
                        handleLoadingChange(false);
                    }, 5000); // 5 second timeout

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
                        clearTimeout(loadingTimeout);
                        handleLoadingChange(false);
                    }
                });

                // Use new Places API for autocomplete suggestions
                const debouncedFetchPredictions = debounce(async (input: string) => {
                    if (input.length < 3) {
                        setSuggestions([]);
                        return;
                    }
                    
                    try {
                        // Use the new Places API AutocompleteSuggestion
                        if (window.google?.maps?.places?.AutocompleteSuggestion) {
                            const { suggestions: predictions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                                input,
                                sessionToken: new window.google.maps.places.AutocompleteSessionToken(),
                                includedPrimaryTypes: ['lodging', 'restaurant', 'tourist_attraction', 'establishment'],
                                includedRegionCodes: [], // Allow worldwide
                            });
                            
                            if (predictions && predictions.length > 0) {
                                // Convert new API format to match existing prediction format
                                const formattedPredictions = predictions.map((suggestion) => ({
                                    description: suggestion.placePrediction?.text?.text || '',
                                    place_id: suggestion.placePrediction?.placeId || '',
                                    structured_formatting: {
                                        main_text: suggestion.placePrediction?.text?.text?.split(',')[0] || '',
                                        secondary_text: suggestion.placePrediction?.text?.text?.split(',').slice(1).join(',').trim() || '',
                                        main_text_matched_substrings: []
                                    },
                                    matched_substrings: [],
                                    terms: [],
                                    types: suggestion.placePrediction?.types || []
                                }) as google.maps.places.AutocompletePrediction);
                                setSuggestions(formattedPredictions);
                            } else {
                                setSuggestions([]);
                                if (input.length > 2) {
                                    // No matching locations found for query
                                }
                            }
                        } else {
                            // Fallback to legacy API if new one not available
                            console.warn('New Places API not available, using fallback');
                            setSuggestions([]);
                        }
                    } catch (error) {
                        console.error('Error fetching autocomplete suggestions:', error);
                        setSuggestions([]);
                        if (input.length > 2) {
                            handleError('Error searching for locations');
                        }
                    }
                }, 300);

                const handleInput = (e: Event) => {
                    const value = (e.target as HTMLInputElement).value;
                    debouncedFetchPredictions(value);
                    // Clear error when user starts typing again
                    if (error) setError(null);
                };

                const handleKeyDown = (e: KeyboardEvent) => {
                    // Allow escape key to reset loading state
                    if (e.key === 'Escape' && isLoading) {
                        handleManualReset();
                    }
                };

                inputRef.current.addEventListener('input', handleInput);
                inputRef.current.addEventListener('keydown', handleKeyDown);
                
                // Store cleanup function
                const currentInput = inputRef.current;
                const cleanup = () => {
                    if (currentInput) {
                        currentInput.removeEventListener('input', handleInput);
                        currentInput.removeEventListener('keydown', handleKeyDown);
                    }
                    debouncedFetchPredictions.cancel();
                };

                handleLoadingChange(false);
                setRetryCount(0);
                return cleanup;
            } catch (error) {
                console.error('Error initializing autocomplete:', error);
                handleError('Failed to initialize location search');
                handleLoadingChange(false); // Reset loading state on error
                setRetryCount(retryAttempt + 1);
                setTimeout(() => {
                    handleLoadingChange(true); // Set loading for retry
                    initializeAutocomplete(retryAttempt + 1);
                }, RETRY_DELAY * (retryAttempt + 1));
            }
        } else {
            // If input doesn't exist or autocomplete already exists, stop loading
            handleLoadingChange(false);
        }
    }, [handleError, handleLoadingChange, onPlaceSelected, error, handleManualReset]);

    // Initialize autocomplete on mount
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        let mounted = true;

        const initAndSetupCleanup = async () => {
            try {
                cleanup = await initializeAutocomplete();
            } catch (error) {
                console.error('Failed to initialize autocomplete:', error);
                if (mounted) {
                    handleLoadingChange(false); // Ensure loading stops on error
                    handleError('Failed to initialize location search');
                }
            }
        };

        // Add timeout failsafe to prevent infinite loading
        const failsafeTimeout = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn('SearchBox initialization timeout, resetting loading state');
                handleLoadingChange(false);
            }
        }, 10000); // 10 second timeout

        initAndSetupCleanup();

        return () => {
            mounted = false;
            clearTimeout(failsafeTimeout);
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
            if (cleanup) {
                cleanup();
            }
            // Ensure loading is stopped on cleanup
            handleLoadingChange(false);
        };
    }, [initializeAutocomplete, isLoading, handleLoadingChange, handleError]);

    return (
        <div className="absolute top-16 left-4 z-10 w-96 max-w-[calc(100%-2rem)]">{/* Moved down to avoid overlapping chat elements */}
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                        {showManualReset && (
                            <button
                                onClick={handleManualReset}
                                className="text-xs text-red-600 hover:text-red-800 underline"
                                type="button"
                                title="Reset if stuck loading"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                )}

                {/* Retry indicator when retrying */}
                {retryCount > 0 && !isLoading && (
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
                            type="button"
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
