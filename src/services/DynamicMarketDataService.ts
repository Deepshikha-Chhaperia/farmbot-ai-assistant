// Dynamic Market Data Service with real Agmarknet integration
interface MarketPrice {
    commodity: string;
    variety?: string;
    price: number;
    unit: string;
    market: string;
    state: string;
    date: string;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    volume?: number;
}

interface AgmarknetResponse {
    records: Array<{
        commodity: string;
        variety: string;
        grade: string;
        market: string;
        state: string;
        district: string;
        min_price: string;
        max_price: string;
        modal_price: string;
        price_date: string;
        arrival_date: string;
    }>;
}

interface CropRecommendation {
    crop: string;
    reasoning: string;
    confidence: number;
    marketFactors: string[];
    weatherFactors: string[];
}

class DynamicMarketDataService {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private readonly cacheTimeout = 60 * 60 * 1000; // 1 hour

    // Real government API endpoints
    private readonly apiEndpoints = {
        agmarknet: {
            base: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
            apiKey: import.meta.env.VITE_DATA_GOV_IN_API_KEY || 'demo-key',
            format: 'json'
        },
        enam: {
            base: 'https://enam.gov.in/web/resources/api',
            apiKey: import.meta.env.VITE_ENAM_API_KEY
        }
    };

    // Dynamic crop database - loaded from government sources
    private cropDatabase: any = null;
    private mspData: any = null;

    constructor() {
        this.initializeMarketData();
    }

    // Initialize market data from government sources
    private async initializeMarketData() {
        try {
            await Promise.all([
                this.loadCropDatabase(),
                this.loadMSPData(),
                this.loadMarketCenters()
            ]);
        } catch (error) {
            console.error('Market data initialization error:', error);
        }
    }

    // Load crop database from government dataset
    private async loadCropDatabase() {
        try {
            // In production, fetch from government agricultural datasets
            const response = await fetch('/data/indian-crops-database.json');
            if (response.ok) {
                this.cropDatabase = await response.json();
            }
        } catch (error) {
            console.warn('Crop database load failed, using minimal dataset');
            this.cropDatabase = {
                kharif: ['rice', 'cotton', 'sugarcane', 'maize', 'jowar', 'bajra'],
                rabi: ['wheat', 'barley', 'gram', 'peas', 'mustard', 'potato'],
                zaid: ['cucumber', 'watermelon', 'muskmelon', 'green vegetables']
            };
        }
    }

    // Load MSP data from government source
    private async loadMSPData() {
        try {
            // Fetch MSP data from government API or dataset
            const response = await fetch('/data/msp-data.json');
            if (response.ok) {
                this.mspData = await response.json();
            }
        } catch (error) {
            console.warn('MSP data load failed');
            // Minimal MSP data for common crops
            this.mspData = {
                'wheat': 2275,
                'rice': 2183,
                'cotton': 6620,
                'sugarcane': 340,
                'gram': 5335
            };
        }
    }

    // Load market centers dynamically
    private async loadMarketCenters() {
        // Implementation for loading market center data
    }

    // Fetch real-time market prices from Agmarknet
    async getMarketPrices(
        state?: string,
        commodity?: string,
        limit: number = 10
    ): Promise<MarketPrice[]> {
        const cacheKey = `market_${state}_${commodity}_${limit}`;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            // Build API URL for Agmarknet
            let apiUrl = `${this.apiEndpoints.agmarknet.base}?api-key=${this.apiEndpoints.agmarknet.apiKey}&format=json&limit=${limit}`;

            if (state) {
                apiUrl += `&filters[state]=${encodeURIComponent(state)}`;
            }
            if (commodity) {
                apiUrl += `&filters[commodity]=${encodeURIComponent(commodity)}`;
            }

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Agmarknet API failed: ${response.status}`);
            }

            const data: AgmarknetResponse = await response.json();

            // Transform to normalized format
            const marketPrices: MarketPrice[] = data.records.map(record => ({
                commodity: record.commodity,
                variety: record.variety,
                price: parseFloat(record.modal_price) || 0,
                unit: 'per quintal',
                market: record.market,
                state: record.state,
                date: record.price_date,
                trend: this.calculateTrend(record.commodity, parseFloat(record.modal_price)),
                changePercent: 0, // Calculate from historical data
                volume: this.getArrivalVolume(record.commodity, record.market)
            }));

            // Cache result
            this.cache.set(cacheKey, {
                data: marketPrices,
                timestamp: Date.now()
            });

            return marketPrices;
        } catch (error) {
            console.error('Market data fetch error:', error);

            // Return empty array instead of mock data
            return [];
        }
    }

    // Calculate price trends from historical data
    private calculateTrend(commodity: string, currentPrice: number): 'up' | 'down' | 'stable' {
        // In production, compare with historical prices
        // For now, implement basic logic
        const historicalAvg = this.getHistoricalAverage(commodity);
        if (currentPrice > historicalAvg * 1.05) return 'up';
        if (currentPrice < historicalAvg * 0.95) return 'down';
        return 'stable';
    }

    // Get historical price average (to be implemented with real data)
    private getHistoricalAverage(commodity: string): number {
        // In production, query historical database
        // Return reasonable default for now
        const commodityBasePrices: { [key: string]: number } = {
            'wheat': 2000,
            'rice': 1800,
            'onion': 1500,
            'potato': 1200,
            'tomato': 2500
        };

        return commodityBasePrices[commodity.toLowerCase()] || 2000;
    }

    // Get arrival volume data
    private getArrivalVolume(commodity: string, market: string): number {
        // In production, fetch from arrival data APIs
        return 0; // Placeholder
    }

    // Generate dynamic crop recommendations based on market + weather
    async generateCropRecommendations(
        weatherData: any,
        location: { state?: string },
        currentMonth: number
    ): Promise<CropRecommendation[]> {
        try {
            // Get current market prices for seasonal crops
            const seasonalCrops = this.getSeasonalCrops(currentMonth);
            const marketPrices = await this.getMarketPrices(location.state);

            const recommendations: CropRecommendation[] = [];

            for (const crop of seasonalCrops) {
                const marketData = marketPrices.find(p =>
                    p.commodity.toLowerCase().includes(crop.toLowerCase())
                );

                const recommendation: CropRecommendation = {
                    crop,
                    reasoning: this.buildRecommendationReasoning(crop, marketData, weatherData),
                    confidence: this.calculateRecommendationConfidence(crop, marketData, weatherData),
                    marketFactors: this.getMarketFactors(marketData),
                    weatherFactors: this.getWeatherFactors(weatherData, crop)
                };

                recommendations.push(recommendation);
            }

            return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
        } catch (error) {
            console.error('Crop recommendation error:', error);
            return [];
        }
    }

    // Get seasonal crops dynamically
    private getSeasonalCrops(month: number): string[] {
        if (!this.cropDatabase) {
            // Fallback seasonal data
            if (month >= 6 && month <= 9) return ['rice', 'cotton', 'sugarcane'];
            if (month >= 11 || month <= 2) return ['wheat', 'gram', 'mustard'];
            return ['cucumber', 'watermelon', 'vegetables'];
        }

        // Use dynamic crop database
        if (month >= 6 && month <= 9) return this.cropDatabase.kharif || [];
        if (month >= 11 || month <= 2) return this.cropDatabase.rabi || [];
        return this.cropDatabase.zaid || [];
    }

    // Build recommendation reasoning
    private buildRecommendationReasoning(
        crop: string,
        marketData: any,
        weatherData: any
    ): string {
        const factors = [];

        if (marketData) {
            if (marketData.trend === 'up') {
                factors.push(`${crop} prices trending upward (+${marketData.changePercent}%)`);
            }
            factors.push(`Current price: ₹${marketData.price}/${marketData.unit}`);
        }

        if (weatherData) {
            if (weatherData.precipitation > 10) {
                factors.push('Good rainfall for planting');
            }
            if (weatherData.temperature >= 20 && weatherData.temperature <= 30) {
                factors.push('Optimal temperature for growth');
            }
        }

        return factors.join('. ') || 'Seasonal recommendation';
    }

    // Calculate recommendation confidence
    private calculateRecommendationConfidence(
        crop: string,
        marketData: any,
        weatherData: any
    ): number {
        let confidence = 0.5; // Base confidence

        if (marketData) {
            if (marketData.trend === 'up') confidence += 0.2;
            if (marketData.price > this.getHistoricalAverage(crop)) confidence += 0.1;
        }

        if (weatherData) {
            if (this.isWeatherSuitableForCrop(crop, weatherData)) confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    // Check if weather is suitable for crop
    private isWeatherSuitableForCrop(crop: string, weather: any): boolean {
        const cropRequirements: { [key: string]: any } = {
            'rice': { minTemp: 20, maxTemp: 35, minRainfall: 100 },
            'wheat': { minTemp: 10, maxTemp: 25, minRainfall: 50 },
            'cotton': { minTemp: 18, maxTemp: 35, minRainfall: 80 }
        };

        const req = cropRequirements[crop.toLowerCase()];
        if (!req) return true; // Unknown crop, assume suitable

        return weather.temperature >= req.minTemp &&
            weather.temperature <= req.maxTemp &&
            weather.precipitation >= req.minRainfall / 30; // Daily requirement
    }

    // Get market factors for recommendation
    private getMarketFactors(marketData: any): string[] {
        if (!marketData) return ['No current market data available'];

        const factors = [];
        if (marketData.trend === 'up') factors.push('Price increasing');
        if (marketData.trend === 'down') factors.push('Price decreasing');
        if (marketData.volume > 1000) factors.push('High market activity');

        return factors;
    }

    // Get weather factors for recommendation
    private getWeatherFactors(weatherData: any, crop: string): string[] {
        const factors = [];

        if (weatherData.precipitation > 5) factors.push('Good rainfall');
        if (weatherData.temperature > 35) factors.push('High temperature');
        if (weatherData.humidity > 80) factors.push('High humidity');

        return factors;
    }

    // Generate multilingual market insights from i18n
    async generateMarketInsights(
        marketData: MarketPrice[],
        language: string = 'hi-IN'
    ): Promise<string[]> {
        if (!marketData || marketData.length === 0) {
            return language === 'hi-IN'
                ? ['बाजार की जानकारी अभी उपलब्ध नहीं है। स्थानीय मंडी से संपर्क करें।']
                : ['Market data not available. Contact local market.'];
        }

        const insights = [];

        // Price trend insights
        const trendingUp = marketData.filter(item => item.trend === 'up');
        const trendingDown = marketData.filter(item => item.trend === 'down');

        if (trendingUp.length > 0) {
            const crops = trendingUp.map(item => item.commodity).join(', ');
            insights.push(language === 'hi-IN'
                ? `${crops} के भाव बढ़ रहे हैं। बेचने का अच्छा समय।`
                : `${crops} prices are rising. Good time to sell.`
            );
        }

        if (trendingDown.length > 0) {
            const crops = trendingDown.map(item => item.commodity).join(', ');
            insights.push(language === 'hi-IN'
                ? `${crops} के भाव गिर रहे हैं। बेचना टालें।`
                : `${crops} prices are falling. Consider holding.`
            );
        }

        // High-value opportunities
        const highValueCrops = marketData
            .filter(item => item.price > this.getHistoricalAverage(item.commodity) * 1.2)
            .slice(0, 2);

        if (highValueCrops.length > 0) {
            const cropNames = highValueCrops.map(item => item.commodity).join(', ');
            insights.push(language === 'hi-IN'
                ? `${cropNames} में अच्छा मुनाफा है। अगली सीजन के लिए सोचें।`
                : `Good profits in ${cropNames}. Consider for next season.`
            );
        }

        return insights.slice(0, 3); // Limit to 3 insights
    }

    // Get Minimum Support Price from government data
    async getMSP(commodity: string): Promise<number | null> {
        if (!this.mspData) {
            await this.loadMSPData();
        }

        return this.mspData?.[commodity.toLowerCase()] || null;
    }

    // Get market recommendations based on current data
    async getMarketRecommendations(
        userLocation: string,
        currentSeason: string,
        language: string = 'hi-IN'
    ): Promise<string[]> {
        try {
            const marketData = await this.getMarketPrices(userLocation);
            const insights = await this.generateMarketInsights(marketData, language);

            // Add seasonal market advice
            const seasonalAdvice = this.getSeasonalMarketAdvice(currentSeason, language);

            return [...insights, ...seasonalAdvice].slice(0, 4);
        } catch (error) {
            console.error('Market recommendations error:', error);
            return language === 'hi-IN'
                ? ['बाजार की जानकारी अभी उपलब्ध नहीं है।']
                : ['Market information currently unavailable.'];
        }
    }

    // Seasonal market advice
    private getSeasonalMarketAdvice(season: string, language: string): string[] {
        const advice = {
            'kharif': {
                'hi-IN': ['धान की मंडी जुलाई में खुलती है।', 'कपास अक्टूबर में बेचें।'],
                'en-IN': ['Rice markets open in July.', 'Sell cotton in October.']
            },
            'rabi': {
                'hi-IN': ['गेहूं मार्च-अप्रैल में बेचें।', 'चना की मांग फरवरी में बढ़ती है।'],
                'en-IN': ['Sell wheat in March-April.', 'Gram demand increases in February.']
            }
        };

        const seasonAdvice = advice[season as keyof typeof advice];
        return seasonAdvice?.[language as keyof typeof seasonAdvice] || [];
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            entries: this.cache.size,
            size: JSON.stringify([...this.cache.values()]).length,
            oldestEntry: this.cache.size > 0 ? Math.min(...Array.from(this.cache.values()).map(v => v.timestamp)) : 0
        };
    }
}

export default DynamicMarketDataService;

