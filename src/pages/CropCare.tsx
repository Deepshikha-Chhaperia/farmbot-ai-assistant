import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sprout, 
  Camera, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  ArrowLeft, 
  Loader2,
  AlertTriangle,
  Lightbulb,
  Leaf,
  Bug,
  Droplets,
  Sun
} from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';
import AgenticFarmingAI from '@/services/AgenticFarmingAI';

interface ChatMessage {
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  image?: string;
}

const CropCare: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const aiService = useRef(new AgenticFarmingAI());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const language = profile?.language || 'hi-IN';

  // Language-specific messages
  const messages_lang = {
    'hi-IN': {
      title: 'फसल देखभाल',
      subtitle: 'आपकी फसल के बारे में पूछें',
      welcome: `नमस्ते ${profile?.name || 'किसान जी'}! मैं आपकी ${profile?.cropType || 'फसल'} की देखभाल में मदद करूंगा। आप अपनी समस्या बताएं या फोटो अपलोड करें।`,
      placeholder: 'अपनी फसल के बारे में पूछें...',
      listening: 'सुन रहा हूं...',
      processing: 'AI सोच रहा है...',
      uploadPhoto: 'फोटो अपलोड करें',
      askQuestion: 'सवाल पूछें',
      quickQuestions: [
        'मेरी फसल में कीड़े लगे हैं',
        'पत्ते पीले हो रहे हैं',
        'कब पानी दें',
        'खाद कब डालें',
        'रोग की पहचान करें',
        'फसल कब काटें'
      ],
      categories: {
        pests: 'कीट-पतंगे',
        diseases: 'रोग',
        watering: 'सिंचाई',
        fertilizer: 'खाद',
        harvest: 'कटाई'
      }
    },
    'mr-IN': {
      title: 'पिक काळजी',
      subtitle: 'तुमच्या पिकाबद्दल विचारा',
      welcome: `नमस्कार ${profile?.name || 'शेतकरी जी'}! मी तुमच्या ${profile?.cropType || 'पिकाच्या'} काळजीत मदत करेन. तुम्ही तुमची समस्या सांगा किंवा फोटो अपलोड करा.`,
      placeholder: 'तुमच्या पिकाबद्दल विचारा...',
      listening: 'ऐकत आहे...',
      processing: 'AI विचार करत आहे...',
      uploadPhoto: 'फोटो अपलोड करा',
      askQuestion: 'प्रश्न विचारा',
      quickQuestions: [
        'माझ्या पिकावर कीड लागले आहेत',
        'पाने पिवळी होत आहेत',
        'कधी पाणी द्यावे',
        'खत कधी टाकावे',
        'रोगाची ओळख करा',
        'पीक कधी कापावे'
      ],
      categories: {
        pests: 'कीड-पतंग',
        diseases: 'रोग',
        watering: 'पाणीपुरवठा',
        fertilizer: 'खत',
        harvest: 'कापणी'
      }
    },
    'en-IN': {
      title: 'Crop Care',
      subtitle: 'Ask about your crops',
      welcome: `Hello ${profile?.name || 'Farmer'}! I'll help you care for your ${profile?.cropType || 'crops'}. Tell me your problem or upload a photo.`,
      placeholder: 'Ask about your crops...',
      listening: 'Listening...',
      processing: 'AI is thinking...',
      uploadPhoto: 'Upload Photo',
      askQuestion: 'Ask Question',
      quickQuestions: [
        'My crop has pests',
        'Leaves are turning yellow',
        'When to water',
        'When to apply fertilizer',
        'Identify disease',
        'When to harvest'
      ],
      categories: {
        pests: 'Pests',
        diseases: 'Diseases',
        watering: 'Watering',
        fertilizer: 'Fertilizer',
        harvest: 'Harvest'
      }
    }
  };

  const currentMessages = messages_lang[language as keyof typeof messages_lang] || messages_lang['hi-IN'];

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
          const transcript = event.results[0][0].transcript;
          setCurrentInput(transcript);
          setIsListening(false);
          
          // Auto-submit voice input after a short delay
          setTimeout(() => {
            if (transcript.trim()) {
              // Trigger submit with the voice input
              handleVoiceSubmit(transcript.trim());
            }
          }, 500);
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

    // Load weather context for AI
    loadWeatherContext();
  }, [language]);

  // Welcome message
  useEffect(() => {
    if (!hasSpokenWelcome) {
      setTimeout(() => {
        speakText(currentMessages.welcome);
        setHasSpokenWelcome(true);
      }, 1500);
    }
  }, []);

  // Auto scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadWeatherContext = async () => {
    try {
      const weatherData = await aiService.current.getLocationBasedWeather();
      setWeather(weatherData);
    } catch (error) {
      console.error('Weather loading failed:', error);
    }
  };

  const speakText = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      
      // Clean text for speech - remove markdown formatting and ### headers
      let cleanText = text
        .replace(/#{1,6}\s*/g, '')  // Remove ### headers
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1')  // Remove italic markdown
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')  // Remove links
        .replace(/`(.*?)`/g, '$1')  // Remove code blocks
        .replace(/\n+/g, ' ')  // Replace multiple newlines with space
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();
      
      // Allow full text to be spoken - no artificial truncation
      // Split into manageable chunks if too long for single utterance
      if (cleanText.length > 1500) {
        // If extremely long, we can break into sentences and speak them sequentially
        const sentences = cleanText.split(/[।\.|\?|!]/).filter(s => s.trim());
        speakSentencesSequentially(sentences, 0);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
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

  // Helper function to speak long content in chunks
  const speakSentencesSequentially = (sentences: string[], index: number) => {
    if (index >= sentences.length) return;
    
    const utterance = new SpeechSynthesisUtterance(sentences[index].trim() + '।');
    utterance.lang = language;
    utterance.rate = 0.8;
    utterance.volume = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === language) ||
                 voices.find(v => v.lang.startsWith(language.split('-')[0]));
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      // Continue with next sentence after a brief pause
      setTimeout(() => {
        speakSentencesSequentially(sentences, index + 1);
      }, 300);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        const imageQuestion = language === 'hi-IN' 
          ? 'इस फोटो को देखकर समस्या बताएं'
          : language === 'mr-IN'
          ? 'या फोटोला पाहून समस्या सांगा'
          : 'Analyze this photo and identify the problem';
        setCurrentInput(imageQuestion);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceSubmit = async (voiceInput: string) => {
    if (!voiceInput.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      message: voiceInput.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Build context for AI
      let query = voiceInput.trim();

      // Add crop context
      if (profile?.cropType) {
        query += ` My crop is ${profile.cropType}.`;
      }

      // Call Agentic AI with full context
      const response = await aiService.current.processQuery(
        query,
        weather,
        { lat: 0, lon: 0, region: profile?.village || 'India' }
      );

      const botMessage: ChatMessage = {
        type: 'bot',
        message: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response
      speakText(response.response);

    } catch (error) {
      console.error('AI processing failed:', error);
      
      const errorMessage: ChatMessage = {
        type: 'bot',
        message: language === 'hi-IN' 
          ? 'क्षमा करें, मुझे कुछ समस्या आई है। कृपया दोबारा कोशिश करें।'
          : language === 'mr-IN'
          ? 'क्षमा करा, मला काही समस्या आली आहे. कृपया पुन्हा प्रयत्न करा.'
          : 'Sorry, I encountered an issue. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setCurrentInput('');
    }
  };

  const handleSubmit = async () => {
    if (!currentInput.trim() && !uploadedImage) {
      console.log('SUBMIT: No input provided, returning early');
      return;
    }

    console.log('SUBMIT: Processing input:', currentInput, 'Image:', !!uploadedImage);

    const userMessage: ChatMessage = {
      type: 'user',
      message: currentInput.trim() || currentMessages.uploadPhoto,
      timestamp: new Date(),
      image: uploadedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Build context for AI
      let query = currentInput.trim();
      if (uploadedImage) {
        query += ` (फोटो अपलोड की गई है / Photo uploaded)`;
      }

      // Add crop context
      if (profile?.cropType) {
        query += ` My crop is ${profile.cropType}.`;
      }

      console.log('SUBMIT: Calling AI with query:', query);

      // Call Agentic AI with full context
      const response = await aiService.current.processQuery(
        query,
        weather,
        { lat: 0, lon: 0, region: profile?.village || 'India' }
      );

      console.log('SUBMIT: AI response received:', response);

      const botMessage: ChatMessage = {
        type: 'bot',
        message: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response
      speakText(response.response);

    } catch (error) {
      console.error('SUBMIT: AI processing failed:', error);
      
      const errorMessage: ChatMessage = {
        type: 'bot',
        message: language === 'hi-IN' 
          ? 'क्षमा करें, मुझे कुछ समस्या आई है। कृपया दोबारा कोशिश करें।'
          : language === 'mr-IN'
          ? 'क्षमा करा, मला काही समस्या आली आहे. कृपया पुन्हा प्रयत्न करा.'
          : 'Sorry, I encountered an issue. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      console.log('SUBMIT: Setting isProcessing to false');
      setIsProcessing(false);
      setCurrentInput('');
      setUploadedImage(null);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      message: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setCurrentInput(''); // Clear any existing input

    try {
      // Build context for AI
      let query = question.trim();

      // Add crop context
      if (profile?.cropType) {
        query += ` My crop is ${profile.cropType}.`;
      }

      // Call Agentic AI with full context
      const response = await aiService.current.processQuery(
        query,
        weather,
        { lat: 0, lon: 0, region: profile?.village || 'India' }
      );

      const botMessage: ChatMessage = {
        type: 'bot',
        message: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response
      speakText(response.response);

    } catch (error) {
      console.error('AI processing failed:', error);
      
      const errorMessage: ChatMessage = {
        type: 'bot',
        message: language === 'hi-IN' 
          ? 'क्षमा करें, मुझे कुछ समस्या आई है। कृपया दोबारा कोशिश करें।'
          : language === 'mr-IN'
          ? 'क्षमा करा, मला काही समस्या आली आहे. कृपया पुन्हा प्रयत्न करा.'
          : 'Sorry, I encountered an issue. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pests': return Bug;
      case 'diseases': return AlertTriangle;
      case 'watering': return Droplets;
      case 'fertilizer': return Leaf;
      case 'harvest': return Sun;
      default: return Lightbulb;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
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
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 rounded-xl shadow-lg">
                <Sprout className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{currentMessages.title}</h1>
                <p className="text-sm text-gray-600">
                  {profile?.cropType ? (
                    language === 'hi-IN' ? `${profile.cropType} की देखभाल` :
                    language === 'mr-IN' ? `${profile.cropType} ची काळजी` :
                    `${profile.cropType} farming advice`
                  ) : currentMessages.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {/* Quick Question Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {Object.entries(currentMessages.categories).map(([key, label]) => {
            const IconComponent = getCategoryIcon(key);
            return (
              <Button
                key={key}
                variant="outline"
                className="flex-col h-20 text-xs border-green-200 hover:bg-green-50 hover:border-green-300"
                onClick={() => {
                  const questions = currentMessages.quickQuestions.filter(q => {
                    if (key === 'pests') return q.includes('कीड') || q.includes('pest');
                    if (key === 'diseases') return q.includes('पीले') || q.includes('yellow') || q.includes('रोग');
                    if (key === 'watering') return q.includes('पानी') || q.includes('water');
                    if (key === 'fertilizer') return q.includes('खाद') || q.includes('fertilizer');
                    if (key === 'harvest') return q.includes('काटें') || q.includes('harvest');
                    return false;
                  });
                  if (questions.length > 0) {
                    handleQuickQuestion(questions[0]);
                  }
                }}
              >
                <IconComponent className="h-6 w-6 text-green-600 mb-1" />
                <span>{label}</span>
              </Button>
            );
          })}
        </div>

        {/* Chat Interface */}
        <Card className="shadow-xl border-0 h-96 flex flex-col">
          {/* Chat Messages */}
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Sprout className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium">
                    {language === 'hi-IN' ? 'मुझसे अपनी फसल के बारे में पूछें!' :
                     language === 'mr-IN' ? 'मला तुमच्या पिकाबद्दल विचारा!' :
                     'Ask me about your crops!'}
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        msg.type === 'user'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      {msg.image && (
                        <div className="mb-3">
                          <img
                            src={msg.image}
                            alt="Uploaded crop"
                            className="w-full h-32 rounded-lg object-cover border-2 border-white shadow-md"
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
                            onClick={() => speakText(msg.message)}
                            className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
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
                  <div className="bg-white text-gray-800 border border-gray-200 max-w-xs px-4 py-3 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                      <p className="text-sm">{currentMessages.processing}</p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Input Area */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            {/* Image Preview */}
            {uploadedImage && (
              <div className="mb-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <img src={uploadedImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Photo ready for analysis</p>
                    <p className="text-xs text-green-600">AI will examine this image</p>
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
              <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-red-800">{currentMessages.listening}</p>
                </div>
              </div>
            )}

            {/* Input Controls */}
            <div className="flex items-center gap-3">
              {/* Photo Upload */}
              <label htmlFor="crop-photo" className="cursor-pointer">
                <div className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <Camera className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  id="crop-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Voice Button */}
              <Button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={isProcessing}
                className={`p-3 rounded-xl transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              {/* Text Input */}
              <Input
                placeholder={currentMessages.placeholder}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1 rounded-xl border-gray-200"
                disabled={isProcessing}
              />

              {/* Send Button */}
              <Button
                onClick={handleSubmit}
                disabled={(!currentInput.trim() && !uploadedImage) || isProcessing}
                className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Questions */}
        <Card className="mt-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              {language === 'hi-IN' ? 'आम सवाल' :
               language === 'mr-IN' ? 'सामान्य प्रश्न' :
               'Common Questions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentMessages.quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-3 justify-start text-left hover:bg-green-50 border-green-200"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isProcessing}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{question}</span>
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

export default CropCare;

