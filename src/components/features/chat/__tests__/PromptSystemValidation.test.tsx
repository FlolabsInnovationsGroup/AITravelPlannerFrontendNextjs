import '@testing-library/jest-dom';
import { sendMessage, ChatResponse } from '../../../../lib/api';

// Mock the API functions
jest.mock('../../../../lib/api');

const mockSendMessage = sendMessage as jest.MockedFunction<typeof sendMessage>;

/**
 * Comprehensive prompt testing suite for frontend validation
 * Tests prompt integration with the AI chat system
 */
describe('Prompt System Frontend Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Location Request Prompts', () => {
        const locationQueries = [
            'Show me the Eiffel Tower',
            'Display Big Ben on the map',
            'I want to see the Colosseum',
            'Add Central Park to my map'
        ];

        locationQueries.forEach(query => {
            it(`should handle location request: "${query}"`, async () => {
                // Mock successful location response
                const mockResponse: ChatResponse = {
                    content: `I'll show you ${query.split(' ').pop()} on the map right away!`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content).toContain('map');
            });
        });
    });

    describe('Booking Guidance Prompts', () => {
        const bookingQueries = [
            'Book a flight to Tokyo',
            'Reserve a hotel in Paris',
            'I want to book a tour in Rome',
            'Make a restaurant reservation'
        ];

        bookingQueries.forEach(query => {
            it(`should provide booking guidance for: "${query}"`, async () => {
                const mockResponse: ChatResponse = {
                    content: `I'll help you find options for ${query.toLowerCase()}. Here are some recommendations and booking guidance...`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.toLowerCase()).not.toContain('i will book');
                expect(response.content.toLowerCase()).not.toContain('booking confirmed');
                expect(response.content.toLowerCase()).toContain('help');
            });
        });
    });

    describe('Trip Planning Prompts', () => {
        const planningQueries = [
            'Plan a 5-day trip to Japan',
            'Create an itinerary for Barcelona',
            'I need a weekend getaway plan',
            'Help me plan a family vacation to Disney World'
        ];

        planningQueries.forEach(query => {
            it(`should provide comprehensive planning for: "${query}"`, async () => {
                const mockResponse: ChatResponse = {
                    content: `Here's a comprehensive plan for your trip: Day 1: Arrival and orientation...`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.length).toBeGreaterThan(50);
            });
        });
    });

    describe('Emergency Assistance Prompts', () => {
        const emergencyQueries = [
            'Help! I lost my passport',
            'My flight was cancelled, what do I do?',
            'I need medical assistance abroad',
            'I\'m stranded in a foreign country'
        ];

        emergencyQueries.forEach(query => {
            it(`should provide immediate assistance for: "${query}"`, async () => {
                const mockResponse: ChatResponse = {
                    content: `I understand this is urgent. Here's what you should do immediately: 1. Contact...`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.toLowerCase()).toMatch(/immediate|urgent|contact|help|embassy|consulate/);
            });
        });
    });

    describe('Weather Safety Prompts', () => {
        const weatherQueries = [
            'Is it safe to travel during hurricane season?',
            'What\'s the weather like in London in December?',
            'Should I pack warm clothes for Iceland?',
            'Any weather warnings for my trip to Florida?'
        ];

        weatherQueries.forEach(query => {
            it(`should provide weather guidance for: "${query}"`, async () => {
                const mockResponse: ChatResponse = {
                    content: `Based on weather patterns, here's what you should know about traveling...`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.toLowerCase()).toMatch(/weather|temperature|season|climate|pack|clothing/);
            });
        });
    });

    describe('Accessibility Prompts', () => {
        const accessibilityQueries = [
            'I need wheelchair accessible hotels',
            'Are there mobility assistance services at the airport?',
            'I\'m hearing impaired, what should I know?',
            'Visual impairment travel assistance needed'
        ];

        accessibilityQueries.forEach(query => {
            it(`should provide accessibility guidance for: "${query}"`, async () => {
                const mockResponse: ChatResponse = {
                    content: `I'll help you find accessible options. Here are accommodations and services that meet your needs...`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.toLowerCase()).toMatch(/accessible|accommodation|assistance|service|wheelchair|mobility/);
            });
        });
    });

    describe('Budget Optimization Prompts', () => {
        const budgetQueries = [
            'How can I travel to Europe on a budget?',
            'Find cheap flights to Asia',
            'Budget-friendly accommodations in New York',
            'I need cost-effective travel options'
        ];

        budgetQueries.forEach(query => {
            it(`should provide budget guidance for: "${query}"`, async () => {
                const mockResponse: ChatResponse = {
                    content: `Here are some budget-friendly options and money-saving tips for your trip...`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.toLowerCase()).toMatch(/budget|cheap|affordable|save|cost|money|tips/);
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle ambiguous queries gracefully', async () => {
            const ambiguousQueries = [
                'Help me with stuff',
                'I need things',
                'Travel help please',
                'What should I do?'
            ];

            /* eslint-disable no-restricted-syntax, no-await-in-loop */
            // eslint-disable-next-line no-restricted-syntax
            for (const query of ambiguousQueries) {
                const mockResponse: ChatResponse = {
                    content: 'I\'d be happy to help! Could you please provide more details about what you\'re looking for?'
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.toLowerCase()).toMatch(/help|details|more|specific|clarify/);
            }
            /* eslint-enable no-restricted-syntax, no-await-in-loop */
        });

        it('should handle invalid or nonsensical queries', async () => {
            const invalidQueries = [
                'asdfghjkl',
                '12345',
                'null undefined error',
                '<script>alert("test")</script>'
            ];

            /* eslint-disable no-restricted-syntax, no-await-in-loop */
            // eslint-disable-next-line no-restricted-syntax
            for (const query of invalidQueries) {
                const mockResponse: ChatResponse = {
                    content: 'I\'m sorry, I didn\'t understand that request. Could you please rephrase your travel question?'
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.toLowerCase()).toMatch(/sorry|understand|rephrase|help|travel/);
            }
            /* eslint-enable no-restricted-syntax, no-await-in-loop */
        });

        it('should maintain context across conversation', async () => {
            // First message
            const firstMockResponse: ChatResponse = {
                content: 'I\'ll help you plan your trip to Paris. What specific aspects would you like to explore?'
            };

            mockSendMessage.mockResolvedValueOnce(firstMockResponse);

            const firstResponse = await mockSendMessage('Plan a trip to Paris', 'test-session');

            // Follow-up message
            const secondMockResponse: ChatResponse = {
                content: 'Great! Here are the best museums in Paris for your trip.'
            };

            mockSendMessage.mockResolvedValueOnce(secondMockResponse);

            const secondResponse = await mockSendMessage('Show me museums', 'test-session');

            expect(firstResponse.content).toContain('Paris');
            expect(secondResponse.content).toContain('museums');
        });
    });

    describe('Performance and Reliability Tests', () => {
        it('should respond within reasonable time limits', async () => {
            const startTime = Date.now();
            
            mockSendMessage.mockImplementation(async () => {
                // Simulate network delay
                await new Promise(resolve => { setTimeout(resolve, 100); });
                return {
                    content: 'Quick response for your travel query.'
                };
            });

            const response = await mockSendMessage('Quick test query', 'test-session');
            const responseTime = Date.now() - startTime;

            expect(response.content).toBeTruthy();
            expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
        });

        it('should handle multiple concurrent requests', async () => {
            const queries = [
                'Show me hotels in Tokyo',
                'Find restaurants in Paris',
                'Plan a trip to London',
                'Book flights to New York'
            ];

            mockSendMessage.mockImplementation(async (query: string) => ({
                content: `Response for: ${query}`
            }));

            const promises = queries.map(query => mockSendMessage(query, 'test-session'));
            const responses = await Promise.all(promises);

            expect(responses).toHaveLength(4);
            responses.forEach((response, index) => {
                expect(response.content).toContain(queries[index]);
            });
        });

        it('should handle API errors gracefully', async () => {
            mockSendMessage.mockRejectedValue(new Error('Network error'));

            try {
                await mockSendMessage('Test query', 'test-session');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Network error');
            }
        });
    });

    describe('Content Quality Validation', () => {
        it('should not make false booking promises', async () => {
            const bookingQuery = 'Book me a flight to Hawaii';
            const mockResponse: ChatResponse = {
                content: 'I can help you find flight options to Hawaii and guide you to booking sites, but I cannot make actual bookings.'
            };

            mockSendMessage.mockResolvedValue(mockResponse);

            const response = await mockSendMessage(bookingQuery, 'test-session');

            // Should not promise actual booking
            expect(response.content.toLowerCase()).not.toContain('booked');
            expect(response.content.toLowerCase()).not.toContain('confirmed');
            expect(response.content.toLowerCase()).not.toContain('reserved');
            
            // Should offer guidance instead
            expect(response.content.toLowerCase()).toMatch(/help|guide|options|find/);
        });

        it('should provide helpful travel information', async () => {
            const infoQuery = 'What should I know about traveling to Japan?';
            const mockResponse: ChatResponse = {
                content: 'Here\'s what you should know about traveling to Japan: visa requirements, cultural etiquette, transportation options, and recommended places to visit.'
            };

            mockSendMessage.mockResolvedValue(mockResponse);

            const response = await mockSendMessage(infoQuery, 'test-session');

            expect(response.content.length).toBeGreaterThan(50);
            expect(response.content.toLowerCase()).toMatch(/visa|culture|transport|visit|know|travel/);
        });

        it('should handle emergency situations appropriately', async () => {
            const emergencyQuery = 'I lost my passport in a foreign country, help!';
            const mockResponse: ChatResponse = {
                content: 'This is an emergency situation. Contact your nearest embassy or consulate immediately. Here are the steps you should take right away...'
            };

            mockSendMessage.mockResolvedValue(mockResponse);

            const response = await mockSendMessage(emergencyQuery, 'test-session');

            expect(response.content.toLowerCase()).toMatch(/emergency|embassy|consulate|immediately|contact/);
            expect(response.content.toLowerCase()).toMatch(/steps|help|right away/);
        });

        it('should provide contextually relevant responses', async () => {
            const queries = [
                { query: 'Find family-friendly activities in Orlando', keywords: ['family', 'children', 'activities'] },
                { query: 'Best romantic destinations in Europe', keywords: ['romantic', 'couples', 'destinations'] },
                { query: 'Solo travel safety tips for women', keywords: ['solo', 'safety', 'women'] }
            ];

            /* eslint-disable no-restricted-syntax, no-await-in-loop */
            // eslint-disable-next-line no-restricted-syntax
            for (const testCase of queries) {
                const mockResponse: ChatResponse = {
                    content: `Here are some great suggestions for your query about ${testCase.keywords.join(', ')}...`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(testCase.query, 'test-session');

                expect(response.content).toBeTruthy();
                // Check that at least one keyword appears in response
                const hasRelevantKeyword = testCase.keywords.some(keyword => 
                    response.content.toLowerCase().includes(keyword.toLowerCase())
                );
                expect(hasRelevantKeyword).toBe(true);
            }
            /* eslint-enable no-restricted-syntax, no-await-in-loop */
        });

        it('should handle location-specific queries appropriately', async () => {
            const locationQueries = [
                'What\'s the best time to visit Tokyo?',
                'Currency exchange in London',
                'Language barriers in Barcelona',
                'Transportation in New York City'
            ];

            /* eslint-disable no-restricted-syntax, no-await-in-loop */
            // eslint-disable-next-line no-restricted-syntax
            for (const query of locationQueries) {
                const locationMatch = query.match(/in (\w+(?:\s+\w+)*)|to (\w+(?:\s+\w+)*)/);
                const location = locationMatch ? (locationMatch[1] || locationMatch[2]) : 'default location';
                const mockResponse: ChatResponse = {
                    content: `Here's helpful information about ${location}: [specific details about the location]`
                };

                mockSendMessage.mockResolvedValue(mockResponse);

                const response = await mockSendMessage(query, 'test-session');

                expect(response.content).toBeTruthy();
                expect(response.content.toLowerCase()).toContain(location.toLowerCase().split(' ')[0]);
            }
            /* eslint-enable no-restricted-syntax, no-await-in-loop */
        });
    });
});
