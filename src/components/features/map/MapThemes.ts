'use client';

export interface MapTheme {
  name: string;
  displayName: string;
  tileStyle: string;
  description: string;
}

export const MAP_THEMES: Record<string, MapTheme> = {
  modern: {
    name: 'modern',
    displayName: 'Modern Travel',
    tileStyle: 'osm-bright',
    description: 'Clean, modern style perfect for travel planning',
  },
  dark: {
    name: 'dark',
    displayName: 'Dark Professional',
    tileStyle: 'dark-matter',
    description: 'Elegant dark theme for premium experience',
  },
  minimalist: {
    name: 'minimalist',
    displayName: 'Minimalist',
    tileStyle: 'positron',
    description: 'Clean, distraction-free map view',
  },
  vibrant: {
    name: 'vibrant',
    displayName: 'Vibrant Travel',
    tileStyle: 'osm-bright-smooth',
    description: 'Colorful theme highlighting points of interest',
  },
  ocean: {
    name: 'ocean',
    displayName: 'Ocean Blue',
    tileStyle: 'positron-blue',
    description: 'Warm, ocean-inspired travel theme',
  },
};

export const DEFAULT_THEME = MAP_THEMES.modern;

export function getMapTheme(themeName: string): MapTheme {
  return MAP_THEMES[themeName] || DEFAULT_THEME;
}

export function getTileUrl(themeName: string, apiKey: string): string {
  const theme = getMapTheme(themeName);
  return `https://maps.geoapify.com/v1/tile/${theme.tileStyle}/{z}/{x}/{y}.png?apiKey=${apiKey}`;
}

export interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  className?: string;
}

export default {
  MAP_THEMES,
  DEFAULT_THEME,
  getMapTheme,
  getTileUrl,
};
