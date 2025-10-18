// Optimized Speech Service - Free, High-Quality, No API Keys Required
class OptimizedSpeechService {
    private recognition: SpeechRecognition | null = null;
    private synthesis: SpeechSynthesis;
    private currentLanguage: string = 'en-IN';
    private isSupported: boolean = false;
    private isCurrentlyRecognizing: boolean = false;
    private voices: SpeechSynthesisVoice[] = [];

    // Indian languages with optimized browser support
    private supportedLanguages = {
        'hi-IN': { name: 'Hindi', nativeName: 'हिंदी', code: 'hi-IN', fallbacks: ['hi', 'hi-IN'] },
        'en-IN': { name: 'English (India)', nativeName: 'English', code: 'en-IN', fallbacks: ['en-IN', 'en-US', 'en'] },
        'bn-IN': { name: 'Bengali', nativeName: 'বাংলা', code: 'bn-IN', fallbacks: ['bn-IN', 'bn', 'bn-BD'] },
        'ta-IN': { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN', fallbacks: ['ta-IN', 'ta', 'ta-LK'] },
        'te-IN': { name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN', fallbacks: ['te-IN', 'te'] },
        'mr-IN': { name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN', fallbacks: ['mr-IN', 'mr'] },
        'gu-IN': { name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu-IN', fallbacks: ['gu-IN', 'gu'] },
        'pa-IN': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa-IN', fallbacks: ['pa-IN', 'pa'] },
        'kn-IN': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn-IN', fallbacks: ['kn-IN', 'kn'] },
        'ml-IN': { name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-IN', fallbacks: ['ml-IN', 'ml'] },
        'or-IN': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', code: 'or-IN', fallbacks: ['or-IN', 'or'] },
        'as-IN': { name: 'Assamese', nativeName: 'অসমীয়া', code: 'as-IN', fallbacks: ['as-IN', 'as'] },
        'ur-IN': { name: 'Urdu', nativeName: 'اردو', code: 'ur-IN', fallbacks: ['ur-IN', 'ur'] }
    };

    constructor() {
        this.synthesis = window.speechSynthesis;
        this.initializeSpeechRecognition();
        this.loadVoices();
    }

    private async loadVoices(): Promise<void> {
        return new Promise((resolve) => {
            // Force voices to load
            if (this.synthesis.getVoices().length > 0) {
                this.voices = this.synthesis.getVoices();
                this.logAvailableIndianVoices();
                resolve();
                return;
            }

            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
                this.logAvailableIndianVoices();
                resolve();
            };

            // Trigger voices loading
            this.synthesis.speak(new SpeechSynthesisUtterance(''));
        });
    }

    private logAvailableIndianVoices(): void {
        console.log('VOICE: Available Indian language voices:');
        const indianVoices = this.voices.filter(voice =>
            voice.lang.includes('hi') || voice.lang.includes('bn') ||
            voice.lang.includes('ta') || voice.lang.includes('te') ||
            voice.lang.includes('gu') || voice.lang.includes('kn') ||
            voice.lang.includes('ml') || voice.lang.includes('mr') ||
            voice.lang.includes('pa') || voice.lang.includes('or') ||
            voice.lang.includes('as') || voice.lang.includes('ur') ||
            voice.lang.includes('en-IN')
        );

        indianVoices.forEach(voice => {
            console.log(`  • ${voice.name} (${voice.lang}) - Local: ${voice.localService}`);
        });

        if (indianVoices.length === 0) {
            console.log('  WARNING: No Indian language voices found. Available voices:');
            this.voices.slice(0, 10).forEach(voice => {
                console.log(`    • ${voice.name} (${voice.lang})`);
            });
        }
    }

    private initializeSpeechRecognition() {
        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (SpeechRecognitionAPI) {
            this.recognition = new SpeechRecognitionAPI();
            this.isSupported = true;
            this.setupRecognition();
        } else {
            console.warn('Speech Recognition not supported in this browser');
            this.isSupported = false;
        }
    }

    private setupRecognition() {
        if (!this.recognition) return;

        // Optimized settings for Indian languages
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1; // Simplified for stability
        this.recognition.lang = this.currentLanguage;
    }

    // Simple, reliable speech recognition
    async startListening(): Promise<string> {
        if (!this.recognition || !this.isSupported) {
            throw new Error('Speech recognition not supported');
        }

        if (this.isCurrentlyRecognizing) {
            this.recognition.stop();
            this.isCurrentlyRecognizing = false;
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.isCurrentlyRecognizing = true;

        return new Promise((resolve, reject) => {
            let finalTranscript = '';
            let timeoutId: NodeJS.Timeout;

            // Set up timeout
            timeoutId = setTimeout(() => {
                if (this.recognition && this.isCurrentlyRecognizing) {
                    this.recognition.stop();
                    this.isCurrentlyRecognizing = false;
                    reject(new Error('Speech recognition timeout'));
                }
            }, 10000); // 10 second timeout

            this.recognition!.onstart = () => {
                console.log('LISTEN: Listening for speech...');
            };

            this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
                clearTimeout(timeoutId);
                const results = Array.from(event.results);

                if (results.length > 0) {
                    const result = results[results.length - 1];
                    finalTranscript = result[0].transcript;

                    // Simple language detection
                    const detectedLanguage = this.detectLanguageSimple(finalTranscript);
                    if (detectedLanguage !== this.currentLanguage) {
                        this.setLanguage(detectedLanguage);
                    }

                    console.log(`Recognized: "${finalTranscript}" (${detectedLanguage})`);
                    this.isCurrentlyRecognizing = false;
                    resolve(finalTranscript);
                }
            };

            this.recognition!.onerror = (event: any) => {
                clearTimeout(timeoutId);
                console.error('Speech recognition error:', event.error);
                this.isCurrentlyRecognizing = false;
                reject(new Error(`Speech recognition failed: ${event.error}`));
            };

            this.recognition!.onend = () => {
                clearTimeout(timeoutId);
                this.isCurrentlyRecognizing = false;
                if (!finalTranscript) {
                    reject(new Error('No speech detected'));
                }
            };

            // Start with optimal language setting
            this.recognition!.lang = this.currentLanguage;
            this.recognition!.start();
        });
    }

    stopListening() {
        if (this.recognition && this.isCurrentlyRecognizing) {
            this.recognition.stop();
            this.isCurrentlyRecognizing = false;
        }
    }

    // Optimized voice synthesis with reliable Bengali support
    async speak(text: string, language?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            // Cancel any ongoing speech
            this.synthesis.cancel();

            const targetLanguage = language || this.currentLanguage;
            const utterance = new SpeechSynthesisUtterance(text);

            // Optimized settings for clarity
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Smart voice selection with guaranteed fallbacks
            const selectedVoice = this.selectOptimalVoice(targetLanguage);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
                console.log(`SPEAKER: Speaking with: ${selectedVoice.name} (${selectedVoice.lang}) for "${targetLanguage}"`);
            } else {
                utterance.lang = targetLanguage;
                console.log(`SPEAKER: Using default voice for: ${targetLanguage}`);
            }

            utterance.onend = () => {
                console.log(`Speech completed for ${targetLanguage}`);
                resolve();
            };

            utterance.onerror = (error) => {
                console.error(`Speech synthesis error for ${targetLanguage}:`, error);
                reject(error);
            };

            this.synthesis.speak(utterance);
        });
    }

    // Highly optimized voice selection for Indian languages
    private selectOptimalVoice(targetLanguage: string): SpeechSynthesisVoice | null {
        if (!this.voices.length) return null;

        const langConfig = this.supportedLanguages[targetLanguage as keyof typeof this.supportedLanguages];
        if (!langConfig) return null;

        // Try each fallback in order
        for (const fallbackLang of langConfig.fallbacks) {
            // First try exact match
            let voice = this.voices.find(v => v.lang === fallbackLang);
            if (voice) {
                console.log(`MATCH: Found exact voice match: ${voice.name} (${voice.lang})`);
                return voice;
            }

            // Then try partial match
            voice = this.voices.find(v => v.lang.startsWith(fallbackLang.split('-')[0]));
            if (voice) {
                console.log(`MATCH: Found partial voice match: ${voice.name} (${voice.lang})`);
                return voice;
            }
        }

        // Special handling for Bengali - try additional fallbacks
        if (targetLanguage === 'bn-IN') {
            console.log('SEARCH: Special Bengali voice search...');

            // Look for any Bengali-related voice
            let bengaliVoice = this.voices.find(v =>
                v.name.toLowerCase().includes('bengali') ||
                v.name.toLowerCase().includes('bangla') ||
                v.lang.includes('bn')
            );

            if (bengaliVoice) {
                console.log(`MATCH: Found Bengali voice: ${bengaliVoice.name} (${bengaliVoice.lang})`);
                return bengaliVoice;
            }

            // Try Hindi as closest fallback for Bengali
            const hindiVoice = this.voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi');
            if (hindiVoice) {
                console.log(`Using Hindi voice for Bengali: ${hindiVoice.name} (${hindiVoice.lang})`);
                return hindiVoice;
            }
        }

        // Final fallback to any English voice
        const englishVoice = this.voices.find(v =>
            v.lang === 'en-IN' || v.lang === 'en-US' || v.lang.startsWith('en')
        );

        if (englishVoice) {
            console.log(`Fallback to English: ${englishVoice.name} (${englishVoice.lang})`);
            return englishVoice;
        }

        return null;
    }

    // Simple but effective language detection
    private detectLanguageSimple(transcript: string): string {
        const text = transcript.toLowerCase();

        // Script-based detection
        if (/[\u0900-\u097F]/.test(transcript)) {
            if (/मी|तुम्ही|आहे|मराठी/.test(transcript)) return 'mr-IN';
            return 'hi-IN';
        }
        if (/[\u0980-\u09FF]/.test(transcript)) {
            if (/মই|অসম/.test(transcript)) return 'as-IN';
            return 'bn-IN';
        }
        if (/[\u0C00-\u0C7F]/.test(transcript)) return 'te-IN';
        if (/[\u0B80-\u0BFF]/.test(transcript)) return 'ta-IN';
        if (/[\u0A80-\u0AFF]/.test(transcript)) return 'gu-IN';
        if (/[\u0C80-\u0CFF]/.test(transcript)) return 'kn-IN';
        if (/[\u0D00-\u0D7F]/.test(transcript)) return 'ml-IN';
        if (/[\u0A00-\u0A7F]/.test(transcript)) return 'pa-IN';
        if (/[\u0B00-\u0B7F]/.test(transcript)) return 'or-IN';
        if (/[\u0600-\u06FF]/.test(transcript)) return 'ur-IN';

        // Simple keyword detection
        const keywords = {
            'hi': ['pani', 'fasal', 'khet', 'kisan', 'barish', 'mausam'],
            'bn': ['jol', 'fasal', 'khet', 'chashi', 'bristi', 'aabohawa'],
            'ta': ['thanni', 'vivasayam', 'nilam', 'mazhai'],
            'te': ['niru', 'pantalu', 'bhumi', 'varsham'],
            'gu': ['pani', 'fasal', 'khet', 'varsha'],
            'kn': ['niru', 'hosilu', 'kshetre', 'male'],
            'ml': ['vellam', 'krishi', 'bhumi', 'mazha'],
            'mr': ['pani', 'pik', 'khet', 'paus'],
            'pa': ['pani', 'fasal', 'khet', 'menh'],
            'or': ['pani', 'fasal', 'khet', 'barkha'],
            'as': ['pani', 'dhaan', 'kheti', 'borkhun'],
            'ur': ['pani', 'fasal', 'khet', 'baarish']
        };

        for (const [lang, words] of Object.entries(keywords)) {
            if (words.some(word => text.includes(word))) {
                return `${lang}-IN`;
            }
        }

        return this.currentLanguage;
    }

    // Test voice synthesis for debugging
    async testVoiceSynthesis(language: string): Promise<boolean> {
        const testTexts: { [key: string]: string } = {
            'hi-IN': 'नमस्कार किसान भाई',
            'bn-IN': 'নমস্কার কৃষক ভাই',
            'te-IN': 'నమస్కారం రైతు గారు',
            'ta-IN': 'வணக்கம் விவசாயி',
            'gu-IN': 'નમસ્કાર ખેડૂત ભાઈ',
            'kn-IN': 'ನಮಸ್ಕಾರ ರೈತ ಅಣ್ಣ',
            'ml-IN': 'നമസ്കാരം കർഷകൻ',
            'mr-IN': 'नमस्कार शेतकरी भाऊ',
            'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਭਰਾ',
            'or-IN': 'ନମସ୍କାର କୃଷକ ଭାଇ',
            'as-IN': 'নমস্কাৰ কৃষক ভাই',
            'ur-IN': 'السلام علیکم کسان بھائی',
            'default': 'Hello farmer'
        };

        const text = testTexts[language] || testTexts['default'];

        try {
            console.log(`Testing voice for ${language}: "${text}"`);
            await this.speak(text, language);
            return true;
        } catch (error) {
            console.error(`Voice test failed for ${language}:`, error);
            return false;
        }
    }

    // Debug available voices for a specific language
    debugVoicesForLanguage(language: string): void {
        const langCode = language.split('-')[0];
        const relevantVoices = this.voices.filter(v =>
            v.lang === language ||
            v.lang.startsWith(langCode) ||
            v.name.toLowerCase().includes(langCode)
        );

        console.log(`Voices for ${language}:`);
        if (relevantVoices.length > 0) {
            relevantVoices.forEach((voice, index) => {
                console.log(`  ${index + 1}. ${voice.name} (${voice.lang}) - Local: ${voice.localService}`);
            });
        } else {
            console.log(`  No voices found for ${language}`);
            console.log(`  Available languages: ${[...new Set(this.voices.map(v => v.lang))].join(', ')}`);
        }
    }

    // Force Bengali voice specifically
    async speakBengali(text: string): Promise<void> {
        console.log('SPEAKER: Forcing Bengali voice synthesis...');

        // Try multiple Bengali configurations
        const bengaliConfigs = [
            { lang: 'bn-IN', name: 'Bengali India' },
            { lang: 'bn-BD', name: 'Bengali Bangladesh' },
            { lang: 'bn', name: 'Bengali Generic' }
        ];

        for (const config of bengaliConfigs) {
            const voice = this.voices.find(v => v.lang === config.lang);
            if (voice) {
                console.log(`Found Bengali voice: ${voice.name} (${voice.lang})`);

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = voice;
                utterance.lang = voice.lang;
                utterance.rate = 0.8;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                return new Promise((resolve, reject) => {
                    utterance.onend = () => resolve();
                    utterance.onerror = reject;
                    this.synthesis.speak(utterance);
                });
            }
        }

        // If no Bengali voice found, use Hindi as closest fallback
        console.log('WARNING: No Bengali voice found, using Hindi fallback');
        const hindiVoice = this.voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi');

        if (hindiVoice) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = hindiVoice;
            utterance.lang = hindiVoice.lang;
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            return new Promise((resolve, reject) => {
                utterance.onend = () => resolve();
                utterance.onerror = reject;
                this.synthesis.speak(utterance);
            });
        }

        throw new Error('No suitable voice found for Bengali');
    }

    // Utility methods
    setLanguage(language: string) {
        this.currentLanguage = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }

    getCurrentLanguage(): string {
        return this.currentLanguage;
    }

    isRecognitionSupported(): boolean {
        return this.isSupported;
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    // Get all available voices (for debugging)
    getAllVoices(): SpeechSynthesisVoice[] {
        return this.voices;
    }

    // Check if Bengali voice is available
    isBengaliVoiceAvailable(): boolean {
        return this.voices.some(v =>
            v.lang.includes('bn') ||
            v.name.toLowerCase().includes('bengali') ||
            v.name.toLowerCase().includes('bangla')
        );
    }
}

export default OptimizedSpeechService;

