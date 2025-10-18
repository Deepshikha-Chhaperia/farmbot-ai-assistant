// Enhanced Speech Service with optimal Indian language voice synthesis and recognition
class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private currentLanguage: string = 'en-IN'; // Default to English
  private isSupported: boolean = false;
  private isCurrentlyRecognizing: boolean = false;

  // Comprehensive Indian languages with proper locale codes for voice synthesis
  private supportedLanguages = {
    // 22 Official Languages
    'hi-IN': { name: 'Hindi', nativeName: 'हिंदी', code: 'hi-IN', region: 'India' },
    'en-IN': { name: 'English (India)', nativeName: 'English', code: 'en-IN', region: 'India' },
    'bn-IN': { name: 'Bengali', nativeName: 'বাংলা', code: 'bn-IN', region: 'India' },
    'ta-IN': { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN', region: 'India' },
    'te-IN': { name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN', region: 'India' },
    'mr-IN': { name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN', region: 'India' },
    'gu-IN': { name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu-IN', region: 'India' },
    'pa-IN': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa-IN', region: 'India' },
    'kn-IN': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn-IN', region: 'India' },
    'ml-IN': { name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-IN', region: 'India' },
    'or-IN': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', code: 'or-IN', region: 'India' },
    'as-IN': { name: 'Assamese', nativeName: 'অসমীয়া', code: 'as-IN', region: 'India' },
    'ur-IN': { name: 'Urdu', nativeName: 'اردو', code: 'ur-IN', region: 'India' },
    'ne-IN': { name: 'Nepali', nativeName: 'नेपाली', code: 'ne-IN', region: 'India' },
    'sa-IN': { name: 'Sanskrit', nativeName: 'संस्कृत', code: 'sa-IN', region: 'India' },
    'sd-IN': { name: 'Sindhi', nativeName: 'سنڌي', code: 'sd-IN', region: 'India' },
    'ks-IN': { name: 'Kashmiri', nativeName: 'कॉशुर', code: 'ks-IN', region: 'India' },
    'doi-IN': { name: 'Dogri', nativeName: 'डोगरी', code: 'doi-IN', region: 'India' },
    'mai-IN': { name: 'Maithili', nativeName: 'मैथिली', code: 'mai-IN', region: 'India' },
    'sat-IN': { name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', code: 'sat-IN', region: 'India' },
    'kok-IN': { name: 'Konkani', nativeName: 'कोंकणी', code: 'kok-IN', region: 'India' },
    'mni-IN': { name: 'Manipuri', nativeName: 'ꯃꯤꯇꯩ ꯂꯣꯟ', code: 'mni-IN', region: 'India' },
    'brx-IN': { name: 'Bodo', nativeName: 'बड़ो', code: 'brx-IN', region: 'India' },

    // Major Regional Languages  
    'bho-IN': { name: 'Bhojpuri', nativeName: 'भोजपुरी', code: 'bho-IN', region: 'India' },
    'mag-IN': { name: 'Magahi', nativeName: 'मगही', code: 'mag-IN', region: 'India' },
    'awa-IN': { name: 'Awadhi', nativeName: 'अवधी', code: 'awa-IN', region: 'India' },
    'raj-IN': { name: 'Rajasthani', nativeName: 'राजस्थानी', code: 'raj-IN', region: 'India' },
    'mwr-IN': { name: 'Marwari', nativeName: 'मारवाड़ी', code: 'mwr-IN', region: 'India' },
    'hne-IN': { name: 'Chhattisgarhi', nativeName: 'छत्तीसगढ़ी', code: 'hne-IN', region: 'India' },
    'gbm-IN': { name: 'Garhwali', nativeName: 'गढ़वाली', code: 'gbm-IN', region: 'India' },
    'kum-IN': { name: 'Kumaoni', nativeName: 'कुमाऊँनी', code: 'kum-IN', region: 'India' },

    // Dravidian Languages
    'tcy-IN': { name: 'Tulu', nativeName: 'ತುಳು', code: 'tcy-IN', region: 'India' },
    'bfq-IN': { name: 'Badaga', nativeName: 'பதகா', code: 'bfq-IN', region: 'India' },
    'tcx-IN': { name: 'Toda', nativeName: 'तोडा', code: 'tcx-IN', region: 'India' },
    'kfa-IN': { name: 'Kota', nativeName: 'कोटा', code: 'kfa-IN', region: 'India' },
    'iru-IN': { name: 'Irula', nativeName: 'इरुला', code: 'iru-IN', region: 'India' },
    'kru-IN': { name: 'Kurukh', nativeName: 'कुरुख', code: 'kru-IN', region: 'India' },

    // Northeast Languages  
    'lus-IN': { name: 'Mizo', nativeName: 'Mizo ṭawng', code: 'lus-IN', region: 'India' },
    'grt-IN': { name: 'Garo', nativeName: 'A·chik', code: 'grt-IN', region: 'India' },
    'lep-IN': { name: 'Lepcha', nativeName: 'ᰛᰩᰵ', code: 'lep-IN', region: 'India' },
    'lim-IN': { name: 'Limbu', nativeName: 'ᤕᤠᤰᤌᤢᤱ', code: 'lim-IN', region: 'India' },
    'njo-IN': { name: 'Ao', nativeName: 'Ao', code: 'njo-IN', region: 'India' },
    'njz-IN': { name: 'Nyishi', nativeName: 'Nyishi', code: 'njz-IN', region: 'India' },
    'adi-IN': { name: 'Adi', nativeName: 'Adi', code: 'adi-IN', region: 'India' },
    'apy-IN': { name: 'Apatani', nativeName: 'Apatani', code: 'apy-IN', region: 'India' },
    'kac-IN': { name: 'Kachin', nativeName: 'Jinghpaw', code: 'kac-IN', region: 'India' },
    'lbj-IN': { name: 'Ladakhi', nativeName: 'ལ་དྭགས་སྐད', code: 'lbj-IN', region: 'India' },
    'sip-IN': { name: 'Sikkimese', nativeName: 'འབྲས་ལྗོངས་སྐད', code: 'sip-IN', region: 'India' },
    'new-IN': { name: 'Newari', nativeName: 'नेवार भाषा', code: 'new-IN', region: 'India' },

    // Austro-Asiatic Languages
    'kha-IN': { name: 'Khasi', nativeName: 'Khasi', code: 'kha-IN', region: 'India' },
    'mnr-IN': { name: 'Mundari', nativeName: 'मुंडारी', code: 'mnr-IN', region: 'India' },
    'hoc-IN': { name: 'Ho', nativeName: 'हो', code: 'hoc-IN', region: 'India' },
    'kfq-IN': { name: 'Korku', nativeName: 'कोरकू', code: 'kfq-IN', region: 'India' },
    'ncb-IN': { name: 'Nicobarese', nativeName: 'Nicobarese', code: 'ncb-IN', region: 'India' },

    // Tribal Languages
    'sck-IN': { name: 'Sadri', nativeName: 'सदरी', code: 'sck-IN', region: 'India' },
    'bhb-IN': { name: 'Bhili', nativeName: 'भीली', code: 'bhb-IN', region: 'India' },
    'gju-IN': { name: 'Gujari', nativeName: 'गुजरी', code: 'gju-IN', region: 'India' },
    'jao-IN': { name: 'Jarawa', nativeName: 'Jarawa', code: 'jao-IN', region: 'India' },

    // Island Languages
    'si-LK': { name: 'Sinhala', nativeName: 'සිංහල', code: 'si-LK', region: 'Sri Lanka' },
    'dv-MV': { name: 'Dhivehi', nativeName: 'ދިވެހި', code: 'dv-MV', region: 'Maldives' }
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
    this.recognition.maxAlternatives = 5; // More alternatives for better accuracy with Indian languages

    // Set language with Indian context awareness
    this.recognition.lang = this.getOptimalRecognitionLanguage(this.currentLanguage);
  }

  // Get optimal recognition language with fallbacks for Indian languages
  private getOptimalRecognitionLanguage(targetLanguage: string): string {
    const recognitionFallbacks: { [key: string]: string } = {
      // Languages with good browser support
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

      // Languages with limited support - fallback to related major language
      'mai-IN': 'hi-IN', // Maithili fallback to Hindi
      'bho-IN': 'hi-IN', // Bhojpuri fallback to Hindi
      'raj-IN': 'hi-IN', // Rajasthani fallback to Hindi
      'kok-IN': 'mr-IN', // Konkani fallback to Marathi
      'tcy-IN': 'kn-IN', // Tulu fallback to Kannada
      'sat-IN': 'hi-IN', // Santali fallback to Hindi
      'mni-IN': 'hi-IN', // Manipuri fallback to Hindi
      'brx-IN': 'hi-IN', // Bodo fallback to Hindi
      'doi-IN': 'hi-IN', // Dogri fallback to Hindi
      'kha-IN': 'en-IN', // Khasi fallback to Indian English
      'lus-IN': 'en-IN', // Mizo fallback to Indian English
      'grt-IN': 'en-IN', // Garo fallback to Indian English

      // Default fallback
      'default': 'en-IN'
    };

    return recognitionFallbacks[targetLanguage] || recognitionFallbacks['default'];
  }

  // Auto-detect language from speech input with comprehensive Indian language support
  private detectLanguageFromSpeech(alternatives: SpeechRecognitionResult[]): string {
    for (const result of alternatives) {
      const transcript = result[0].transcript.toLowerCase();

      // Script-based detection for native scripts

      // Devanagari script languages (Hindi, Marathi, Nepali, Sanskrit, etc.)
      if (/[\u0900-\u097F]/.test(transcript)) {
        // Specific Marathi markers
        if (/मी|तुम्ही|आहे|असा|मध्ये|महाराष्ट्र/.test(transcript)) return 'mr-IN';
        // Nepali markers
        if (/म|तपाईं|छ|हो|को|नेपाल/.test(transcript)) return 'ne-IN';
        // Sanskrit markers
        if (/धर्म|मोक्ष|आत्मा|ब्रह्म|वेद|शास्त्र|संस्कृत/.test(transcript)) return 'sa-IN';
        // Maithili markers
        if (/हम|अहाँ|छी|अछि|मैथिली|मिथिला/.test(transcript)) return 'mai-IN';
        // Bhojpuri markers
        if (/हमार|राउर|बा|बाटे|भोजपुरी/.test(transcript)) return 'bho-IN';
        // Default to Hindi for Devanagari
        return 'hi-IN';
      }

      // Bengali script (Bengali, Assamese)
      if (/[\u0980-\u09FF]/.test(transcript)) {
        if (/মই|তুমি|আছে|অসম|গুৱাহাটী/.test(transcript)) return 'as-IN';
        return 'bn-IN';
      }

      // Telugu script
      if (/[\u0C00-\u0C7F]/.test(transcript)) return 'te-IN';

      // Tamil script
      if (/[\u0B80-\u0BFF]/.test(transcript)) return 'ta-IN';

      // Gujarati script
      if (/[\u0A80-\u0AFF]/.test(transcript)) return 'gu-IN';

      // Kannada script
      if (/[\u0C80-\u0CFF]/.test(transcript)) {
        // Check for Tulu vs Kannada
        if (/ತುಳು|ಮಂಗಳೂರು|ಉಡುಪಿ/.test(transcript)) return 'tcy-IN';
        return 'kn-IN';
      }

      // Malayalam script
      if (/[\u0D00-\u0D7F]/.test(transcript)) return 'ml-IN';

      // Punjabi script
      if (/[\u0A00-\u0A7F]/.test(transcript)) return 'pa-IN';

      // Odia script
      if (/[\u0B00-\u0B7F]/.test(transcript)) return 'or-IN';

      // Arabic script (Urdu)
      if (/[\u0600-\u06FF]/.test(transcript)) {
        if (/میں|آپ|ہے|اردو/.test(transcript)) return 'ur-IN';
        return 'ur-IN'; // Default to Urdu for Arabic script in Indian context
      }

      // Keyword-based detection for romanized speech
      const languageKeywords: { [key: string]: string[] } = {
        'hi': ['pani', 'paudhe', 'fasal', 'khet', 'barish', 'mausam', 'kab', 'dena', 'hai'],
        'bn': ['jol', 'gach', 'fasal', 'khet', 'bristi', 'kobe', 'debe', 'ache'],
        'te': ['niru', 'mokka', 'pantalu', 'tota', 'varsham', 'eppudu', 'ivvali'],
        'ta': ['thanni', 'che', 'vivasayam', 'vellai', 'mazhai', 'eppozhu', 'kodukka'],
        'gu': ['pani', 'jhad', 'fasal', 'khet', 'varsha', 'kyare', 'aapvu'],
        'kn': ['niru', 'gida', 'hosilu', 'kshetre', 'male', 'yavaga', 'kodu'],
        'ml': ['vellam', 'chedi', 'krishi', 'nellum', 'mazha', 'eppol', 'kodukkuka'],
        'mr': ['pani', 'jhad', 'pik', 'khet', 'paus', 'kevha', 'dyayche'],
        'pa': ['pani', 'ped', 'fasal', 'khet', 'menh', 'kado', 'dena'],
        'or': ['pani', 'gachha', 'fasal', 'khet', 'barkha', 'kebe', 'debe'],
        'as': ['pani', 'gash', 'dhaan', 'kheti', 'borkhun', 'keti', 'dibo'],
        'ur': ['pani', 'poda', 'fasal', 'khet', 'baarish', 'kab', 'dena'],
        'bho': ['pani', 'ped', 'fasal', 'khet', 'barkha', 'kab', 'deke'],
        'raj': ['pani', 'ped', 'fasal', 'khet', 'menh', 'kab', 'dena'],
        'mai': ['pani', 'gachh', 'fasal', 'khet', 'barkha', 'kakhon', 'debe'],
        'tcy': ['niru', 'mara', 'gatti', 'rota', 'madme', 'yenaag', 'korpar'],
        'sat': ['dak', 'dar', 'dhaan', 'atu', 'jhar', 'okte', 'ema'],
        'mni': ['ishing', 'upal', 'mahi', 'lou', 'nungsit', 'karamna', 'piba'],
        'brx': ['dai', 'sima', 'mairong', 'bar', 'san', 'jangai', 'hobar'],
        'kha': ['um', 'sla', 'khir', 'ri', 'slap', 'kaei', 'jingai'],
        'lus': ['tui', 'thing', 'lo', 'ruah', 'hun', 'engtik', 'pe'],
        'grt': ['chi', 'wak sak', 'bol', 'wa', 'sam', 'jagen', 'pea']
      };

      // Check for language-specific keywords
      for (const [lang, keywords] of Object.entries(languageKeywords)) {
        const matchCount = keywords.filter(keyword => transcript.includes(keyword)).length;
        if (matchCount > 0) {
          return `${lang}-IN`;
        }
      }

      // Common Hindi keywords (fallback for Devanagari languages)
      const hindiKeywords = ['pani', 'paudhe', 'khet', 'fasal', 'barish', 'mausam', 'kab', 'dena'];
      if (hindiKeywords.some(keyword => transcript.includes(keyword))) {
        return 'hi-IN';
      }

      // English keywords
      const englishKeywords = ['water', 'plant', 'crop', 'farm', 'rain', 'weather', 'when', 'give'];
      if (englishKeywords.some(keyword => transcript.includes(keyword))) {
        return 'en-IN';
      }
    }

    // Return current language if no detection possible
    return this.currentLanguage;
  }

  // Enhanced recognition with automatic language switching
  async recognizeWithLanguageAdaptation(): Promise<string> {
    if (!this.recognition || !this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      let finalTranscript = '';
      let detectedLanguage = this.currentLanguage;

      this.recognition!.onstart = () => {
        console.log('Speech recognition started for language:', this.currentLanguage);
      };

      this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results);

        if (results.length > 0) {
          const result = results[results.length - 1];
          finalTranscript = result[0].transcript;

          // Detect language from speech alternatives
          detectedLanguage = this.detectLanguageFromSpeech(results);

          console.log(`Recognized: "${finalTranscript}" in language: ${detectedLanguage}`);

          // Update current language if different
          if (detectedLanguage !== this.currentLanguage) {
            this.setLanguage(detectedLanguage);
          }

          resolve(finalTranscript);
        }
      };

      this.recognition!.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      this.recognition!.onend = () => {
        if (!finalTranscript) {
          reject(new Error('No speech detected'));
        }
      };

      // Start recognition with current optimal language setting
      this.recognition!.lang = this.getOptimalRecognitionLanguage(this.currentLanguage);
      this.recognition!.start();
    });
  }

  // Standard listening method for backward compatibility
  async startListening(): Promise<string> {
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
        console.log('Speech recognition started');
      };

      this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results);

        if (results.length > 0) {
          const result = results[results.length - 1];
          finalTranscript = result[0].transcript;

          // Detect and adapt to the language being spoken
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

  stopListening() {
    if (this.recognition && this.isCurrentlyRecognizing) {
      this.recognition.stop();
      this.isCurrentlyRecognizing = false;
    }
  }

  // Enhanced voice synthesis with comprehensive Indian language support
  async speak(text: string, language?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLanguage = language || this.currentLanguage;

      // Configure utterance for Indian languages
      utterance.rate = 0.8; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      // Enhanced voice selection with multiple fallback strategies
      const voices = this.synthesis.getVoices();
      const selectedVoice = this.selectBestVoice(voices, targetLanguage);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang}) for target: ${targetLanguage}`);
      } else {
        utterance.lang = targetLanguage;
        console.log(`No specific voice found, using default for: ${targetLanguage}`);
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        reject(error);
      };

      this.synthesis.speak(utterance);
    });
  }

  // Enhanced voice selection with smart fallbacks for Indian languages
  private selectBestVoice(voices: SpeechSynthesisVoice[], targetLanguage: string): SpeechSynthesisVoice | null {
    if (!voices.length) return null;

    // Strategy 1: Exact language match
    let voice = voices.find(v => v.lang === targetLanguage);
    if (voice) return voice;

    // Strategy 2: Language code match (e.g., 'bn' for 'bn-IN')
    const langCode = targetLanguage.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(langCode));
    if (voice) return voice;

    // Strategy 3: Script-based fallbacks for Indian languages
    const scriptFallbacks = this.getScriptBasedFallbacks(targetLanguage);
    for (const fallbackLang of scriptFallbacks) {
      voice = voices.find(v => v.lang === fallbackLang || v.lang.startsWith(fallbackLang.split('-')[0]));
      if (voice) return voice;
    }

    // Strategy 4: Regional fallback (Indian English or default English)
    voice = voices.find(v => v.lang === 'en-IN' || v.lang === 'en-US' || v.lang === 'en-GB');
    if (voice) return voice;

    // Strategy 5: Any available voice (last resort)
    return voices[0] || null;
  }

  // Get script-based fallback languages for better voice synthesis
  private getScriptBasedFallbacks(targetLanguage: string): string[] {
    const langCode = targetLanguage.split('-')[0];

    // Script-based fallback groups
    const scriptGroups: { [key: string]: string[] } = {
      // Devanagari script languages
      'hi': ['hi-IN', 'mr-IN', 'ne-IN', 'sa-IN'],
      'mr': ['mr-IN', 'hi-IN', 'ne-IN'],
      'ne': ['ne-IN', 'hi-IN', 'mr-IN'],
      'sa': ['sa-IN', 'hi-IN', 'mr-IN'],
      'mai': ['hi-IN', 'mr-IN'],
      'bho': ['hi-IN', 'mr-IN'],

      // Bengali script languages  
      'bn': ['bn-IN', 'bn-BD', 'as-IN'],
      'as': ['as-IN', 'bn-IN', 'bn-BD'],

      // Tamil script
      'ta': ['ta-IN', 'ta-LK'],

      // Telugu script
      'te': ['te-IN'],

      // Gujarati script
      'gu': ['gu-IN'],

      // Kannada script
      'kn': ['kn-IN'],

      // Malayalam script
      'ml': ['ml-IN'],

      // Punjabi script
      'pa': ['pa-IN', 'pa-PK'],

      // Odia script
      'or': ['or-IN'],

      // Urdu (Arabic script)
      'ur': ['ur-IN', 'ur-PK', 'ar-SA'],

      // Other Indian languages fallback to Hindi then English
      'default': ['hi-IN', 'en-IN', 'en-US']
    };

    return scriptGroups[langCode] || scriptGroups['default'];
  }

  // Debug method to list available voices for Indian languages
  getAvailableIndianVoices(): { language: string, voices: string[] }[] {
    if (!this.synthesis) return [];

    const voices = this.synthesis.getVoices();
    const indianLanguageCodes = ['hi', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'mr', 'pa', 'or', 'as', 'ur'];

    return indianLanguageCodes.map(langCode => ({
      language: langCode,
      voices: voices
        .filter(v => v.lang.startsWith(langCode) || v.lang.includes(langCode))
        .map(v => `${v.name} (${v.lang})`)
    })).filter(item => item.voices.length > 0);
  }

  // Set current language and update recognition settings
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

  // Method to force voices to load (some browsers need this)
  loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (this.synthesis.getVoices().length) {
        resolve(this.synthesis.getVoices());
        return;
      }

      this.synthesis.onvoiceschanged = () => {
        resolve(this.synthesis.getVoices());
      };
    });
  }

  // Test voice synthesis for a specific language
  async testVoiceSynthesis(language: string, testText?: string): Promise<boolean> {
    const text = testText || this.getTestText(language);

    try {
      await this.speak(text, language);
      return true;
    } catch (error) {
      console.error(`Voice synthesis test failed for ${language}:`, error);
      return false;
    }
  }

  // Get appropriate test text for each language
  private getTestText(language: string): string {
    const testTexts: { [key: string]: string } = {
      'hi-IN': 'किसान भाई, आपकी फसल अच्छी है।',
      'bn-IN': 'কৃষক ভাই, আপনার ফসল ভালো হচ্ছে।',
      'te-IN': 'రైతు గారు, మీ పంట బాగా ఉంది.',
      'ta-IN': 'விவசாயி அண்ணா, உங்கள் பயிர் நன்றாக உள்ளது.',
      'gu-IN': 'ખેડૂત ભાઈ, તમારો પાક સારો છે.',
      'kn-IN': 'ರೈತ ಅಣ್ಣ, ನಿಮ್ಮ ಬೆಳೆ ಚೆನ್ನಾಗಿದೆ.',
      'ml-IN': 'കർഷകൻ, നിങ്ങളുടെ വിള നന്നായിട്ടുണ്ട്.',
      'mr-IN': 'शेतकरी भाऊ, तुमचे पीक चांगले आहे.',
      'pa-IN': 'ਕਿਸਾਨ ਭਰਾ, ਤੁਹਾਡੀ ਫਸਲ ਵਧੀਆ ਹੈ.',
      'or-IN': 'କୃଷକ ଭାଇ, ଆପଣଙ୍କ ଫସଲ ଭଲ ଅଛି.',
      'as-IN': 'কৃষক ভাই, আপোনাৰ শস্য ভাল হৈছে।',
      'ur-IN': 'کسان بھائی، آپ کی فصل اچھی ہے۔',
      'default': 'Farmer friend, your crop is good.'
    };

    return testTexts[language] || testTexts['default'];
  }
}

export default SpeechService;
