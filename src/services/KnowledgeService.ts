// Dynamic Knowledge Service with RAG implementation
import OpenAI from 'openai';

interface KnowledgeDocument {
    id: string;
    content: string;
    category: 'watering' | 'planting' | 'fertilizer' | 'pest' | 'disease' | 'market' | 'weather';
    language: string;
    embedding?: number[];
    metadata: {
        source: string;
        reliability: number;
        region?: string;
        season?: string;
    };
}

class KnowledgeService {
    private knowledgeBase: KnowledgeDocument[] = [];
    private openai: OpenAI;
    private embeddingsCache = new Map<string, number[]>();

    constructor(openaiClient: OpenAI) {
        this.openai = openaiClient;
        this.initializeKnowledgeBase();
    }

    // Initialize with dynamic agricultural knowledge from multiple sources
    private async initializeKnowledgeBase() {
        try {
            // Load from multiple sources
            await Promise.all([
                this.loadFAOGuidelines(),
                this.loadIndianAgriculturalPractices(),
                this.loadGovernmentAdvisories(),
                this.loadRegionalCropGuides()
            ]);

            // Generate embeddings for semantic search
            await this.generateEmbeddings();
        } catch (error) {
            console.error('Knowledge base initialization error:', error);
            // Load minimal fallback
            this.loadMinimalKnowledgeBase();
        }
    }

    // Load FAO agricultural guidelines dynamically
    private async loadFAOGuidelines() {
        // In production, fetch from FAO API or database
        const faoGuidelines = [
            {
                id: 'fao-irrigation-1',
                content: 'For small-scale irrigation, check soil moisture at 6-inch depth. If soil sticks to fingers, delay watering. Best times are early morning (5-7 AM) or evening (5-7 PM).',
                category: 'watering' as const,
                language: 'en-IN',
                metadata: {
                    source: 'FAO Small-scale Irrigation Guidelines',
                    reliability: 0.95,
                    region: 'global'
                }
            },
            {
                id: 'fao-irrigation-1-hi',
                content: '6 इंच गहराई पर मिट्टी की नमी चेक करें। अगर मिट्टी उंगलियों में चिपकती है तो पानी न दें। सुबह 5-7 या शाम 5-7 बजे पानी देना सबसे अच्छा।',
                category: 'watering' as const,
                language: 'hi-IN',
                metadata: {
                    source: 'FAO छोटे पैमाने की सिंचाई गाइडलाइन',
                    reliability: 0.95,
                    region: 'global'
                }
            }
        ];

        this.knowledgeBase.push(...faoGuidelines);
    }

    // Load Indian agricultural practices
    private async loadIndianAgriculturalPractices() {
        const indianPractices = [
            {
                id: 'india-monsoon-1',
                content: 'During monsoon season (June-September), avoid excess irrigation. Focus on drainage to prevent waterlogging. Kharif crops like rice, cotton benefit from consistent moisture but not standing water.',
                category: 'watering' as const,
                language: 'en-IN',
                metadata: {
                    source: 'Indian Council of Agricultural Research',
                    reliability: 0.90,
                    region: 'India',
                    season: 'kharif'
                }
            },
            {
                id: 'india-monsoon-1-hi',
                content: 'मानसून में (जून-सितंबर) ज्यादा सिंचाई न करें। जल निकासी पर ध्यान दें। धान, कपास में लगातार नमी चाहिए लेकिन पानी जमा न होने दें।',
                category: 'watering' as const,
                language: 'hi-IN',
                metadata: {
                    source: 'भारतीय कृषि अनुसंधान परिषद',
                    reliability: 0.90,
                    region: 'India',
                    season: 'kharif'
                }
            }
        ];

        this.knowledgeBase.push(...indianPractices);
    }

    // Load government agricultural advisories
    private async loadGovernmentAdvisories() {
        // In production, fetch from government APIs or datasets
        const govAdvisories = [
            {
                id: 'gov-rabi-planting',
                content: 'Rabi season planting (November-January): Wheat requires 4-6 irrigations. Plant after residual moisture from previous rains. Optimal soil temperature 15-20°C.',
                category: 'planting' as const,
                language: 'en-IN',
                metadata: {
                    source: 'Ministry of Agriculture, Government of India',
                    reliability: 0.95,
                    region: 'India',
                    season: 'rabi'
                }
            }
        ];

        this.knowledgeBase.push(...govAdvisories);
    }

    // Load regional crop guides
    private async loadRegionalCropGuides() {
        // Regional variations for different states
        const regionalGuides = [
            {
                id: 'punjab-wheat',
                content: 'Punjab wheat variety PBW-725 suitable for November planting. Requires 5-6 irrigations. First irrigation 21 days after sowing.',
                category: 'planting' as const,
                language: 'en-IN',
                metadata: {
                    source: 'Punjab Agricultural University',
                    reliability: 0.85,
                    region: 'Punjab'
                }
            }
        ];

        this.knowledgeBase.push(...regionalGuides);
    }

    // Generate embeddings for semantic search (RAG implementation)
    private async generateEmbeddings() {
        // Check if we have a valid OpenAI client
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey || apiKey === 'your_openai_api_key_here' || typeof this.openai.apiKey !== 'string') {
            console.log('Skipping embedding generation - no valid API key');
            return;
        }

        // Test API key with a simple call first
        try {
            console.log('Testing OpenRouter API key...');
            // For OpenRouter, test with a simple chat completion call
            const testResponse = await this.openai.chat.completions.create({
                model: "openai/gpt-3.5-turbo",
                messages: [{ role: "user", content: "test" }],
                max_tokens: 1
            });
            console.log('OpenRouter API key is valid');
        } catch (error) {
            console.warn('WARNING: OpenRouter API key test failed, skipping embeddings:', error.message);
            return;
        }

        for (const doc of this.knowledgeBase) {
            if (!doc.embedding) {
                try {
                    const response = await this.openai.embeddings.create({
                        model: 'openai/text-embedding-3-small',
                        input: doc.content
                    });
                    doc.embedding = response.data[0].embedding;

                    // Cache embedding
                    this.embeddingsCache.set(doc.id, doc.embedding);
                } catch (error) {
                    console.error(`Embedding generation failed for ${doc.id}:`, error);
                }
            }
        }
    }

    // Semantic search using embeddings (RAG retrieval)
    async searchRelevantKnowledge(
        query: string,
        category?: string,
        language: string = 'en-IN',
        limit: number = 5
    ): Promise<KnowledgeDocument[]> {
        try {
            // Generate query embedding
            const queryResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query
            });
            const queryEmbedding = queryResponse.data[0].embedding;

            // Calculate similarity scores
            const scoredDocs = this.knowledgeBase
                .filter(doc => {
                    const categoryMatch = !category || doc.category === category;
                    const languageMatch = doc.language === language || doc.language === 'en-IN';
                    return categoryMatch && languageMatch && doc.embedding;
                })
                .map(doc => ({
                    doc,
                    score: this.calculateCosineSimilarity(queryEmbedding, doc.embedding!)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            return scoredDocs.map(item => item.doc);
        } catch (error) {
            console.error('Knowledge search error:', error);
            // Fallback to keyword search
            return this.keywordSearch(query, category, language, limit);
        }
    }

    // Fallback keyword search when embeddings fail
    private keywordSearch(query: string, category?: string, language: string = 'en-IN', limit: number = 5): KnowledgeDocument[] {
        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(' ');

        return this.knowledgeBase
            .filter(doc => {
                const categoryMatch = !category || doc.category === category;
                const languageMatch = doc.language === language || doc.language === 'en-IN';
                const contentMatch = keywords.some(keyword =>
                    doc.content.toLowerCase().includes(keyword)
                );
                return categoryMatch && languageMatch && contentMatch;
            })
            .slice(0, limit);
    }

    // Calculate cosine similarity between vectors
    private calculateCosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // Load minimal knowledge base as ultimate fallback
    private loadMinimalKnowledgeBase() {
        this.knowledgeBase = [
            {
                id: 'basic-watering',
                content: 'Check soil moisture before watering. Water early morning or evening.',
                category: 'watering',
                language: 'en-IN',
                metadata: { source: 'Basic Agricultural Practices', reliability: 0.7 }
            }
        ];
    }

    // Get knowledge statistics
    getKnowledgeStats() {
        return {
            totalDocuments: this.knowledgeBase.length,
            categoriesCount: [...new Set(this.knowledgeBase.map(doc => doc.category))].length,
            languagesCount: [...new Set(this.knowledgeBase.map(doc => doc.language))].length,
            embeddingsGenerated: this.knowledgeBase.filter(doc => doc.embedding).length
        };
    }
}

export default KnowledgeService;

