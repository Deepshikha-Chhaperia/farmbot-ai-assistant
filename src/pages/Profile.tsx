import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, User, Sprout, MapPin, ArrowRight, SkipForward, Languages } from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';
import { getStaticTranslation, translateMultipleKeys } from '@/utils/translation';
import { translateTextLive, translateProfileDataLive } from '@/utils/realTimeTranslation';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, resetUserSession } = useProfile();
  
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [village, setVillage] = useState('');
  const [currentField, setCurrentField] = useState<'name' | 'crop' | 'village' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentFieldRef = useRef<'name' | 'crop' | 'village' | null>(null);

  // Common Indian crops for dropdown
  const commonCrops = [
    'Rice / धान',
    'Wheat / गेहूं', 
    'Cotton / कपास',
    'Sugarcane / गन्ना',
    'Maize / मक्का',
    'Bajra / बाजरा',
    'Jowar / ज्वार',
    'Onion / प्याज',
    'Potato / आलू',
    'Tomato / टमाटर',
    'Banana / केला',
    'Mango / आम',
    'Orange / संतरा',
    'Coconut / नारियल',
    'Other / अन्य'
  ];

  const language = profile?.language || 'hi-IN';

  // Language-specific messages
  const messages = {
    'hi-IN': {
      welcome: 'नमस्ते! अब आपकी जानकारी भरते हैं। आप बोल सकते हैं या टाइप कर सकते हैं।',
      namePrompt: 'आपका नाम बताएं',
      cropPrompt: 'आप कौन सी फसल उगाते हैं',
      villagePrompt: 'आपका गांव कौन सा है',
      confirmName: 'आपका नाम है',
      confirmCrop: 'आपकी फसल है', 
      confirmVillage: 'आपका गांव है',
      correct: 'सही है',
      tryAgain: 'दोबारा कोशिश करें',
      completed: 'बधाई हो! अब डैशबोर्ड पर जाते हैं।'
    },
    'en-IN': {
      welcome: 'Hello! Now let\'s fill your information. You can speak or type.',
      namePrompt: 'What is your name',
      cropPrompt: 'What crop do you grow',
      villagePrompt: 'Which village are you from',
      confirmName: 'Your name is',
      confirmCrop: 'Your crop is',
      confirmVillage: 'Your village is',
      correct: 'Correct',
      tryAgain: 'Try again', 
      completed: 'Congratulations! Now going to dashboard.'
    }
  };

  const currentMessages = messages[language as keyof typeof messages] || messages['hi-IN'];

  // Handle language change with translation
  const handleLanguageChange = async (newLanguage: string) => {
    console.log(`Switching language from ${language} to ${newLanguage}`);
    setIsTranslating(true);
    
    try {
      // Translate existing form data
      const translatedName = name ? await translateTextLive(name, language, newLanguage) : '';
      const translatedCrop = cropType ? await translateTextLive(cropType, language, newLanguage) : '';
      const translatedVillage = village ? await translateTextLive(village, language, newLanguage) : '';
      
      console.log('Translation results:', {
        name: `"${name}" → "${translatedName}"`,
        crop: `"${cropType}" → "${translatedCrop}"`,
        village: `"${village}" → "${translatedVillage}"`
      });
      
      // Update form fields
      setName(translatedName);
      setCropType(translatedCrop);
      setVillage(translatedVillage);
      
      // Update profile language
      updateProfile({ language: newLanguage });
      
      // Voice confirmation
      const confirmMessage = newLanguage === 'hi-IN' 
        ? 'भाषा बदल गई। आपकी जानकारी अनुवादित कर दी गई।'
        : 'Language switched. Your information has been translated.';
      
      setTimeout(() => {
        speakText(confirmMessage);
      }, 500);
      
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
      };
      
      recognition.onresult = (event) => {
        console.log('Speech recognition onresult fired');
        console.log('Event results:', event.results);
        
        if (event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          console.log('Speech recognition result:', transcript);
          console.log('Confidence:', confidence);
          console.log('Current field from ref:', currentFieldRef.current);
          console.log('Current field from state:', currentField);
          
          // Call handleVoiceInput with transcript and current field
          try {
            handleVoiceInput(transcript, currentFieldRef.current);
            console.log('handleVoiceInput called successfully');
          } catch (error) {
            console.error('Error in handleVoiceInput:', error);
          }
        } else {
          console.warn('No results in speech recognition event');
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setCurrentField(null);
        
        // Show user-friendly error message
        if (event.error === 'no-speech') {
          speakText(language === 'hi-IN' ? 'कुछ नहीं सुनाई दिया। दोबारा कोशिश करें।' : 'No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          alert(language === 'hi-IN' ? 'माइक्रोफोन की अनुमति दें।' : 'Please allow microphone access.');
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  // Welcome message on load
  useEffect(() => {
    if (!hasSpokenWelcome) {
      setTimeout(() => {
        speakText(currentMessages.welcome);
        setHasSpokenWelcome(true);
      }, 1000);
    }
  }, []);

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCropType(profile.cropType || '');
      setVillage(profile.village || '');
    }
  }, [profile]);

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

  const startVoiceInput = (field: 'name' | 'crop' | 'village') => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not available');
      alert(language === 'hi-IN' ? 'माइक्रोफोन उपलब्ध नहीं है।' : 'Speech recognition not available.');
      return;
    }

    // Stop any ongoing recognition
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Ignore errors when stopping
    }

    setCurrentField(field);
    currentFieldRef.current = field; // Sync ref with state
    setIsListening(true);
    
    console.log('Setting current field to:', field);
    console.log('Ref value:', currentFieldRef.current);
    
    // Prompt user based on field
    const prompts = {
      name: currentMessages.namePrompt,
      crop: currentMessages.cropPrompt, 
      village: currentMessages.villagePrompt
    };
    
    speakText(prompts[field]);
    
    // Start recognition after voice prompt finishes
    setTimeout(() => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        setCurrentField(null);
        alert(language === 'hi-IN' ? 'माइक्रोफोन की अनुमति दें।' : 'Please allow microphone access.');
      }
    }, 2500);
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setCurrentField(null);
  };

  // Format crop input with intelligent comma insertion
  const formatCropInput = (input: string): string => {
    if (!input.trim()) return '';
    
    let formatted = input.trim();
    
    // Replace 'and' with commas
    formatted = formatted.replace(/\s+and\s+/gi, ', ');
    
    // Add commas between words that look like crop names
    // Split by spaces and rejoin with commas if multiple words
    const words = formatted.split(/\s+/).filter(word => word.length > 0);
    if (words.length > 1) {
      // Check if it already has proper comma separation
      if (!formatted.includes(',')) {
        formatted = words.join(', ');
      }
    }
    
    // Clean up any double commas or spaces
    formatted = formatted.replace(/,\s*,/g, ',')
                        .replace(/,\s*/g, ', ')
                        .replace(/\s+/g, ' ')
                        .trim();
    
    return formatted;
  };

  const handleVoiceInput = (transcript: string, fieldFromRef: 'name' | 'crop' | 'village' | null = null) => {
    console.log('handleVoiceInput called with:', transcript);
    console.log('Field from ref parameter:', fieldFromRef);
    console.log('Current field state:', currentField);
    console.log('Current name state:', name);
    console.log('Current cropType state:', cropType);
    console.log('Current village state:', village);
    
    const cleanTranscript = transcript.trim();
    const activeField = fieldFromRef || currentField; // Use ref value if available
    
    console.log('Using active field:', activeField);
    
    if (activeField === 'name') {
      console.log('Setting name to:', cleanTranscript);
      setName(cleanTranscript);
      speakText(`${currentMessages.confirmName} ${cleanTranscript}. ${currentMessages.correct}?`);
    } else if (activeField === 'crop') {
      // Format crop input with intelligent comma insertion
      const formattedCrop = formatCropInput(cleanTranscript);
      console.log('Setting crop to:', formattedCrop);
      console.log('Original transcript:', cleanTranscript);
      console.log('Formatted crop:', formattedCrop);
      
      setCropType(formattedCrop);
      speakText(`${currentMessages.confirmCrop} ${formattedCrop}. ${currentMessages.correct}?`);
    } else if (activeField === 'village') {
      console.log('Setting village to:', cleanTranscript);
      setVillage(cleanTranscript);
      speakText(`${currentMessages.confirmVillage} ${cleanTranscript}. ${currentMessages.correct}?`);
    } else {
      console.log('No current field set or invalid field. State:', currentField, 'Ref:', fieldFromRef);
    }
    
    console.log('Clearing current field');
    setCurrentField(null);
    currentFieldRef.current = null; // Clear ref as well
  };

  const handleSubmit = () => {
    if (!name.trim() || !cropType.trim() || !village.trim()) {
      speakText('कृपया सभी जानकारी भरें। Please fill all information.');
      return;
    }

    // Update profile
    updateProfile({
      name: name.trim(),
      cropType: cropType.trim(),
      village: village.trim(),
      isComplete: true
    });

    speakText(currentMessages.completed);

    // Navigate to dashboard
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-2xl shadow-lg">
              <User className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Profile Setup</h1>
              <p className="text-lg text-gray-600">
                {language === 'hi-IN' ? 'अपनी जानकारी भरें' : 
                 'Fill your information'}
              </p>
            </div>
          </div>
          
          {/* Language Switcher */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {language === 'hi-IN' ? 'भाषा:' : 'Language:'}
              </span>
            </div>
            <Select 
              value={language} 
              onValueChange={handleLanguageChange}
              disabled={isTranslating}
            >
              <SelectTrigger className="w-48 bg-white border-2 border-gray-300 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hi-IN">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">IN</span>
                    <span>हिंदी (Hindi)</span>
                  </div>
                </SelectItem>
                <SelectItem value="en-IN">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">GB</span>
                    <span>English</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Translation Status */}
            {isTranslating && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">
                  {language === 'hi-IN' ? 'अनुवाद हो रहा है...' : 'Translating...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-t-lg">
            <CardTitle className="text-center text-xl text-gray-800">
              {language === 'hi-IN' ? 'किसान की जानकारी' :
               'Farmer Information'}
              <span className="block text-sm text-gray-600 mt-1">
                (Maximum 3 fields | अधिकतम 3 फील्ड)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Name Field */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-5 w-5" />
                {language === 'hi-IN' ? 'आपका नाम' :
                 'Your Name'}
              </Label>
              <div className="flex gap-3">
                <Input
                  id="name"
                  type="text"
                  placeholder={language === 'hi-IN' ? 'जैसे: राम कुमार' :
                              'e.g: Ram Kumar'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-400"
                />
                <Button
                  onClick={() => currentField === 'name' ? stopVoiceInput() : startVoiceInput('name')}
                  variant={currentField === 'name' ? 'destructive' : 'outline'}
                  size="lg"
                  className="px-4 py-4 rounded-xl"
                  disabled={isListening && currentField !== 'name'}
                >
                  {currentField === 'name' && isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Crop Type Field */}
            <div className="space-y-3">
              <Label htmlFor="crop" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Sprout className="h-5 w-5" />
                {language === 'hi-IN' ? 'मुख्य फसल' :
                 'Main Crop'}
              </Label>
              <div className="flex gap-3">
                <Input
                  id="crop"
                  type="text"
                  placeholder={language === 'hi-IN' ? 'जैसे: गेहूं, चावल, टमाटर' :
                              'e.g: Wheat, Rice, Tomato'}
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-400"
                />
                <Button
                  onClick={() => currentField === 'crop' ? stopVoiceInput() : startVoiceInput('crop')}
                  variant={currentField === 'crop' ? 'destructive' : 'outline'}
                  size="lg"
                  className="px-4 py-4 rounded-xl"
                  disabled={isListening && currentField !== 'crop'}
                >
                  {currentField === 'crop' && isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Village Field */}
            <div className="space-y-3">
              <Label htmlFor="village" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {language === 'hi-IN' ? 'गांव/शहर' :
                 'Village/City'}
              </Label>
              <div className="flex gap-3">
                <Input
                  id="village"
                  type="text"
                  placeholder={language === 'hi-IN' ? 'जैसे: नागपुर, महाराष्ट्र' :
                              'e.g: Nagpur, Maharashtra'}
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-400"
                />
                <Button
                  onClick={() => currentField === 'village' ? stopVoiceInput() : startVoiceInput('village')}
                  variant={currentField === 'village' ? 'destructive' : 'outline'}
                  size="lg"
                  className="px-4 py-4 rounded-xl"
                  disabled={isListening && currentField !== 'village'}
                >
                  {currentField === 'village' && isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Voice Status */}
            {isListening && (
              <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-lg font-semibold text-red-800">
                    {language === 'hi-IN' ? 'सुन रहा हूं...' :
                     'Listening...'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
                className="flex-1 text-lg py-4 rounded-xl border-2 border-gray-300 hover:bg-gray-100"
              >
                <SkipForward className="h-5 w-5 mr-2" />
                {language === 'hi-IN' ? 'छोड़ें' :
                 'Skip'}
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || !cropType.trim() || !village.trim()}
                size="lg" 
                className="flex-1 text-lg py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {language === 'hi-IN' ? 'आगे बढ़ें' :
                 'Continue'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            {/* Privacy Note */}
            <div className="text-center text-sm text-gray-500 pt-4">
              {language === 'hi-IN' ? 'आपकी जानकारी सुरक्षित है। कोई और इसे नहीं देख सकता।' :
                   'Your information is secure. No other farmer can see it.'}
            </div>
            
            {/* Development Helper - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-center pt-4">
                <details className="inline-block text-left">
                  <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                    Dev Tools
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs space-y-2">
                    <p><strong>User ID:</strong> <code className="bg-white px-1 rounded text-xs">{profile?.userId || 'Not set'}</code></p>
                    <p><strong>Session Test:</strong> Open this URL in new tab/window to test privacy isolation</p>
                    <button 
                      onClick={() => {
                        resetUserSession();
                        window.location.reload();
                      }}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                      Reset Session (Test New User)
                    </button>
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

