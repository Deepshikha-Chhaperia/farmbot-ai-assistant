import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sprout, CloudRain, TrendingUp, Volume2, Languages } from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  voiceTest: string;
  description: string;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // Top 2 farming languages in India with voice tests
  const languages: LanguageOption[] = [
    {
      code: 'hi-IN',
      name: 'Hindi',
      nativeName: 'हिंदी',
      flag: 'IN',
      voiceTest: 'हिंदी के लिए यहाँ दबाएं',
      description: 'भारत की सबसे बड़ी भाषा'
    },
    {
      code: 'en-IN',
      name: 'English',
      nativeName: 'English',
      flag: 'GB',
      voiceTest: 'Press here for English',
      description: 'International farming guidance'
    }
  ];

  // Initialize voices and handle voice loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let voicesChangedListener: (() => void) | null = null;

    const initializeVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices loaded:', voices.length);
        setVoicesLoaded(true);
        return true;
      }
      return false;
    };

    // Try to get voices immediately
    if (initializeVoices()) {
      return; // Voices already loaded
    }

    // If voices not loaded, wait for voiceschanged event
    voicesChangedListener = () => {
      console.log('Voices changed event fired');
      if (initializeVoices()) {
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedListener!);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', voicesChangedListener);

    // Fallback: Force voice loading after timeout
    timeoutId = setTimeout(() => {
      console.log('Voice loading timeout, forcing initialization...');
      // Try to force voice loading by speaking empty text
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.cancel();
      
      // Try again after a brief delay
      setTimeout(() => {
        if (initializeVoices() || window.speechSynthesis.getVoices().length === 0) {
          console.log('Fallback: Setting voices as loaded anyway');
          setVoicesLoaded(true);
        }
      }, 500);
    }, 3000); // 3 second timeout

    // Cleanup
    return () => {
      if (voicesChangedListener) {
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedListener);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Set up user interaction detection
  useEffect(() => {
    const handleUserInteraction = () => {
      console.log('User interaction detected!');
      setUserHasInteracted(true);
      
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Auto-announce welcome message when voices are loaded AND user has interacted
  useEffect(() => {
    if (voicesLoaded && userHasInteracted && !hasSpokenWelcome) {
      console.log('Speaking welcome message after user interaction...');
      setTimeout(() => {
        speakWelcomeMessage();
        setHasSpokenWelcome(true);
      }, 500); // Shorter delay since user has already interacted
    }
  }, [voicesLoaded, userHasInteracted, hasSpokenWelcome]);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('farmbot_language');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const speakWelcomeMessage = () => {
    const welcomeMessage = 'नमस्ते! आपका स्वागत है। अपनी भाषा चुनें। Welcome! Please choose your language.';
    speakText(welcomeMessage, 'hi-IN');
  };

  const speakText = (text: string, language: string = 'hi-IN') => {
    try {
      console.log(`Speaking: "${text}" in ${language}`);
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      // Wait a moment before starting new speech
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        // Find best voice for the language
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        
        const voice = voices.find(v => v.lang === language) ||
                     voices.find(v => v.lang.startsWith(language.split('-')[0])) ||
                     voices.find(v => v.lang.includes('hi')) || // Fallback for Hindi
                     voices.find(v => v.lang.includes('en')); // Fallback for English
        
        if (voice) {
          console.log(`Using voice: ${voice.name} (${voice.lang})`);
          utterance.voice = voice;
        } else {
          console.log('No specific voice found, using default');
        }

        // Add event listeners for debugging
        utterance.onstart = () => console.log('Speech started');
        utterance.onend = () => console.log('Speech ended');
        utterance.onerror = (error) => console.error('Speech error:', error);

        window.speechSynthesis.speak(utterance);
      }, 100); // Small delay to ensure cancel() completes
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    }
  };

  const handleLanguageSelect = (language: LanguageOption) => {
    console.log(`Language selected: ${language.nativeName} (${language.code})`);
    
    setSelectedLanguage(language.code);
    
    // Save language preference
    localStorage.setItem('farmbot_language', language.code);
    
    // Update profile with selected language
    updateProfile({ language: language.code });
    
    // Voice confirmation
    const confirmationMessage = language.code === 'hi-IN' 
      ? `हिंदी चुनी गई। अब आपकी जानकारी भरेंगे।`
      : language.code === 'mr-IN'
      ? `मराठी निवडली गेली। आता तुमची माहिती भरू.`
      : `English selected. Now let's fill your information.`;
    
    speakText(confirmationMessage, language.code);
    
    // Navigate to profile page after voice confirmation
    setTimeout(() => {
      navigate('/profile');
    }, 3000);
  };

  const testLanguageVoice = (language: LanguageOption) => {
    speakText(language.voiceTest, language.code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-green-100 p-4 relative overflow-hidden">
      {/* Floating Agricultural Elements for Visual Appeal */}
      <div className="absolute top-20 left-10 opacity-20 animate-pulse">
        <Sprout className="h-32 w-32 text-emerald-500" />
      </div>
      <div className="absolute bottom-20 right-10 opacity-20 animate-bounce">
        <CloudRain className="h-24 w-24 text-blue-500" />
      </div>
      <div className="absolute top-1/3 right-20 opacity-15 animate-pulse">
        <TrendingUp className="h-20 w-20 text-green-500" />
      </div>
      <div className="absolute bottom-1/4 left-1/4 opacity-15 animate-bounce">
        <div className="text-4xl">🌾</div>
      </div>
      <div className="absolute top-1/4 right-1/3 opacity-20">
        <div className="text-3xl">🚜</div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Enhanced Header with Animation */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-6 mb-8 animate-fade-in">
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-6 rounded-3xl shadow-2xl">
              <Sprout className="h-20 w-20 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-2">
                FarmBot
              </h1>
              <p className="text-2xl text-gray-700 font-semibold">Your AI Kisan Saathi</p>
              <p className="text-lg text-gray-600 mt-1">आपका स्मार्ट कृषि सहायक</p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-4 mb-12">
            <h2 className="text-3xl text-gray-800 font-bold">
              🌾 Welcome to Smart Farming
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get personalized farming advice, weather updates, and market prices in your native language
            </p>
            <p className="text-lg text-gray-500">
              Simple • Smart • Speaks Your Language
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-emerald-200">
              <Volume2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Voice Support</h3>
              <p className="text-sm text-gray-600">बोलें और सुनें</p>
            </div>
            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-blue-200">
              <CloudRain className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Live Weather</h3>
              <p className="text-sm text-gray-600">मौसम की जानकारी</p>
            </div>
            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-green-200">
              <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Market Prices</h3>
              <p className="text-sm text-gray-600">बाजार भाव</p>
            </div>
          </div>
        </div>

        {/* Click to Enable Voice Message */}
        {!userHasInteracted && (
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-2xl p-6 mx-auto max-w-2xl shadow-lg animate-pulse">
              <Volume2 className="h-12 w-12 text-yellow-600 mx-auto mb-3 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Click anywhere to enable voice guidance!
              </h3>
              <p className="text-gray-600">
                आवाज़ सुनने के लिए कहीं भी क्लिक करें! | Voice guidance ke liye click karen!
              </p>
            </div>
          </div>
        )}

        {/* Language Selection */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Languages className="h-8 w-8 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-800">
              अपनी भाषा चुनें / Choose Your Language
            </h2>
          </div>
        </div>

        {/* Language Options */}
        <div className="max-w-2xl mx-auto space-y-4 mb-8">
          {languages.map((language) => (
            <div
              key={language.code}
              className={`relative group cursor-pointer transition-all duration-300 ${
                selectedLanguage === language.code
                  ? 'ring-4 ring-emerald-500 shadow-2xl transform scale-105'
                  : 'hover:shadow-xl hover:transform hover:scale-102'
              }`}
            >
              <div 
                onClick={() => handleLanguageSelect(language)}
                className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-2 border-gray-200 hover:border-emerald-300 flex items-center space-x-6 hover:bg-white/95 transition-all"
              >
                {/* Flag */}
                <div className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {language.flag}
                </div>

                {/* Language Details */}
                <div className="flex-grow text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    {language.nativeName}
                  </h3>
                  <p className="text-lg text-gray-600 mb-1">
                    {language.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {language.description}
                  </p>
                </div>

                {/* Voice Test Button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    testLanguageVoice(language);
                  }}
                  variant="outline"
                  size="lg"
                  className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 px-4 py-2"
                  title="Test Voice"
                >
                  <Volume2 className="h-5 w-5" />
                  <span className="ml-2 hidden sm:inline">Test</span>
                </Button>

                {/* Selection Indicator */}
                {selectedLanguage === language.code && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={() => handleLanguageSelect(languages.find(l => l.code === selectedLanguage)!)}
            className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white px-12 py-4 rounded-2xl shadow-xl font-bold text-xl transform hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center gap-3">
              Continue / आगे बढ़ें
              <Sprout className="h-6 w-6" />
            </span>
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Made for Indian farmers with love | भारतीय किसानों के लिए प्यार से बनाया गया
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;

