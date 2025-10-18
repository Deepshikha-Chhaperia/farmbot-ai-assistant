import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, HelpCircle, Volume2, Mic, Camera, Sprout, CloudRain, TrendingUp, Droplets } from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';

const Help: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [hasSpokenHelp, setHasSpokenHelp] = useState(false);

  const language = profile?.language || 'hi-IN';

  const messages = {
    'hi-IN': {
      title: 'मदद',
      appDescription: 'यह ऐप किसानों के लिए मौसम, फसल की सलाह और बाजार की कीमतों में मदद करती है।',
      howToUse: 'कैसे उपयोग करें',
      voiceControl: 'आवाज से नियंत्रण',
      photoAnalysis: 'फोटो विश्लेषण',
      features: 'मुख्य फीचर्स',
      weatherFeature: 'मौसम पूर्वानुमान - आज और अगले 3 दिनों का मौसम देखें',
      cropFeature: 'फसल देखभाल - AI से फसल की समस्याओं का समाधान पाएं',
      irrigationFeature: 'सिंचाई सलाह - मौसम के अनुसार पानी देने की सलाह',
      marketFeature: 'बाजार भाव - नजदीकी मंडी के भाव देखें',
      voiceInstructions: 'माइक बटन दबाकर बोलें। ऐप आपकी भाषा समझेगा।',
      photoInstructions: 'कैमरा बटन से फोटो अपलोड करें। AI आपकी फसल की समस्या बताएगा।',
      listenToHelp: 'मदद सुनें'
    },
    'mr-IN': {
      title: 'मदत',
      appDescription: 'हे अॅप शेतकऱ्यांसाठी हवामान, पिकांचा सल्ला आणि बाजाराच्या किमती मध्ये मदत करते.',
      howToUse: 'कसे वापरावे',
      voiceControl: 'आवाजाने नियंत्रण',
      photoAnalysis: 'फोटो विश्लेषण',
      features: 'मुख्य फीचर्स',
      weatherFeature: 'हवामान अंदाज - आज आणि पुढील 3 दिवसांचे हवामान पहा',
      cropFeature: 'पिक काळजी - AI पासून पिकांच्या समस्यांचे निराकरण मिळवा',
      irrigationFeature: 'पाणीपुरवठा सल्ला - हवामान अनुसार पाणी देण्याचा सल्ला',
      marketFeature: 'बाजार भाव - जवळच्या मंडईचे भाव पहा',
      voiceInstructions: 'माइक बटण दाबून बोला. अॅप तुमची भाषा समजेल.',
      photoInstructions: 'कॅमेरा बटणाने फोटो अपलोड करा. AI तुमच्या पिकाची समस्या सांगेल.',
      listenToHelp: 'मदत ऐका'
    },
    'en-IN': {
      title: 'Help',
      appDescription: 'This app helps farmers with weather, crop advice, and market prices.',
      howToUse: 'How to Use',
      voiceControl: 'Voice Control',
      photoAnalysis: 'Photo Analysis',
      features: 'Main Features',
      weatherFeature: 'Weather Forecast - Check today and next 3 days weather',
      cropFeature: 'Crop Care - Get AI solutions for crop problems',
      irrigationFeature: 'Irrigation Advice - Weather-based watering guidance',
      marketFeature: 'Market Prices - Check nearby mandi rates',
      voiceInstructions: 'Press mic button and speak. App will understand your language.',
      photoInstructions: 'Upload photo using camera button. AI will identify your crop problem.',
      listenToHelp: 'Listen to Help'
    }
  };

  const currentMessages = messages[language as keyof typeof messages] || messages['hi-IN'];

  useEffect(() => {
    if (!hasSpokenHelp) {
      setTimeout(() => {
        speakHelpMessage();
        setHasSpokenHelp(true);
      }, 1500);
    }
  }, []);

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

  const speakHelpMessage = () => {
    speakText(currentMessages.appDescription);
  };

  const features = [
    {
      icon: CloudRain,
      title: language === 'hi-IN' ? 'मौसम पूर्वानुमान' : language === 'mr-IN' ? 'हवामान अंदाज' : 'Weather Forecast',
      description: currentMessages.weatherFeature,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: Sprout,
      title: language === 'hi-IN' ? 'फसल देखभाल' : language === 'mr-IN' ? 'पिक काळजी' : 'Crop Care',
      description: currentMessages.cropFeature,
      color: 'text-green-600 bg-green-50'
    },
    {
      icon: Droplets,
      title: language === 'hi-IN' ? 'सिंचाई सलाह' : language === 'mr-IN' ? 'पाणीपुरवठा सल्ला' : 'Irrigation Advice',
      description: currentMessages.irrigationFeature,
      color: 'text-cyan-600 bg-cyan-50'
    },
    {
      icon: TrendingUp,
      title: language === 'hi-IN' ? 'बाजार भाव' : language === 'mr-IN' ? 'बाजार भाव' : 'Market Prices',
      description: currentMessages.marketFeature,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
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
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{currentMessages.title}</h1>
              </div>
            </div>

            <Button
              onClick={speakHelpMessage}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Volume2 className="h-5 w-5 mr-2" />
              {currentMessages.listenToHelp}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {/* App Description */}
        <Card className="mb-8 shadow-xl border-0">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
            <div className="text-center">
              <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">
                {language === 'hi-IN' ? 'फार्मबॉट - आपका AI किसान साथी' :
                 language === 'mr-IN' ? 'फार्मबॉट - तुमचा AI शेतकरी साथी' :
                 'FarmBot - Your AI Kisan Saathi'}
              </h2>
              <p className="text-lg opacity-90">
                {currentMessages.appDescription}
              </p>
            </div>
          </div>
        </Card>

        {/* How to Use */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">{currentMessages.howToUse}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Voice Control */}
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="bg-green-100 p-3 rounded-full">
                <Mic className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">{currentMessages.voiceControl}</h3>
                <p className="text-gray-600">
                  {currentMessages.voiceInstructions}
                </p>
              </div>
            </div>

            {/* Photo Analysis */}
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-3 rounded-full">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">{currentMessages.photoAnalysis}</h3>
                <p className="text-gray-600">
                  {currentMessages.photoInstructions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">{currentMessages.features}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 border-gray-100 hover:shadow-md transition-all cursor-pointer ${feature.color}`}
                  onClick={() => {
                    // Navigate to feature or speak description
                    speakText(feature.description);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <feature.icon className="h-8 w-8 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate('/weather')}
            className="h-16 bg-blue-600 hover:bg-blue-700 flex-col"
          >
            <CloudRain className="h-6 w-6 mb-1" />
            <span className="text-xs">
              {language === 'hi-IN' ? 'मौसम' :
               language === 'mr-IN' ? 'हवामान' :
               'Weather'}
            </span>
          </Button>
          
          <Button
            onClick={() => navigate('/crop-care')}
            className="h-16 bg-green-600 hover:bg-green-700 flex-col"
          >
            <Sprout className="h-6 w-6 mb-1" />
            <span className="text-xs">
              {language === 'hi-IN' ? 'फसल केयर' :
               language === 'mr-IN' ? 'पिक काळजी' :
               'Crop Care'}
            </span>
          </Button>
          
          <Button
            onClick={() => navigate('/irrigation')}
            className="h-16 bg-cyan-600 hover:bg-cyan-700 flex-col"
          >
            <Droplets className="h-6 w-6 mb-1" />
            <span className="text-xs">
              {language === 'hi-IN' ? 'सिंचाई' :
               language === 'mr-IN' ? 'पाणीपुरवठा' :
               'Irrigation'}
            </span>
          </Button>
          
          <Button
            onClick={() => navigate('/market-prices')}
            className="h-16 bg-purple-600 hover:bg-purple-700 flex-col"
          >
            <TrendingUp className="h-6 w-6 mb-1" />
            <span className="text-xs">
              {language === 'hi-IN' ? 'बाजार' :
               language === 'mr-IN' ? 'बाजार' :
               'Market'}
            </span>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Help;

