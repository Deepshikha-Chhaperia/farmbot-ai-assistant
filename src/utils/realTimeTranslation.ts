// Live translation utility - Google Translate style dynamic translation
// Supports real-time UI language switching between Hindi and English

interface TranslationResult {
    originalText: string;
    translatedText: string;
    fromLanguage: string;
    toLanguage: string;
}

/**
 * Live translation using Google Translate API
 * This provides real-time translation like Google Translate
 */
export const translateTextLive = async (
    text: string,
    fromLang: string,
    toLang: string
): Promise<string> => {
    if (!text?.trim()) {
        console.log('TRANSLATE: No text to translate (empty or null)');
        return text;
    }
    
    if (fromLang === toLang) {
        console.log('TRANSLATE: Same language, no translation needed');
        return text;
    }

    console.log('TRANSLATE: Live translating from', fromLang, 'to', toLang);

    try {
        // Convert language codes to Google Translate format
        const fromCode = getGoogleLangCode(fromLang);
        const toCode = getGoogleLangCode(toLang);
        
        // Use Google Translate API (free version)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromCode}&tl=${toCode}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            const translatedText = data[0][0][0];
            console.log('TRANSLATE: Success -', text, '->', translatedText);
            return translatedText;
        } else {
            // Fallback to MyMemory API if Google fails
            return await fallbackTranslation(text, fromCode, toCode);
        }
    } catch (error) {
        console.error('TRANSLATE: Google Translate failed:', error);
        const fromCode = getGoogleLangCode(fromLang);
        const toCode = getGoogleLangCode(toLang);
        return await fallbackTranslation(text, fromCode, toCode);
    }
};

/**
 * Fallback translation using MyMemory API
 */
async function fallbackTranslation(text: string, from: string, to: string): Promise<string> {
    try {
        console.log('TRANSLATE: Using fallback MyMemory API');
        
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
            const translatedText = data.responseData.translatedText;
            console.log('TRANSLATE: Fallback success -', text, '->', translatedText);
            return translatedText;
        } else {
            console.warn('TRANSLATE: All APIs failed, returning original text');
            return text;
        }
    } catch (error) {
        console.error('TRANSLATE: Fallback translation failed:', error);
        return text;
    }
}

/**
 * Convert language codes to Google Translate format
 */
function getGoogleLangCode(langCode: string): string {
    const mapping: { [key: string]: string } = {
        'hi-IN': 'hi',
        'en-IN': 'en',
        'bn-IN': 'bn',
        'ta-IN': 'ta',
        'te-IN': 'te',
        'mr-IN': 'mr',
        'gu-IN': 'gu',
        'pa-IN': 'pa',
        'kn-IN': 'kn',
        'ml-IN': 'ml',
        'or-IN': 'or',
        'as-IN': 'as'
    };
    return mapping[langCode] || langCode.split('-')[0];
}

/**
 * Translate profile data in real-time when language is changed
 */
export async function translateProfileDataLive(profileData: any, targetLanguage: string) {
    console.log('TRANSLATE: Starting live profile data translation to', targetLanguage);
    
    try {
        const translated = { ...profileData };
        
        // Determine source language (assume current UI language)
        const sourceLanguage = targetLanguage === 'hi-IN' ? 'en-IN' : 'hi-IN';
        
        // Translate user-facing fields
        if (profileData.name && typeof profileData.name === 'string') {
            translated.name = await translateTextLive(profileData.name, sourceLanguage, targetLanguage);
        }
        
        if (profileData.location && typeof profileData.location === 'string') {
            translated.location = await translateTextLive(profileData.location, sourceLanguage, targetLanguage);
        }
        
        if (profileData.farmingType && typeof profileData.farmingType === 'string') {
            translated.farmingType = await translateTextLive(profileData.farmingType, sourceLanguage, targetLanguage);
        }
        
        if (profileData.primaryCrops && Array.isArray(profileData.primaryCrops)) {
            translated.primaryCrops = await Promise.all(
                profileData.primaryCrops.map((crop: string) => 
                    translateTextLive(crop, sourceLanguage, targetLanguage)
                )
            );
        }

        console.log('TRANSLATE: Profile data translation completed');
        return translated;
    } catch (error) {
        console.error('TRANSLATE: Profile data translation failed:', error);
        return profileData;
    }
}

/**
 * Translate an array of UI texts (for bulk translation)
 */
export async function translateUITexts(
    texts: string[], 
    fromLang: string, 
    toLang: string
): Promise<string[]> {
    console.log('TRANSLATE: Bulk translating', texts.length, 'UI texts');
    
    try {
        const translations = await Promise.all(
            texts.map(text => translateTextLive(text, fromLang, toLang))
        );
        
        console.log('TRANSLATE: Bulk translation completed');
        return translations;
    } catch (error) {
        console.error('TRANSLATE: Bulk translation failed:', error);
        return texts;
    }
}

/**
 * Detect if text is likely Hindi or English (basic detection)
 */
export function detectLanguage(text: string): 'hi-IN' | 'en-IN' {
    if (!text) return 'en-IN';
    
    // Check for Devanagari characters (Hindi)
    const hindiRegex = /[\u0900-\u097F]/;
    
    if (hindiRegex.test(text)) {
        return 'hi-IN';
    } else {
        return 'en-IN';
    }
}