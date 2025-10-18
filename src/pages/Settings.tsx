import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings as SettingsIcon, Languages, Volume2, User, Trash2 } from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';
import FarmerLanguageSelector from '@/components/FarmerLanguageSelector';
import { translateProfileDataLive } from '@/utils/realTimeTranslation';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, clearProfile } = useProfile();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const language = profile?.language || 'hi-IN';

  const messages = {
    'hi-IN': {
      title: 'सेटिंग्स',
      languageSettings: 'भाषा सेटिंग्स',
      currentLanguage: 'वर्तमान भाषा',
      changeLanguage: 'भाषा बदलें',
      profileSettings: 'प्रोफाइल सेटिंग्स',
      editProfile: 'प्रोफाइल एडिट करें',
      clearData: 'डेटा साफ करें',
      aboutApp: 'ऐप के बारे में',
      version: 'संस्करण',
      madeFor: 'भारतीय किसानों के लिए बनाया गया',
      name: 'नाम',
      crop: 'फसल',
      village: 'गांव',
      notSet: 'सेट नहीं किया गया'
    },
    'mr-IN': {
      title: 'सेटिंग्ज',
      languageSettings: 'भाषा सेटिंग्ज',
      currentLanguage: 'सध्याची भाषा',
      changeLanguage: 'भाषा बदला',
      profileSettings: 'प्रोफाईल सेटिंग्ज',
      editProfile: 'प्रोफाईल एडिट करा',
      clearData: 'डेटा साफ करा',
      aboutApp: 'अॅपबद्दल',
      version: 'आवृत्ती',
      madeFor: 'भारतीय शेतकऱ्यांसाठी बनवले'
    },
    'en-IN': {
      title: 'Settings',
      languageSettings: 'Language Settings',
      currentLanguage: 'Current Language',
      changeLanguage: 'Change Language',
      profileSettings: 'Profile Settings',
      editProfile: 'Edit Profile',
      clearData: 'Clear Data',
      aboutApp: 'About App',
      version: 'Version',
      madeFor: 'Made for Indian farmers'
    }
  };

  const currentMessages = messages[language as keyof typeof messages] || messages['hi-IN'];

  const handleLanguageChange = async (newLanguage: string) => {
    console.log('=== SETTINGS LANGUAGE CHANGE START ===');
    console.log(`Current language: "${language}"`);
    console.log(`New language: "${newLanguage}"`);
    console.log(`Languages equal? ${language === newLanguage}`);
    
    // Don't do anything if it's the same language
    if (language === newLanguage) {
      console.log('Same language selected, closing selector');
      setShowLanguageSelector(false);
      return;
    }
    
    console.log('Different language selected, proceeding with LIVE translation');
    console.log('Current profile data:', {
      hasProfile: !!profile,
      name: profile?.name || 'NOT SET',
      cropType: profile?.cropType || 'NOT SET',
      village: profile?.village || 'NOT SET',
      language: profile?.language || 'NOT SET'
    });
    
    // Translate existing profile data if it exists
    if (profile && (profile.name || profile.cropType || profile.village)) {
      console.log('Profile data found, calling LIVE translateProfileDataLive...');
      
      try {
        const translatedData = await translateProfileDataLive(
          {
            name: profile.name,
            cropType: profile.cropType,
            village: profile.village
          },
          newLanguage // to new language
        );
        
        console.log('LIVE Translation completed, results:', {
          original: {
            name: profile.name,
            cropType: profile.cropType,
            village: profile.village
          },
          translated: {
            name: translatedData.name,
            cropType: translatedData.cropType,
            village: translatedData.village
          }
        });
        
        const updatedProfile = {
          language: newLanguage,
          name: translatedData.name || profile.name,
          cropType: translatedData.cropType || profile.cropType,
          village: translatedData.village || profile.village
        };
        
        console.log('Calling updateProfile with LIVE translation:', updatedProfile);
        
        // Update profile with translated data and new language
        updateProfile(updatedProfile);
        
        console.log('Profile updated with LIVE translations');
      } catch (error) {
        console.error('LIVE translation failed:', error);
        // Fallback: just update language
        updateProfile({ language: newLanguage });
      }
    } else {
      // No profile data to translate, just update language
      console.log('No profile data to translate, just updating language');
      updateProfile({ language: newLanguage });
    }
    
    setShowLanguageSelector(false);
    
    // Voice confirmation
    const confirmText = newLanguage === 'hi-IN' ? 'भाषा बदल दी गई। आपकी जानकारी अनुवादित कर दी गई।' :
                       newLanguage === 'mr-IN' ? 'भाषा बदलली गेली. तुमची माहिती अनुवादित केली गेली.' :
                       'Language changed. Your information has been translated.';
    
    setTimeout(() => {
      console.log('Speaking confirmation:', confirmText);
      const utterance = new SpeechSynthesisUtterance(confirmText);
      utterance.lang = newLanguage;
      utterance.rate = 0.8;
      utterance.volume = 0.9;
      
      // Find appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === newLanguage) ||
                   voices.find(v => v.lang.startsWith(newLanguage.split('-')[0]));
      if (voice) utterance.voice = voice;
      
      window.speechSynthesis.speak(utterance);
    }, 1000); // Longer delay to allow for API translation
    
    console.log('=== SETTINGS LANGUAGE CHANGE END ===');
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      clearProfile();
      navigate('/');
    }
  };

  if (showLanguageSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <Button onClick={() => setShowLanguageSelector(false)} variant="ghost" className="mb-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Settings
            </Button>
          </div>
          <FarmerLanguageSelector 
            onLanguageSelect={handleLanguageChange}
            currentLanguage={language}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50">
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="lg"
              className="p-2"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-xl shadow-lg">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{currentMessages.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {/* Language Settings */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Languages className="h-6 w-6 text-blue-600" />
              {currentMessages.languageSettings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{currentMessages.currentLanguage}</p>
                <p className="text-gray-600">
                  {language === 'hi-IN' ? 'हिंदी' : language === 'mr-IN' ? 'मराठी' : 'English'}
                </p>
              </div>
              <Button 
                onClick={() => setShowLanguageSelector(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Languages className="h-4 w-4 mr-2" />
                {currentMessages.changeLanguage}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-6 w-6 text-green-600" />
              {currentMessages.profileSettings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">
                    {language === 'hi-IN' ? 'नाम' :
                     language === 'mr-IN' ? 'नाव' :
                     'Name'}: {profile?.name || (
                      language === 'hi-IN' ? 'सेट नहीं किया गया' :
                      language === 'mr-IN' ? 'सेट नाही' :
                      'Not set'
                    )}
                  </p>
                  <p className="text-gray-600">
                    {language === 'hi-IN' ? 'फसल' :
                     language === 'mr-IN' ? 'पिक' :
                     'Crop'}: {profile?.cropType || (
                      language === 'hi-IN' ? 'सेट नहीं किया गया' :
                      language === 'mr-IN' ? 'सेट नाही' :
                      'Not set'
                    )}
                  </p>
                  <p className="text-gray-600">
                    {language === 'hi-IN' ? 'गांव' :
                     language === 'mr-IN' ? 'गाव' :
                     'Village'}: {profile?.village || (
                      language === 'hi-IN' ? 'सेट नहीं किया गया' :
                      language === 'mr-IN' ? 'सेट नाही' :
                      'Not set'
                    )}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  className="border-green-300"
                >
                  <User className="h-4 w-4 mr-2" />
                  {currentMessages.editProfile}
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <Button 
                  onClick={handleClearData}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {currentMessages.clearData}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About App */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-purple-600" />
              {currentMessages.aboutApp}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">FarmBot AI</h3>
              <p className="text-gray-600 mb-4">{currentMessages.madeFor}</p>
              <p className="text-sm text-gray-500">{currentMessages.version} 1.0.0</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;

