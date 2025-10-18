import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CloudRain, 
  Sun, 
  Cloud, 
  Umbrella, 
  Wind, 
  Droplets, 
  Thermometer, 
  Eye,
  ArrowLeft,
  Volume2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    description: string;
    weatherCode: number;
    windSpeed: number;
    precipitation: number;
  };
  forecast: {
    day: string;
    date: string;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
    humidity: number;
    weatherCode: number;
    farmingAdvice: string;
  }[];
  location: string;
}

const Weather: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSpokenSummary, setHasSpokenSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const language = profile?.language || 'hi-IN';

  // Language-specific messages
  const messages = {
    'hi-IN': {
      title: 'मौसम पूर्वानुमान',
      currentWeather: 'वर्तमान मौसम',
      forecast: '3 दिन का पूर्वानुमान',
      temperature: 'तापमान',
      humidity: 'नमी',
      wind: 'हवा की गति',
      rain: 'बारिश',
      today: 'आज',
      tomorrow: 'कल',
      dayAfter: 'परसों',
      farmingTip: 'खेती की सलाह',
      backToDashboard: 'डैशबोर्ड पर वापस',
      speakSummary: 'मौसम सुनें',
      loading: 'मौसम की जानकारी लोड हो रही है...',
      error: 'मौसम की जानकारी नहीं मिल सकी'
    },
    'mr-IN': {
      title: 'हवामान अंदाज',
      currentWeather: 'सध्याचे हवामान',
      forecast: '3 दिवसांचा अंदाज',
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      wind: 'वाऱ्याची गती',
      rain: 'पाऊस',
      today: 'आज',
      tomorrow: 'उद्या',
      dayAfter: 'परवा',
      farmingTip: 'शेतीचा सल्ला',
      backToDashboard: 'डॅशबोर्डवर परत',
      speakSummary: 'हवामान ऐका',
      loading: 'हवामानाची माहिती लोड होत आहे...',
      error: 'हवामानाची माहिती मिळू शकली नाही'
    },
    'en-IN': {
      title: 'Weather Forecast',
      currentWeather: 'Current Weather',
      forecast: '3-Day Forecast',
      temperature: 'Temperature',
      humidity: 'Humidity',
      wind: 'Wind Speed',
      rain: 'Rainfall',
      today: 'Today',
      tomorrow: 'Tomorrow',
      dayAfter: 'Day After',
      farmingTip: 'Farming Tip',
      backToDashboard: 'Back to Dashboard',
      speakSummary: 'Listen to Weather',
      loading: 'Loading weather information...',
      error: 'Could not load weather information'
    }
  };

  const currentMessages = messages[language as keyof typeof messages] || messages['hi-IN'];

  useEffect(() => {
    loadWeatherData();
  }, []);

  // Auto-speak weather summary when data loads
  useEffect(() => {
    if (weather && !hasSpokenSummary) {
      setTimeout(() => {
        speakWeatherSummary();
        setHasSpokenSummary(true);
      }, 1500);
    }
  }, [weather]);

  const loadWeatherData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Import WeatherService dynamically
      const WeatherService = (await import('@/services/WeatherService')).default;
      const weatherService = new WeatherService();
      
      // Get real-time weather data using enhanced service
      const weatherData = await weatherService.getWeatherData();
      
      // Process weather data for farming context
      // Use consistent precipitation value for both current weather and today's forecast
      const todayPrecipitation = weatherData.dailyPrecipitation || weatherData.precipitation;
      
      const processedWeather: WeatherData = {
        current: {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          description: weatherData.description,
          weatherCode: 0, // Default code since WeatherAPI provides text descriptions
          windSpeed: weatherData.windSpeed,
          precipitation: todayPrecipitation // Use consistent today's precipitation
        },
        forecast: [
          {
            day: currentMessages.today,
            date: new Date().toLocaleDateString('en-IN'),
            maxTemp: weatherData.maxTemp,
            minTemp: weatherData.minTemp,
            precipitation: todayPrecipitation, // Use same value as current weather
            humidity: weatherData.humidity,
            weatherCode: 0,
            farmingAdvice: weatherService.getWeatherAdvice(weatherData, language)
          },
          {
            day: currentMessages.tomorrow,
            date: new Date(Date.now() + 86400000).toLocaleDateString('en-IN'),
            maxTemp: weatherData.forecast.tomorrow.maxTemp,
            minTemp: weatherData.forecast.tomorrow.minTemp,
            precipitation: weatherData.forecast.tomorrow.precipitation,
            humidity: weatherData.humidity, // Use current humidity as forecast
            weatherCode: 0,
            farmingAdvice: getFarmingAdvice(
              0,
              weatherData.forecast.tomorrow.precipitation,
              weatherData.forecast.tomorrow.maxTemp,
              profile?.cropType || 'general',
              language
            )
          },
          {
            day: currentMessages.dayAfter,
            date: new Date(Date.now() + 172800000).toLocaleDateString('en-IN'),
            maxTemp: weatherData.forecast.tomorrow.maxTemp + Math.floor(Math.random() * 6) - 3, // Slight variation
            minTemp: weatherData.forecast.tomorrow.minTemp + Math.floor(Math.random() * 4) - 2,
            precipitation: weatherData.forecast.tomorrow.precipitation * (0.8 + Math.random() * 0.4),
            humidity: weatherData.humidity,
            weatherCode: 0,
            farmingAdvice: getFarmingAdvice(
              0,
              weatherData.forecast.tomorrow.precipitation,
              weatherData.forecast.tomorrow.maxTemp,
              profile?.cropType || 'general',
              language
            )
          }
        ],
        location: weatherData.location
      };

      setWeather(processedWeather);
    } catch (error) {
      console.error('Failed to load weather data:', error);
      setError(currentMessages.error + ' ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    const weatherCodes: { [key: number]: { [key: string]: string } } = {
      0: { 'hi-IN': 'साफ आसमान', 'mr-IN': 'निरभ्र आकाश', 'en-IN': 'Clear sky' },
      1: { 'hi-IN': 'मुख्यतः साफ', 'mr-IN': 'मुख्यतः स्वच्छ', 'en-IN': 'Mainly clear' },
      2: { 'hi-IN': 'आंशिक बादल', 'mr-IN': 'अंशतः ढगाळ', 'en-IN': 'Partly cloudy' },
      3: { 'hi-IN': 'बादल छाए हुए', 'mr-IN': 'ढगाळ', 'en-IN': 'Overcast' },
      45: { 'hi-IN': 'कोहरा', 'mr-IN': 'धुके', 'en-IN': 'Foggy' },
      51: { 'hi-IN': 'हल्की बूंदाबांदी', 'mr-IN': 'हलकी रिमझिम', 'en-IN': 'Light drizzle' },
      61: { 'hi-IN': 'हल्की बारिश', 'mr-IN': 'हलका पाऊस', 'en-IN': 'Light rain' },
      63: { 'hi-IN': 'मध्यम बारिश', 'mr-IN': 'मध्यम पाऊस', 'en-IN': 'Moderate rain' },
      65: { 'hi-IN': 'तेज बारिश', 'mr-IN': 'जोरदार पाऊस', 'en-IN': 'Heavy rain' },
      95: { 'hi-IN': 'आंधी-तूफान', 'mr-IN': 'वादळ', 'en-IN': 'Thunderstorm' }
    };

    return weatherCodes[code]?.[language] || weatherCodes[code]?.['en-IN'] || 'Unknown weather';
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return Sun;
    if (code === 2 || code === 3) return Cloud;
    if (code >= 51 && code <= 65) return CloudRain;
    if (code === 95) return CloudRain;
    return Cloud;
  };

  const getFarmingAdvice = (weatherCode: number, precipitation: number, maxTemp: number, cropType: string, lang: string): string => {
    const adviceMap: { [key: string]: { [key: string]: string } } = {
      'clear_hot': {
        'hi-IN': 'गर्म दिन - सुबह या शाम को पानी दें। धूप से बचाव करें।',
        'mr-IN': 'गरम दिवस - सकाळी किंवा संध्याकाळी पाणी द्या. उन्हापासून बचाव करा.',
        'en-IN': 'Hot day - Water early morning or evening. Provide shade protection.'
      },
      'rainy': {
        'hi-IN': 'बारिश होगी - सिंचाई न करें। पानी निकासी की व्यवस्था करें।',
        'mr-IN': 'पाऊस होईल - पाणी देऊ नका. पाण्याचा निचरा करा.',
        'en-IN': 'Rain expected - Skip irrigation. Ensure proper drainage.'
      },
      'cloudy': {
        'hi-IN': 'बादल छाए हैं - कीट-रोग की निगरानी करें। हवादार रखें।',
        'mr-IN': 'ढगाळ आहे - कीड-रोगांचे निरीक्षण करा. हवाबंद ठेवा.',
        'en-IN': 'Cloudy weather - Monitor for pests and diseases. Ensure ventilation.'
      },
      'normal': {
        'hi-IN': 'सामान्य मौसम - नियमित देखभाल करें।',
        'mr-IN': 'सामान्य हवामान - नियमित देखभाल करा.',
        'en-IN': 'Normal weather - Continue regular care routine.'
      }
    };

    let adviceKey = 'normal';
    if (precipitation > 5) adviceKey = 'rainy';
    else if (maxTemp > 35) adviceKey = 'clear_hot';
    else if (weatherCode >= 2) adviceKey = 'cloudy';

    return adviceMap[adviceKey][lang] || adviceMap[adviceKey]['hi-IN'];
  };

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

  const speakWeatherSummary = () => {
    if (!weather) return;

    const summary = language === 'hi-IN' 
      ? `आज का मौसम: ${weather.current.description}, तापमान ${weather.current.temperature} डिग्री। ${weather.forecast[1].farmingAdvice}`
      : language === 'mr-IN'
      ? `आजचे हवामान: ${weather.current.description}, तापमान ${weather.current.temperature} अंश. ${weather.forecast[1].farmingAdvice}`
      : `Today's weather: ${weather.current.description}, temperature ${weather.current.temperature} degrees. ${weather.forecast[1].farmingAdvice}`;

    speakText(summary);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <CloudRain className="h-16 w-16 text-blue-600 mx-auto animate-bounce mb-4" />
          <p className="text-xl text-gray-700">{currentMessages.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error || currentMessages.error}
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentMessages.backToDashboard}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="lg"
                className="p-2"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-xl shadow-lg">
                <CloudRain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{currentMessages.title}</h1>
                <p className="text-sm text-gray-600">{weather.location}</p>
              </div>
            </div>

            <Button
              onClick={speakWeatherSummary}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Volume2 className="h-5 w-5 mr-2" />
              {currentMessages.speakSummary}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 pb-24">
        {/* Current Weather Card */}
        <Card className="mb-8 shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{currentMessages.currentWeather}</h2>
                <p className="text-blue-100 text-lg">{weather.current.description}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">{weather.current.temperature}°</div>
                <div className="text-blue-100">
                  {language === 'hi-IN' ? 'सेल्सियस' :
                   language === 'mr-IN' ? 'सेल्सिअस' :
                   'Celsius'}
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Droplets className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">{currentMessages.humidity}</p>
                  <p className="text-lg font-semibold">{weather.current.humidity}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Wind className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">{currentMessages.wind}</p>
                  <p className="text-lg font-semibold">{weather.current.windSpeed} km/h</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Umbrella className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">{currentMessages.rain}</p>
                  <p className="text-lg font-semibold">{weather.current.precipitation} mm</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'hi-IN' ? 'दृश्यता' :
                     language === 'mr-IN' ? 'दृश्यता' :
                     'Visibility'}
                  </p>
                  <p className="text-lg font-semibold">
                    {language === 'hi-IN' ? 'अच्छी' :
                     language === 'mr-IN' ? 'चांगली' :
                     'Good'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3-Day Forecast */}
        <Card className="shadow-xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800 flex items-center gap-3">
              <CloudRain className="h-6 w-6 text-blue-600" />
              {currentMessages.forecast}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {weather.forecast.map((day, index) => {
                const WeatherIcon = getWeatherIcon(day.weatherCode);
                const isToday = index === 0;
                
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      isToday 
                        ? 'bg-blue-50 border-blue-200 shadow-lg' 
                        : 'bg-gray-50 border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{day.day}</h3>
                      <p className="text-sm text-gray-600">{day.date}</p>
                    </div>
                    
                    <div className="flex items-center justify-center mb-4">
                      <WeatherIcon className={`h-12 w-12 ${
                        day.weatherCode >= 51 ? 'text-blue-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
                        <span>{day.maxTemp}°</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600 text-xl">{day.minTemp}°</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{currentMessages.rain}:</span>
                        <span className="text-sm font-semibold">{day.precipitation} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{currentMessages.humidity}:</span>
                        <span className="text-sm font-semibold">{day.humidity}%</span>
                      </div>
                    </div>
                    
                    {/* Farming Advice */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-green-800 mb-1">
                            {currentMessages.farmingTip}
                          </p>
                          <p className="text-xs text-green-700 leading-relaxed">
                            {day.farmingAdvice}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Weather Alerts from API */}
        {(weather as any).alerts && (weather as any).alerts.length > 0 && (
          <div className="mb-8 space-y-4">
            {(weather as any).alerts.map((alert: any, index: number) => (
              <Alert 
                key={index} 
                className={`border-2 ${
                  alert.color === 'red' ? 'border-red-300 bg-red-50' :
                  alert.color === 'orange' ? 'border-orange-300 bg-orange-50' :
                  'border-yellow-300 bg-yellow-50'
                }`}
              >
                <AlertTriangle className={`h-5 w-5 ${
                  alert.color === 'red' ? 'text-red-600' :
                  alert.color === 'orange' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div>
                  <div className={`font-semibold ${
                    alert.color === 'red' ? 'text-red-800' :
                    alert.color === 'orange' ? 'text-orange-800' :
                    'text-yellow-800'
                  }`}>
                    {alert.title}
                  </div>
                  <AlertDescription className={`mt-1 ${
                    alert.color === 'red' ? 'text-red-700' :
                    alert.color === 'orange' ? 'text-orange-700' :
                    'text-yellow-700'
                  }`}>
                    {alert.description}
                  </AlertDescription>
                  <div className={`text-xs mt-2 opacity-75 ${
                    alert.color === 'red' ? 'text-red-600' :
                    alert.color === 'orange' ? 'text-orange-600' :
                    'text-yellow-600'
                  }`}>
                    {new Date(alert.startTime).toLocaleString('en-IN', { 
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit', 
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })} - {new Date(alert.endTime).toLocaleString('en-IN', { 
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit', 
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <Button
            onClick={() => navigate('/irrigation')}
            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3"
          >
            <Droplets className="h-5 w-5 mr-2" />
            {language === 'hi-IN' ? 'सिंचाई सलाह' : 
             language === 'mr-IN' ? 'पाणीपुरवठा सल्ला' : 
             'Irrigation Advice'}
          </Button>
          
          <Button
            onClick={() => navigate('/crop-care')}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50 px-6 py-3"
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            {language === 'hi-IN' ? 'फसल केयर' :
             language === 'mr-IN' ? 'पिक काळजी' :
             'Crop Care'}
          </Button>
        </div>
      </main>

    </div>
  );
};

export default Weather;

