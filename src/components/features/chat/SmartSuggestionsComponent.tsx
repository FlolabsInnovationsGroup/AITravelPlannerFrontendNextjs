import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

interface SmartSuggestionsProps {
  suggestions: string[];
  handleSendMessage: (message: string) => void;
  currentLocation?: string;
}

const SmartSuggestionsComponent: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  handleSendMessage,
  currentLocation
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Get the most relevant suggestions (max 6)
  const getTopSuggestions = (): string[] => {
    if (suggestions.length === 0) {
      // Default fallback suggestions
      const defaultSuggestions = [
        'Plan a 3-day itinerary',
        'Find the best restaurants',
        'Show me popular attractions',
        'Help with travel budget'
      ];
      
      if (currentLocation) {
        return [
          `Best things to do in ${currentLocation}`,
          `Top restaurants in ${currentLocation}`,
          `Hidden gems in ${currentLocation}`,
          'Create a day plan'
        ];
      }
      
      return defaultSuggestions;
    }
    
    return suggestions.slice(0, 6);
  };

  const topSuggestions = getTopSuggestions();

  if (topSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      {/* Header with minimize/expand toggle */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Smart Suggestions</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
          aria-label={isMinimized ? "Expand suggestions" : "Minimize suggestions"}
        >
          {isMinimized ? (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Suggestions content */}
      {!isMinimized && (
        <div className="px-3 pb-3">
          {/* Quick preview suggestions in minimized state */}
          <div className="flex flex-wrap gap-2">
            {topSuggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSendMessage(suggestion)}
                className="px-3 py-1.5 bg-white text-sm text-gray-700 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Minimized state - show just top 3 suggestions in a compact row */}
      {isMinimized && (
        <div className="px-3 pb-3">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {topSuggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSendMessage(suggestion)}
                className="flex-shrink-0 px-2 py-1 bg-white text-xs text-gray-600 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                {suggestion.length > 25 ? `${suggestion.substring(0, 25)  }...` : suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSuggestionsComponent;