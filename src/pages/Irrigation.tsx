import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Droplets, 
  ArrowLeft, 
  Volume2, 
  Thermometer,
  Cloud,
  Sun,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';

const Irrigation: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [weather, setWeather] = useState<any>(null);
  const [irrigationAdvice, setIrrigationAdvice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const language = profile?.language || 'hi-IN';

  const messages = {
    'hi-IN': {
      title: 'सिंचाई सलाह',
      subtitle: 'स्मार्ट पानी प्रबंधन',
      recommendation: 'आज की सिफारिश',
      nextWatering: 'अगली सिंचाई',
      soilMoisture: 'मिट्टी की नमी',
      weatherContext: 'मौसम संदर्भ',
      todaysAdvice: 'आज की सलाह',
      wateringTips: 'सिंचाई टिप्स',
      backToDashboard: 'डैशबोर्ड पर वापस',
      speakAdvice: 'सलाह सुनें',
      doWater: 'पानी दें',
      skipWatering: 'पानी न दें',
      waterLater: 'बाद में पानी दें'
    },
    'mr-IN': {
      title: 'पाणीपुरवठा सल्ला',
      subtitle: 'स्मार्ट पाणी व्यवस्थापन',
      recommendation: 'आजची शिफारस',
      nextWatering: 'पुढील पाणीपुरवठा',
      soilMoisture: 'मातीची ओलावा',
      weatherContext: 'हवामान संदर्भ',
      todaysAdvice: 'आजचा सल्ला',
      wateringTips: 'पाणीपुरवठा टिप्स',
      backToDashboard: 'डॅशबोर्डवर परत',
      speakAdvice: 'सल्ला ऐका',
      doWater: 'पाणी द्या',
      skipWatering: 'पाणी देऊ नका',
      waterLater: 'नंतर पाणी द्या'
    },
    'en-IN': {
      title: 'Irrigation Advice',
      subtitle: 'Smart water management',
      recommendation: 'Today\'s Recommendation',
      nextWatering: 'Next Watering',
      soilMoisture: 'Soil Moisture',
      weatherContext: 'Weather Context',
      todaysAdvice: 'Today\'s Advice',
      wateringTips: 'Watering Tips',
      backToDashboard: 'Back to Dashboard',
      speakAdvice: 'Listen to Advice',
      doWater: 'Water Now',
      skipWatering: 'Skip Watering',
      waterLater: 'Water Later'
    }
  };

  const currentMessages = messages[language as keyof typeof messages] || messages['hi-IN'];

  useEffect(() => {
    loadIrrigationData();
  }, []);

  const loadIrrigationData = async () => {
    setIsLoading(true);
    try {
      // Get location and weather
      const locationResponse = await fetch('https://ipapi.co/json/');
      const locationData = await locationResponse.json();

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${locationData.latitude}&longitude=${locationData.longitude}&current=temperature_2m,relative_humidity_2m,precipitation&hourly=precipitation&daily=precipitation_sum,temperature_2m_max&timezone=Asia/Kolkata&forecast_days=2`
      );
      const weatherData = await weatherResponse.json();

      setWeather({
        current: {
          temperature: Math.round(weatherData.current.temperature_2m),
          humidity: Math.round(weatherData.current.relative_humidity_2m),
          precipitation: weatherData.current.precipitation || 0
        },
        tomorrow: {
          maxTemp: Math.round(weatherData.daily.temperature_2m_max[1]),
          precipitation: Math.round((weatherData.daily.precipitation_sum[1] || 0) * 10) / 10
        },
        location: `${locationData.city}, ${locationData.region}`
      });

      // Generate irrigation advice
      const advice = generateIrrigationAdvice(weatherData, profile?.cropType);
      setIrrigationAdvice(advice);

      // Speak advice
      setTimeout(() => {
        speakText(advice.summary);
      }, 2000);

    } catch (error) {
      console.error('Failed to load irrigation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateIrrigationAdvice = (weatherData: any, cropType: string = 'general') => {
    const currentTemp = Math.round(weatherData.current.temperature_2m);
    const humidity = Math.round(weatherData.current.relative_humidity_2m);
    const todayRain = weatherData.current.precipitation || 0;
    const tomorrowRain = weatherData.daily.precipitation_sum[1] || 0;

    let recommendation = 'water_now';
    let timing = 'morning';
    let reason = '';

    // Decision logic
    if (todayRain > 5 || tomorrowRain > 10) {
      recommendation = 'skip_today';
      reason = language === 'hi-IN' ? 'बारिश हो रही है या होगी' : 
               language === 'mr-IN' ? 'पाऊस झाला आहे किंवा होणार आहे' :
               'Rain today or expected tomorrow';
    } else if (humidity > 80) {
      recommendation = 'water_later';
      timing = 'evening';
      reason = language === 'hi-IN' ? 'आज नमी ज्यादा है' :
               language === 'mr-IN' ? 'आज आर्द्रता जास्त आहे' :
               'High humidity today';
    } else if (currentTemp > 35) {
      recommendation = 'water_now';
      timing = 'early_morning';
      reason = language === 'hi-IN' ? 'आज बहुत गर्मी है' :
               language === 'mr-IN' ? 'आज खूप गरमी आहे' :
               'Very hot weather today';
    }

    const summaryMap = {
      'hi-IN': {
        water_now: `आज सुबह ${timing === 'early_morning' ? 'जल्दी' : ''} पानी दें। ${reason}।`,
        skip_today: `आज पानी न दें। ${reason}।`,
        water_later: `आज शाम को पानी दें। ${reason}।`
      },
      'mr-IN': {
        water_now: `आज सकाळी ${timing === 'early_morning' ? 'लवकर' : ''} पाणी द्या. ${reason}.`,
        skip_today: `आज पाणी देऊ नका. ${reason}.`,
        water_later: `आज संध्याकाळी पाणी द्या. ${reason}.`
      },
      'en-IN': {
        water_now: `Water ${timing === 'early_morning' ? 'early morning' : 'this morning'} today. ${reason}.`,
        skip_today: `Skip watering today. ${reason}.`,
        water_later: `Water in the evening today. ${reason}.`
      }
    };

    return {
      recommendation,
      timing,
      reason,
      summary: summaryMap[language as keyof typeof summaryMap][recommendation as keyof typeof summaryMap['hi-IN']],
      soilMoisture: humidity > 70 ? 'good' : humidity > 50 ? 'moderate' : 'low',
      nextWateringHours: recommendation === 'skip_today' ? 24 : timing === 'evening' ? 8 : 2
    };
  };

  const speakText = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.8;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Droplets className="h-16 w-16 text-cyan-600 mx-auto animate-bounce mb-4" />
          <p className="text-xl text-gray-700">
            {language === 'hi-IN' ? 'सिंचाई सलाह लोड हो रही है...' :
             language === 'mr-IN' ? 'पाणीपुरवठा सल्ला लोड होत आहे...' :
             'Loading irrigation advice...'}
          </p>
        </div>
      </div>
    );
  }

  const getRecommendationColor = (rec: string) => {
    if (rec === 'water_now') return 'bg-green-500';
    if (rec === 'skip_today') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getRecommendationIcon = (rec: string) => {
    if (rec === 'water_now') return CheckCircle;
    if (rec === 'skip_today') return AlertTriangle;
    return Clock;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-green-50">
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
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-3 rounded-xl shadow-lg">
                <Droplets className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{currentMessages.title}</h1>
                <p className="text-sm text-gray-600">{weather?.location}</p>
              </div>
            </div>

            <Button
              onClick={() => irrigationAdvice && speakText(irrigationAdvice.summary)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Volume2 className="h-5 w-5 mr-2" />
              {currentMessages.speakAdvice}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {/* Main Recommendation Card */}
        <Card className="mb-8 shadow-xl border-0 overflow-hidden">
          <div className={`${getRecommendationColor(irrigationAdvice?.recommendation || 'water_now')} text-white p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{currentMessages.recommendation}</h2>
                <p className="text-lg opacity-90">
                  {irrigationAdvice?.summary || 'Loading...'}
                </p>
              </div>
              <div className="text-6xl opacity-20">
                {React.createElement(getRecommendationIcon(irrigationAdvice?.recommendation || 'water_now'))}
              </div>
            </div>
          </div>
        </Card>

        {/* Weather Context */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Cloud className="h-6 w-6 text-blue-600" />
              {currentMessages.weatherContext}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Thermometer className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'hi-IN' ? 'तापमान' :
                   language === 'mr-IN' ? 'तापमान' :
                   'Temperature'}
                </p>
                <p className="text-xl font-bold text-orange-600">{weather?.current?.temperature}°C</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Droplets className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'hi-IN' ? 'नमी' :
                   language === 'mr-IN' ? 'आर्द्रता' :
                   'Humidity'}
                </p>
                <p className="text-xl font-bold text-blue-600">{weather?.current?.humidity}%</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Cloud className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'hi-IN' ? 'आज बारिश' :
                   language === 'mr-IN' ? 'आज पाऊस' :
                   'Today Rain'}
                </p>
                <p className="text-xl font-bold text-green-600">{weather?.current?.precipitation}mm</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Sun className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'hi-IN' ? 'कल' :
                   language === 'mr-IN' ? 'उद्या' :
                   'Tomorrow'}
                </p>
                <p className="text-xl font-bold text-purple-600">{weather?.tomorrow?.precipitation}mm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Irrigation Tips */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Droplets className="h-6 w-6 text-cyan-600" />
              {currentMessages.wateringTips}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-cyan-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-cyan-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {language === 'hi-IN' ? 'सही समय' : 
                     language === 'mr-IN' ? 'योग्य वेळ' : 
                     'Right Timing'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {language === 'hi-IN' ? 'सुबह 5-7 बजे या शाम 5-7 बजे पानी दें। दोपहर में न दें।' :
                     language === 'mr-IN' ? 'सकाळी ५-७ वाजता किंवा संध्याकाळी ५-७ वाजता पाणी द्या. दुपारी देऊ नका.' :
                     'Water between 5-7 AM or 5-7 PM. Avoid midday watering.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Droplets className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {language === 'hi-IN' ? 'पानी की मात्रा' :
                     language === 'mr-IN' ? 'पाण्याचे प्रमाण' :
                     'Water Quantity'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {language === 'hi-IN' ? 'मिट्टी में 4-6 इंच तक पानी पहुंचे। ज्यादा पानी न दें।' :
                     language === 'mr-IN' ? 'मातीत ४-६ इंच पर्यंत पाणी पोहोचावे. जास्त पाणी देऊ नका.' :
                     'Water should reach 4-6 inches deep in soil. Don\'t overwater.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {language === 'hi-IN' ? 'बारिश के दिन' :
                     language === 'mr-IN' ? 'पावसाचे दिवस' :
                     'Rainy Days'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {language === 'hi-IN' ? 'बारिश के दिन पानी न दें। जल जमाव से बचें।' :
                     language === 'mr-IN' ? 'पावसाच्या दिवशी पाणी देऊ नका. पाण्याचे साठवण टाळा.' :
                     'Skip watering on rainy days. Avoid waterlogging.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <Button
            onClick={() => navigate('/weather')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Cloud className="h-5 w-5 mr-2" />
            {language === 'hi-IN' ? 'मौसम देखें' :
             language === 'mr-IN' ? 'हवामान पहा' :
             'Check Weather'}
          </Button>
          
          <Button
            onClick={() => navigate('/crop-care')}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
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

export default Irrigation;

