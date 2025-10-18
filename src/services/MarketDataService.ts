// Market Data Service for Indian Agricultural Markets
// Integrates with Government of India APIs and market platforms

interface MarketPrice {
    commodity: string;
    market: string;
    price: number;
    unit: string;
    date: string;
    trend: 'up' | 'down' | 'stable';
    region: string;
}

interface CropRecommendation {
    crop: string;
    profitability: number;
    season: string;
    marketDemand: 'high' | 'medium' | 'low';
    priceRange: { min: number; max: number };
}

class MarketDataService {
    private baseURL = 'https://api.data.gov.in/resource';
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheExpiry = 3600000; // 1 hour in milliseconds

    // Indian states mapping for regional market data
    private indianStates = {
        'delhi': 'DL',
        'uttar pradesh': 'UP',
        'bihar': 'BR',
        'west bengal': 'WB',
        'maharashtra': 'MH',
        'gujarat': 'GJ',
        'rajasthan': 'RJ',
        'punjab': 'PB',
        'haryana': 'HR',
        'tamil nadu': 'TN',
        'karnataka': 'KA',
        'andhra pradesh': 'AP',
        'telangana': 'TG',
        'odisha': 'OD',
        'madhya pradesh': 'MP'
    };

    // Common Indian crops with local names
    private cropMapping = {
        'rice': { hindi: 'चावल', english: 'rice', tamil: 'அரிசி', bengali: 'ধান' },
        'wheat': { hindi: 'गेहूं', english: 'wheat', tamil: 'கோதுமை', bengali: 'গম' },
        'cotton': { hindi: 'कपास', english: 'cotton', tamil: 'பருத்தி', bengali: 'তুলা' },
        'sugarcane': { hindi: 'गन्ना', english: 'sugarcane', tamil: 'கரும்பு', bengali: 'আখ' },
        'maize': { hindi: 'मक्का', english: 'maize', tamil: 'சோளம்', bengali: 'ভুট্টা' },
        'onion': { hindi: 'प्याज', english: 'onion', tamil: 'வெங்காயம்', bengali: 'পেঁয়াজ' },
        'potato': { hindi: 'आलू', english: 'potato', tamil: 'உருளைக்கிழங்கு', bengali: 'আলু' },
        'tomato': { hindi: 'टमाटर', english: 'tomato', tamil: 'தக்காளி', bengali: 'টমেটো' }
    };

    // Get market prices for specific location and crops
    async getMarketPrices(location: string, crops: string[] = []): Promise<MarketPrice[]> {
        try {
            const cacheKey = `market-${location}-${crops.join(',')}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            // Simulate real market data API call (replace with actual government API)
            const marketData = await this.fetchGovernmentMarketData(location, crops);

            this.setCachedData(cacheKey, marketData);
            return marketData;

        } catch (error) {
            console.error('Market data fetch error:', error);
            return this.getFallbackMarketData(location, crops);
        }
    }

    // Fetch data from Government of India agriculture APIs
    private async fetchGovernmentMarketData(location: string, crops: string[]): Promise<MarketPrice[]> {
        // This would integrate with real APIs like:
        // - Agmarknet API
        // - eNAM platform API  
        // - Ministry of Agriculture APIs

        // For now, simulating realistic market data based on current conditions
        const mockPrices: MarketPrice[] = [
            {
                commodity: 'Rice',
                market: `${location} Mandi`,
                price: 2100,
                unit: 'per quintal',
                date: new Date().toISOString().split('T')[0],
                trend: 'stable',
                region: location
            },
            {
                commodity: 'Wheat',
                market: `${location} Market`,
                price: 2250,
                unit: 'per quintal',
                date: new Date().toISOString().split('T')[0],
                trend: 'up',
                region: location
            },
            {
                commodity: 'Onion',
                market: `${location} Wholesale`,
                price: 3500,
                unit: 'per quintal',
                date: new Date().toISOString().split('T')[0],
                trend: 'down',
                region: location
            }
        ];

        return mockPrices;
    }

    // Get crop recommendations based on market demand and weather
    async getCropRecommendations(
        location: string,
        season: string,
        weatherData: any
    ): Promise<CropRecommendation[]> {
        try {
            const currentMonth = new Date().getMonth() + 1;
            const recommendations: CropRecommendation[] = [];

            // Kharif season recommendations (June-November)
            if (currentMonth >= 6 && currentMonth <= 8) {
                recommendations.push(
                    {
                        crop: 'Rice',
                        profitability: 85,
                        season: 'Kharif',
                        marketDemand: 'high',
                        priceRange: { min: 1900, max: 2300 }
                    },
                    {
                        crop: 'Cotton',
                        profitability: 78,
                        season: 'Kharif',
                        marketDemand: 'medium',
                        priceRange: { min: 5500, max: 6200 }
                    }
                );
            }

            // Rabi season recommendations (November-April)
            if (currentMonth >= 11 || currentMonth <= 2) {
                recommendations.push(
                    {
                        crop: 'Wheat',
                        profitability: 82,
                        season: 'Rabi',
                        marketDemand: 'high',
                        priceRange: { min: 2000, max: 2400 }
                    },
                    {
                        crop: 'Mustard',
                        profitability: 75,
                        season: 'Rabi',
                        marketDemand: 'medium',
                        priceRange: { min: 4500, max: 5200 }
                    }
                );
            }

            return recommendations;
        } catch (error) {
            console.error('Crop recommendation error:', error);
            return [];
        }
    }

    // Get MSP (Minimum Support Price) data from government
    async getMSPData(crop: string): Promise<{ crop: string; msp: number; year: string } | null> {
        try {
            // This would integrate with real MSP APIs from Ministry of Agriculture
            const mspData = {
                'rice': { crop: 'Rice', msp: 2183, year: '2024-25' },
                'wheat': { crop: 'Wheat', msp: 2275, year: '2024-25' },
                'cotton': { crop: 'Cotton', msp: 6620, year: '2024-25' },
                'sugarcane': { crop: 'Sugarcane', msp: 340, year: '2024-25' }
            };

            const cropKey = crop.toLowerCase();
            return mspData[cropKey as keyof typeof mspData] || null;

        } catch (error) {
            console.error('MSP data error:', error);
            return null;
        }
    }

    // Generate market insights in multiple languages
    generateMarketInsights(prices: MarketPrice[], language: string = 'hi-IN'): string[] {
        const insights: string[] = [];

        // Price trend analysis
        const upwardTrends = prices.filter(p => p.trend === 'up');
        const downwardTrends = prices.filter(p => p.trend === 'down');

        if (upwardTrends.length > 0) {
            const crops = upwardTrends.map(p => p.commodity).join(', ');
            insights.push(
                language === 'hi-IN'
                    ? `${crops} के भाव बढ़ रहे हैं। अच्छा समय बेचने के लिए।`
                    : `${crops} prices are rising. Good time to sell.`
            );
        }

        if (downwardTrends.length > 0) {
            const crops = downwardTrends.map(p => p.commodity).join(', ');
            insights.push(
                language === 'hi-IN'
                    ? `${crops} के भाव गिर रहे हैं। खरीदने का अच्छा समय।`
                    : `${crops} prices are falling. Good time to buy.`
            );
        }

        // High value crops
        const highValueCrops = prices.filter(p => p.price > 3000);
        if (highValueCrops.length > 0) {
            insights.push(
                language === 'hi-IN'
                    ? `उच्च मूल्य वाली फसलें: ${highValueCrops.map(c => c.commodity).join(', ')}`
                    : `High value crops: ${highValueCrops.map(c => c.commodity).join(', ')}`
            );
        }

        return insights;
    }

    // Search for nearest markets
    async findNearestMarkets(lat: number, lon: number): Promise<string[]> {
        try {
            // This would integrate with actual market location APIs
            // For now, returning sample markets based on common Indian market locations
            const sampleMarkets = [
                'Local Mandi',
                'District Market',
                'APMC Market',
                'eNAM Platform',
                'Cooperative Society'
            ];

            return sampleMarkets;
        } catch (error) {
            console.error('Market search error:', error);
            return ['Local Market'];
        }
    }

    // Cache management
    private getCachedData(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    private setCachedData(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    // Fallback market data when APIs are unavailable
    private getFallbackMarketData(location: string, crops: string[]): MarketPrice[] {
        const today = new Date().toISOString().split('T')[0];

        return [
            {
                commodity: 'Rice',
                market: `${location} Market`,
                price: 2100,
                unit: 'per quintal',
                date: today,
                trend: 'stable',
                region: location
            },
            {
                commodity: 'Wheat',
                market: `${location} Mandi`,
                price: 2250,
                unit: 'per quintal',
                date: today,
                trend: 'up',
                region: location
            }
        ];
    }

    // Get price predictions based on historical data and market trends
    async getPricePredictions(crop: string, location: string): Promise<{
        currentPrice: number;
        predictedPrice: number;
        timeframe: string;
        confidence: number;
    } | null> {
        try {
            // This would use ML models to predict prices
            // For now, using simple trend analysis
            const marketData = await this.getMarketPrices(location, [crop]);
            const currentCrop = marketData.find(m => m.commodity.toLowerCase() === crop.toLowerCase());

            if (!currentCrop) return null;

            let predictedPrice = currentCrop.price;
            if (currentCrop.trend === 'up') predictedPrice *= 1.05;
            if (currentCrop.trend === 'down') predictedPrice *= 0.95;

            return {
                currentPrice: currentCrop.price,
                predictedPrice: Math.round(predictedPrice),
                timeframe: '7 days',
                confidence: 0.7
            };
        } catch (error) {
            console.error('Price prediction error:', error);
            return null;
        }
    }

    // Format price information for voice response
    formatPriceForVoice(price: MarketPrice, language: string): string {
        const templates = {
            'hi-IN': `${price.commodity} का भाव ${price.market} में ₹${price.price} ${price.unit} है। भाव ${price.trend === 'up' ? 'बढ़ रहा' : price.trend === 'down' ? 'गिर रहा' : 'स्थिर'} है।`,
            'en-IN': `${price.commodity} price at ${price.market} is ₹${price.price} ${price.unit}. Price is ${price.trend === 'up' ? 'rising' : price.trend === 'down' ? 'falling' : 'stable'}.`,
            'bn-IN': `${price.market} এ ${price.commodity} এর দাম ₹${price.price} ${price.unit}। দাম ${price.trend === 'up' ? 'বাড়ছে' : price.trend === 'down' ? 'কমছে' : 'স্থিতিশীল'}।`,
            'ta-IN': `${price.market} இல் ${price.commodity} விலை ₹${price.price} ${price.unit}. விலை ${price.trend === 'up' ? 'உயர்ந்து கொண்டிருக்கிறது' : price.trend === 'down' ? 'குறைந்து கொண்டிருக்கிறது' : 'நிலையாக உள்ளது'}.`
        };

        return templates[language as keyof typeof templates] || templates['hi-IN'];
    }
}

export default MarketDataService;

