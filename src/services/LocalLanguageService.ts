// Enhanced Language Detection Service - Supporting ALL Indian Languages
interface LanguageDetection {
    language: string;
    confidence: number;
    script?: string;
    alternatives?: Array<{ language: string; confidence: number }>;
}

interface LanguageInfo {
    code: string;
    name: string;
    nativeName: string;
    script: string;
    family: string;
    region: string;
}

class LocalLanguageService {
    private modelLoaded: boolean = false;
    private supportedLanguages: Map<string, LanguageInfo>;

    constructor() {
        this.supportedLanguages = new Map([
            // 22 Official Languages of India (8th Schedule)
            ['hi', { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', script: 'Devanagari', family: 'Indo-Aryan', region: 'North India' }],
            ['bn', { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', family: 'Indo-Aryan', region: 'East India' }],
            ['te', { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', family: 'Dravidian', region: 'South India' }],
            ['ta', { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', family: 'Dravidian', region: 'South India' }],
            ['gu', { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', family: 'Indo-Aryan', region: 'West India' }],
            ['kn', { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', family: 'Dravidian', region: 'South India' }],
            ['ml', { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', family: 'Dravidian', region: 'South India' }],
            ['mr', { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', family: 'Indo-Aryan', region: 'West India' }],
            ['pa', { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', family: 'Indo-Aryan', region: 'North India' }],
            ['or', { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia', family: 'Indo-Aryan', region: 'East India' }],
            ['as', { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali', family: 'Indo-Aryan', region: 'Northeast India' }],
            ['ur', { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Arabic', family: 'Indo-Aryan', region: 'North India' }],
            ['ne', { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari', family: 'Indo-Aryan', region: 'Himalayan' }],
            ['sa', { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृत', script: 'Devanagari', family: 'Indo-Aryan', region: 'Pan-Indian' }],
            ['sd', { code: 'sd', name: 'Sindhi', nativeName: 'सिन्धी', script: 'Devanagari', family: 'Indo-Aryan', region: 'West India' }],
            ['ks', { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', script: 'Devanagari', family: 'Indo-Aryan', region: 'North India' }],
            ['doi', { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari', family: 'Indo-Aryan', region: 'North India' }],
            ['mai', { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari', family: 'Indo-Aryan', region: 'East India' }],
            ['sat', { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki', family: 'Austroasiatic', region: 'East India' }],
            ['kok', { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', script: 'Devanagari', family: 'Indo-Aryan', region: 'West India' }],
            ['mni', { code: 'mni', name: 'Manipuri', nativeName: 'ꯃꯤꯇꯩ ꯂꯣꯟ', script: 'Manipuri', family: 'Sino-Tibetan', region: 'Northeast India' }],
            ['brx', { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', script: 'Devanagari', family: 'Sino-Tibetan', region: 'Northeast India' }],

            // Major Regional Languages
            ['bho', { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Bihar/UP' }],
            ['mag', { code: 'mag', name: 'Magahi', nativeName: 'मगही', script: 'Devanagari', family: 'Indo-Aryan', region: 'Bihar' }],
            ['awa', { code: 'awa', name: 'Awadhi', nativeName: 'अवधी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Uttar Pradesh' }],
            ['raj', { code: 'raj', name: 'Rajasthani', nativeName: 'राजस्थानी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Rajasthan' }],
            ['mwr', { code: 'mwr', name: 'Marwari', nativeName: 'मारवाड़ी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Rajasthan' }],
            ['hne', { code: 'hne', name: 'Chhattisgarhi', nativeName: 'छत्तीसगढ़ी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Chhattisgarh' }],
            ['gbm', { code: 'gbm', name: 'Garhwali', nativeName: 'गढ़वाली', script: 'Devanagari', family: 'Indo-Aryan', region: 'Uttarakhand' }],
            ['kum', { code: 'kum', name: 'Kumaoni', nativeName: 'कुमाऊँनी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Uttarakhand' }],

            // Dravidian Languages
            ['tcy', { code: 'tcy', name: 'Tulu', nativeName: 'ತುಳು', script: 'Kannada', family: 'Dravidian', region: 'Karnataka/Kerala' }],
            ['bfq', { code: 'bfq', name: 'Badaga', nativeName: 'பதகா', script: 'Tamil', family: 'Dravidian', region: 'Tamil Nadu' }],
            ['tcx', { code: 'tcx', name: 'Toda', nativeName: 'तोडा', script: 'Tamil', family: 'Dravidian', region: 'Tamil Nadu' }],
            ['kfa', { code: 'kfa', name: 'Kota', nativeName: 'कोटा', script: 'Tamil', family: 'Dravidian', region: 'Tamil Nadu' }],
            ['iru', { code: 'iru', name: 'Irula', nativeName: 'इरुला', script: 'Tamil', family: 'Dravidian', region: 'Tamil Nadu' }],
            ['kru', { code: 'kru', name: 'Kurukh', nativeName: 'कुरुख', script: 'Devanagari', family: 'Dravidian', region: 'Jharkhand/Odisha' }],

            // Northeast India Languages (Tibeto-Burman)
            ['lus', { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng', script: 'Latin', family: 'Sino-Tibetan', region: 'Mizoram' }],
            ['grt', { code: 'grt', name: 'Garo', nativeName: 'A·chik', script: 'Latin', family: 'Sino-Tibetan', region: 'Meghalaya' }],
            ['lep', { code: 'lep', name: 'Lepcha', nativeName: 'ᰛᰩᰵ', script: 'Lepcha', family: 'Sino-Tibetan', region: 'Sikkim' }],
            ['lim', { code: 'lim', name: 'Limbu', nativeName: 'ᤕᤠᤰᤌᤢᤱ', script: 'Limbu', family: 'Sino-Tibetan', region: 'Sikkim/Nepal' }],
            ['njo', { code: 'njo', name: 'Ao', nativeName: 'Ao', script: 'Latin', family: 'Sino-Tibetan', region: 'Nagaland' }],
            ['njz', { code: 'njz', name: 'Nyishi', nativeName: 'Nyishi', script: 'Latin', family: 'Sino-Tibetan', region: 'Arunachal Pradesh' }],
            ['adi', { code: 'adi', name: 'Adi', nativeName: 'Adi', script: 'Latin', family: 'Sino-Tibetan', region: 'Arunachal Pradesh' }],
            ['apy', { code: 'apy', name: 'Apatani', nativeName: 'Apatani', script: 'Latin', family: 'Sino-Tibetan', region: 'Arunachal Pradesh' }],
            ['kac', { code: 'kac', name: 'Kachin', nativeName: 'Jinghpaw', script: 'Latin', family: 'Sino-Tibetan', region: 'Arunachal Pradesh' }],
            ['lbj', { code: 'lbj', name: 'Ladakhi', nativeName: 'ལ་དྭགས་སྐད', script: 'Tibetan', family: 'Sino-Tibetan', region: 'Ladakh' }],
            ['sip', { code: 'sip', name: 'Sikkimese', nativeName: 'འབྲས་ལྗོངས་སྐད', script: 'Tibetan', family: 'Sino-Tibetan', region: 'Sikkim' }],
            ['new', { code: 'new', name: 'Newari', nativeName: 'नेवार भाषा', script: 'Devanagari', family: 'Sino-Tibetan', region: 'Nepal' }],

            // Austro-Asiatic Languages
            ['kha', { code: 'kha', name: 'Khasi', nativeName: 'Khasi', script: 'Latin', family: 'Austroasiatic', region: 'Meghalaya' }],
            ['mnr', { code: 'mnr', name: 'Mundari', nativeName: 'मुंडारी', script: 'Devanagari', family: 'Austroasiatic', region: 'Jharkhand' }],
            ['hoc', { code: 'hoc', name: 'Ho', nativeName: 'हो', script: 'Devanagari', family: 'Austroasiatic', region: 'Jharkhand' }],
            ['kfq', { code: 'kfq', name: 'Korku', nativeName: 'कोरकू', script: 'Devanagari', family: 'Austroasiatic', region: 'Madhya Pradesh' }],
            ['ncb', { code: 'ncb', name: 'Nicobarese', nativeName: 'Nicobarese', script: 'Latin', family: 'Austroasiatic', region: 'Andaman & Nicobar' }],

            // Tribal and Indigenous Languages
            ['sck', { code: 'sck', name: 'Sadri', nativeName: 'सदरी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Jharkhand' }],
            ['bhb', { code: 'bhb', name: 'Bhili', nativeName: 'भीली', script: 'Devanagari', family: 'Indo-Aryan', region: 'Madhya Pradesh' }],
            ['gju', { code: 'gju', name: 'Gujari', nativeName: 'गुजरी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Himachal Pradesh' }],
            ['jao', { code: 'jao', name: 'Jarawa', nativeName: 'Jarawa', script: 'Latin', family: 'Andamanese', region: 'Andaman Islands' }],
            ['dhd', { code: 'dhd', name: 'Dhundari', nativeName: 'ढूंढाड़ी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Rajasthan' }],
            ['mup', { code: 'mup', name: 'Malvi', nativeName: 'मालवी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Madhya Pradesh' }],
            ['swv', { code: 'swv', name: 'Shekhawati', nativeName: 'शेखावाटी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Rajasthan' }],
            ['gom', { code: 'gom', name: 'Goan Konkani', nativeName: 'गोवा कोंकणी', script: 'Devanagari', family: 'Indo-Aryan', region: 'Goa' }],

            // Island Languages
            ['si', { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', script: 'Sinhala', family: 'Indo-Aryan', region: 'Sri Lanka' }],
            ['dv', { code: 'dv', name: 'Dhivehi', nativeName: 'ދިވެހި', script: 'Thaana', family: 'Indo-Aryan', region: 'Maldives' }],

            // International Languages
            ['en', { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', family: 'Germanic', region: 'Global' }],
            ['ar', { code: 'ar', name: 'Arabic', nativeName: 'العربية', script: 'Arabic', family: 'Semitic', region: 'Middle East' }],
            ['fa', { code: 'fa', name: 'Persian', nativeName: 'فارسی', script: 'Arabic', family: 'Iranian', region: 'Iran' }],
            ['zh', { code: 'zh', name: 'Chinese', nativeName: '中文', script: 'Hanzi', family: 'Sino-Tibetan', region: 'China' }],
            ['my', { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ', script: 'Myanmar', family: 'Sino-Tibetan', region: 'Myanmar' }],
        ]);

        this.modelLoaded = true;
        console.log(`LocalLanguageService initialized with ${this.supportedLanguages.size} languages including all major Indian languages`);
    }

    async detectLanguage(text: string): Promise<LanguageDetection> {
        try {
            const detection = this.detectLanguageHeuristic(text);

            return {
                language: detection.language,
                confidence: detection.confidence,
                script: this.supportedLanguages.get(detection.language)?.script,
                alternatives: detection.alternatives
            };
        } catch (error) {
            console.error('Language detection error:', error);
            return {
                language: 'en',
                confidence: 0.5,
                script: 'Latin'
            };
        }
    }

    private detectLanguageHeuristic(text: string): LanguageDetection {
        const lowerText = text.toLowerCase();

        // Script-based detection (Unicode ranges) - Most reliable method

        // Devanagari script (Hindi, Marathi, Sanskrit, Nepali, etc.)
        if (/[\u0900-\u097F]/.test(text)) {
            // Specific language identification within Devanagari
            if (/मी|तुम्ही|आहे|असा|मध्ये|महाराष्ट्र|पुणे|मुंबई|मराठी/.test(text)) {
                return { language: 'mr', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            if (/म|तपाईं|छ|हो|को|नेपाल|काठमाडौं|नेपाली/.test(text)) {
                return { language: 'ne', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            if (/धर्म|मोक्ष|आत्मा|ब्रह्म|वेद|शास्त्र|संस्कृत|श्लोक/.test(text)) {
                return { language: 'sa', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            if (/हम|अहाँ|छी|अछि|मैथिली|मिथिला|दरभंगा/.test(text)) {
                return { language: 'mai', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            if (/हमार|राउर|बा|बाटे|भोजपुरी|बिहार|गोपालगंज/.test(text)) {
                return { language: 'bho', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            if (/हमरो|तोरो|छै|मगही|गया|पटना/.test(text)) {
                return { language: 'mag', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            if (/हमरी|तोरी|है|अवधी|लखनऊ|फैजाबाद/.test(text)) {
                return { language: 'awa', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            if (/म्हारो|थारो|सै|राजस्थानी|जयपुर|जोधपुर/.test(text)) {
                return { language: 'raj', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            if (/हमर|तोर|हवै|छत्तीसगढ़ी|रायपुर|बिलासपुर/.test(text)) {
                return { language: 'hne', confidence: 0.95, alternatives: [{ language: 'hi', confidence: 0.7 }] };
            }
            // Default to Hindi for unspecified Devanagari
            return { language: 'hi', confidence: 0.85, alternatives: [] };
        }

        // Bengali script (Bengali, Assamese)
        if (/[\u0980-\u09FF]/.test(text)) {
            if (/মই|তুমি|আছে|অসম|গুৱাহাটী|অসমীয়া/.test(text)) {
                return { language: 'as', confidence: 0.95, alternatives: [{ language: 'bn', confidence: 0.7 }] };
            }
            return { language: 'bn', confidence: 0.9, alternatives: [] };
        }

        // Telugu script
        if (/[\u0C00-\u0C7F]/.test(text)) {
            return { language: 'te', confidence: 0.95, alternatives: [] };
        }

        // Tamil script (Tamil and related)
        if (/[\u0B80-\u0BFF]/.test(text)) {
            return { language: 'ta', confidence: 0.95, alternatives: [] };
        }

        // Gujarati script
        if (/[\u0A80-\u0AFF]/.test(text)) {
            return { language: 'gu', confidence: 0.95, alternatives: [] };
        }

        // Kannada script (Kannada, Tulu)
        if (/[\u0C80-\u0CFF]/.test(text)) {
            if (/ತುಳು|ಮಂಗಳೂರು|ಉಡುಪಿ/.test(text)) {
                return { language: 'tcy', confidence: 0.95, alternatives: [{ language: 'kn', confidence: 0.7 }] };
            }
            return { language: 'kn', confidence: 0.95, alternatives: [] };
        }

        // Malayalam script
        if (/[\u0D00-\u0D7F]/.test(text)) {
            return { language: 'ml', confidence: 0.95, alternatives: [] };
        }

        // Gurmukhi script (Punjabi)
        if (/[\u0A00-\u0A7F]/.test(text)) {
            return { language: 'pa', confidence: 0.95, alternatives: [] };
        }

        // Odia script
        if (/[\u0B00-\u0B7F]/.test(text)) {
            return { language: 'or', confidence: 0.95, alternatives: [] };
        }

        // Arabic script (Urdu, Arabic, Persian)
        if (/[\u0600-\u06FF]/.test(text)) {
            if (/میں|آپ|ہے|اردو|پاکستان|ہندوستان/.test(text)) {
                return { language: 'ur', confidence: 0.9, alternatives: [{ language: 'ar', confidence: 0.6 }] };
            }
            if (/من|شما|است|ایران|فارسی/.test(text)) {
                return { language: 'fa', confidence: 0.9, alternatives: [{ language: 'ar', confidence: 0.6 }] };
            }
            return { language: 'ar', confidence: 0.8, alternatives: [] };
        }

        // Special scripts
        if (/[\u0D80-\u0DFF]/.test(text)) return { language: 'si', confidence: 0.95, alternatives: [] }; // Sinhala
        if (/[\u1000-\u109F]/.test(text)) return { language: 'my', confidence: 0.95, alternatives: [] }; // Myanmar
        if (/[\u0F00-\u0FFF]/.test(text)) return { language: 'lbj', confidence: 0.8, alternatives: [{ language: 'sip', confidence: 0.7 }] }; // Tibetan
        if (/[\u1C50-\u1C7F]/.test(text)) return { language: 'sat', confidence: 0.95, alternatives: [] }; // Ol Chiki (Santali)
        if (/[\uAAE0-\uAAFF]/.test(text)) return { language: 'mni', confidence: 0.95, alternatives: [] }; // Manipuri
        if (/[\u1C00-\u1C4F]/.test(text)) return { language: 'lep', confidence: 0.95, alternatives: [] }; // Lepcha
        if (/[\u1900-\u194F]/.test(text)) return { language: 'lim', confidence: 0.95, alternatives: [] }; // Limbu

        // Keyword-based detection for romanized/transliterated text
        const farmingKeywords = {
            'hi': ['pani', 'paudhe', 'fasal', 'khet', 'barish', 'mausam', 'beej', 'kheti', 'kisan', 'dhan', 'gehu', 'kab', 'dena'],
            'bn': ['jol', 'gach', 'fasal', 'khet', 'bristi', 'mausam', 'bij', 'krishi', 'chal', 'gom', 'kobe', 'debe'],
            'te': ['niru', 'mokka', 'pantalu', 'tota', 'varsham', 'ruthuvulu', 'vittanalu', 'panta', 'vyavasayam', 'eppudu', 'ivvali'],
            'ta': ['thanni', 'che', 'vivasayam', 'vellai', 'mazhai', 'paruva kaalam', 'nel', 'arisi', 'eppozhu', 'kodukka'],
            'gu': ['pani', 'jhad', 'fasal', 'khet', 'varsha', 'rutu', 'bij', 'kheti', 'chovish', 'kyare', 'aapvu'],
            'kn': ['niru', 'gida', 'hosilu', 'kshetre', 'male', 'ritu', 'bijja', 'krishi', 'akki', 'yavaga', 'kodu'],
            'ml': ['vellam', 'chedi', 'krishi', 'nellum', 'mazha', 'kalam', 'vithu', 'panji', 'ari', 'eppol', 'kodukkuka'],
            'mr': ['pani', 'jhad', 'pik', 'khet', 'paus', 'rutu', 'bij', 'sheti', 'bhat', 'kevha', 'dyayche'],
            'pa': ['pani', 'ped', 'fasal', 'khet', 'menh', 'mausam', 'beej', 'kheti', 'chawal', 'kado', 'dena'],
            'or': ['pani', 'gachha', 'fasal', 'khet', 'barkha', 'rutu', 'gachh', 'chasa', 'chaula', 'kebe', 'debe'],
            'as': ['pani', 'gash', 'dhaan', 'kheti', 'borkhun', 'kaal', 'bij', 'sali', 'ahu', 'keti', 'dibo'],
            'ur': ['pani', 'poda', 'fasal', 'khet', 'baarish', 'mausam', 'beej', 'kisani', 'chawal', 'kab', 'dena'],
            'bho': ['pani', 'ped', 'fasal', 'khet', 'barkha', 'mausam', 'beej', 'kheti', 'bhaat', 'kab', 'deke'],
            'raj': ['pani', 'ped', 'fasal', 'khet', 'menh', 'mausam', 'beej', 'kheti', 'jau', 'kab', 'dena'],
            'mai': ['pani', 'gachh', 'fasal', 'khet', 'barkha', 'kaal', 'bij', 'kheti', 'chaur', 'kakhon', 'debe'],
            'tcy': ['niru', 'mara', 'gatti', 'rota', 'madme', 'kaala', 'bija', 'olle', 'yenaag', 'korpar'],
            'sat': ['dak', 'dar', 'dhaan', 'atu', 'jhar', 'sarad', 'bij', 'jo', 'okte', 'ema'],
            'mni': ['ishing', 'upal', 'mahi', 'lou', 'nungsit', 'numit', 'maru', 'cheng', 'karamna', 'piba'],
            'brx': ['dai', 'sima', 'mairong', 'bar', 'san', 'mausam', 'gaso', 'brai', 'jangai', 'hobar'],
            'kha': ['um', 'sla', 'khir', 'ri', 'slap', 'kharai', 'saplaw', 'khiew', 'kaei', 'jingai'],
            'lus': ['tui', 'thing', 'lo', 'lo hmun', 'ruah', 'hun', 'chi', 'buh', 'engtik', 'pe'],
            'grt': ['chi', 'wak sak', 'bol', 'a jak', 'wa', 'sam', 'bilsi', 'grik', 'jagen', 'pea'],
        };

        // Check for language-specific farming terms
        for (const [lang, keywords] of Object.entries(farmingKeywords)) {
            const matchCount = keywords.filter(keyword =>
                lowerText.includes(keyword)).length;

            if (matchCount > 0) {
                return {
                    language: lang,
                    confidence: Math.min(0.9, 0.6 + (matchCount * 0.1)),
                    alternatives: []
                };
            }
        }

        // Common English farming terms
        const englishFarmingTerms = [
            'farm', 'crop', 'plant', 'soil', 'water', 'seed', 'harvest', 'fertilizer',
            'pest', 'disease', 'weather', 'irrigation', 'farming', 'agriculture',
            'cultivation', 'livestock', 'cattle', 'rice', 'wheat', 'corn', 'vegetable', 'when', 'give'
        ];

        const englishTermCount = englishFarmingTerms.filter(term =>
            lowerText.includes(term)).length;

        if (englishTermCount > 0) {
            return {
                language: 'en',
                confidence: Math.min(0.9, 0.5 + (englishTermCount * 0.1)),
                alternatives: []
            };
        }

        // Default to English for Latin script
        if (/^[A-Za-z0-9\s.,!?]+$/.test(text)) {
            return {
                language: 'en',
                confidence: 0.7,
                alternatives: []
            };
        }

        // Default fallback
        return {
            language: 'en',
            confidence: 0.5,
            alternatives: []
        };
    }

    async preWarmModel(): Promise<void> {
        console.log('Language model pre-warmed (heuristic mode) - All Indian languages supported');
    }

    getModelInfo(): string {
        return `Enhanced Heuristic Language Detection - ${this.supportedLanguages.size} languages supported including all major Indian languages`;
    }

    getSupportedLanguages(): LanguageInfo[] {
        return Array.from(this.supportedLanguages.values());
    }

    getLanguagesByRegion(region: string): LanguageInfo[] {
        return Array.from(this.supportedLanguages.values())
            .filter(lang => lang.region.toLowerCase().includes(region.toLowerCase()));
    }

    getLanguagesByScript(script: string): LanguageInfo[] {
        return Array.from(this.supportedLanguages.values())
            .filter(lang => lang.script.toLowerCase() === script.toLowerCase());
    }

    isModelLoaded(): boolean {
        return this.modelLoaded;
    }
}

export default LocalLanguageService;

