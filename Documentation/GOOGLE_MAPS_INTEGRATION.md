# Google Maps Integration

This document outlines the Google Maps integration implemented in the AI Travel Planner Frontend.

## Overview

The application has been migrated from MapBox to Google Maps, providing enhanced location services, real-time updates, and comprehensive travel planning features.

## Key Components

### GoogleMapComponent
- **Location**: `src/components/features/map/GoogleMapComponent.tsx`
- **Features**:
  - Google Places API integration
  - Advanced marker clustering
  - Rich location info windows with photos and ratings
  - Search functionality
  - Weather overlay
  - Route optimization
  - Fullscreen mode
  - Error boundaries and loading states

### RightMapPanel
- **Location**: `src/components/features/map/RightMapPanel.tsx`
- **Features**:
  - Real-time location updates via WebSocket
  - Automatic location fetching and display
  - Travel agent image fallback when no locations
  - Haversine distance calculation for duplicate prevention

## Services

### MapService
- **Location**: `src/services/MapService.ts`
- **Features**:
  - WebSocket integration for real-time updates
  - REST API methods for location management
  - Google Maps instance management
  - Error handling and reconnection logic

### Supporting Services
- **WeatherService**: Weather data integration
- **LocationExtractionService**: AI-powered location extraction
- **RouteOptimizationService**: Route planning and optimization

## Environment Variables

Add the following to your `.env` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Google Maps API Setup

1. **Create a Google Cloud Project**
2. **Enable the following APIs**:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. **Create API credentials**:
   - Go to Credentials in Google Cloud Console
   - Create API Key
   - Restrict the key to your domain (recommended for production)
4. **Set up billing** (required for Google Maps APIs)

## Features

### Real-time Location Updates
- WebSocket connection for live location updates
- Duplicate location prevention using Haversine distance calculation
- Automatic reconnection with exponential backoff

### Enhanced Location Details
- Google Places API integration for rich location data
- Photos, ratings, opening hours, and contact information
- Travel-specific insights and recommendations

### Search and Discovery
- Places search with autocomplete
- Location suggestions based on context
- City-aware search improvements

### Weather Integration
- Real-time weather data for locations
- Travel recommendations based on weather
- Weather alerts and insights

### Route Optimization
- Multi-location route planning
- Travel time optimization
- Transportation mode selection

## TypeScript Types

All map-related types are defined in `src/types/map.ts`:

- `Location`: Core location interface
- `LocationType`: Location category enumeration
- `WebSocketEvent`: Real-time event types
- `OpeningHours`: Business hours information

## Error Handling

- **LoadScript Error Boundaries**: Graceful handling of Google Maps loading failures
- **Network Error Recovery**: Automatic retry logic for API calls
- **WebSocket Reconnection**: Robust connection management
- **Type-safe Error Handling**: TypeScript-enforced error types

## Performance Optimizations

- **Component Memoization**: Prevents unnecessary re-renders
- **Marker Clustering**: Efficient handling of multiple locations
- **Lazy Loading**: On-demand component loading
- **Bundle Optimization**: Reduced bundle size after MapBox removal

## Testing

Run the test suite to verify integration:

```bash
npm run test
```

Build verification:

```bash
npm run build
```

## Migration Notes

The migration from MapBox to Google Maps is complete:

- ✅ All MapBox dependencies removed
- ✅ Google Maps components fully implemented
- ✅ WebSocket integration maintained
- ✅ Enhanced features added (Places API, Weather, etc.)
- ✅ Type safety improved
- ✅ Build and test suite passing

## Troubleshooting

### Common Issues

1. **Map not loading**: Check Google Maps API key configuration
2. **Places search not working**: Ensure Places API is enabled in Google Cloud Console
3. **WebSocket connection issues**: Verify backend WebSocket endpoint configuration
4. **Build errors**: Run `npm run build` to identify TypeScript issues

### API Quotas

Monitor your Google Maps API usage in Google Cloud Console to avoid quota exceeded errors. Consider implementing usage limits for production environments.