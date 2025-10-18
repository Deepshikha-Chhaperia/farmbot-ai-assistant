// Simple LLM Agent - Direct OpenRouter API calls with no fallbacks
import OpenAI from 'openai';
import LocalLanguageService from './LocalLanguageService';

interface AgentResponse {
    response: string;  // Changed from 'text' to 'response' to match FarmBotFixed
    language: string;
    confidence: number;
    sources: string[];
    reasoning: string[];
}

class SimpleLLMAgent {
    private openai: OpenAI;
    private languageService: LocalLanguageService;

    constructor() {
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

        if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
            throw new Error('OpenRouter API key is required');
        }

        this.openai = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'http://localhost:8080',
                'X-Title': 'FarmBot AI Assistant'
            },
            dangerouslyAllowBrowser: true
        });

        this.languageService = new LocalLanguageService();
        console.log('SimpleLLMAgent initialized with OpenRouter API');
    }

    async processQuery(userQuery: string, selectedLanguage?: string): Promise<AgentResponse> {
        try {
            console.log('Processing query with SimpleLLMAgent:', userQuery);
            console.log('Selected language override:', selectedLanguage);

            // Use selected language if provided, otherwise detect
            let finalLanguage = selectedLanguage;
            let languageDetection;

            if (!finalLanguage) {
                languageDetection = await this.languageService.detectLanguage(userQuery);
                finalLanguage = languageDetection.language;
            } else {
                // Create mock detection for selected language
                languageDetection = {
                    language: finalLanguage,
                    confidence: 1.0,
                    alternatives: []
                };
            }

            console.log('Final language for response:', finalLanguage);

            // FORCE language mapping to ensure correct response
            const languageMap: { [key: string]: string } = {
                'hi': 'Hindi',
                'hi-IN': 'Hindi',
                'mr': 'Marathi',
                'mr-IN': 'Marathi',
                'bn': 'Bengali',
                'bn-IN': 'Bengali',
                'te': 'Telugu',
                'ta': 'Tamil',
                'gu': 'Gujarati',
                'kn': 'Kannada',
                'ml': 'Malayalam',
                'pa': 'Punjabi',
                'or': 'Odia',
                'as': 'Assamese',
                'ur': 'Urdu',
                'ne': 'Nepali',
                'en': 'English'
            };

            const detectedLangCode = finalLanguage.split('-')[0];
            const languageName = languageMap[detectedLangCode] || 'Hindi';

            console.log('Final language name for AI:', languageName);

            // Get location (basic)
            const location = await this.getBasicLocation();
            console.log('Location:', location);

            // Get current weather for context
            const weather = await this.getBasicWeather(location);
            console.log('Weather:', weather);

            // Get current time context
            const currentTime = new Date();
            const timeContext = {
                date: currentTime.toLocaleDateString('en-IN'),
                time: currentTime.toLocaleTimeString('en-IN'),
                season: this.getCurrentSeason()
            };

            // Direct AI call with rich context
            const prompt = `
Current Date & Time: ${timeContext.date} at ${timeContext.time}
Farmer's Location: ${location}
Weather Conditions: ${weather}
Season: ${timeContext.season}
Farmer's Question: "${userQuery}"

CRITICAL: You MUST respond in ${languageName} language only. The farmer asked in ${languageName}, so respond in ${languageName}.

INSTRUCTIONS:
1. Respond ONLY in ${languageName} language - NO OTHER LANGUAGE
2. Give SPECIFIC advice based on the current weather and season
3. Consider the farmer's location for regional farming practices
4. Make your response UNIQUE and contextual - avoid generic answers
5. Include practical steps with timing and quantities where relevant
6. Consider the current date and season for seasonal advice`;

            console.log('Making DIRECT OpenRouter call with enhanced context...');
            console.log('Forcing response in:', languageName);

            const completion = await this.openai.chat.completions.create({
                model: "anthropic/claude-3-5-haiku", // Claude 3.5 Haiku - cheap and excellent
                messages: [
                    {
                        role: "system",
                        content: `You are an expert agricultural advisor for Indian farmers. 

CRITICAL LANGUAGE REQUIREMENT:
- The farmer asked in ${languageName}
- You MUST respond ONLY in ${languageName}
- NEVER mix languages or use English
- If you respond in wrong language, the farmer won't understand

RESPONSE REQUIREMENTS:
- Give UNIQUE, SPECIFIC advice - never generic responses
- Consider EXACT current conditions provided
- Make each response DIFFERENT and contextual
- Include practical steps with timing and quantities

FARMER CONTEXT:
- Simple language needed - many have limited literacy
- Need immediate, actionable guidance
- Work with local crops and seasonal patterns
- Current weather affects their decisions TODAY

Current weather and location data is provided - USE IT in your response.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 300, // Increased since using free model
                temperature: 0.4 // Balanced for good responses
            });

            const response = completion.choices[0]?.message?.content?.trim();

            if (!response) {
                throw new Error('Empty response from OpenRouter API');
            }

            console.log('REAL AI response received:', response.substring(0, 100) + '...');

            return {
                response: response,
                language: finalLanguage, // Use the final language (selected or detected)
                confidence: languageDetection.confidence,
                sources: ['OpenRouter GPT-4 Turbo'],
                reasoning: ['Direct AI call to OpenRouter']
            };

        } catch (error) {
            console.error('SimpleLLMAgent error:', error);
            throw error;
        }
    }

    private async getBasicLocation(): Promise<string> {
        try {
            // Simple IP-based location
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return `${data.city || 'Unknown'}, ${data.region || 'India'}`;
        } catch {
            return 'India';
        }
    }

    private async getBasicWeather(location: string): Promise<string> {
        try {
            // Extract city name for weather
            const city = location.split(',')[0].trim();
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current_weather=true&timezone=Asia/Kolkata`);
            const data = await response.json();

            if (data.current_weather) {
                const temp = Math.round(data.current_weather.temperature);
                const weatherCode = data.current_weather.weathercode;
                const description = this.getWeatherDescription(weatherCode);

                return `${temp}°C, ${description}`;
            }

            return 'Weather data unavailable';
        } catch {
            return 'Weather data unavailable';
        }
    }

    private getCurrentSeason(): string {
        const month = new Date().getMonth() + 1; // 1-12

        if (month >= 3 && month <= 5) return 'Spring (Pre-Monsoon)';
        if (month >= 6 && month <= 9) return 'Monsoon (Rainy Season)';
        if (month >= 10 && month <= 11) return 'Post-Monsoon';
        return 'Winter (Rabi Season)';
    }

    private getWeatherDescription(code: number): string {
        const weatherCodes: { [key: number]: string } = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };

        return weatherCodes[code] || 'Unknown weather';
    }
}

export default SimpleLLMAgent;

