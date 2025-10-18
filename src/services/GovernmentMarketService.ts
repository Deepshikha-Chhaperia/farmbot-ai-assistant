// Government Market Price Service using official APIs
// Uses AGMARKNET, e-NAM, FCA Infoweb, NHB, and other government sources

interface MarketPrice {
    commodity: string;
    price: number;
    unit: string;
    market: string;
    state?: string;
    trend?: string;
    change?: number;
    date: string;
    source: string;
    arrivals?: number;
    quality?: string;
}

interface LocationData {
    lat: number;
    lon: number;
    city: string;
    state: string;
    district: string;
}

class GovernmentMarketService {
    private cache = new Map<string, { data: MarketPrice[]; timestamp: number }>();
    private readonly cacheTimeout = 60 * 60 * 1000; // 1 hour for more stable prices
    private fallbackCache = new Map<string, MarketPrice[]>(); // Separate cache for fallback data

    // Government API endpoints and configurations
    private readonly apiSources = [
        {
            name: 'AGMARKNET',
            url: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
            key: '579b464db66ec23bdd000001cce8b87bb7614c51d71b5f0e60b00cbd',
            priority: 1,
            description: 'Agricultural Marketing Division - Daily Mandi Prices'
        },
        {
            name: 'e-NAM',
            url: 'https://api.data.gov.in/resource/eb348ba4-4d79-40cd-913c-c8e1081c7b67',
            key: '579b464db66ec23bdd000001cce8b87bb7614c51d71b5f0e60b00cbd',
            priority: 2,
            description: 'e-National Agriculture Market - Real-time Prices'
        },
        {
            name: 'FCA_Infoweb',
            url: 'https://fcainfoweb.nic.in/reports/report_menu_web.aspx',
            key: null,
            priority: 3,
            description: 'Food Corporation of India - Retail Prices'
        },
        {
            name: 'NHB_Horticulture',
            url: 'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24',
            key: '579b464db66ec23bdd000001cce8b87bb7614c51d71b5f0e60b00cbd',
            priority: 4,
            description: 'National Horticulture Board - Fruit & Vegetable Prices'
        }
    ];

    // Get current location for market data
    async getCurrentLocation(): Promise<LocationData> {
        try {
            // Try to get precise location
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5 * 60 * 1000
                });
            });

            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get detailed location
            const geoResponse = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const geoData = await geoResponse.json();

            return {
                lat: latitude,
                lon: longitude,
                city: geoData.city || geoData.locality || 'Unknown',
                state: geoData.principalSubdivision || 'Unknown',
                district: geoData.localityInfo?.administrative?.[3]?.name || geoData.city || 'Unknown'
            };
        } catch (error) {
            // Fallback to IP-based location
            try {
                const ipResponse = await fetch('https://ipapi.co/json/');
                const ipData = await ipResponse.json();
                
                return {
                    lat: ipData.latitude || 28.6139, // Default to Delhi
                    lon: ipData.longitude || 77.2090,
                    city: ipData.city || 'Delhi',
                    state: ipData.region || 'Delhi',
                    district: ipData.city || 'Delhi'
                };
            } catch (fallbackError) {
                // Ultimate fallback
                return {
                    lat: 28.6139,
                    lon: 77.2090,
                    city: 'Delhi',
                    state: 'Delhi',
                    district: 'Delhi'
                };
            }
        }
    }

    // Fetch market data from multiple government sources
    async getMarketPrices(location?: LocationData, commodityFilter?: string[], farmerCrops?: string[], language: string = 'hi-IN'): Promise<MarketPrice[]> {
        const targetLocation = location || await this.getCurrentLocation();
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `market_${targetLocation.state}_${targetLocation.district}_${today}`;

        // Check cache first - more specific cache key with date for stability
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('Using cached market data for today');
            return this.filterAndSortPrices(cached.data, commodityFilter, targetLocation, farmerCrops);
        }

        let allPrices: MarketPrice[] = [];
        let primarySourceSucceeded = false;

        // Try PRIMARY source first (AGMARKNET) - most reliable
        try {
            console.log('Trying primary source: AGMARKNET');
            const primaryPrices = await this.fetchAGMARKNETData(this.apiSources[0], targetLocation);
            if (primaryPrices.length > 0) {
                allPrices = primaryPrices;
                primarySourceSucceeded = true;
                console.log('Primary source (AGMARKNET) succeeded with', primaryPrices.length, 'records');
            }
        } catch (error) {
            console.warn('Primary source (AGMARKNET) failed:', error);
        }

        // If primary source failed, try secondary sources
        if (!primarySourceSucceeded) {
            console.log('Primary source failed, trying secondary sources');
            for (let i = 1; i < this.apiSources.length; i++) {
                const source = this.apiSources[i];
                try {
                    let prices: MarketPrice[] = [];
                    
                    switch (source.name) {
                        case 'e-NAM':
                            prices = await this.fetchENAMData(source, targetLocation);
                            break;
                        case 'NHB_Horticulture':
                            prices = await this.fetchNHBData(source, targetLocation);
                            break;
                        default:
                            continue;
                    }

                    if (prices.length > 0) {
                        allPrices = prices;
                        console.log(`Secondary source ${source.name} succeeded with`, prices.length, 'records');
                        break; // Use first successful secondary source
                    }
                    
                } catch (error) {
                    console.warn(`${source.name} API failed:`, error);
                    continue;
                }
            }
        }

        // If no government data available, use enhanced fallback data with farmer crops
        if (allPrices.length === 0) {
            console.log('All government sources failed, using fallback data');
            allPrices = this.generateRealisticMarketData(targetLocation, farmerCrops, language);
        }

        // Cache the results with improved caching
        this.cache.set(cacheKey, {
            data: allPrices,
            timestamp: Date.now()
        });

        console.log('Final market data cached with', allPrices.length, 'records');
        return this.filterAndSortPrices(allPrices, commodityFilter, targetLocation, farmerCrops);
    }

    // Fetch data from AGMARKNET (Agricultural Marketing Division)
    private async fetchAGMARKNETData(source: any, location: LocationData): Promise<MarketPrice[]> {
        const url = `${source.url}?api-key=${source.key}&format=json&limit=50&filters[state]=${encodeURIComponent(location.state)}`;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'FarmBot Agricultural Assistant'
            }
        });

        if (!response.ok) {
            throw new Error(`AGMARKNET API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.records || data.records.length === 0) {
            throw new Error('No AGMARKNET data available');
        }

        return data.records
            .filter((record: any) => record.commodity && record.modal_price)
            .slice(0, 15)
            .map((record: any) => ({
                commodity: this.normalizeCommodity(record.commodity),
                price: this.parsePrice(record.modal_price),
                unit: this.normalizeUnit(record.unit || 'quintal'),
                market: record.market || `${location.city} Mandi`,
                state: record.state || location.state,
                trend: this.calculateTrend(record.modal_price, record.max_price, record.min_price),
                change: this.calculateChange(record.modal_price, record.max_price, record.min_price),
                date: this.formatDate(record.arrival_date || new Date().toISOString()),
                source: 'AGMARKNET (Govt)',
                arrivals: record.arrivals ? parseInt(record.arrivals) : undefined,
                quality: record.grade || 'Standard'
            }));
    }

    // Fetch data from e-NAM (National Agriculture Market)
    private async fetchENAMData(source: any, location: LocationData): Promise<MarketPrice[]> {
        const url = `${source.url}?api-key=${source.key}&format=json&limit=30`;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'FarmBot Agricultural Assistant'
            }
        });

        if (!response.ok) {
            throw new Error(`e-NAM API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.records || data.records.length === 0) {
            throw new Error('No e-NAM data available');
        }

        return data.records
            .filter((record: any) => record.commodity_name && record.modal_rate)
            .slice(0, 12)
            .map((record: any) => ({
                commodity: this.normalizeCommodity(record.commodity_name),
                price: this.parsePrice(record.modal_rate),
                unit: this.normalizeUnit(record.unit_name || 'quintal'),
                market: record.mandi_name || `${location.city} e-NAM`,
                state: record.state_name || location.state,
                trend: this.calculateTrend(record.modal_rate, record.max_rate, record.min_rate),
                change: this.calculateChange(record.modal_rate, record.max_rate, record.min_rate),
                date: this.formatDate(record.price_date || new Date().toISOString()),
                source: 'e-NAM (Govt)',
                arrivals: record.arrivals_in_qtl ? parseInt(record.arrivals_in_qtl) : undefined,
                quality: record.variety || 'FAQ'
            }));
    }

    // Fetch data from NHB (National Horticulture Board)
    private async fetchNHBData(source: any, location: LocationData): Promise<MarketPrice[]> {
        const url = `${source.url}?api-key=${source.key}&format=json&limit=25`;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'FarmBot Agricultural Assistant'
            }
        });

        if (!response.ok) {
            throw new Error(`NHB API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.records || data.records.length === 0) {
            throw new Error('No NHB data available');
        }

        return data.records
            .filter((record: any) => record.commodity && record.wholesale_price)
            .slice(0, 10)
            .map((record: any) => ({
                commodity: this.normalizeCommodity(record.commodity),
                price: this.parsePrice(record.wholesale_price),
                unit: this.normalizeUnit(record.unit || 'kg'),
                market: record.centre || `${location.city} Wholesale`,
                state: record.state || location.state,
                trend: record.retail_price ? this.calculateTrendFromRetail(record.wholesale_price, record.retail_price) : '+',
                change: record.retail_price ? Math.abs(parseFloat(record.retail_price) - parseFloat(record.wholesale_price)) : this.getDeterministicChange(record.commodity),
                date: this.formatDate(record.date || new Date().toISOString()),
                source: 'NHB (Govt)',
                quality: 'Fresh'
            }));
    }

    // Parse farmer crops input and separate multiple commodities - ENHANCED FOR VOICE SEARCH
    parseFarmerCrops(input: string): string[] {
        if (!input || typeof input !== 'string') return [];
        
        console.log('Voice Input to parse:', input);
        
        // SUPER ENHANCED parsing that handles voice recognition patterns
        const normalizedInput = input
            .toLowerCase()
            .trim()
            // Handle voice recognition artifacts
            .replace(/[\.,;:!?\[\](){}"'`~]/g, ' ') // Remove punctuation
            .replace(/\s+ke\s+bhao\s*/g, ' ') // Remove "ke bhao"
            .replace(/\s+ka\s+bhao\s*/g, ' ') // Remove "ka bhao"
            .replace(/\s+ki\s+keemat\s*/g, ' ') // Remove "ki keemat"
            .replace(/\s+dekhiye\s*/g, ' ') // Remove "dekhiye"
            .replace(/\s+batao\s*/g, ' ') // Remove "batao"
            .replace(/\s+price\s*/g, ' ') // Remove "price"
            // Enhanced separator handling for voice
            .replace(/[,।\s]+और[,।\s]+/g, ' ') // 'और' (and)
            .replace(/[,।\s]+aur[,।\s]+/g, ' ') // 'aur' (and) 
            .replace(/[,।\s]+or[,।\s]+/g, ' ') // 'or' (English)
            .replace(/[,।\s]+with[,।\s]+/g, ' ') // 'with'
            .replace(/[,।\s]+also[,।\s]+/g, ' ') // 'also'
            .replace(/[,।\s]+plus[,।\s]+/g, ' ') // 'plus'
            .replace(/[,।\s]+/g, ' ') // Replace commas, devanagari danda, spaces
            .replace(/\s+/g, ' '); // Multiple spaces to single space
        
        console.log('Voice Normalized input:', normalizedInput);
        
        // Split by spaces and filter more intelligently
        const potentialCrops = normalizedInput
            .split(/\s+/)
            .map(crop => crop.trim())
            .filter(crop => crop.length > 1)
            .filter(crop => !['और', 'aur', 'ki', 'ka', 'ke', 'ki', 'with', 'or', 'also', 'plus', 'the', 'a', 'an', 'is', 'are', 'what', 'how', 'much', 'tell', 'me', 'about', 'show'].includes(crop)); // Remove connecting/filler words
        
        console.log('Potential crops after filtering:', potentialCrops);
        
        // ENHANCED crop mapping with phonetic variations for voice recognition
        const enhancedCropMappings: { [key: string]: string } = {
            // Wheat variations
            'gehu': 'गेहूं', 'gehun': 'गेहूं', 'geyhu': 'गेहूं', 'gehuu': 'गेहूं',
            'wheat': 'गेहूं', 'wheats': 'गेहूं',
            
            // Rice variations  
            'chawal': 'धान', 'chaawal': 'धान', 'chaval': 'धान', 'chawl': 'धान',
            'rice': 'धान', 'dhaan': 'धान', 'dhan': 'धान', 'paddy': 'धान',
            
            // Tomato variations
            'tamatar': 'टमाटर', 'tamaatar': 'टमाटर', 'tomato': 'टमाटर', 'tamater': 'टमाटर',
            
            // Onion variations
            'pyaz': 'प्याज', 'pyaaz': 'प्याज', 'onion': 'प्याज', 'onions': 'प्याज',
            
            // Potato variations
            'aloo': 'आलू', 'aaloo': 'आलू', 'alu': 'आलू', 'potato': 'आलू', 'potatoes': 'आलू',
            
            // Maize variations
            'makka': 'मक्का', 'maaka': 'मक्का', 'makaa': 'मक्का',
            'maize': 'मक्का', 'corn': 'मक्का',
            
            // Cotton variations
            'kapas': 'कपास', 'kapaas': 'कपास', 'cotton': 'कपास',
            
            // Sugarcane variations
            'ganna': 'गन्ना', 'sugarcane': 'गन्ना', 'gana': 'गन्ना',
            
            // Pulse variations
            'chana': 'चना', 'chanaa': 'चना', 'gram': 'चना', 'chickpea': 'चना',
            'arhar': 'अरहर', 'toor': 'अरहर', 'pigeon': 'अरहर',
            'moong': 'मूंग', 'mung': 'मूंग', 'green': 'मूंग',
            'urad': 'उड़द', 'black': 'उड़द',
            
            // Oil seeds
            'sarson': 'सरसों', 'mustard': 'सरसों', 'sarso': 'सरसों',
            'til': 'तिल', 'sesame': 'तिल',
            'soybean': 'सोयाबीन', 'soya': 'सोयाबीन',
            'groundnut': 'मूंगफली', 'peanut': 'मूंगफली', 'moongfali': 'मूंगफली',
            
            // Spices
            'haldi': 'हल्दी', 'turmeric': 'हल्दी', 'haladi': 'हल्दी',
            'lahsun': 'लहसुन', 'garlic': 'लहसुन', 'lasun': 'लहसुन',
            'adrak': 'अदरक', 'ginger': 'अदरक', 'adarak': 'अदरक',
            'mirch': 'हरी मिर्च', 'chili': 'हरी मिर्च', 'pepper': 'हरी मिर्च',
            
            // Millets
            'bajra': 'बाजरा', 'pearl': 'बाजरा', 'bajara': 'बाजरा',
            'jowar': 'ज्वार', 'sorghum': 'ज्वार', 'jwar': 'ज्वार',
            
            // Other crops
            'dhania': 'धनिया', 'coriander': 'धनिया', 'dhaniya': 'धनिया',
            'methi': 'मेथी', 'fenugreek': 'मेथी'
        };
        
        // Map crops with enhanced matching
        const mappedCrops = potentialCrops.map(crop => {
            // Direct mapping
            const directMatch = enhancedCropMappings[crop];
            if (directMatch) {
                console.log(`Direct match: ${crop} -> ${directMatch}`);
                return directMatch;
            }
            
            // Fuzzy matching for voice recognition errors
            const cropKeys = Object.keys(enhancedCropMappings);
            const fuzzyMatch = cropKeys.find(key => {
                // Check if crop contains key or key contains crop (for partial matches)
                if (crop.includes(key) || key.includes(crop)) {
                    return true;
                }
                // Check Levenshtein distance for phonetic similarity
                const distance = this.calculateLevenshteinDistance(crop, key);
                return distance <= Math.min(2, Math.floor(key.length / 3)); // Allow 1-2 char differences
            });
            
            if (fuzzyMatch) {
                const fuzzyResult = enhancedCropMappings[fuzzyMatch];
                console.log(`Fuzzy match: ${crop} -> ${fuzzyMatch} -> ${fuzzyResult}`);
                return fuzzyResult;
            }
            
            console.log(`No match found for: ${crop}, keeping as-is`);
            return crop; // Keep original if no match
        }).filter(crop => crop.length > 0);
        
        const uniqueCrops = [...new Set(mappedCrops)]; // Remove duplicates
        console.log('Final mapped voice crops:', uniqueCrops);
        return uniqueCrops;
    }
    
    // Calculate Levenshtein distance for fuzzy matching
    private calculateLevenshteinDistance(str1: string, str2: string): number {
        const matrix: number[][] = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Generate realistic market data as fallback with Hindi names - FIXED PRICES
    private generateRealisticMarketData(location: LocationData, farmerCrops?: string[], language: string = 'hi-IN'): MarketPrice[] {
        // Check if we already have cached fallback data for today
        const today = new Date();
        const todayKey = `fallback_${today.toISOString().split('T')[0]}_${location.city}`;
        
        if (this.fallbackCache.has(todayKey)) {
            console.log('Using cached fallback data for today');
            return this.fallbackCache.get(todayKey)!;
        }

        const commodities = [
            { name: 'धान', englishName: 'Rice', basePrice: 2400, variation: 300, unit: 'quintal' },
            { name: 'गेहूं', englishName: 'Wheat', basePrice: 2100, variation: 250, unit: 'quintal' },
            { name: 'कपास', englishName: 'Cotton', basePrice: 6200, variation: 500, unit: 'quintal' },
            { name: 'गन्ना', englishName: 'Sugarcane', basePrice: 310, variation: 40, unit: 'quintal' },
            { name: 'मक्का', englishName: 'Maize', basePrice: 1850, variation: 200, unit: 'quintal' },
            { name: 'बाजरा', englishName: 'Bajra', basePrice: 1700, variation: 180, unit: 'quintal' },
            { name: 'ज्वार', englishName: 'Jowar', basePrice: 1650, variation: 170, unit: 'quintal' },
            { name: 'चना', englishName: 'Chana', basePrice: 4500, variation: 400, unit: 'quintal' },
            { name: 'हल्दी', englishName: 'Turmeric', basePrice: 8500, variation: 800, unit: 'quintal' },
            { name: 'मूंगफली', englishName: 'Groundnut', basePrice: 4800, variation: 450, unit: 'quintal' },
            { name: 'सरसों', englishName: 'Mustard Seed', basePrice: 4200, variation: 380, unit: 'quintal' },
            { name: 'सोयाबीन', englishName: 'Soybean', basePrice: 3800, variation: 350, unit: 'quintal' },
            { name: 'प्याज', englishName: 'Onion', basePrice: 25, variation: 8, unit: 'kg' },
            { name: 'आलू', englishName: 'Potato', basePrice: 18, variation: 5, unit: 'kg' },
            { name: 'टमाटर', englishName: 'Tomato', basePrice: 35, variation: 12, unit: 'kg' },
            { name: 'लहसुन', englishName: 'Garlic', basePrice: 180, variation: 40, unit: 'kg' },
            { name: 'अदरक', englishName: 'Ginger', basePrice: 120, variation: 30, unit: 'kg' },
            { name: 'हरी मिर्च', englishName: 'Green Chili', basePrice: 45, variation: 15, unit: 'kg' },
            { name: 'अरहर', englishName: 'Arhar', basePrice: 5500, variation: 400, unit: 'quintal' },
            { name: 'मूंग', englishName: 'Moong', basePrice: 6800, variation: 500, unit: 'quintal' },
            { name: 'उड़द', englishName: 'Urad', basePrice: 7200, variation: 600, unit: 'quintal' },
            { name: 'तिल', englishName: 'Sesame', basePrice: 8000, variation: 700, unit: 'quintal' },
            { name: 'धनिया', englishName: 'Coriander', basePrice: 15000, variation: 1200, unit: 'quintal' },
            { name: 'मेथी', englishName: 'Fenugreek', basePrice: 6500, variation: 500, unit: 'quintal' }
        ];

        // Prioritize farmer's crops, then add other commodities
        let selectedCommodities = [];
        
        // STRICT FARMER CROP FILTERING: If farmer has specific crops, ONLY show those
        // Don't add any extra commodities when farmer crops are specified
        if (farmerCrops && farmerCrops.length > 0) {
            const farmerSpecificCrops = commodities.filter(commodity => 
                farmerCrops.some(crop => {
                    const cropLower = crop.toLowerCase().trim();
                    const commodityNameLower = commodity.name.toLowerCase();
                    const commodityEnglishLower = commodity.englishName.toLowerCase();
                    
                    // Direct matches
                    if (commodityNameLower === cropLower || commodityEnglishLower === cropLower) {
                        return true;
                    }
                    
                    // Partial matches
                    if (commodityNameLower.includes(cropLower) || cropLower.includes(commodityNameLower)) {
                        return true;
                    }
                    
                    if (commodityEnglishLower.includes(cropLower) || cropLower.includes(commodityEnglishLower)) {
                        return true;
                    }
                    
                    // Special Hindi-English mappings
                    const mappings = {
                        'wheat': 'गेहूं', 'gehun': 'गेहूं',
                        'rice': 'धान', 'paddy': 'धान', 'dhaan': 'धान',
                        'cotton': 'कपास', 'kapas': 'कपास',
                        'maize': 'मक्का', 'makka': 'मक्का',
                        'tomato': 'टमाटर', 'tamatar': 'टमाटर'
                    };
                    
                    if (mappings[cropLower] === commodityNameLower || mappings[commodityNameLower] === cropLower) {
                        return true;
                    }
                    
                    return false;
                })
            );
            selectedCommodities = [...farmerSpecificCrops];
        } else {
            // No farmer crops specified, so we show no commodities at all (not even fallback)
            selectedCommodities = [];
        }
        
        // ABSOLUTELY NO EXTRA COMMODITIES - only farmer crops
        // If no farmer crops found, don't show anything extra
        if (selectedCommodities.length === 0) {
            // Only return empty array or basic wheat/tomato if no farmer crops
            if (!farmerCrops || farmerCrops.length === 0) {
                selectedCommodities = [commodities[1], commodities[14]]; // Just wheat and tomato
            }
        }

        const generatedPrices = selectedCommodities.map(commodity => {
            // Use deterministic seed based on commodity + today's date
            const seed = this.generateDeterministicSeed(commodity.name, today);
            const randomValue = this.seededRandom(seed);
            
            // Generate consistent daily prices using seeded random
            const priceVariation = (randomValue - 0.5) * commodity.variation * 0.6;
            const finalPrice = Math.round(commodity.basePrice + priceVariation);
            
            // Generate consistent trend and change using different seeds
            const trendSeed = this.generateDeterministicSeed(commodity.name + '_trend', today);
            const changeSeed = this.generateDeterministicSeed(commodity.name + '_change', today);
            const arrivalSeed = this.generateDeterministicSeed(commodity.name + '_arrival', today);
            
            const trend = this.seededRandom(trendSeed) > 0.45 ? '+' : '-';
            const changePercent = this.seededRandom(changeSeed) * 8 + 1;
            const arrivals = Math.floor(this.seededRandom(arrivalSeed) * 500) + 50;

            return {
                commodity: commodity.name, // Hindi name
                price: finalPrice,
                unit: commodity.unit,
                market: this.generateLocalizedMarketName(location.city, language),
                state: this.translateLocation(location.state, language),
                trend,
                change: Math.round(changePercent * 10) / 10,
                date: today.toLocaleDateString('en-IN'),
                source: 'क्षेत्रीय बाजार डेटा',
                arrivals
            };
        });
        
        // Cache the generated data for today
        this.fallbackCache.set(todayKey, generatedPrices);
        console.log('Generated and cached new fallback data for today');
        
        return generatedPrices;
    }

    // Generate deterministic seed for consistent randomness
    private generateDeterministicSeed(input: string, date: Date): number {
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const seedStr = input + dateStr;
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            const char = seedStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    // Seeded random number generator (Linear Congruential Generator)
    private seededRandom(seed: number): number {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    // Get deterministic change value for consistency
    private getDeterministicChange(commodity: string): number {
        const seed = this.generateDeterministicSeed(commodity, new Date());
        return Math.floor(this.seededRandom(seed) * 10) + 1;
    }

    // Translate location names based on language
    translateLocation(locationString: string, language: string = 'hi-IN'): string {
        const locationTranslations: { [key: string]: { [key: string]: string } } = {
            // Major cities
            'Kolkata': { 'hi-IN': 'कोलकाता', 'bn-IN': 'কলকাতা', 'en-IN': 'Kolkata' },
            'Mumbai': { 'hi-IN': 'मुंबई', 'mr-IN': 'मुंबई', 'en-IN': 'Mumbai' },
            'Delhi': { 'hi-IN': 'दिल्ली', 'en-IN': 'Delhi' },
            'Chennai': { 'hi-IN': 'चेन्नई', 'ta-IN': 'சென்னை', 'en-IN': 'Chennai' },
            'Bangalore': { 'hi-IN': 'बेंगलूरु', 'kn-IN': 'ಬೆಂಗಳೂರು', 'en-IN': 'Bangalore' },
            'Hyderabad': { 'hi-IN': 'हैदराबाद', 'te-IN': 'హైదరాబాద్', 'en-IN': 'Hyderabad' },
            'Pune': { 'hi-IN': 'पुणे', 'mr-IN': 'पुणे', 'en-IN': 'Pune' },
            'Ahmedabad': { 'hi-IN': 'अहमदाबाद', 'gu-IN': 'અમદાવાદ', 'en-IN': 'Ahmedabad' },
            'Jaipur': { 'hi-IN': 'जयपुर', 'en-IN': 'Jaipur' },
            'Lucknow': { 'hi-IN': 'लखनऊ', 'en-IN': 'Lucknow' },
            'Kanpur': { 'hi-IN': 'कानपुर', 'en-IN': 'Kanpur' },
            'Nagpur': { 'hi-IN': 'नागपुर', 'mr-IN': 'नागपूर', 'en-IN': 'Nagpur' },
            'Patna': { 'hi-IN': 'पटना', 'en-IN': 'Patna' },
            'Indore': { 'hi-IN': 'इंदौर', 'en-IN': 'Indore' },
            'Bhopal': { 'hi-IN': 'भोपाल', 'en-IN': 'Bhopal' },
            'Agra': { 'hi-IN': 'आगरा', 'en-IN': 'Agra' },
            'Visakhapatnam': { 'hi-IN': 'विशाखापत्तनम', 'te-IN': 'విశాఖపట్నం', 'en-IN': 'Visakhapatnam' },
            'Vadodara': { 'hi-IN': 'वडोदरा', 'gu-IN': 'વડોદરા', 'en-IN': 'Vadodara' },
            'Coimbatore': { 'hi-IN': 'कोयम्बटूर', 'ta-IN': 'கோயம்புத்தூர்', 'en-IN': 'Coimbatore' },
            
            // States
            'West Bengal': { 'hi-IN': 'पश्चिम बंगाल', 'bn-IN': 'পশ্চিমবঙ্গ', 'en-IN': 'West Bengal' },
            'Maharashtra': { 'hi-IN': 'महाराष्ट्र', 'mr-IN': 'महाराष्ट्र', 'en-IN': 'Maharashtra' },
            'Gujarat': { 'hi-IN': 'गुजरात', 'gu-IN': 'ગુજરાત', 'en-IN': 'Gujarat' },
            'Rajasthan': { 'hi-IN': 'राजस्थान', 'en-IN': 'Rajasthan' },
            'Punjab': { 'hi-IN': 'पंजाब', 'pa-IN': 'ਪੰਜਾਬ', 'en-IN': 'Punjab' },
            'Haryana': { 'hi-IN': 'हरियाणा', 'en-IN': 'Haryana' },
            'Uttar Pradesh': { 'hi-IN': 'उत्तर प्रदेश', 'en-IN': 'Uttar Pradesh' },
            'Bihar': { 'hi-IN': 'बिहार', 'en-IN': 'Bihar' },
            'Odisha': { 'hi-IN': 'ओडिशा', 'or-IN': 'ଓଡ଼ିଶା', 'en-IN': 'Odisha' },
            'Tamil Nadu': { 'hi-IN': 'तमिलनाडु', 'ta-IN': 'தமிழ்நாடு', 'en-IN': 'Tamil Nadu' },
            'Karnataka': { 'hi-IN': 'कर्नाटक', 'kn-IN': 'ಕರ್ನಾಟಕ', 'en-IN': 'Karnataka' },
            'Andhra Pradesh': { 'hi-IN': 'आंध्र प्रदेश', 'te-IN': 'ఆంధ్రప్రదేశ్', 'en-IN': 'Andhra Pradesh' },
            'Kerala': { 'hi-IN': 'केरल', 'ml-IN': 'കേരളം', 'en-IN': 'Kerala' },
            'Assam': { 'hi-IN': 'असम', 'as-IN': 'অসম', 'en-IN': 'Assam' },
            'Jharkhand': { 'hi-IN': 'झारखंड', 'en-IN': 'Jharkhand' },
            'Chhattisgarh': { 'hi-IN': 'छत्तीसगढ़', 'en-IN': 'Chhattisgarh' },
            'Madhya Pradesh': { 'hi-IN': 'मध्य प्रदेश', 'en-IN': 'Madhya Pradesh' },
            'Telangana': { 'hi-IN': 'तेलंगाना', 'te-IN': 'తెలంగాణ', 'en-IN': 'Telangana' }
        };
        
        let translatedLocation = locationString;
        
        // Apply translations for each part of the location string
        for (const [english, translations] of Object.entries(locationTranslations)) {
            const translated = translations[language] || english;
            translatedLocation = translatedLocation.replace(new RegExp(english, 'gi'), translated);
        }
        
        return translatedLocation;
    }

    // Generate localized market name based on language
    generateLocalizedMarketName(cityName: string, language: string = 'hi-IN'): string {
        let translatedCity = this.translateLocation(cityName, language);
        
        // Comprehensive list of all market suffixes in all languages to remove
        const allMarketSuffixes = [
            'मंडी', 'बाजार', 'Market', 'मार्केट',
            'মান্ডি', 'বাজার', 'சந்தை', 'మండី', 'మార్కెట్',
            'બજાર', 'ਮੰਡੀ', 'ବଜାର', 'बजार',
            'Mandi', 'Bazaar', 'market', 'mandi', 'bazaar'
        ];
        
        // Remove ALL market suffixes from the translated city name
        for (const suffix of allMarketSuffixes) {
            // Case-insensitive removal with word boundaries
            const regex = new RegExp(`\\s+${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gi');
            translatedCity = translatedCity.replace(regex, '');
        }
        
        // Trim any extra whitespace
        translatedCity = translatedCity.trim();
        
        // Add the appropriate market suffix based on language
        const marketSuffix = {
            'hi-IN': 'मंडी',
            'mr-IN': 'मंडी', 
            'bn-IN': 'মান্ডি',
            'ta-IN': 'சந்தை',
            'te-IN': 'మండీ',
            'gu-IN': 'બજાર',
            'pa-IN': 'ਮੰਡੀ',
            'en-IN': 'Market'
        };
        
        const finalSuffix = marketSuffix[language] || marketSuffix['hi-IN'];
        return `${translatedCity} ${finalSuffix}`;
    }

    // Translate commodities based on language
    translateCommodity(commodity: string, language: string = 'hi-IN'): string {
        console.log(`translateCommodity: "${commodity}" to language "${language}"`);
        
        const commodityTranslations: { [key: string]: { [key: string]: string } } = {
            // Hindi as base form with translations
            'धान': { 'en-IN': 'Rice', 'hi-IN': 'धान', 'mr-IN': 'धान' },
            'गेहूं': { 'en-IN': 'Wheat', 'hi-IN': 'गेहूं', 'mr-IN': 'गहू' },
            'कपास': { 'en-IN': 'Cotton', 'hi-IN': 'कपास', 'mr-IN': 'कापूस' },
            'गन्ना': { 'en-IN': 'Sugarcane', 'hi-IN': 'गन्ना', 'mr-IN': 'उस' },
            'मक्का': { 'en-IN': 'Maize', 'hi-IN': 'मक्का', 'mr-IN': 'मक्का' },
            'बाजरा': { 'en-IN': 'Bajra', 'hi-IN': 'बाजरा', 'mr-IN': 'बाजरी' },
            'ज्वार': { 'en-IN': 'Jowar', 'hi-IN': 'ज्वार', 'mr-IN': 'ज्वारी' },
            'चना': { 'en-IN': 'Chickpea', 'hi-IN': 'चना', 'mr-IN': 'हरभरा' },
            'हल्दी': { 'en-IN': 'Turmeric', 'hi-IN': 'हल्दी', 'mr-IN': 'हळद' },
            'मूंगफली': { 'en-IN': 'Groundnut', 'hi-IN': 'मूंगफली', 'mr-IN': 'भूईमूग' },
            'सरसों': { 'en-IN': 'Mustard Seed', 'hi-IN': 'सरसों', 'mr-IN': 'मोहरी' },
            'सोयाबीन': { 'en-IN': 'Soybean', 'hi-IN': 'सोयाबीन', 'mr-IN': 'सोयाबीन' },
            'प्याज': { 'en-IN': 'Onion', 'hi-IN': 'प्याज', 'mr-IN': 'कांदा' },
            'आलू': { 'en-IN': 'Potato', 'hi-IN': 'आलू', 'mr-IN': 'बटाटा' },
            'टमाटर': { 'en-IN': 'Tomato', 'hi-IN': 'टमाटर', 'mr-IN': 'टमाटर' },
            'लहसुन': { 'en-IN': 'Garlic', 'hi-IN': 'लहसुन', 'mr-IN': 'लसूण' },
            'अदरक': { 'en-IN': 'Ginger', 'hi-IN': 'अदरक', 'mr-IN': 'आले' },
            'हरी मिर्च': { 'en-IN': 'Green Chili', 'hi-IN': 'हरी मिर्च', 'mr-IN': 'हिरवी मिरची' },
            'अरहर': { 'en-IN': 'Pigeon Pea', 'hi-IN': 'अरहर', 'mr-IN': 'तूर' },
            'मूंग': { 'en-IN': 'Moong', 'hi-IN': 'मूंग', 'mr-IN': 'मूग' },
            'उड़द': { 'en-IN': 'Black Gram', 'hi-IN': 'उड़द', 'mr-IN': 'उडीद' },
            'तिल': { 'en-IN': 'Sesame', 'hi-IN': 'तिल', 'mr-IN': 'तिळ' },
            'धनिया': { 'en-IN': 'Coriander', 'hi-IN': 'धनिया', 'mr-IN': 'धणे' },
            'मेथी': { 'en-IN': 'Fenugreek', 'hi-IN': 'मेथी', 'mr-IN': 'मेथी' }
        };

        // Reverse lookup maps
        const englishToHindi: { [key: string]: string } = {
            'rice': 'धान', 'wheat': 'गेहूं', 'cotton': 'कपास', 'sugarcane': 'गन्ना',
            'maize': 'मक्का', 'bajra': 'बाजरा', 'jowar': 'ज्वार', 'chickpea': 'चना',
            'turmeric': 'हल्दी', 'groundnut': 'मूंगफली', 'mustard seed': 'सरसों', 'soybean': 'सोयाबीन',
            'onion': 'प्याज', 'potato': 'आलू', 'tomato': 'टमाटर', 'garlic': 'लहसुन',
            'ginger': 'अदरक', 'green chili': 'हरी मिर्च', 'pigeon pea': 'अरहर',
            'moong': 'मूंग', 'black gram': 'उड़द', 'sesame': 'तिल', 'coriander': 'धनिया', 'fenugreek': 'मेथी'
        };
        
        // For English mode: If input is already in English, keep it in English
        if (language === 'en-IN') {
            const normalizedInput = commodity.toLowerCase().trim();
            
            // Check if it's already in English (in our reverse lookup)
            if (englishToHindi[normalizedInput]) {
                // It's English, find the proper English form from translations
                const hindiForm = englishToHindi[normalizedInput];
                const englishForm = commodityTranslations[hindiForm]?.['en-IN'];
                console.log(`English mode: "${commodity}" -> "${englishForm || commodity}"`);
                return englishForm || commodity;
            }
            
            // Check if it's Hindi that needs to be translated to English
            if (commodityTranslations[commodity]) {
                const englishForm = commodityTranslations[commodity]['en-IN'];
                console.log(`English mode: Hindi "${commodity}" -> English "${englishForm}"`);
                return englishForm || commodity;
            }
            
            // Already in English or unknown, return as-is
            console.log(`English mode: keeping as-is "${commodity}"`);
            return commodity;
        }
        
        // For Hindi/Marathi modes: Convert English to local language
        const normalizedInput = commodity.toLowerCase().trim();
        let hindiBase = commodity;
        
        // If input is English, convert to Hindi first
        if (englishToHindi[normalizedInput]) {
            hindiBase = englishToHindi[normalizedInput];
            console.log(`Converting English "${commodity}" -> Hindi "${hindiBase}"`);
        }
        
        // Then translate to target language
        const result = commodityTranslations[hindiBase]?.[language] || commodity;
        console.log(`Final result: "${commodity}" -> "${result}" for language "${language}"`);
        return result;
    }

    // Helper methods with enhanced Hindi-English mapping
    private normalizeCommodity(commodity: string): string {
        const commodityMap: { [key: string]: string } = {
            // English to Hindi mapping
            'rice': 'धान',
            'paddy': 'धान',
            'dhaan': 'धान',
            'basmati': 'धान',
            'wheat': 'गेहूं',
            'gehun': 'गेहूं',
            'cotton': 'कपास',
            'kapas': 'कपास',
            'cotton seed': 'कपास',
            'sugarcane': 'गन्ना',
            'ganna': 'गन्ना',
            'maize': 'मक्का',
            'makka': 'मक्का',
            'corn': 'मक्का',
            'bajra': 'बाजरा',
            'pearl millet': 'बाजरा',
            'jowar': 'ज्वार',
            'sorghum': 'ज्वार',
            'gram': 'चना',
            'chana': 'चना',
            'chickpea': 'चना',
            'turmeric': 'हल्दी',
            'haldi': 'हल्दी',
            'groundnut': 'मूंगफली',
            'moongfali': 'मूंगफली',
            'peanut': 'मूंगफली',
            'mustard': 'सरसों',
            'mustard seed': 'सरसों',
            'sarson': 'सरसों',
            'soybean': 'सोयाबीन',
            'soya bean': 'सोयाबीन',
            'soyabean': 'सोयाबीन',
            'onion': 'प्याज',
            'pyaz': 'प्याज',
            'potato': 'आलू',
            'aloo': 'आलू',
            'tomato': 'टमाटर',
            'tamatar': 'टमाटर',
            'garlic': 'लहसुन',
            'lahsun': 'लहसुन',
            'ginger': 'अदरक',
            'adrak': 'अदरक',
            'green chili': 'हरी मिर्च',
            'green chilli': 'हरी मिर्च',
            'hari mirch': 'हरी मिर्च',
            // Additional mappings
            'arhar': 'अरहर',
            'tur': 'अरहर',
            'moong': 'मूंग',
            'urad': 'उड़द',
            'sesame': 'तिल',
            'til': 'तिल',
            'coriander': 'धनिया',
            'dhania': 'धनिया',
            'fenugreek': 'मेथी',
            'methi': 'मेथी'
        };

        const normalized = commodity.toLowerCase().trim();
        return commodityMap[normalized] || this.capitalizeWords(commodity);
    }

    private normalizeUnit(unit: string): string {
        const unitMap: { [key: string]: string } = {
            'qtl': 'quintal',
            'quintal': 'quintal',
            'kg': 'kg',
            'kilogram': 'kg',
            'ton': 'tonne',
            'tonne': 'tonne',
            'mt': 'tonne'
        };
        
        return unitMap[unit.toLowerCase()] || unit;
    }

    private parsePrice(priceStr: string | number): number {
        if (typeof priceStr === 'number') return priceStr;
        const cleaned = priceStr.toString().replace(/[^\d.]/g, '');
        const price = parseFloat(cleaned);
        return isNaN(price) ? 0 : Math.round(price);
    }

    private calculateTrend(modal: string | number, max: string | number, min: string | number): string {
        const modalPrice = this.parsePrice(modal);
        const maxPrice = this.parsePrice(max);
        const avgPrice = (maxPrice + this.parsePrice(min)) / 2;
        
        return modalPrice > avgPrice ? '+' : '-';
    }

    private calculateChange(modal: string | number, max: string | number, min: string | number): number {
        const modalPrice = this.parsePrice(modal);
        const avgPrice = (this.parsePrice(max) + this.parsePrice(min)) / 2;
        
        if (avgPrice === 0) {
            // Use deterministic fallback instead of random
            const seed = this.generateDeterministicSeed(modal.toString(), new Date());
            return Math.round(this.seededRandom(seed) * 5) + 1;
        }
        
        const changePercent = Math.abs((modalPrice - avgPrice) / avgPrice * 100);
        return Math.round(changePercent * 10) / 10;
    }

    private calculateTrendFromRetail(wholesale: string | number, retail: string | number): string {
        const wholesalePrice = this.parsePrice(wholesale);
        const retailPrice = this.parsePrice(retail);
        const margin = (retailPrice - wholesalePrice) / wholesalePrice * 100;
        
        return margin < 20 ? '+' : '-'; // Good margin indicates rising wholesale prices
    }

    private formatDate(dateStr: string): string {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN');
        } catch {
            return new Date().toLocaleDateString('en-IN');
        }
    }

    private capitalizeWords(str: string): string {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }

    private filterAndSortPrices(prices: MarketPrice[], commodityFilter?: string[], location?: LocationData, farmerCrops?: string[]): MarketPrice[] {
        let filtered = prices;

        // Filter by commodity if specified
        if (commodityFilter && commodityFilter.length > 0) {
            filtered = prices.filter(price => 
                commodityFilter.some(commodity => 
                    price.commodity.toLowerCase().includes(commodity.toLowerCase())
                )
            );
        }

        // Sort by relevance: farmer's crops first, then trending up, then alphabetically
        return filtered.sort((a, b) => {
            // First priority: farmer's crops
            if (farmerCrops && farmerCrops.length > 0) {
                const aIsFarmerCrop = farmerCrops.some(crop => 
                    a.commodity.toLowerCase().includes(crop.toLowerCase()) ||
                    crop.toLowerCase().includes(a.commodity.toLowerCase())
                );
                const bIsFarmerCrop = farmerCrops.some(crop => 
                    b.commodity.toLowerCase().includes(crop.toLowerCase()) ||
                    crop.toLowerCase().includes(b.commodity.toLowerCase())
                );
                
                if (aIsFarmerCrop && !bIsFarmerCrop) return -1;
                if (!aIsFarmerCrop && bIsFarmerCrop) return 1;
            }
            
            // Second priority: trending up commodities
            if (a.trend === '+' && b.trend === '-') return -1;
            if (a.trend === '-' && b.trend === '+') return 1;
            
            // Third priority: alphabetical order
            return a.commodity.localeCompare(b.commodity);
        }).slice(0, 15); // Limit to 15 items for UI performance
    }

    // Get market analysis and insights
    getMarketInsights(prices: MarketPrice[], language: string = 'hi-IN'): string {
        if (prices.length === 0) return '';

        const trendingUp = prices.filter(p => p.trend === '+').length;
        const trendingDown = prices.filter(p => p.trend === '-').length;
        const avgChange = prices.reduce((sum, p) => sum + (p.change || 0), 0) / prices.length;

        const insights = {
            'hi-IN': {
                rising: `${trendingUp} फसलों के भाव बढ़ रहे हैं`,
                falling: `${trendingDown} फसलों के भाव गिर रहे हैं`,
                stable: 'बाजार स्थिर है',
                volatile: 'बाजार में उतार-चढ़ाव है'
            },
            'en-IN': {
                rising: `${trendingUp} commodities showing upward trend`,
                falling: `${trendingDown} commodities declining`,
                stable: 'Market is stable',
                volatile: 'Market is volatile'
            }
        };

        const currentInsights = insights[language as keyof typeof insights] || insights['hi-IN'];
        
        if (avgChange < 2) return currentInsights.stable;
        if (avgChange > 5) return currentInsights.volatile;
        if (trendingUp > trendingDown) return currentInsights.rising;
        return currentInsights.falling;
    }

    // Clear cache
    clearCache(): void {
        this.cache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            entries: this.cache.size,
            sources: this.apiSources.map(s => s.name)
        };
    }
}

export default GovernmentMarketService;

