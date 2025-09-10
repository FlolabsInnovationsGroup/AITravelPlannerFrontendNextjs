import { weatherService } from '@/services/WeatherService';

// Mock test for weather service functionality
describe('WeatherService', () => {
    test('should initialize with API key', () => {
        expect(weatherService).toBeDefined();
    });

    test('should return weather data or mock data for coordinates', async () => {
        // Paris coordinates
        const result = await weatherService.getWeatherData(48.8566, 2.3522, 'Paris');
        
        expect(result).toBeDefined();
        expect(result?.location).toBeDefined();
        expect(result?.current).toBeDefined();
        expect(result?.forecast).toBeDefined();
        
        if (result) {
            expect(result.location.lat).toBeCloseTo(48.8566, 1);
            expect(result.location.lng).toBeCloseTo(2.3522, 1);
            expect(result.current.temperature).toBeDefined();
            expect(result.current.description).toBeDefined();
            expect(result.forecast.length).toBeGreaterThan(0);
        }
    });

    test('should return weather icon URL', () => {
        const iconUrl = weatherService.getWeatherIconUrl('01d');
        expect(iconUrl).toBe('https://openweathermap.org/img/wn/01d@2x.png');
    });
});