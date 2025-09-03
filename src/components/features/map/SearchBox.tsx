import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface SearchBoxProps {
    onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
    placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onPlaceSelected, placeholder = "Search locations..." }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (inputRef.current && !autocompleteRef.current) {
            // Create the Autocomplete object using the modern Places API
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                fields: ['name', 'geometry', 'types', 'formatted_address'],
            });

            // Add the place_changed event listener
            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();
                if (place) {
                    onPlaceSelected(place);
                }
            });
        }

        // Cleanup on unmount
        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [onPlaceSelected]);

    return (
        <div className="absolute top-4 left-4 z-10 w-96 max-w-[calc(100%-2rem)]">
            <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                className="w-full bg-white/90 backdrop-blur-sm shadow-lg"
            />
        </div>
    );
};

export default SearchBox;
