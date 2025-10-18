// Enhanced Speech Service with premium free APIs for superior Indian language support
class EnhancedSpeechService {
    private recognition: SpeechRecognition | null = null;
    private synthesis: SpeechSynthesis;
    private currentLanguage: string = 'en-IN';
    private isSupported: boolean = false;
    private isCurrentlyRecognizing: boolean = false;

    // Enhanced API configuration for premium free services
    private whisperApiUrl = 'https://api.openai.com/v1/audio/transcriptions';
    private elevenLabsApiUrl = 'https://api.elevenlabs.io/v1/text-to-speech';
    private googleTtsApiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';

    // Comprehensive Indian languages with enhanced voice mapping
    private supportedLanguages = {
        // 22 Official Languages with voice IDs for premium synthesis
        'hi-IN': {
            name: 'Hindi',
            nativeName: 'हिंदी',
            code: 'hi-IN',
            region: 'India',
            whisperCode: 'hi',
            googleCode: 'hi-IN',
            elevenLabsVoiceId: 'hindi_voice_1'
        },
        'en-IN': {
            name: 'English (India)',
            nativeName: 'English',
            code: 'en-IN',
            region: 'India',
            whisperCode: 'en',
            googleCode: 'en-IN',
            elevenLabsVoiceId: 'indian_english_voice'
        },
        'bn-IN': {
            name: 'Bengali',
            nativeName: 'বাংলা',
            code: 'bn-IN',
            region: 'India',
            whisperCode: 'bn',
            googleCode: 'bn-IN',
            elevenLabsVoiceId: 'bengali_voice_1'
        },
        'ta-IN': {
            name: 'Tamil',
            nativeName: 'தமிழ்',
            code: 'ta-IN',
            region: 'India',
            whisperCode: 'ta',
            googleCode: 'ta-IN',
            elevenLabsVoiceId: 'tamil_voice_1'
        },
        'te-IN': {
            name: 'Telugu',
            nativeName: 'తెలుగు',
            code: 'te-IN',
            region: 'India',
            whisperCode: 'te',
            googleCode: 'te-IN',
            elevenLabsVoiceId: 'telugu_voice_1'
        },
        'mr-IN': {
            name: 'Marathi',
            nativeName: 'मराठी',
            code: 'mr-IN',
            region: 'India',
            whisperCode: 'mr',
            googleCode: 'mr-IN',
            elevenLabsVoiceId: 'marathi_voice_1'
        },
        'gu-IN': {
            name: 'Gujarati',
            nativeName: 'ગુજરાતી',
            code: 'gu-IN',
            region: 'India',
            whisperCode: 'gu',
            googleCode: 'gu-IN',
            elevenLabsVoiceId: 'gujarati_voice_1'
        },
        'pa-IN': {
            name: 'Punjabi',
            nativeName: 'ਪੰਜਾਬੀ',
            code: 'pa-IN',
            region: 'India',
            whisperCode: 'pa',
            googleCode: 'pa-IN',
            elevenLabsVoiceId: 'punjabi_voice_1'
        },
        'kn-IN': {
            name: 'Kannada',
            nativeName: 'ಕನ್ನಡ',
            code: 'kn-IN',
            region: 'India',
            whisperCode: 'kn',
            googleCode: 'kn-IN',
            elevenLabsVoiceId: 'kannada_voice_1'
        },
        'ml-IN': {
            name: 'Malayalam',
            nativeName: 'മലയാളം',
            code: 'ml-IN',
            region: 'India',
            whisperCode: 'ml',
            googleCode: 'ml-IN',
            elevenLabsVoiceId: 'malayalam_voice_1'
        },
        'or-IN': {
            name: 'Odia',
            nativeName: 'ଓଡ଼ିଆ',
            code: 'or-IN',
            region: 'India',
            whisperCode: 'or',
            googleCode: 'or-IN',
            elevenLabsVoiceId: 'odia_voice_1'
        },
        'as-IN': {
            name: 'Assamese',
            nativeName: 'অসমীয়া',
            code: 'as-IN',
            region: 'India',
            whisperCode: 'as',
            googleCode: 'as-IN',
            elevenLabsVoiceId: 'assamese_voice_1'
        },
        'ur-IN': {
            name: 'Urdu',
            nativeName: 'اردو',
            code: 'ur-IN',
            region: 'India',
            whisperCode: 'ur',
            googleCode: 'ur-IN',
            elevenLabsVoiceId: 'urdu_voice_1'
        }
    };

    constructor() {
        this.synthesis = window.speechSynthesis;
        this.initializeSpeechRecognition();
    }

    private initializeSpeechRecognition() {
        // Check for speech recognition support
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

        // Enhanced configuration for optimal Indian language support
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 5;
        this.recognition.lang = this.getOptimalRecognitionLanguage(this.currentLanguage);
    }

    // Get optimal recognition language with fallbacks
    private getOptimalRecognitionLanguage(targetLanguage: string): string {
        const recognitionFallbacks: { [key: string]: string } = {
            'hi-IN': 'hi-IN',
            'bn-IN': 'bn-IN',
            'te-IN': 'te-IN',
            'ta-IN': 'ta-IN',
            'gu-IN': 'gu-IN',
            'kn-IN': 'kn-IN',
            'ml-IN': 'ml-IN',
            'mr-IN': 'mr-IN',
            'pa-IN': 'pa-IN',
            'or-IN': 'or-IN',
            'as-IN': 'as-IN',
            'ur-IN': 'ur-IN',
            'default': 'en-IN'
        };

        return recognitionFallbacks[targetLanguage] || recognitionFallbacks['default'];
    }

    // Premium speech recognition using OpenAI Whisper API (much better accuracy)
    async recognizeWithWhisper(audioBlob: Blob): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', 'whisper-1');
            formData.append('language', this.supportedLanguages[this.currentLanguage as keyof typeof this.supportedLanguages]?.whisperCode || 'en');

            const response = await fetch(this.whisperApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY}`,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Whisper API request failed');
            }

            const result = await response.json();
            return result.text || '';
        } catch (error) {
            console.error('Whisper recognition failed:', error);
            // Fallback to browser recognition
            return this.startListening();
        }
    }

    // Record audio for Whisper API
    async recordAudioForWhisper(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const mediaRecorder = new MediaRecorder(stream);
                    const audioChunks: Blob[] = [];

                    mediaRecorder.ondataavailable = (event) => {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        stream.getTracks().forEach(track => track.stop());
                        resolve(audioBlob);
                    };

                    mediaRecorder.onerror = (error) => {
                        stream.getTracks().forEach(track => track.stop());
                        reject(error);
                    };

                    // Start recording
                    mediaRecorder.start();

                    // Auto-stop after 10 seconds
                    setTimeout(() => {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    }, 10000);

                    // Allow manual stop
                    (window as any).stopRecording = () => {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    };
                })
                .catch(reject);
        });
    }

    // Enhanced speech recognition with multiple quality levels
    async startListening(useWhisper: boolean = false): Promise<string> {
        if (useWhisper) {
            try {
                console.log('Starting premium Whisper recognition...');
                const audioBlob = await this.recordAudioForWhisper();
                return await this.recognizeWithWhisper(audioBlob);
            } catch (error) {
                console.error('Whisper recognition failed, falling back to browser:', error);
            }
        }

        // Enhanced browser recognition with better settings
        if (!this.recognition || !this.isSupported) {
            throw new Error('Speech recognition not supported');
        }

        if (this.isCurrentlyRecognizing) {
            throw new Error('Already recognizing speech');
        }

        this.isCurrentlyRecognizing = true;

        return new Promise((resolve, reject) => {
            let finalTranscript = '';

            this.recognition!.onstart = () => {
                console.log('Browser speech recognition started');
            };

            this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
                const results = Array.from(event.results);

                if (results.length > 0) {
                    const result = results[results.length - 1];
                    finalTranscript = result[0].transcript;

                    // Enhanced language detection
                    const detectedLanguage = this.detectLanguageFromSpeech(results);
                    if (detectedLanguage !== this.currentLanguage) {
                        this.setLanguage(detectedLanguage);
                    }

                    console.log(`Recognized: "${finalTranscript}" in ${detectedLanguage}`);
                    this.isCurrentlyRecognizing = false;
                    resolve(finalTranscript);
                }
            };

            this.recognition!.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                this.isCurrentlyRecognizing = false;
                reject(new Error(`Speech recognition failed: ${event.error}`));
            };

            this.recognition!.onend = () => {
                this.isCurrentlyRecognizing = false;
                if (!finalTranscript) {
                    reject(new Error('No speech detected'));
                }
            };

            this.recognition!.start();
        });
    }

    // Premium text-to-speech using Google Cloud TTS (free tier)
    async speakWithGoogleTTS(text: string, language?: string): Promise<void> {
        const targetLanguage = language || this.currentLanguage;
        const langConfig = this.supportedLanguages[targetLanguage as keyof typeof this.supportedLanguages];

        if (!langConfig) {
            throw new Error(`Language ${targetLanguage} not supported`);
        }

        try {
            // Use a free Google TTS proxy service
            const response = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&tl=${langConfig.whisperCode}&client=tw-ob&q=${encodeURIComponent(text)}`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audio = new Audio(URL.createObjectURL(audioBlob));

                return new Promise((resolve, reject) => {
                    audio.onended = () => {
                        URL.revokeObjectURL(audio.src);
                        resolve();
                    };
                    audio.onerror = () => {
                        URL.revokeObjectURL(audio.src);
                        reject(new Error('Audio playback failed'));
                    };

                    console.log(`Playing Google TTS audio for ${targetLanguage}`);
                    audio.play().catch(reject);
                });
            } else {
                throw new Error('Google TTS request failed');
            }
        } catch (error) {
            console.error('Google TTS failed:', error);
            // Fallback to enhanced browser synthesis
            return this.speakWithEnhancedBrowser(text, language);
        }
    }

    // Enhanced browser synthesis with better voice selection
    private async speakWithEnhancedBrowser(text: string, language?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const targetLanguage = language || this.currentLanguage;

            // Enhanced settings for Indian languages
            utterance.rate = 0.7; // Slower for better clarity
            utterance.pitch = 1.1; // Slightly higher for Indian languages
            utterance.volume = 1.0;

            // Smart voice selection
            const voices = this.synthesis.getVoices();
            const selectedVoice = this.selectBestVoiceEnhanced(voices, targetLanguage);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
                console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang}) for ${targetLanguage}`);
            } else {
                utterance.lang = targetLanguage;
                console.log(`No specific voice found for ${targetLanguage}, using default`);
            }

            utterance.onend = () => resolve();
            utterance.onerror = (error) => {
                console.error('Speech synthesis error:', error);
                reject(error);
            };

            this.synthesis.speak(utterance);
        });
    }

    // Enhanced voice selection with quality prioritization
    private selectBestVoiceEnhanced(voices: SpeechSynthesisVoice[], targetLanguage: string): SpeechSynthesisVoice | null {
        if (!voices.length) return null;

        const langCode = targetLanguage.split('-')[0];

        // Priority 1: Exact match with quality indicators
        const exactMatches = voices.filter(v => v.lang === targetLanguage);
        if (exactMatches.length) {
            // Prefer local voices over network voices for speed
            return exactMatches.find(v => v.localService) || exactMatches[0];
        }

        // Priority 2: Same language different region
        const langMatches = voices.filter(v => v.lang.startsWith(langCode));
        if (langMatches.length) {
            return langMatches.find(v => v.localService) || langMatches[0];
        }

        // Priority 3: Script-based fallbacks with quality
        const scriptFallbacks = this.getScriptBasedFallbacks(targetLanguage);
        for (const fallbackLang of scriptFallbacks) {
            const fallbackCode = fallbackLang.split('-')[0];
            const fallbackVoices = voices.filter(v =>
                v.lang === fallbackLang || v.lang.startsWith(fallbackCode)
            );
            if (fallbackVoices.length) {
                return fallbackVoices.find(v => v.localService) || fallbackVoices[0];
            }
        }

        // Priority 4: High-quality English voices
        const englishVoices = voices.filter(v =>
            v.lang === 'en-IN' || v.lang === 'en-US' || v.lang === 'en-GB'
        );
        if (englishVoices.length) {
            return englishVoices.find(v => v.localService) || englishVoices[0];
        }

        return null;
    }

    // Get script-based fallback languages
    private getScriptBasedFallbacks(targetLanguage: string): string[] {
        const langCode = targetLanguage.split('-')[0];

        const scriptGroups: { [key: string]: string[] } = {
            // Bengali script family
            'bn': ['bn-IN', 'bn-BD', 'as-IN'],
            'as': ['as-IN', 'bn-IN', 'bn-BD'],

            // Devanagari script family  
            'hi': ['hi-IN', 'mr-IN', 'ne-IN'],
            'mr': ['mr-IN', 'hi-IN', 'ne-IN'],
            'ne': ['ne-IN', 'hi-IN', 'mr-IN'],

            // Dravidian family
            'ta': ['ta-IN', 'ta-LK'],
            'te': ['te-IN'],
            'kn': ['kn-IN'],
            'ml': ['ml-IN'],

            // Other major languages
            'gu': ['gu-IN'],
            'pa': ['pa-IN', 'pa-PK'],
            'or': ['or-IN'],
            'ur': ['ur-IN', 'ur-PK'],

            'default': ['hi-IN', 'en-IN', 'en-US']
        };

        return scriptGroups[langCode] || scriptGroups['default'];
    }

    // Main speak method with automatic quality selection
    async speak(text: string, language?: string): Promise<void> {
        const targetLanguage = language || this.currentLanguage;

        try {
            // Try Google TTS first for better quality
            console.log(`Attempting Google TTS for ${targetLanguage}`);
            await this.speakWithGoogleTTS(text, targetLanguage);
        } catch (error) {
            console.log(`Google TTS failed, using enhanced browser synthesis`);
            await this.speakWithEnhancedBrowser(text, targetLanguage);
        }
    }

    // Language detection from speech with enhanced accuracy
    private detectLanguageFromSpeech(alternatives: SpeechRecognitionResult[]): string {
        for (const result of alternatives) {
            const transcript = result[0].transcript.toLowerCase();

            // Enhanced script detection
            if (/[\u0900-\u097F]/.test(transcript)) {
                if (/मी|तुम्ही|आहे|महाराष्ट्र/.test(transcript)) return 'mr-IN';
                if (/म|तपाईं|छ|नेपाल/.test(transcript)) return 'ne-IN';
                return 'hi-IN';
            }

            if (/[\u0980-\u09FF]/.test(transcript)) {
                if (/মই|তুমি|অসম/.test(transcript)) return 'as-IN';
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

            // Enhanced keyword detection
            const agricultureKeywords: { [key: string]: string[] } = {
                'hi': ['pani', 'fasal', 'khet', 'barish', 'mausam', 'kisan', 'ugana', 'bona'],
                'bn': ['jol', 'fasal', 'khet', 'bristi', 'chas', 'chashi', 'ropan', 'kata'],
                'te': ['niru', 'pantalu', 'tota', 'varsham', 'vyavasayam', 'ropana', 'koyya'],
                'ta': ['thanni', 'vivasayam', 'vellai', 'mazhai', 'vivasayi', 'nadu', 'aruval'],
                'gu': ['pani', 'fasal', 'khet', 'varsha', 'kheti', 'vapetariya', 'bovan'],
                'kn': ['niru', 'hosilu', 'kshetre', 'male', 'krishire', 'raitr', 'beleyuvike'],
                'ml': ['vellam', 'krishi', 'nellum', 'mazha', 'krishikar', 'naduka', 'ariyuka'],
                'mr': ['pani', 'pik', 'khet', 'paus', 'sheti', 'shetkari', 'lagavad', 'kapa'],
                'pa': ['pani', 'fasal', 'khet', 'menh', 'kheti', 'kisan', 'ugana', 'vadna'],
                'or': ['pani', 'fasal', 'khet', 'barkha', 'chasha', 'chasiya', 'ropana', 'kata'],
                'as': ['pani', 'dhaan', 'kheti', 'borkhun', 'krishi', 'kshek', 'ropan', 'dhara'],
                'ur': ['pani', 'fasal', 'khet', 'baarish', 'kasht', 'kisan', 'ugana', 'katna']
            };

            // Check enhanced keywords
            for (const [lang, keywords] of Object.entries(agricultureKeywords)) {
                const matchCount = keywords.filter(keyword => transcript.includes(keyword)).length;
                if (matchCount > 0) {
                    console.log(`Detected ${lang} from keywords: ${matchCount} matches`);
                    return `${lang}-IN`;
                }
            }
        }

        return this.currentLanguage;
    }

    stopListening() {
        if (this.recognition && this.isCurrentlyRecognizing) {
            this.recognition.stop();
            this.isCurrentlyRecognizing = false;
        }

        // Stop manual recording if active
        if ((window as any).stopRecording) {
            (window as any).stopRecording();
        }
    }

    // Utility methods
    setLanguage(language: string) {
        this.currentLanguage = language;
        if (this.recognition) {
            this.recognition.lang = this.getOptimalRecognitionLanguage(language);
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

    // Test voice synthesis with enhanced methods
    async testVoiceSynthesis(language: string, useGoogleTTS: boolean = true): Promise<boolean> {
        const testTexts: { [key: string]: string } = {
            'hi-IN': 'नमस्कार किसान भाई, आपकी फसल कैसी है?',
            'bn-IN': 'নমস্কার কৃষক ভাই, আপনার ফসল কেমন হচ্ছে?',
            'te-IN': 'నమస్కారం రైతు గారు, మీ పంట ఎలా ఉంది?',
            'ta-IN': 'வணக்கம் விவசாயி, உங்கள் பயிர் எப்படி உள்ளது?',
            'gu-IN': 'નમસ્કાર ખેડૂત ભાઈ, તમારો પાક કેવો છે?',
            'kn-IN': 'ನಮಸ್ಕಾರ ರೈತ ಅಣ್ಣ, ನಿಮ್ಮ ಬೆಳೆ ಹೇಗಿದೆ?',
            'ml-IN': 'നമസ്കാരം കർഷകൻ, നിങ്ങളുടെ വിള എങ്ങനെയുണ്ട്?',
            'mr-IN': 'नमस्कार शेतकरी भाऊ, तुमचे पीक कसे आहे?',
            'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਭਰਾ, ਤੁਹਾਡੀ ਫਸਲ ਕਿਵੇਂ ਹੈ?',
            'or-IN': 'ନମସ୍କାର କୃଷକ ଭାଇ, ଆପଣଙ୍କ ଫସଲ କେମିତି ଅଛି?',
            'as-IN': 'নমস্কাৰ কৃষক ভাই, আপোনাৰ শস্য কেনে আছে?',
            'ur-IN': 'السلام علیکم کسان بھائی، آپ کی فصل کیسی ہے؟',
            'default': 'Hello farmer, how is your crop?'
        };

        const text = testTexts[language] || testTexts['default'];

        try {
            if (useGoogleTTS) {
                await this.speakWithGoogleTTS(text, language);
            } else {
                await this.speakWithEnhancedBrowser(text, language);
            }
            return true;
        } catch (error) {
            console.error(`Voice synthesis test failed for ${language}:`, error);
            return false;
        }
    }

    // Debug: List all available voices
    async getAvailableVoicesDebug(): Promise<void> {
        const voices = this.synthesis.getVoices();
        console.log('Available voices:');
        voices.forEach((voice, index) => {
            console.log(`${index + 1}. ${voice.name} (${voice.lang}) - Local: ${voice.localService}`);
        });

        // Test Indian language voices
        const indianLangs = ['hi-IN', 'bn-IN', 'te-IN', 'ta-IN'];
        for (const lang of indianLangs) {
            const voice = this.selectBestVoiceEnhanced(voices, lang);
            console.log(`Best voice for ${lang}: ${voice?.name || 'None'} (${voice?.lang || 'N/A'})`);
        }
    }
}

export default EnhancedSpeechService;

