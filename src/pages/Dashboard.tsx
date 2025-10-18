import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sprout, 
  CloudRain, 
  Droplets, 
  TrendingUp, 
  MapPin, 
  Thermometer,
  Settings,
  HelpCircle,
  Home,
  Mic,
  Volume2
} from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';

interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  precipitation: number;
}

interface MarketData {
  commodity: string;
  price: number;
  unit: string;
  market: string;
  trend?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [location, setLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const language = profile?.language || 'hi-IN';

  // Language-specific messages
  const messages = {
    'hi-IN': {
      welcome: `नमस्ते ${profile?.name || 'किसान जी'}! आज मैं आपकी कैसे मदद कर सकता हूं? फसल केयर, मौसम, सिंचाई या बाजार भाव के लिए बोलें।`,
      cropCare: 'फसल केयर',
      weather: 'मौसम',
      irrigation: 'सिंचाई',
      marketPrices: 'बाजार भाव',
      listening: 'सुन रहा हूं...',
      voiceHelp: 'फसल केयर, मौसम, सिंचाई या बाजार भाव कहें',
      location: 'स्थान',
      temperature: 'तापमान',
      market: 'मंडी',
      language: 'भाषा',
      home: 'होम',
      help: 'मदद',
      settings: 'सेटिंग्स',
      voice: 'आवाज़',
      clickOrSay: 'क्लिक करें या बोलें',
      navigateWithVoice: 'आवाज़ से नेविगेट करें',
      speak: 'बोलें',
      current: 'वर्तमान',
      humidity: 'नमी',
      rain: 'बारिश',
      yourCrop: 'आपकी फसल',
      quintal: 'क्विंटल',
      kg: 'किलो',
      loading: 'लोड हो रहा है...',
      farmer: 'किसान'
    },
    'mr-IN': {
      welcome: `नमस्कार ${profile?.name || 'शेतकरी जी'}! आज मी तुमची कशी मदत करू शकतो? पिक काळजी, हवामान, पाणीपुरवठा किंवा बाजार भावासाठी बोला।`,
      cropCare: 'पिक काळजी',
      weather: 'हवामान',
      irrigation: 'पाणीपुरवठा',
      marketPrices: 'बाजार भाव',
      listening: 'ऐकत आहे...',
      voiceHelp: 'पिक काळजी, हवामान, पाणीपुरवठा किंवा बाजार भाव म्हणा'
    },
    'en-IN': {
      welcome: `Hello ${profile?.name || 'Farmer'}! How can I help you today? Say Crop Care, Weather, Irrigation, or Market Prices.`,
      cropCare: 'Crop Care',
      weather: 'Weather',
      irrigation: 'Irrigation',
      marketPrices: 'Market Prices',
      listening: 'Listening...',
      voiceHelp: 'Say Crop Care, Weather, Irrigation, or Market Prices'
    }
  };

  const currentMessages = messages[language as keyof typeof messages] || messages['hi-IN'];

  // Feature cards data
  const featureCards = [
    {
      id: 'crop-care',
      title: currentMessages.cropCare,
      subtitle: language === 'hi-IN' ? 'फसल की देखभाल और सलाह' : 
                language === 'mr-IN' ? 'पिकांची देखभाल आणि सल्ला' : 
                'Expert advice for your crops',
      icon: Sprout,
      color: 'emerald',
      route: '/crop-care',
      keywords: ['crop', 'फसल', 'पिक', 'care', 'केयर', 'काळजी']
    },
    {
      id: 'weather',
      title: currentMessages.weather,
      subtitle: language === 'hi-IN' ? '3 दिन का मौसम पूर्वानुमान' :
                language === 'mr-IN' ? '3 दिवसांचा हवामान अंदाज' :
                '3-day weather forecast',
      icon: CloudRain,
      color: 'blue',
      route: '/weather',
      keywords: ['weather', 'मौसम', 'हवामान', 'rain', 'बारिश', 'पाऊस']
    },
    {
      id: 'irrigation',
      title: currentMessages.irrigation,
      subtitle: language === 'hi-IN' ? 'स्मार्ट पानी की सलाह' :
                language === 'mr-IN' ? 'स्मार्ट पाणी सल्ला' :
                'Smart watering guidance',
      icon: Droplets,
      color: 'cyan',
      route: '/irrigation',
      keywords: ['irrigation', 'सिंचाई', 'पाणीपुरवठा', 'water', 'पानी', 'पाणी']
    },
    {
      id: 'market',
      title: currentMessages.marketPrices,
      subtitle: language === 'hi-IN' ? 'आज के मंडी भाव' :
                language === 'mr-IN' ? 'आजचे मंडई भाव' :
                'Today\'s market rates',
      icon: TrendingUp,
      color: 'green',
      route: '/market-prices',
      keywords: ['market', 'बाजार', 'मंडी', 'price', 'भाव', 'rates', 'दर']
    }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = language;

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          handleVoiceNavigation(transcript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [language]);

  // Load real-time data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Welcome message (one time only)
  useEffect(() => {
    if (!hasSpokenWelcome && profile && !isLoading) {
      setTimeout(() => {
        speakText(currentMessages.welcome);
        setHasSpokenWelcome(true);
      }, 1500);
    }
  }, [profile, isLoading]);

  const speakText = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.8;
      utterance.volume = 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === language) ||
                   voices.find(v => v.lang.startsWith(language.split('-')[0]));
      if (voice) utterance.voice = voice;

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Import Government Market Service
      const GovernmentMarketService = (await import('@/services/GovernmentMarketService')).default;
      const marketService = new GovernmentMarketService();
      
      // Get location using the same service as MarketPrices
      const locationData = await marketService.getCurrentLocation();
      const locationString = `${locationData.city}, ${locationData.state}`;
      setLocation(locationString);

      // Get weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${locationData.lat}&longitude=${locationData.lon}&current_weather=true&hourly=relative_humidity_2m,precipitation&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

      if (weatherData.current_weather) {
        const weatherCode = weatherData.current_weather.weathercode;
        const description = getWeatherDescription(weatherCode);
        
        // Only set weather data if we have a valid description
        if (description && !description.includes('Unknown') && !description.includes('अज्ञात')) {
          setWeather({
            temperature: Math.round(weatherData.current_weather.temperature),
            humidity: Math.round(weatherData.hourly.relative_humidity_2m[0]) || 0,
            description: description,
            precipitation: Math.round(weatherData.hourly.precipitation[0] * 10) / 10 || 0
          });
        } else {
          // Set weather data without description if unclear
          setWeather({
            temperature: Math.round(weatherData.current_weather.temperature),
            humidity: Math.round(weatherData.hourly.relative_humidity_2m[0]) || 0,
            description: '', // Empty description if unclear
            precipitation: Math.round(weatherData.hourly.precipitation[0] * 10) / 10 || 0
          });
        }
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLocation('India');
    } finally {
      setIsLoading(false);
    }
  };

  // Translation utility functions
  const translateUnit = (unit: string): string => {
    if (language !== 'hi-IN') return unit;
    
    const unitTranslations: { [key: string]: string } = {
      'quintal': 'क्विंटल',
      'kg': 'किलो',
      'ton': 'टन',
      'bag': 'बोरी',
      'box': 'बक्सा'
    };
    
    return unitTranslations[unit.toLowerCase()] || unit;
  };
  
  const translateLocation = (locationString: string): string => {
    if (language !== 'hi-IN') return locationString;
    
    const locationTranslations: { [key: string]: string } = {
      'Kolkata': 'कोलकाता',
      'West Bengal': 'पश्चिम बंगाल',
      'Mumbai': 'मुंबई',
      'Delhi': 'दिल्ली',
      'Chennai': 'चेन्नई',
      'Bangalore': 'बेंगलूरु',
      'Hyderabad': 'हैदराबाद',
      'Maharashtra': 'महाराष्ट्र',
      'Gujarat': 'गुजरात',
      'Rajasthan': 'राजस्थान',
      'Punjab': 'पंजाब',
      'Haryana': 'हरियाणा',
      'Uttar Pradesh': 'उत्तर प्रदेश',
      'Bihar': 'बिहार',
      'Odisha': 'ओडिशा',
      'Tamil Nadu': 'तमिलनाडु',
      'Karnataka': 'कर्नाटक',
      'Andhra Pradesh': 'आंध्र प्रदेश'
    };
    
    let translatedLocation = locationString;
    for (const [english, hindi] of Object.entries(locationTranslations)) {
      translatedLocation = translatedLocation.replace(english, hindi);
    }
    
    return translatedLocation;
  };

  const getWeatherDescription = (code: number): string => {
    const weatherCodes: { [key: number]: { [key: string]: string } } = {
      0: { 'hi-IN': 'साफ आसमान', 'mr-IN': 'स्पष्ट आकाश', 'en-IN': 'Clear sky' },
      1: { 'hi-IN': 'मुख्यतः साफ', 'mr-IN': 'मुख्यतः स्पष्ट', 'en-IN': 'Mainly clear' },
      2: { 'hi-IN': 'आंशिक बादल', 'mr-IN': 'आंशिक ढग', 'en-IN': 'Partly cloudy' },
      3: { 'hi-IN': 'घने बादल', 'mr-IN': 'घन ढग', 'en-IN': 'Overcast' },
      51: { 'hi-IN': 'हल्की बारिश', 'mr-IN': 'हलका पाऊस', 'en-IN': 'Light rain' },
      61: { 'hi-IN': 'बारिश', 'mr-IN': 'पाऊस', 'en-IN': 'Rain' },
      95: { 'hi-IN': 'तूफान', 'mr-IN': 'मेघगर्जना', 'en-IN': 'Thunderstorm' }
    };
    
    const descriptions = weatherCodes[code];
    if (descriptions) {
      return descriptions[language] || descriptions['hi-IN'] || descriptions['en-IN'];
    }
    
    return language === 'hi-IN' ? 'अज्ञात' : language === 'mr-IN' ? 'अज्ञात' : 'Unknown';
  };

  const handleVoiceNavigation = (transcript: string) => {
    console.log('Voice command:', transcript);
    
    for (const card of featureCards) {
      for (const keyword of card.keywords) {
        if (transcript.includes(keyword)) {
          speakText(`${card.title} पर जा रहे हैं। Going to ${card.title}.`);
          setTimeout(() => navigate(card.route), 2000);
          return;
        }
      }
    }

    // If no match found
    speakText(currentMessages.voiceHelp);
  };

  const startVoiceListening = () => {
    if (!recognitionRef.current) return;
    
    setIsListening(true);
    speakText(currentMessages.voiceHelp);
    
    setTimeout(() => {
      recognitionRef.current?.start();
    }, 3000);
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleCardClick = (route: string, title: string) => {
    speakText(`${title} खोल रहे हैं। Opening ${title}.`);
    setTimeout(() => navigate(route), 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Sprout className="h-16 w-16 text-emerald-600 mx-auto animate-spin mb-4" />
          <p className="text-xl text-gray-700">
            {language === 'hi-IN' ? 'आपका खेती डैशबोर्ड लोड हो रहा है...' :
             language === 'mr-IN' ? 'तुमचे शेती डॅशबोर्ड लोड होत आहे...' :
             'Loading your farming dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-3 rounded-xl shadow-lg">
                <Sprout className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {language === 'hi-IN' ? `नमस्ते ${profile?.name || 'किसान जी'}` :
                   language === 'mr-IN' ? `नमस्कार ${profile?.name || 'शेतकरी जी'}` :
                   `Hello ${profile?.name || 'Farmer'}`}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile?.cropType && (
                    language === 'hi-IN' ? `${profile.cropType} किसान` :
                    language === 'mr-IN' ? `${profile.cropType} शेतकरी` :
                    `${profile.cropType} farmer`
                  )} • {profile?.village || (
                    language === 'hi-IN' ? 'भारत' :
                    language === 'mr-IN' ? 'भारत' :
                    'India'
                  )}
                </p>
              </div>
            </div>

            {/* Voice Control Button */}
            <Button
              onClick={isListening ? stopVoiceListening : startVoiceListening}
              variant={isListening ? 'destructive' : 'default'}
              size="lg"
              className={`px-4 py-3 rounded-xl ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isListening ? (
                <>
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2"></div>
                  {currentMessages.listening}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" />
                  {language === 'hi-IN' ? 'आवाज़' :
                   language === 'mr-IN' ? 'आवाज' :
                   'Voice'}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 pb-24">{/* Added pb-24 for bottom navigation space */}
        {/* Live Data Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  {language === 'hi-IN' ? 'स्थान' :
                   language === 'mr-IN' ? 'स्थान' :
                   'Location'}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {location ? translateLocation(location) : (language === 'hi-IN' ? 'लोड हो रहा है...' : language === 'mr-IN' ? 'लोड होत आहे...' : 'Loading...')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <Thermometer className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  {language === 'hi-IN' ? 'तापमान' :
                   language === 'mr-IN' ? 'तापमान' :
                   'Temperature'}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {weather ? `${weather.temperature}°C` : 'Loading...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  {language === 'hi-IN' ? 'मंडी' :
                   language === 'mr-IN' ? 'मंडी' :
                   'Market'}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {language === 'hi-IN' ? 'भाव देखें' :
                   language === 'mr-IN' ? 'भाव पहा' :
                   'Check Prices'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Volume2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  {language === 'hi-IN' ? 'भाषा' :
                   language === 'mr-IN' ? 'भाषा' :
                   'Language'}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {language.split('-')[0].toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {featureCards.map((card) => {
            const IconComponent = card.icon;
            const colorClasses = {
              emerald: 'from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600',
              blue: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
              cyan: 'from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600',
              green: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            };

            return (
              <Card 
                key={card.id}
                className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 shadow-lg overflow-hidden group"
                onClick={() => handleCardClick(card.route, card.title)}
              >
                <div className={`bg-gradient-to-r ${colorClasses[card.color as keyof typeof colorClasses]} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 backdrop-blur p-4 rounded-2xl group-hover:scale-110 transition-transform">
                        <IconComponent className="h-12 w-12 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {card.title}
                        </h3>
                        <p className="text-white/90 text-lg">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="text-white/70 group-hover:text-white transition-colors">
                      →
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600">
                      {card.id === 'weather' && weather && (
                        <span>
                          {weather.description ? (
                            language === 'hi-IN' ? `वर्तमान: ${weather.description}, ${weather.humidity}% नमी` :
                            language === 'mr-IN' ? `सद्यस्थिती: ${weather.description}, ${weather.humidity}% आर्द्रता` :
                            `Current: ${weather.description}, ${weather.humidity}% humidity`
                          ) : (
                            language === 'hi-IN' ? `${weather.humidity}% नमी` :
                            language === 'mr-IN' ? `${weather.humidity}% आर्द्रता` :
                            `${weather.humidity}% humidity`
                          )}
                        </span>
                      )}
                      {card.id === 'market' && (
                        <span>
                          {language === 'hi-IN' ? 'लाइव भाव देखें' :
                           language === 'mr-IN' ? 'लाइव भाव पहा' :
                           'View Live Prices'}
                        </span>
                      )}
                      {card.id === 'crop-care' && profile?.cropType && (
                        <span>
                          {language === 'hi-IN' ? `आपकी फसल: ${profile.cropType}` :
                           language === 'mr-IN' ? `तुमचे पिक: ${profile.cropType}` :
                           `Your crop: ${profile.cropType}`}
                        </span>
                      )}
                      {card.id === 'irrigation' && weather && (
                        <span>
                          {language === 'hi-IN' ? `नमी: ${weather.humidity}% • बारिश: ${weather.precipitation}एमएम` :
                           language === 'mr-IN' ? `आर्द्रता: ${weather.humidity}% • पाऊस: ${weather.precipitation}एमएम` :
                           `Humidity: ${weather.humidity}% • Rain: ${weather.precipitation}mm`}
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      {language === 'hi-IN' ? `क्लिक करें या बोलें "${card.title}"` :
                       language === 'mr-IN' ? `क्लिक करा किंवा बोला "${card.title}"` :
                       `Click or Say "${card.title}"`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Voice Help Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Volume2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {language === 'hi-IN' ? 'आवाज़ से नेविगेट करें' :
                   language === 'mr-IN' ? 'आवाजाने नेव्हिगेट करा' :
                   'Navigate with Voice'}
                </h3>
                <p className="text-gray-600">
                  {currentMessages.voiceHelp}
                </p>
              </div>
              <Button
                onClick={startVoiceListening}
                disabled={isListening}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mic className="h-5 w-5 mr-2" />
                {language === 'hi-IN' ? 'बोलें' :
                 language === 'mr-IN' ? 'बोला' :
                 'Speak'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-center gap-8">
          <Button
            variant="ghost"
            size="lg"
            className="flex-col gap-2 h-auto py-3"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">
              {language === 'hi-IN' ? 'होम' :
               language === 'mr-IN' ? 'होम' :
               'Home'}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="flex-col gap-2 h-auto py-3"
            onClick={() => navigate('/help')}
          >
            <HelpCircle className="h-6 w-6" />
            <span className="text-xs">
              {language === 'hi-IN' ? 'मदद' :
               language === 'mr-IN' ? 'मदत' :
               'Help'}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="flex-col gap-2 h-auto py-3"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs">
              {language === 'hi-IN' ? 'सेटिंग्स' :
               language === 'mr-IN' ? 'सेटिंग्स' :
               'Settings'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

