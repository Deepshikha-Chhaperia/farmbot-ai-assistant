import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Volume2, Check, ChevronRight } from 'lucide-react';

interface LanguageOption {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    voiceTest: string;
}

interface FarmerLanguageSelectorProps {
    onLanguageSelect: (languageCode: string) => void;
    currentLanguage: string;
}

const FarmerLanguageSelector: React.FC<FarmerLanguageSelectorProps> = ({
    onLanguageSelect,
    currentLanguage
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Only Hindi and English language options for farmers
    const languages: LanguageOption[] = [
        {
            code: 'hi-IN',
            name: 'Hindi',
            nativeName: 'हिंदी',
            flag: 'IN',
            voiceTest: 'नमस्ते, मैं आपकी कृषि सहायक हूँ। आज मौसम कैसा है?'
        },
        {
            code: 'en-IN',
            name: 'English',
            nativeName: 'English',
            flag: 'GB',
            voiceTest: 'Hello, I am your farming assistant. How is the weather today?'
        }
    ];

    const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

    const testVoice = async (language: LanguageOption) => {
        try {
            const utterance = new SpeechSynthesisUtterance(language.voiceTest);
            utterance.lang = language.code;
            utterance.rate = 0.8;

            // Find the best voice for this language
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang === language.code) ||
                voices.find(v => v.lang.startsWith(language.code.split('-')[0]));

            if (voice) {
                utterance.voice = voice;
                console.log(`Testing voice: ${voice.name} for ${language.nativeName}`);
            }

            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error(`Voice test failed for ${language.nativeName}:`, error);
        }
    };

    const selectLanguage = (language: LanguageOption) => {
        console.log('=== FARMER LANGUAGE SELECTOR ===');
        console.log(`Clicked language: ${language.nativeName} (${language.code})`);
        console.log(`Current language: ${currentLanguage}`);
        console.log(`Languages equal? ${language.code === currentLanguage}`);
        
        // Only call onLanguageSelect if it's a different language
        if (language.code !== currentLanguage) {
            console.log(`Different language selected, calling onLanguageSelect`);
            onLanguageSelect(language.code);
        } else {
            console.log(`Same language clicked, NOT calling onLanguageSelect`);
        }
        
        setIsOpen(false);

        // Auto-test the voice when selected
        setTimeout(() => testVoice(language), 500);
        
        console.log('=== END FARMER LANGUAGE SELECTOR ===');
    };

    if (!isOpen) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 text-lg px-4 py-6"
                >
                    <Languages className="w-5 h-5" />
                    <span className="text-2xl">{currentLang.flag}</span>
                    <span className="font-semibold text-lg">{currentLang.nativeName}</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testVoice(currentLang)}
                    className="px-3 py-2"
                >
                    <Volume2 className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Compact List Layout */}
            <div className="space-y-3 mb-8">
                {languages.map((language) => (
                    <div
                        key={language.code}
                        className={`relative group cursor-pointer transition-all duration-300 ${currentLanguage === language.code
                            ? 'ring-2 ring-blue-500 shadow-lg'
                            : 'hover:shadow-md'
                            }`}
                        onClick={() => selectLanguage(language)}
                    >
                        <div className="bg-white/90 backdrop-blur-lg rounded-xl p-4 border border-gray-200 flex items-center space-x-4 hover:bg-white/95 transition-all">
                            {/* Flag */}
                            <div className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                {language.flag}
                            </div>

                            {/* Language Details */}
                            <div className="flex-grow">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {language.nativeName}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {language.name}
                                </p>
                            </div>

                            {/* Voice Test Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    testVoice(language);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-all duration-200 opacity-70 group-hover:opacity-100"
                                title="Test Voice"
                            >
                                <Volume2 className="h-4 w-4" />
                            </button>

                            {/* Selection Indicator */}
                            {currentLanguage === language.code && (
                                <div className="text-blue-600 flex-shrink-0">
                                    <Check className="h-5 w-5" />
                                </div>
                            )}

                            {/* Chevron for unselected items */}
                            {currentLanguage !== language.code && (
                                <div className="text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Language selection message */}
            <div className="text-center">
                <p className="text-gray-600 text-lg">
                    {currentLanguage === 'hi-IN' ? 'किसी भाषा पर क्लिक करें' : 'Click on any language above to select'}
                </p>
            </div>
        </div>
    );
};

export default FarmerLanguageSelector;

