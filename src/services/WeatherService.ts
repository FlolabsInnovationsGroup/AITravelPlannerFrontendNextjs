export interface WeatherData {
    location: {
        lat: number;
        lng: number;
        name: string;
    };
    current: {
        temperature: number;
        description: string;
        icon: string;
        humidity: number;
        windSpeed: number;
        feelLike: number;
        uvIndex?: number; // Important for outdoor travel activities
        visibility?: number; // Important for sightseeing
        cloudiness?: number; // Useful for photography planning
    };
    forecast: WeatherForecast[];
    travelInsights?: TravelWeatherInsights;
}

export interface TravelWeatherInsights {
    bestTimeToVisit: string;
    clothingRecommendations: string[];
    activitySuggestions: string[];
    weatherAlerts?: string[];
}

export interface WeatherForecast {
    date: string;
    temperature: {
        min: number;
        max: number;
    };
    description: string;
    icon: string;
    precipitation: number;
}

class WeatherService {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
    private cache = new Map<string, { data: WeatherData; timestamp: number }>();
    private readonly cacheTime = 10 * 60 * 1000; // 10 minutes

    constructor() {
        // In production, this should be from environment variables
        this.apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo-key';
        
        // Log API key status for debugging (first 8 chars only for security)
        if (this.apiKey === 'demo-key') {
            console.log('🌤️ Weather Service: Using demo/mock data');
        } else {
            console.log(`🌤️ Weather Service: Using API key ${this.apiKey.substring(0, 8)}...`);
        }
    }

    /**
     * Get weather data for a specific location
     */
    async getWeatherData(lat: number, lng: number, locationName?: string): Promise<WeatherData | null> {
        const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTime) {
            return cached.data;
        }

        // If no API key is configured, return mock data for demo
        if (this.apiKey === 'demo-key') {
            return this.getMockWeatherData(lat, lng, locationName);
        }

        try {
            // Fetch current weather and forecast
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`),
                fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`)
            ]);

            if (!currentResponse.ok) {
                const errorText = await currentResponse.text();
                console.warn(`Weather API current request failed (${currentResponse.status}):`, errorText);
                
                // If it's a 401, log helpful message
                if (currentResponse.status === 401) {
                    console.warn('🔑 API Key issue detected. Common causes:');
                    console.warn('- New API key needs 10+ minutes to activate');
                    console.warn('- Account needs email verification');
                    console.warn('- Free tier limitations');
                    console.warn('- Check key at https://home.openweathermap.org/api_keys');
                }
                
                return this.getMockWeatherData(lat, lng, locationName);
            }

            if (!forecastResponse.ok) {
                console.warn('Weather API forecast request failed, using mock data');
                return this.getMockWeatherData(lat, lng, locationName);
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();

            const weatherData: WeatherData = {
                location: {
                    lat,
                    lng,
                    name: locationName || currentData.name || 'Unknown Location'
                },
                current: {
                    temperature: Math.round(currentData.main.temp),
                    description: currentData.weather[0].description,
                    icon: currentData.weather[0].icon,
                    humidity: currentData.main.humidity,
                    windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
                    feelLike: Math.round(currentData.main.feels_like)
                },
                forecast: this.processForecastData(forecastData.list)
            };

            // Cache the result
            this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
            
            return weatherData;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return this.getMockWeatherData(lat, lng, locationName);
        }
    }

    /**
     * Get weather for multiple locations
     */
    async getWeatherForLocations(locations: Array<{ lat: number; lng: number; name?: string }>): Promise<WeatherData[]> {
        const promises = locations.map(loc => this.getWeatherData(loc.lat, loc.lng, loc.name));
        const results = await Promise.allSettled(promises);
        
        return results
            .filter((result): result is PromiseFulfilledResult<WeatherData> => 
                result.status === 'fulfilled' && result.value !== null
            )
            .map(result => result.value);
    }

    /**
     * Process forecast data to get daily summaries
     */
    private processForecastData(forecastList: any[]): WeatherForecast[] {
        const dailyForecasts = new Map<string, any[]>();
        
        // Group forecasts by date
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyForecasts.has(date)) {
                dailyForecasts.set(date, []);
            }
            dailyForecasts.get(date)!.push(item);
        });

        // Create daily summaries (next 5 days)
        return Array.from(dailyForecasts.entries())
            .slice(0, 5)
            .map(([date, items]) => {
                const temps = items.map(item => item.main.temp);
                const descriptions = items.map(item => item.weather[0].description);
                const icons = items.map(item => item.weather[0].icon);
                const precipitation = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);

                return {
                    date,
                    temperature: {
                        min: Math.round(Math.min(...temps)),
                        max: Math.round(Math.max(...temps))
                    },
                    description: descriptions[0], // Use first description of the day
                    icon: icons[0], // Use first icon of the day
                    precipitation: Math.round(precipitation)
                };
            });
    }

    /**
     * Generate mock weather data for demo purposes
     */
    private getMockWeatherData(lat: number, lng: number, locationName?: string): WeatherData {
        // Generate pseudo-random but consistent weather based on coordinates
        const tempBase = 20 + (Math.sin(lat * 0.1) * 15) + (Math.cos(lng * 0.1) * 10);
        const season = Math.sin((Date.now() / (1000 * 60 * 60 * 24 * 365)) * 2 * Math.PI);
        const temperature = Math.round(tempBase + (season * 10));
        
        const weatherTypes = [
            { description: 'Clear sky', icon: '01d' },
            { description: 'Few clouds', icon: '02d' },
            { description: 'Scattered clouds', icon: '03d' },
            { description: 'Light rain', icon: '10d' },
            { description: 'Partly cloudy', icon: '04d' }
        ];
        
        const weatherIndex = Math.abs(Math.floor(lat + lng)) % weatherTypes.length;
        const weather = weatherTypes[weatherIndex];

        return {
            location: {
                lat,
                lng,
                name: locationName || 'Location'
            },
            current: {
                temperature,
                description: weather.description,
                icon: weather.icon,
                humidity: 60 + Math.round(Math.random() * 30),
                windSpeed: Math.round(Math.random() * 20),
                feelLike: temperature + Math.round((Math.random() - 0.5) * 4)
            },
            forecast: Array.from({ length: 5 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i + 1);
                
                return {
                    date: date.toDateString(),
                    temperature: {
                        min: temperature - 5 + Math.round(Math.random() * 3),
                        max: temperature + 5 + Math.round(Math.random() * 3)
                    },
                    description: weatherTypes[Math.floor(Math.random() * weatherTypes.length)].description,
                    icon: weatherTypes[Math.floor(Math.random() * weatherTypes.length)].icon,
                    precipitation: Math.round(Math.random() * 10)
                };
            })
        };
    }

    /**
     * Get weather icon URL
     */
    getWeatherIconUrl(icon: string): string {
        return `https://openweathermap.org/img/wn/${icon}@2x.png`;
    }

    /**
     * Generate travel insights based on weather data
     */
    private generateTravelInsights(weatherData: WeatherData): TravelWeatherInsights {
        const temp = weatherData.current.temperature;
        const description = weatherData.current.description.toLowerCase();
        const windSpeed = weatherData.current.windSpeed;
        const humidity = weatherData.current.humidity;
        
        const insights: TravelWeatherInsights = {
            bestTimeToVisit: this.getBestTimeToVisit(weatherData),
            clothingRecommendations: this.getClothingRecommendations(temp, description, windSpeed),
            activitySuggestions: this.getActivitySuggestions(temp, description, windSpeed, humidity),
            weatherAlerts: this.getWeatherAlerts(weatherData)
        };
        
        return insights;
    }
    
    private getBestTimeToVisit(weather: WeatherData): string {
        const temp = weather.current.temperature;
        const description = weather.current.description.toLowerCase();
        
        if (description.includes('rain') || description.includes('storm')) {
            return "Indoor activities recommended. Wait for weather to clear.";
        }
        
        if (temp >= 20 && temp <= 28 && !description.includes('rain')) {
            return "Perfect weather for outdoor sightseeing!";
        }
        
        if (temp < 5) {
            return "Bundle up! Great for winter activities and cozy indoor venues.";
        }
        
        if (temp > 30) {
            return "Stay hydrated! Early morning or evening activities recommended.";
        }
        
        return "Good weather for most activities with proper preparation.";
    }
    
    private getClothingRecommendations(temp: number, description: string, windSpeed: number): string[] {
        const recommendations: string[] = [];
        
        if (temp < 0) {
            recommendations.push("Heavy winter coat, thermal layers");
            recommendations.push("Insulated boots and warm hat");
        } else if (temp < 10) {
            recommendations.push("Warm jacket or coat");
            recommendations.push("Long pants and closed shoes");
        } else if (temp < 20) {
            recommendations.push("Light jacket or sweater");
            recommendations.push("Comfortable walking shoes");
        } else if (temp < 30) {
            recommendations.push("Light, breathable clothing");
            recommendations.push("Comfortable walking shoes");
        } else {
            recommendations.push("Light, loose-fitting clothes");
            recommendations.push("Sun hat and sunglasses");
            recommendations.push("Plenty of sunscreen");
        }
        
        if (description.includes('rain')) {
            recommendations.push("Waterproof jacket or umbrella");
            recommendations.push("Water-resistant shoes");
        }
        
        if (windSpeed > 20) {
            recommendations.push("Wind-resistant outer layer");
        }
        
        return recommendations;
    }
    
    private getActivitySuggestions(temp: number, description: string, windSpeed: number, humidity: number): string[] {
        const activities: string[] = [];
        
        if (description.includes('rain') || description.includes('storm')) {
            activities.push("Visit museums and galleries");
            activities.push("Explore indoor markets");
            activities.push("Try local cuisine at restaurants");
            activities.push("Relax at cafes with a warm drink");
        } else if (temp >= 20 && temp <= 28) {
            activities.push("Walking tours and sightseeing");
            activities.push("Outdoor dining and street food");
            activities.push("Park visits and photography");
            activities.push("Bike tours around the city");
        } else if (temp < 10) {
            activities.push("Visit winter markets");
            activities.push("Enjoy hot springs or spas");
            activities.push("Experience seasonal festivals");
            activities.push("Try warm local specialties");
        } else if (temp > 30) {
            activities.push("Early morning sightseeing");
            activities.push("Beach or waterfront activities");
            activities.push("Air-conditioned attractions");
            activities.push("Evening street walks");
        }
        
        if (windSpeed < 10 && humidity < 70) {
            activities.push("Perfect for outdoor photography");
        }
        
        return activities;
    }
    
    private getWeatherAlerts(weather: WeatherData): string[] {
        const alerts: string[] = [];
        const temp = weather.current.temperature;
        const description = weather.current.description.toLowerCase();
        const windSpeed = weather.current.windSpeed;
        
        if (temp > 35) {
            alerts.push("⚠️ Extreme heat - stay hydrated and seek shade");
        }
        
        if (temp < -10) {
            alerts.push("❄️ Extreme cold - limit outdoor exposure");
        }
        
        if (description.includes('storm') || description.includes('thunderstorm')) {
            alerts.push("⛈️ Thunderstorm warning - stay indoors");
        }
        
        if (windSpeed > 30) {
            alerts.push("💨 High winds - be cautious with outdoor activities");
        }
        
        if (description.includes('fog')) {
            alerts.push("🌫️ Low visibility - exercise caution when traveling");
        }
        
        return alerts;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

export const weatherService = new WeatherService();
export default weatherService;
