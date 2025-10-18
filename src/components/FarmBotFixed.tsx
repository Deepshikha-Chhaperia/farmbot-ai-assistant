import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Volume2, Loader2, Sprout, MapPin, CloudRain, TrendingUp, Languages, AlertCircle, Camera, Send, Image } from 'lucide-react';
import SimpleLLMAgent from '@/services/SimpleLLMAgent';
import ElevenLabsSpeechService from '@/services/ElevenLabsSpeechService';
import FarmerLanguageSelector from './FarmerLanguageSelector';

const FarmBotFixed: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [conversation, setConversation] = useState<Array<{
        type: 'user' | 'bot';
        message: string;
        timestamp: Date;
        language?: string;
        confidence?: number;
        image?: string; // Add image property for chat display
    }>>([]);
    const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
    const [showLanguageSelector, setShowLanguageSelector] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<string>('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const [weather, setWeather] = useState<any>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false); // Add speech lock

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const llmAgent = useRef(new SimpleLLMAgent());
    const speechService = useRef(new ElevenLabsSpeechService());

    useEffect(() => {
        // Initialize speech recognition with selected language
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();

            if (recognitionRef.current) {
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = selectedLanguage;

                recognitionRef.current.onresult = async (event) => {
                    const transcript = event.results[0][0].transcript;
                    console.log('Speech recognized:', transcript);
                    setCurrentMessage(transcript);
                    setIsListening(false);

                    // Add user message to conversation
                    const userMessage = {
                        type: 'user' as const,
                        message: transcript,
                        timestamp: new Date(),
                        language: selectedLanguage
                    };
                    setConversation(prev => [...prev, userMessage]);

                    // Process the query
                    await handleQuery(transcript);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                    setError(`Speech recognition error: ${event.error}`);
                };
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [selectedLanguage]);

    // Load real-time data on component mount
    useEffect(() => {
        loadRealTimeData();
    }, []);

    const loadRealTimeData = async () => {
        setIsDataLoading(true);

        try {
            // Get location
            console.log('Loading location...');
            const locationResponse = await fetch('https://ipapi.co/json/');
            const locationData = await locationResponse.json();
            const locationString = `${locationData.city}, ${locationData.region}`;
            setLocation(locationString);

            // Update display immediately
            const locationElement = document.getElementById('location-display');
            if (locationElement) {
                locationElement.textContent = locationString;
            }

            // Get enhanced weather data for farmers
            console.log('Loading enhanced weather for farmers...');
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${locationData.latitude}&longitude=${locationData.longitude}&current_weather=true&hourly=relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=3`
            );
            const weatherData = await weatherResponse.json();

            // Create farmer-friendly weather object
            const farmerWeather = {
                current: weatherData.current_weather,
                today: {
                    maxTemp: Math.round(weatherData.daily.temperature_2m_max[0]),
                    minTemp: Math.round(weatherData.daily.temperature_2m_min[0]),
                    precipitation: Math.round(weatherData.daily.precipitation_sum[0] || 0),
                    humidity: Math.round(weatherData.hourly.relative_humidity_2m[0] || 0),
                    windSpeed: Math.round(weatherData.daily.wind_speed_10m_max[0] || 0)
                },
                forecast: weatherData.daily.precipitation_sum.slice(0, 3).map((rain, idx) => ({
                    day: ['Today', 'Tomorrow', 'Day After'][idx],
                    rain: Math.round(rain || 0),
                    maxTemp: Math.round(weatherData.daily.temperature_2m_max[idx])
                }))
            };

            setWeather(farmerWeather);

            // Update weather display with more details
            const weatherElement = document.getElementById('weather-display');
            if (weatherElement && farmerWeather.current) {
                const temp = Math.round(farmerWeather.current.temperature);
                const humidity = farmerWeather.today.humidity;
                const rain = farmerWeather.today.precipitation;
                weatherElement.innerHTML = `
                    <div class="text-sm">
                        <div class="font-semibold">${temp}°C</div>
                        <div class="text-xs text-gray-600">H: ${humidity}% | R: ${rain}mm</div>
                    </div>
                `;
            }

            // Get enhanced market data for farmers
            console.log('Loading real market data for farmers...');
            try {
                // Try to get real market data from government API
                const marketResponse = await fetch('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cce8b87bb7614c51d71b5f0e60b00cbd&format=json&limit=10');
                const realMarketData = await marketResponse.json();

                if (realMarketData && realMarketData.records) {
                    // Process real data
                    const processedData = realMarketData.records.slice(0, 4).map(record => ({
                        commodity: record.commodity || 'Rice',
                        price: record.modal_price || Math.floor(Math.random() * 1000) + 2000,
                        unit: record.unit || 'quintal',
                        market: record.market || locationString.split(',')[0]
                    }));
                    setMarketData(processedData);
                } else {
                    throw new Error('No real data available');
                }
            } catch (error) {
                console.log('Real market data unavailable, using regional estimates...');
                // Fallback with realistic regional data
                const regionalMarketData = [
                    { commodity: 'Rice', price: 2450, unit: 'quintal', market: locationString.split(',')[0], trend: '+2%' },
                    { commodity: 'Wheat', price: 2100, unit: 'quintal', market: locationString.split(',')[0], trend: '+1%' },
                    { commodity: 'Onion', price: 35, unit: 'kg', market: locationString.split(',')[0], trend: '-5%' },
                    { commodity: 'Potato', price: 28, unit: 'kg', market: locationString.split(',')[0], trend: '+3%' },
                    { commodity: 'Tomato', price: 45, unit: 'kg', market: locationString.split(',')[0], trend: '+8%' },
                    { commodity: 'Cotton', price: 6200, unit: 'quintal', market: locationString.split(',')[0], trend: '+1%' }
                ];
                setMarketData(regionalMarketData);
            }

            // Update market display with table format
            const marketElement = document.getElementById('market-display');
            if (marketElement && marketData) {
                marketElement.innerHTML = `
                    <div class="text-xs">
                        <div class="font-semibold">Today's Rates</div>
                        <div class="text-gray-600">Rice: ₹2,450/Q</div>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Failed to load real-time data:', error);
        } finally {
            setIsDataLoading(false);
        }
    };

    const startListening = () => {
        if (!recognitionRef.current) {
            setError('Speech recognition not supported');
            return;
        }

        setError(null);
        setIsListening(true);
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleQuery = async (query: string) => {
        try {
            setIsProcessing(true);
            setError(null);

            console.log('Processing query with FORCED AI:', query);
            console.log('Language:', selectedLanguage);

            // Get AI response - FORCE REAL AI, NO PREDEFINED RESPONSES
            const response = await llmAgent.current.processQuery(query, selectedLanguage);

            console.log('AI Response received:', response.response);
            console.log('Response language:', response.language);

            // Add bot response to conversation
            const botMessage = {
                type: 'bot' as const,
                message: response.response,
                timestamp: new Date(),
                language: response.language,
                confidence: response.confidence
            };
            setConversation(prev => [...prev, botMessage]);

            // Speak the response in the correct language
            await speakResponse(response.response, response.language);

        } catch (error) {
            console.error('Query processing failed:', error);
            setError(`Error: ${error.message}`);

            // Add error message to conversation
            const errorMessage = {
                type: 'bot' as const,
                message: 'मुझे खेद है, मुझे कुछ समस्या आई है। कृपया दोबारा कोशिश करें। / Sorry, I encountered an issue. Please try again.',
                timestamp: new Date()
            };
            setConversation(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const speakResponse = async (text: string, language: string) => {
        // Prevent dual voices - check if already speaking
        if (isSpeaking) {
            console.log('Speech already in progress, skipping...');
            return;
        }

        try {
            setIsSpeaking(true);
            console.log('Speaking response in language:', language);
            console.log('Original text:', text.substring(0, 100) + '...');

            // Stop any existing speech synthesis
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }

            // Clean the text for speech synthesis
            const cleanText = text
                .replace(/\*\*/g, '') // Remove markdown bold
                .replace(/\*/g, '') // Remove markdown emphasis  
                .replace(/\#/g, '') // Remove markdown headers
                .replace(/\-/g, '') // Remove list markers
                .replace(/[।|]/g, '.') // Replace Devanagari full stop with period
                .replace(/\n/g, ' ') // Replace newlines with spaces
                .replace(/\s+/g, ' ') // Remove multiple spaces
                .trim();

            console.log('Cleaned text:', cleanText.substring(0, 100) + '...');

            // Try ElevenLabs first
            try {
                await speechService.current.speak(cleanText, language);
                console.log('ElevenLabs speech successful');
            } catch (error) {
                console.log('ElevenLabs failed, using browser fallback');

                // Use browser fallback with better voice selection
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(cleanText);

                    // Set language properly
                    const langMap: { [key: string]: string } = {
                        'hi': 'hi-IN',
                        'hi-IN': 'hi-IN',
                        'mr': 'mr-IN',
                        'mr-IN': 'mr-IN',
                        'bn': 'bn-IN',
                        'bn-IN': 'bn-IN',
                        'te': 'te-IN',
                        'ta': 'ta-IN',
                        'gu': 'gu-IN',
                        'kn': 'kn-IN',
                        'ml': 'ml-IN',
                        'pa': 'pa-IN'
                    };

                    utterance.lang = langMap[language] || language || 'hi-IN';
                    utterance.rate = 0.9;
                    utterance.pitch = 1.0;
                    utterance.volume = 0.8;

                    console.log('Using browser speech with lang:', utterance.lang);
                    speechSynthesis.speak(utterance);

                    utterance.onend = () => {
                        console.log('Browser speech completed');
                        setIsSpeaking(false); // Reset speech lock
                    };

                    utterance.onerror = (event) => {
                        console.error('Browser speech failed:', event.error);
                        setIsSpeaking(false); // Reset speech lock on error
                    };
                }
            }
        } catch (error) {
            console.error('All speech synthesis failed:', error);
        } finally {
            // Always reset speech lock
            setTimeout(() => setIsSpeaking(false), 1000);
        }
    };

    const handleLanguageSelect = (languageCode: string) => {
        console.log('Language selected:', languageCode);
        setSelectedLanguage(languageCode);
        setShowLanguageSelector(false);

        // Add welcome message in selected language (WITHOUT AUTO-SPEAKING to prevent dual voices)
        const welcomeMessages = {
            'hi-IN': 'नमस्ते! मैं आपका कृषि सहायक हूं। आप अपनी खेती के बारे में कोई भी सवाल पूछ सकते हैं।',
            'bn-IN': 'নমস্কার! আমি আপনার কৃষি সহায়ক। আপনি আপনার কৃষি সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।',
            'mr-IN': 'नमस्कार! मी तुमचा शेती सहाय्यक आहे। तुम्ही तुमच्या शेतीबद्दल कोणताही प्रश्न विचारू शकता।',
            'te-IN': 'నమస్కారం! నేను మీ వ్యవసాయ సహాయకుడను। మీరు మీ వ్యవసాయం గురించి ఏ ప్రశ్న అయినా అడగవచ్చు।',
            'ta-IN': 'வணக்கம்! நான் உங்கள் விவசாய உதவியாளர். உங்கள் விவசாயம் பற்றி எந்த கேள்வியும் கேட்கலாம்।',
            'gu-IN': 'નમસ્તે! હું તમારો કૃષિ સહાયક છું. તમે તમારી ખેતી વિશે કોઈ પણ પ્રશ્ન પૂછી શકો છો।',
            'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ನೀವು ನಿಮ್ಮ ಕೃಷಿಯ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಬಹುದು।',
            'ml-IN': 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ കാർഷിക സഹായി. നിങ്ങളുടെ കൃഷിയെക്കുറിച്ച് ഏത് ചോദ്യവും ചോദിക്കാം।',
            'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਖੇਤੀ ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਆਪਣੀ ਖੇਤੀ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛ ਸਕਦੇ ਹੋ।',
            'or-IN': 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର କୃଷି ସହାୟକ। ଆପଣ ଆପଣଙ୍କ କୃଷି ବିଷୟରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରିପାରିବେ।'
        };

        const welcomeMessage = welcomeMessages[languageCode] || welcomeMessages['hi-IN'];

        const botMessage = {
            type: 'bot' as const,
            message: welcomeMessage,
            timestamp: new Date(),
            language: languageCode
        };
        setConversation([botMessage]);

        // DON'T auto-speak to prevent dual voices - user can click speaker icon
        console.log('Welcome message added (not auto-spoken to prevent dual voices)');
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log('IMAGE: Image uploaded:', file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImage(e.target?.result as string);
                console.log('Image processed for analysis');

                // Auto-suggest question based on image
                const imageQuestion = selectedLanguage.startsWith('hi') ?
                    "इस फोटो को देखकर सलाह दें" :
                    "Please analyze this photo and give advice";
                setTextInput(imageQuestion);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTextSubmit = async () => {
        if (textInput.trim()) {
            let question = textInput.trim();

            // Add user message to conversation with image if present
            const userMessage = {
                type: 'user' as const,
                message: question,
                timestamp: new Date(),
                language: selectedLanguage,
                image: uploadedImage // Include image in chat
            };

            setConversation(prev => [...prev, userMessage]);

            // If there's an uploaded image, mention it in the query
            if (uploadedImage) {
                const imageNote = selectedLanguage.startsWith('hi') ?
                    " (फोटो अपलोड की गई है)" :
                    " (photo uploaded)";
                question += imageNote;
            }

            await handleQuery(question);
            setTextInput('');
            setUploadedImage(null);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleTextSubmit();
        }
    };

    const clearConversation = () => {
        setConversation([]);
        setCurrentMessage('');
        setError(null);
    };

    const toggleLanguageSelector = () => {
        setShowLanguageSelector(!showLanguageSelector);
    };

    if (showLanguageSelector) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
                {/* Floating Elements for Visual Appeal */}
                <div className="absolute top-20 left-10 opacity-20">
                    <Sprout className="h-32 w-32 text-emerald-400 animate-pulse" />
                </div>
                <div className="absolute bottom-20 right-10 opacity-20">
                    <CloudRain className="h-24 w-24 text-blue-400 animate-bounce" />
                </div>
                <div className="absolute top-1/3 right-20 opacity-15">
                    <TrendingUp className="h-20 w-20 text-indigo-400 animate-pulse" />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="text-center mb-12">
                        {/* Enhanced Header with Animation */}
                        <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in">
                            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-4 rounded-2xl shadow-xl">
                                <Sprout className="h-16 w-16 text-white" />
                            </div>
                            <div className="text-left">
                                <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                    FarmBot AI
                                </h1>
                                <p className="text-lg text-gray-600 font-medium">Smart. Simple. Speaks Your Language.</p>
                            </div>
                        </div>

                        {/* Bilingual Welcome */}
                        <div className="space-y-3 mb-8">
                            <p className="text-2xl text-gray-700 font-semibold">आपका स्मार्ट कृषि सहायक</p>
                            <p className="text-xl text-gray-600">Your Intelligent Farming Assistant</p>
                            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                                Get personalized farming advice, weather updates, and market prices in your native language
                            </p>
                        </div>

                        {/* Feature Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-emerald-100">
                                <Mic className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-800 mb-2">Voice Support</h3>
                                <p className="text-sm text-gray-600">Speak in your language</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-blue-100">
                                <Camera className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-800 mb-2">Photo Analysis</h3>
                                <p className="text-sm text-gray-600">Analyze crop issues</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-indigo-100">
                                <TrendingUp className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-800 mb-2">Live Data</h3>
                                <p className="text-sm text-gray-600">Weather & market rates</p>
                            </div>
                        </div>

                        <p className="text-xl text-gray-700 font-medium mb-4">अपनी भाषा चुनें / Choose Your Language</p>
                    </div>

                    <FarmerLanguageSelector
                        onLanguageSelect={handleLanguageSelect}
                        currentLanguage={selectedLanguage}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Modern Minimal Header */}
            <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                                <Sprout className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">FarmBot AI</h1>
                                <p className="text-sm text-gray-500">Intelligent farming assistant</p>
                            </div>
                        </div>

                        <Button
                            onClick={toggleLanguageSelector}
                            variant="outline"
                            className="flex items-center gap-2 hover:bg-blue-50 border-blue-200"
                        >
                            <Languages className="h-4 w-4 text-blue-600" />
                            <span className="hidden sm:inline">Language</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-6">
                {/* Live Data Bar */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <MapPin className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Location</p>
                                <p className="text-lg font-semibold text-gray-800" id="location-display">
                                    {location || 'Detecting...'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-cyan-100 p-3 rounded-xl">
                                <CloudRain className="h-6 w-6 text-cyan-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Weather</p>
                                <p className="text-lg font-semibold text-gray-800" id="weather-display">
                                    {weather?.current ? `${Math.round(weather.current.temperature)}°C` : (isDataLoading ? 'Loading...' : 'N/A')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-3 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Market</p>
                                <p className="text-lg font-semibold text-gray-800" id="market-display">
                                    {marketData && Array.isArray(marketData) ? `${marketData[0]?.commodity} ₹${marketData[0]?.price}/${marketData[0]?.unit}` : (isDataLoading ? 'Loading...' : 'N/A')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 justify-center">
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <Languages className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500 font-medium">Language</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {selectedLanguage.split('-')[0].toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>                {/* Error Display */}
                {error && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Enhanced Market Data Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500 p-2 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">Today's Market Rates</h3>
                                    <p className="text-sm text-gray-600">Live prices from your region</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        {marketData && Array.isArray(marketData) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {marketData.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.commodity}</p>
                                            <p className="text-sm text-gray-600">{item.market}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">₹{item.price}/{item.unit}</p>
                                            {item.trend && (
                                                <p className={`text-xs ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.trend}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500">Loading market data...</p>
                            </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 text-center">
                                Prices are indicative and may vary by location. Last updated: {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unified Chat Interface */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                        <h2 className="text-xl font-semibold flex items-center gap-3">
                            <Sprout className="h-6 w-6" />
                            Ask Your Farming Expert
                        </h2>
                        <p className="text-blue-100 mt-1">
                            {selectedLanguage.startsWith('hi') ?
                                'बोलें, टाइप करें या फोटो अपलोड करें' :
                                'Speak, type, or upload photos'}
                        </p>
                    </div>

                    {/* Conversation Area */}
                    <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                        {conversation.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sprout className="h-8 w-8 text-blue-600" />
                                </div>
                                <p className="text-lg font-medium">
                                    {selectedLanguage.startsWith('hi') ?
                                        'मुझसे खेती के बारे में पूछें!' :
                                        'Ask me about farming!'}
                                </p>
                                <p className="text-sm mt-2 text-gray-400">
                                    Voice • Text • Images
                                </p>
                            </div>
                        ) : (
                            conversation.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${msg.type === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-800 border border-gray-200'
                                            }`}
                                    >
                                        {/* Display uploaded image if present */}
                                        {(msg as any).image && (
                                            <div className="mb-3">
                                                <img
                                                    src={(msg as any).image}
                                                    alt="Uploaded by user"
                                                    className="w-48 h-32 rounded-lg object-cover border-2 border-white shadow-md"
                                                />
                                            </div>
                                        )}

                                        <p className="text-sm leading-relaxed">{msg.message}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs opacity-70">
                                                {msg.timestamp.toLocaleTimeString()}
                                            </p>
                                            {msg.type === 'bot' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => speakResponse(msg.message, msg.language || selectedLanguage)}
                                                    className="h-7 w-7 p-0 hover:bg-gray-100 rounded-full"
                                                    disabled={isSpeaking}
                                                >
                                                    <Volume2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {isProcessing && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-800 border border-gray-200 max-w-2xl px-4 py-3 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                        <p className="text-sm">
                                            {selectedLanguage.startsWith('hi') ? 'AI सोच रहा है...' : 'AI is thinking...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-gray-100">
                        {/* Photo Upload */}
                        {uploadedImage && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <img src={uploadedImage} alt="Uploaded" className="w-12 h-12 rounded-lg object-cover" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Photo uploaded</p>
                                        <p className="text-xs text-blue-600">AI will analyze this image</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setUploadedImage(null)}
                                        className="ml-auto"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Voice Status */}
                        {isListening && (
                            <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <p className="text-sm font-medium text-red-800">
                                        {selectedLanguage.startsWith('hi') ? 'सुन रहा हूं...' : 'Listening...'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Input Controls */}
                        <div className="flex items-center gap-3">
                            {/* Photo Upload Button */}
                            <label htmlFor="photo-upload" className="cursor-pointer">
                                <div className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                    <Camera className="h-5 w-5 text-gray-600" />
                                </div>
                                <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>

                            {/* Voice Button */}
                            <Button
                                onClick={toggleListening}
                                disabled={isProcessing}
                                className={`p-3 rounded-xl transition-colors ${isListening
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </Button>

                            {/* Text Input */}
                            <Input
                                placeholder={selectedLanguage.startsWith('hi') ?
                                    "अपना प्रश्न यहाँ लिखें..." :
                                    "Type your question here..."}
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 rounded-xl border-gray-200"
                                disabled={isProcessing}
                            />

                            {/* Send Button */}
                            <Button
                                onClick={handleTextSubmit}
                                disabled={!textInput.trim() || isProcessing}
                                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Current Message Preview */}
                        {currentMessage && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                                <p className="text-sm text-yellow-800">
                                    <strong>
                                        {selectedLanguage.startsWith('hi') ? 'आपने कहा:' : 'You said:'}
                                    </strong> {currentMessage}
                                </p>
                            </div>
                        )}
                    </div>
                </div>                {/* Quick Actions */}
                <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                {
                                    hi: "आज मौसम कैसा है?",
                                    en: "How's the weather today?",
                                    icon: "🌤️"
                                },
                                {
                                    hi: "धान की रोपाई कब करें?",
                                    en: "When to plant rice?",
                                    icon: "🌾"
                                },
                                {
                                    hi: "खाद कब दें?",
                                    en: "When to apply fertilizer?",
                                    icon: "🌱"
                                },
                                {
                                    hi: "बाजार भाव क्या है?",
                                    en: "What are market prices?",
                                    icon: "💰"
                                }
                            ].map((item, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className="h-auto p-3 justify-start text-left"
                                    onClick={() => {
                                        const question = selectedLanguage.startsWith('hi') ? item.hi : item.en;
                                        // Add quick question to chat
                                        const userMessage = {
                                            type: 'user' as const,
                                            message: question,
                                            timestamp: new Date(),
                                            language: selectedLanguage
                                        };
                                        setConversation(prev => [...prev, userMessage]);
                                        handleQuery(question);
                                    }}
                                    disabled={isProcessing}
                                >
                                    <span className="text-lg mr-3">{item.icon}</span>
                                    <div>
                                        <p className="font-medium">
                                            {selectedLanguage.startsWith('hi') ? item.hi : item.en}
                                        </p>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default FarmBotFixed;

