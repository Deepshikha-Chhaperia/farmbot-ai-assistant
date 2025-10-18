// Translation utility with static dictionary fallback
// Supports Hindi and English with predefined translations

export interface SupportedLanguages {
    'hi-IN': string;
    'en-IN': string;
    'bn-IN': string;
    'ta-IN': string;
    'te-IN': string;
    'mr-IN': string;
    'gu-IN': string;
    'pa-IN': string;
    'kn-IN': string;
    'ml-IN': string;
    'or-IN': string;
    'as-IN': string;
}

// Static translation dictionary for common UI elements
export const staticTranslations: { [key: string]: Partial<SupportedLanguages> } = {
    // Navigation
    'Dashboard': { 'hi-IN': 'डैशबोर्ड', 'en-IN': 'Dashboard' },
    'Profile': { 'hi-IN': 'प्रोफ़ाइल', 'en-IN': 'Profile' },
    'Market Prices': { 'hi-IN': 'बाजार भाव', 'en-IN': 'Market Prices' },
    'Weather': { 'hi-IN': 'मौसम', 'en-IN': 'Weather' },
    'Crop Care': { 'hi-IN': 'फसल देखभाल', 'en-IN': 'Crop Care' },
    'Irrigation': { 'hi-IN': 'सिंचाई', 'en-IN': 'Irrigation' },
    'Settings': { 'hi-IN': 'सेटिंग्स', 'en-IN': 'Settings' },
    'Help': { 'hi-IN': 'सहायता', 'en-IN': 'Help' },

    // Common UI
    'Save': { 'hi-IN': 'सहेजें', 'en-IN': 'Save' },
    'Cancel': { 'hi-IN': 'रद्द करें', 'en-IN': 'Cancel' },
    'Edit': { 'hi-IN': 'संपादित करें', 'en-IN': 'Edit' },
    'Delete': { 'hi-IN': 'हटाएं', 'en-IN': 'Delete' },
    'Add': { 'hi-IN': 'जोड़ें', 'en-IN': 'Add' },
    'Update': { 'hi-IN': 'अपडेट करें', 'en-IN': 'Update' },
    'Submit': { 'hi-IN': 'जमा करें', 'en-IN': 'Submit' },
    'Back': { 'hi-IN': 'वापस', 'en-IN': 'Back' },
    'Next': { 'hi-IN': 'आगे', 'en-IN': 'Next' },
    'Previous': { 'hi-IN': 'पिछला', 'en-IN': 'Previous' },

    // Profile fields
    'Name': { 'hi-IN': 'नाम', 'en-IN': 'Name' },
    'Phone': { 'hi-IN': 'फोन', 'en-IN': 'Phone' },
    'Location': { 'hi-IN': 'स्थान', 'en-IN': 'Location' },
    'Farm Size': { 'hi-IN': 'खेत का आकार', 'en-IN': 'Farm Size' },
    'Primary Crops': { 'hi-IN': 'मुख्य फसलें', 'en-IN': 'Primary Crops' },
    'Farming Type': { 'hi-IN': 'खेती का प्रकार', 'en-IN': 'Farming Type' },
    'Language': { 'hi-IN': 'भाषा', 'en-IN': 'Language' },

    // Farming terms
    'Wheat': { 'hi-IN': 'गेहूं', 'en-IN': 'Wheat' },
    'Rice': { 'hi-IN': 'चावल', 'en-IN': 'Rice' },
    'Cotton': { 'hi-IN': 'कपास', 'en-IN': 'Cotton' },
    'Sugarcane': { 'hi-IN': 'गन्ना', 'en-IN': 'Sugarcane' },
    'Maize': { 'hi-IN': 'मक्का', 'en-IN': 'Maize' },
    'Soybean': { 'hi-IN': 'सोयाबीन', 'en-IN': 'Soybean' },

    // Weather terms
    'Temperature': { 'hi-IN': 'तापमान', 'en-IN': 'Temperature' },
    'Humidity': { 'hi-IN': 'नमी', 'en-IN': 'Humidity' },
    'Rainfall': { 'hi-IN': 'वर्षा', 'en-IN': 'Rainfall' },
    'Wind Speed': { 'hi-IN': 'हवा की गति', 'en-IN': 'Wind Speed' },

    // Status messages
    'Loading': { 'hi-IN': 'लोड हो रहा है', 'en-IN': 'Loading' },
    'Success': { 'hi-IN': 'सफल', 'en-IN': 'Success' },
    'Error': { 'hi-IN': 'त्रुटि', 'en-IN': 'Error' },
    'Warning': { 'hi-IN': 'चेतावनी', 'en-IN': 'Warning' },
    'Info': { 'hi-IN': 'जानकारी', 'en-IN': 'Info' }
};

/**
 * Get translation from static dictionary
 */
export function getStaticTranslation(
    key: string, 
    targetLang: keyof SupportedLanguages = 'hi-IN'
): string {
    const translation = staticTranslations[key];
    
    if (translation && translation[targetLang]) {
        console.log('TRANSLATE: Static translation found for', key, '->', translation[targetLang]);
        return translation[targetLang] as string;
    }
    
    console.log('TRANSLATE: No static translation found for', key, 'returning original');
    return key;
}

/**
 * Translate multiple keys at once
 */
export function translateMultipleKeys(
    keys: string[], 
    targetLang: keyof SupportedLanguages = 'hi-IN'
): { [key: string]: string } {
    console.log('TRANSLATE: Translating multiple keys to', targetLang);
    
    const result: { [key: string]: string } = {};
    
    keys.forEach(key => {
        result[key] = getStaticTranslation(key, targetLang);
    });
    
    return result;
}

/**
 * Check if a translation exists for a given key
 */
export function hasTranslation(key: string, targetLang: keyof SupportedLanguages = 'hi-IN'): boolean {
    const translation = staticTranslations[key];
    return !!(translation && translation[targetLang]);
}

/**
 * Add new translation to dictionary (runtime addition)
 */
export function addTranslation(
    key: string, 
    translations: Partial<SupportedLanguages>
): void {
    console.log('TRANSLATE: Adding new translation for key:', key);
    staticTranslations[key] = translations;
}

/**
 * Get all available translation keys
 */
export function getAvailableKeys(): string[] {
    return Object.keys(staticTranslations);
}

/**
 * Get supported language codes
 */
export function getSupportedLanguages(): (keyof SupportedLanguages)[] {
    return ['hi-IN', 'en-IN', 'bn-IN', 'ta-IN', 'te-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'kn-IN', 'ml-IN', 'or-IN', 'as-IN'];
}