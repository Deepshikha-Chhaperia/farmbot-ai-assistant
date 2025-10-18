// ElevenLabs Premium Speech Service - High Quality Multilingual TTS
class ElevenLabsSpeechService {
    private recognition: SpeechRecognition | null = null;
    private synthesis: SpeechSynthesis;
    private currentLanguage: string = 'en-IN';
    private isSupported: boolean = false;
    private isCurrentlyRecognizing: boolean = false;
    private apiKey: string = '';

    // ElevenLabs voice mapping for Indian languages
    private elevenLabsVoices = {
        'hi-IN': { voiceId: 'pMsXgVXv3BLzUgSXRplE', name: 'Adam (Hindi optimized)', language: 'hindi' },
        'en-IN': { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Indian English)', language: 'english' },
        'bn-IN': { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Bengali)', language: 'bengali' },
        'ta-IN': { voiceId: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Tamil)', language: 'tamil' },
        'te-IN': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Sam (Telugu)', language: 'telugu' },
        'mr-IN': { voiceId: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Marathi)', language: 'marathi' },
        'gu-IN': { voiceId: 'CYw3kZ02Hs0563khs1Fj', name: 'Drew (Gujarati)', language: 'gujarati' },
        'pa-IN': { voiceId: 'SOYHLrjzK2X1ezoPC6cr', name: 'Dave (Punjabi)', language: 'punjabi' },
        'kn-IN': { voiceId: 'pqHfZKP75CvOlQylNhV4', name: 'Bill (Kannada)', language: 'kannada' },
        'ml-IN': { voiceId: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum (Malayalam)', language: 'malayalam' },
        'or-IN': { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Odia)', language: 'odia' },
        'as-IN': { voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Assamese)', language: 'assamese' },
        'ur-IN': { voiceId: 'bIHbv24MWmeRgasZH58o', name: 'Will (Urdu)', language: 'urdu' }
    };

    constructor() {
        this.synthesis = window.speechSynthesis;
        this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
        this.initializeSpeechRecognition();
        this.isSupported = this.checkSupport();

        if (!this.apiKey) {
            console.warn('ElevenLabs API key not found. Will use browser fallback.');
        } else {
            console.log('ElevenLabs API key configured!');
        }
    }

    private checkSupport(): boolean {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    private initializeSpeechRecognition(): void {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.maxAlternatives = 5;
                this.recognition.lang = this.currentLanguage;
            }
        } catch (error) {
            console.error('Speech recognition not supported:', error);
            this.isSupported = false;
        }
    }

    // Premium ElevenLabs Text-to-Speech with browser fallback
    async speak(text: string, languageCode: string = 'en-IN'): Promise<void> {
        try {
            console.log(`ElevenLabs TTS: Speaking "${text}" in ${languageCode}`);

            // Try ElevenLabs first if API key is available
            if (this.apiKey && this.elevenLabsVoices[languageCode]) {
                const success = await this.speakWithElevenLabs(text, languageCode);
                if (success) return;
            }

            // Fallback to optimized browser synthesis
            console.log('Falling back to optimized browser synthesis');
            await this.speakWithBrowser(text, languageCode);

        } catch (error) {
            console.error('Speech synthesis error:', error);
            throw new Error(`Speech synthesis failed: ${error.message}`);
        }
    }

    private async speakWithElevenLabs(text: string, languageCode: string): Promise<boolean> {
        try {
            const voiceConfig = this.elevenLabsVoices[languageCode];
            if (!voiceConfig) {
                console.log(`No ElevenLabs voice configured for ${languageCode}`);
                return false;
            }

            console.log(`Using ElevenLabs voice: ${voiceConfig.name} for ${languageCode}`);

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.8,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('ElevenLabs API error:', response.status, response.statusText, errorText);

                // If voice doesn't exist, try first available voice
                if (response.status === 422 || response.status === 404) {
                    console.log('Voice not found, trying with first available voice...');
                    return await this.tryWithFirstAvailableVoice(text);
                }
                return false;
            }

            const audioBuffer = await response.arrayBuffer();
            const audioContext = new AudioContext();
            const audioBufferDecoded = await audioContext.decodeAudioData(audioBuffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBufferDecoded;
            source.connect(audioContext.destination);
            source.start(0);

            console.log('ElevenLabs synthesis completed successfully');
            return true;

        } catch (error) {
            console.error('ElevenLabs synthesis error:', error);
            return false;
        }
    }

    private async tryWithFirstAvailableVoice(text: string): Promise<boolean> {
        try {
            // Get available voices from your account
            const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            if (!voicesResponse.ok) {
                console.error('Failed to get available voices');
                return false;
            }

            const voicesData = await voicesResponse.json();
            if (!voicesData.voices || voicesData.voices.length === 0) {
                console.error('No voices available in account');
                return false;
            }

            // Use the first available voice
            const firstVoice = voicesData.voices[0];
            console.log(`Using first available voice: ${firstVoice.name} (${firstVoice.voice_id})`);

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${firstVoice.voice_id}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.8,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                })
            });

            if (!response.ok) {
                console.error('Failed with first available voice too');
                return false;
            }

            const audioBuffer = await response.arrayBuffer();
            const audioContext = new AudioContext();
            const audioBufferDecoded = await audioContext.decodeAudioData(audioBuffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBufferDecoded;
            source.connect(audioContext.destination);
            source.start(0);

            console.log('ElevenLabs synthesis with first available voice completed');
            return true;

        } catch (error) {
            console.error('Error trying first available voice:', error);
            return false;
        }
    }

    private async speakWithBrowser(text: string, languageCode: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.synthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);

                // Wait for voices to load if they haven't yet
                if (this.synthesis.getVoices().length === 0) {
                    console.log('Waiting for voices to load...');
                    this.synthesis.onvoiceschanged = () => {
                        const voice = this.selectBestBrowserVoice(languageCode);
                        if (voice) {
                            utterance.voice = voice;
                            console.log(`Browser voice (after load): ${voice.name} (${voice.lang})`);
                        } else {
                            console.warn(`No voice found for ${languageCode}, using system default`);
                        }

                        utterance.lang = languageCode;
                        utterance.rate = 0.85;
                        utterance.pitch = 1.0;
                        utterance.volume = 1.0;
                        utterance.onend = () => {
                            console.log(`Browser synthesis completed for ${languageCode}`);
                            resolve();
                        };
                        utterance.onerror = (event) => {
                            console.error('Browser synthesis error:', event.error, 'but continuing...');
                            setTimeout(() => resolve(), 100);
                        };
                        this.synthesis.speak(utterance);
                    };
                    return;
                }

                const voice = this.selectBestBrowserVoice(languageCode);
                if (voice) {
                    utterance.voice = voice;
                    console.log(`Browser voice: ${voice.name} (${voice.lang})`);
                } else {
                    console.warn(`No voice found for ${languageCode}, using system default`);
                }

                utterance.lang = languageCode;
                utterance.rate = 0.85;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                utterance.onend = () => {
                    console.log(`Browser synthesis completed for ${languageCode}`);
                    resolve();
                };

                utterance.onerror = (event) => {
                    console.error('Browser synthesis error:', event.error, 'but continuing...');
                    // Don't reject - sometimes errors are spurious, especially for Indian languages
                    setTimeout(() => resolve(), 100);
                };

                this.synthesis.speak(utterance);
                console.log(`Speaking: "${text}" in ${languageCode}`);

            } catch (error) {
                console.error('Browser synthesis setup error:', error, 'but continuing...');
                // Try to continue anyway
                setTimeout(() => resolve(), 100);
            }
        });
    }

    private selectBestBrowserVoice(languageCode: string): SpeechSynthesisVoice | null {
        const voices = this.synthesis.getVoices();
        const langPrefix = languageCode.split('-')[0];

        console.log(`Looking for voice for ${languageCode} from ${voices.length} available voices`);

        // Log some available voices for debugging
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`).slice(0, 10));

        // Strategy 1: Exact match
        let voice = voices.find(v => v.lang === languageCode);
        if (voice) {
            console.log(`Exact match: ${voice.name} (${voice.lang})`);
            return voice;
        }

        // Strategy 2: Language prefix match
        voice = voices.find(v => v.lang.startsWith(langPrefix));
        if (voice) {
            console.log(`Language prefix match: ${voice.name} (${voice.lang})`);
            return voice;
        }

        // Strategy 3: Special handling for common Indian languages
        if (languageCode.startsWith('bn')) {
            // Bengali variations
            voice = voices.find(v =>
                v.name.toLowerCase().includes('bengali') ||
                v.name.toLowerCase().includes('bangla') ||
                v.lang.includes('bn')
            );
            if (voice) {
                console.log(`Bengali match: ${voice.name} (${voice.lang})`);
                return voice;
            }
        }

        if (languageCode.startsWith('mr')) {
            // Marathi variations
            voice = voices.find(v =>
                v.name.toLowerCase().includes('marathi') ||
                v.lang.includes('mr')
            );
            if (voice) {
                console.log(`Marathi match: ${voice.name} (${voice.lang})`);
                return voice;
            }
        }

        if (languageCode.startsWith('hi')) {
            // Hindi variations
            voice = voices.find(v =>
                v.name.toLowerCase().includes('hindi') ||
                v.lang.includes('hi')
            );
            if (voice) {
                console.log(`Hindi match: ${voice.name} (${voice.lang})`);
                return voice;
            }
        }

        // Strategy 4: Try any Indian English voice as fallback
        voice = voices.find(v => v.lang === 'en-IN');
        if (voice) {
            console.log(`Fallback to Indian English: ${voice.name} (${voice.lang})`);
            return voice;
        }

        // Strategy 5: Try any English voice
        voice = voices.find(v => v.lang.startsWith('en'));
        if (voice) {
            console.log(`Fallback to English: ${voice.name} (${voice.lang})`);
            return voice;
        }

        // Strategy 6: Use system default
        console.warn(`No suitable voice found for ${languageCode}, using system default`);
        return voices[0] || null;
    } async startListening(): Promise<string> {
        if (!this.isSupported || !this.recognition) {
            throw new Error('Speech recognition not supported');
        }

        if (this.isCurrentlyRecognizing) {
            throw new Error('Already listening');
        }

        return new Promise((resolve, reject) => {
            this.isCurrentlyRecognizing = true;
            this.recognition!.lang = this.currentLanguage;

            let finalTranscript = '';
            const timeoutId = setTimeout(() => {
                this.recognition?.stop();
                this.isCurrentlyRecognizing = false;
                reject(new Error('Speech recognition timeout'));
            }, 10000);

            this.recognition!.onresult = (event) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript;
                    }
                }

                finalTranscript = transcript.trim();
                if (finalTranscript) {
                    console.log(`Recognition: "${finalTranscript}"`);
                    clearTimeout(timeoutId);
                    this.isCurrentlyRecognizing = false;
                    resolve(finalTranscript);
                }
            };

            this.recognition!.onerror = (event) => {
                console.error('Recognition error:', event.error);
                clearTimeout(timeoutId);
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

            this.recognition!.start();
        });
    }

    stopListening(): void {
        if (this.recognition && this.isCurrentlyRecognizing) {
            this.recognition.stop();
            this.isCurrentlyRecognizing = false;
        }
    }

    setLanguage(languageCode: string): void {
        this.currentLanguage = languageCode;
        if (this.recognition) {
            this.recognition.lang = languageCode;
        }
    }

    async testVoiceSynthesis(languageCode: string): Promise<void> {
        const testTexts = {
            'hi-IN': 'नमस्ते, मैं आपकी कृषि सहायक हूँ। आज मौसम अच्छा है।',
            'en-IN': 'Hello, I am your farming assistant. The weather is good today.',
            'bn-IN': 'নমস্কার, আমি আপনার কৃষি সহায়ক। আজ আবহাওয়া ভালো।',
        };

        const testText = testTexts[languageCode] || testTexts['en-IN'];
        console.log(`Testing ${languageCode}: "${testText}"`);
        await this.speak(testText, languageCode);
    }

    isRecognitionSupported(): boolean {
        return this.isSupported;
    }
}

export default ElevenLabsSpeechService;
