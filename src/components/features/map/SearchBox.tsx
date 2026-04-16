'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

export interface PlaceResult {
    name: string;
    formatted_address: string;
    place_id: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    types?: string[];
    rating?: number;
}

interface SearchBoxProps {
    onPlaceSelected: (place: PlaceResult) => void;
    placeholder?: string;
    onError?: (error: string) => void;
    onLoadingChange?: (isLoading: boolean) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const DEBOUNCE_MS = 300;

interface AutocompleteSuggestion {
    place_id: string;
    name: string;
    formatted: string;
    lat: number;
    lon: number;
    categories?: string[];
    result_type?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({
    onPlaceSelected,
    placeholder = 'Search destinations, hotels, restaurants...',
    onError,
    onLoadingChange,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [showManualReset, setShowManualReset] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleError = useCallback(
        (errorMessage: string) => {
            setError(errorMessage);
            onError?.(errorMessage);
        },
        [onError],
    );

    const handleLoadingChange = useCallback(
        (loading: boolean) => {
            setIsLoading(loading);
            onLoadingChange?.(loading);
            if (!loading) setShowManualReset(false);
        },
        [onLoadingChange],
    );

    useEffect(() => {
        if (isLoading) {
            const resetTimeout = setTimeout(() => setShowManualReset(true), 8000);
            return () => clearTimeout(resetTimeout);
        }
        setShowManualReset(false);
        return undefined;
    }, [isLoading]);

    const handleManualReset = useCallback(() => {
        setIsLoading(false);
        setShowManualReset(false);
        setError(null);
        onLoadingChange?.(false);
    }, [onLoadingChange]);

    const fetchSuggestions = useCallback(
        async (query: string) => {
            if (query.length < 3) {
                setSuggestions([]);
                return;
            }

            abortControllerRef.current?.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
                handleLoadingChange(true);
                const response = await fetch(
                    `${API_URL}/api/geoapify/autocomplete?text=${encodeURIComponent(query)}`,
                    { signal: controller.signal },
                );

                if (!response.ok) {
                    throw new Error(`Autocomplete request failed: ${response.status}`);
                }

                const data = await response.json();

                const results: AutocompleteSuggestion[] = (data.features || data.results || []).map(
                    (feature: any) => ({
                        place_id: feature.properties?.place_id || feature.place_id || `${feature.properties?.lat}-${feature.properties?.lon}`,
                        name: feature.properties?.name || feature.properties?.formatted?.split(',')[0] || feature.name || '',
                        formatted: feature.properties?.formatted || feature.formatted_address || feature.formatted || '',
                        lat: feature.properties?.lat ?? feature.geometry?.coordinates?.[1] ?? 0,
                        lon: feature.properties?.lon ?? feature.geometry?.coordinates?.[0] ?? 0,
                        categories: feature.properties?.categories || feature.categories || [],
                        result_type: feature.properties?.result_type || feature.result_type || '',
                    }),
                );

                if (!controller.signal.aborted) {
                    setSuggestions(results);
                    setError(null);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    handleError('Error searching for locations');
                    setSuggestions([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    handleLoadingChange(false);
                }
            }
        },
        [handleError, handleLoadingChange],
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;
            if (error) setError(null);

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                fetchSuggestions(value);
            }, DEBOUNCE_MS);
        },
        [fetchSuggestions, error],
    );

    const handleSuggestionClick = useCallback(
        (suggestion: AutocompleteSuggestion) => {
            if (inputRef.current) {
                inputRef.current.value = suggestion.name || suggestion.formatted;
            }
            setSuggestions([]);

            const place: PlaceResult = {
                name: suggestion.name,
                formatted_address: suggestion.formatted,
                place_id: suggestion.place_id,
                geometry: {
                    location: {
                        lat: suggestion.lat,
                        lng: suggestion.lon,
                    },
                },
                types: suggestion.categories,
            };

            onPlaceSelected(place);
        },
        [onPlaceSelected],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
                setSuggestions([]);
                if (isLoading) handleManualReset();
            }
        },
        [isLoading, handleManualReset],
    );

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            abortControllerRef.current?.abort();
        };
    }, []);

    return (
        <div className="absolute top-16 left-4 z-[1000] w-96 max-w-[calc(100%-2rem)]">
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
                    aria-describedby={error ? 'search-error' : undefined}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />

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
            </div>

            {error && (
                <div
                    id="search-error"
                    role="alert"
                    className="mt-1 text-sm text-red-500 bg-white/90 backdrop-blur-sm p-2 rounded border border-red-200"
                >
                    <span className="font-medium">Error:</span> {error}
                </div>
            )}

            <div
                className={`
                    mt-1
                    transition-all
                    duration-200
                    ease-in-out
                    ${suggestions.length > 0 && !error && !isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                `}
            >
                <div className="bg-white shadow-lg rounded-md overflow-hidden backdrop-blur-sm bg-white/90">
                    {suggestions.map((suggestion) => (
                        <button
                            type="button"
                            key={suggestion.place_id}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 ease-in-out"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            <p className="text-sm text-gray-900 font-medium">
                                {suggestion.name || suggestion.formatted.split(',')[0]}
                            </p>
                            <p className="text-xs text-gray-500">{suggestion.formatted}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchBox;
