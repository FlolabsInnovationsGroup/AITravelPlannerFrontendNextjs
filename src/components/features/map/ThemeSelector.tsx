'use client';

import React, { useState } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { MAP_THEMES, ThemeSelectorProps } from './MapThemes';

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (themeName: string) => {
    onThemeChange(themeName);
    setIsOpen(false);
  };

  const currentThemeData = MAP_THEMES ? MAP_THEMES[currentTheme] : null;

  return (
    <div className={`relative ${className}`}>
      {/* Theme Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <Palette size={16} className="text-gray-500" />
        <span>{currentThemeData?.displayName || 'Modern Travel'}</span>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close theme selector"
          />
          
          {/* Theme Options */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              Map Themes
            </div>
            
            {MAP_THEMES && typeof MAP_THEMES === 'object' && Object.values(MAP_THEMES).map((theme) => (
              <button
                type="button"
                key={theme.name}
                onClick={() => handleThemeSelect(theme.name)}
                className="w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 group"
              >
                {/* Theme Preview */}
                <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden border border-gray-200">
                  <div 
                    className="w-full h-full"
                    style={{
                      background: (() => {
                        if (theme.name === 'dark') return 'linear-gradient(135deg, #242f3e 0%, #263c3f 50%, #17263c 100%)';
                        if (theme.name === 'ocean') return 'linear-gradient(135deg, #b9d3c2 0%, #dfd2ae 50%, #f5f1e6 100%)';
                        if (theme.name === 'vibrant') return 'linear-gradient(135deg, #4285F4 0%, #FBBC04 50%, #e0efef 100%)';
                        if (theme.name === 'minimalist') return 'linear-gradient(135deg, #f5f5f5 0%, #e9e9e9 50%, #dedede 100%)';
                        return 'linear-gradient(135deg, #f5f5f5 0%, #e9e9e9 50%, #ffffff 100%)';
                      })()
                    }}
                  />
                </div>

                {/* Theme Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {theme.displayName}
                    </span>
                    {currentTheme === theme.name && (
                      <Check size={14} className="text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              </button>
            ))}
            
            <div className="px-3 py-2 mt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Choose a theme that matches your travel planning style
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;