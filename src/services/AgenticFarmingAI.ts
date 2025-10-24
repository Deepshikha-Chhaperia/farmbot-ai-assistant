import OpenAI from 'openai';
import LiveGovernmentMarketService from './LiveGovernmentMarketService';

// RAG Document Interface
interface RAGDocument {
  id: string;
  content: string;
  category: string;
  language: string;
  embedding?: number[];
  metadata: {
    source: string;
    reliability: number;
    region?: string;
  };
}

// Language detection mapping
const LANGUAGE_CODES = {
  'hindi': 'hi-IN',
  'हिंदी': 'hi-IN',
  'english': 'en-IN',
  'bengali': 'bn-IN',
  'बंगाली': 'bn-IN',
  'tamil': 'ta-IN',
  'तमिल': 'ta-IN',
  'telugu': 'te-IN',
  'तेलुगु': 'te-IN',
  'marathi': 'mr-IN',
  'मराठी': 'mr-IN',
  'gujarati': 'gu-IN',
  'गुजराती': 'gu-IN',
  'punjabi': 'pa-IN',
  'पंजाबी': 'pa-IN'
} as const;

// Crop calendar for India (Kharif and Rabi seasons)
const INDIAN_CROP_CALENDAR = {
  kharif: {
    season: 'Kharif (Monsoon Season)',
    period: 'June - November',
    crops: ['rice', 'cotton', 'sugarcane', 'maize', 'jowar', 'bajra'],
    plantingWindow: { start: 6, end: 8 }, // June-August
    harvestWindow: { start: 10, end: 12 } // October-December
  },
  rabi: {
    season: 'Rabi (Winter Season)',
    period: 'November - April',
    crops: ['wheat', 'barley', 'gram', 'peas', 'mustard', 'potato'],
    plantingWindow: { start: 11, end: 1 }, // November-January
    harvestWindow: { start: 3, end: 5 } // March-May
  },
  zaid: {
    season: 'Zaid (Summer Season)',
    period: 'March - June',
    crops: ['cucumber', 'watermelon', 'muskmelon', 'green leafy vegetables'],
    plantingWindow: { start: 3, end: 4 }, // March-April
    harvestWindow: { start: 5, end: 6 } // May-June
  }
};

// Comprehensive Agricultural Knowledge Base for RAG System
const AGRICULTURAL_KNOWLEDGE_BASE = {
  // Crop-specific knowledge
  crops: {
    rice: {
      planting: {
        'hi-IN': 'धान की रोपाई मानसून के पंद्रह से बीस दिन बाद करें। जमीन में दो से तीन सेमी पानी रखें।',
        'mr-IN': 'मान्सूनच्या 15-20 दिवसांनी धान लावा. जमिनीत 2-3 सेमी पाणी ठेवा.',
        'en-IN': 'Plant rice 15-20 days after monsoon onset. Maintain 2-3cm water level.'
      },
      diseases: {
        'hi-IN': 'धान में ब्लास्ट रोग से बचने के लिए नीम तेल छिड़कें। पत्ते पीले हों तो जिंक सल्फेट दें।',
        'mr-IN': 'धानातील ब्लास्ट रोगापासून बचण्यासाठी कडुलिंबाचे तेल फवारा. पाने पिवळी झाली तर जिंक सल्फेट द्या.',
        'en-IN': 'Spray neem oil to prevent rice blast. Apply zinc sulfate if leaves turn yellow.'
      },
      harvest: {
        'hi-IN': 'दाने सुनहरे हो जाएं तो काटें। 80% दाने पक जाएं तो कटाई का समय।',
        'mr-IN': 'दाणे सोनेरी झाले तर कापा. 80% दाणे पिकले तर कापणीची वेळ.',
        'en-IN': 'Harvest when grains turn golden. Cut when 80% grains are mature.'
      }
    },
    wheat: {
      planting: {
        'hi-IN': 'गेहूं बुआई नवंबर में करें। एक सौ से एक सौ बीस किलो बीज प्रति हेक्टेयर।',
        'mr-IN': 'गहू लागवड नोव्हेंबरमध्ये करा. 100-120 किलो बियाणे प्रति हेक्टर.',
        'en-IN': 'Sow wheat in November. Use 100-120 kg seeds per hectare.'
      },
      fertilizer: {
        'hi-IN': 'DAP खाद बुआई के समय डालें। यूरिया तीस से चालीस दिन बाद छिड़कें।',
        'mr-IN': 'डीएपी खत बियाणे वेळी घाला. युरिया 30-40 दिवसांनी टाका.',
        'en-IN': 'Apply DAP fertilizer at sowing. Spray urea after 30-40 days.'
      }
    },
    cotton: {
      planting: {
        'hi-IN': 'कपास मई में बोएं। पंक्ति से पंक्ति 67.5 सेमी की दूरी रखें।',
        'mr-IN': 'कापूस मे महिन्यात लावा. ओळीपासून ओळीपर्यंत 67.5 सेमी अंतर ठेवा.',
        'en-IN': 'Plant cotton in May. Maintain 67.5cm row-to-row spacing.'
      },
      pest: {
        'hi-IN': 'बॉलवर्म से बचने के लिए फेरोमोन ट्रैप लगाएं। बीटी कपास उगाएं।',
        'mr-IN': 'बॉलवर्मपासून वाचण्यासाठी फेरोमोन सापळे लावा. बीटी कापूस लावा.',
        'en-IN': 'Use pheromone traps for bollworm control. Grow Bt cotton varieties.'
      }
    }
  },

  // Weather-based advice
  weather: {
    hot_weather: {
      'hi-IN': 'तेज गर्मी में पौधों को छाया दें। दिन में दो से तीन बार पानी दें। मल्चिंग करें।',
      'mr-IN': 'तीव्र उन्हात झाडांना सावली द्या. दिवसातून 2-3 वेळा पाणी द्या. मल्चिंग करा.',
      'en-IN': 'Provide shade in extreme heat. Water 2-3 times daily. Use mulching.'
    },
    monsoon: {
      'hi-IN': 'बारिश में पानी निकासी का इंतजाम करें। फंगल रोगों से बचाव करें।',
      'mr-IN': 'पावसाळ्यात पाण्याचा निचरा करा. बुरशीजन्य रोगांपासून संरक्षण करा.',
      'en-IN': 'Ensure proper drainage during monsoon. Protect from fungal diseases.'
    },
    winter: {
      'hi-IN': 'ठंड में पाले से बचाव करें। धुआं करके तापमान बढ़ाएं।',
      'mr-IN': 'थंडीत दवपासून संरक्षण करा. धूर करून तापमान वाढवा.',
      'en-IN': 'Protect from frost in winter. Create smoke to raise temperature.'
    }
  },

  // Pest and disease management
  pests: {
    aphids: {
      'hi-IN': 'माहू के लिए नीम का तेल या साबुन का पानी छिड़कें। लेडी बर्ड बीटल छोड़ें।',
      'mr-IN': 'माशीसाठी कडुलिंबाचे तेल किंवा साबणाचे पाणी फवारा. लेडी बर्ड बीटल सोडा.',
      'en-IN': 'For aphids, spray neem oil or soapy water. Release ladybird beetles.'
    },
    whitefly: {
      'hi-IN': 'सफेद मक्खी के लिए पीला चिपचिपा जाल लगाएं। नीम तेल का छिड़काव करें।',
      'mr-IN': 'पांढऱ्या माशीसाठी पिवळे चिकट जाळे लावा. कडुलिंबाचे तेल फवारा.',
      'en-IN': 'Use yellow sticky traps for whitefly. Spray neem oil solution.'
    }
  },

  // Organic farming
  organic: {
    fertilizers: {
      'hi-IN': 'गोबर खाद, कम्पोस्ट, केंचुआ खाद का इस्तेमाल करें। हरी खाद बोएं।',
      'mr-IN': 'गोबर खत, कंपोस्ट, गांडुळ खत वापरा. हिरवी खत लावा.',
      'en-IN': 'Use farmyard manure, compost, vermicompost. Grow green manure crops.'
    },
    pesticides: {
      'hi-IN': 'नीम, करंज, तम्बाकू का काढ़ा बनाकर छिड़कें। मिश्रित खेती करें।',
      'mr-IN': 'कडुलिंब, करंज, तंबाखूचे काढे बनवून फवारा. मिश्र शेती करा.',
      'en-IN': 'Prepare neem, karanj, tobacco extracts for spraying. Practice mixed cropping.'
    }
  },

  // Soil health
  soil: {
    testing: {
      'hi-IN': 'साल में एक बार मिट्टी की जांच कराएं। pH 6.0-7.5 रखें।',
      'mr-IN': 'वर्षातून एकदा मातीची चाचणी करा. pH 6.0-7.5 ठेवा.',
      'en-IN': 'Test soil once a year. Maintain pH between 6.0-7.5.'
    },
    improvement: {
      'hi-IN': 'जैविक खाद डालें। हरी खाद बोएं। मिट्टी की जुताई कम करें।',
      'mr-IN': 'सेंद्रिय खत घाला. हिरवी खत लावा. मातीची नांगरणी कमी करा.',
      'en-IN': 'Add organic matter. Sow green manure. Reduce tillage operations.'
    }
  },

  // Government schemes
  schemes: {
    subsidy: {
      'hi-IN': 'PM-KISAN योजना के लिए आवेदन करें। DBT के लिए आधार लिंक करें।',
      'mr-IN': 'PM-KISAN योजनेसाठी अर्ज करा. DBT साठी आधार लिंक करा.',
      'en-IN': 'Apply for PM-KISAN scheme. Link Aadhaar for DBT benefits.'
    },
    insurance: {
      'hi-IN': 'फसल बीमा जरूर कराएं। नुकसान की रिपोर्ट 72 घंटे में करें।',
      'mr-IN': 'पीक विमा नक्की करा. नुकसानीचा अहवाल 72 तासांत द्या.',
      'en-IN': 'Get crop insurance. Report damages within 72 hours.'
    }
  },

  // Irrigation and water management
  irrigation: {
    drip: {
      'hi-IN': 'ड्रिप सिस्टम से चालीस से पचास प्रतिशत पानी बचाया जा सकता है। सब्जियों के लिए सबसे अच्छा।',
      'mr-IN': 'ठिबक सिंचन प्रणालीने 40-50% पाणी वाचवता येते. भाजीपाल्यासाठी सर्वोत्तम.',
      'en-IN': 'Drip irrigation saves 40-50% water. Best for vegetables and fruits.'
    },
    sprinkler: {
      'hi-IN': 'स्प्रिंकलर सिस्टम गेहूं, चना, सरसों के लिए अच्छा है। हवा न हो तो चलाएं।',
      'mr-IN': 'स्प्रिंकलर प्रणाली गहू, हरभरा, मोहरीसाठी चांगली. वारा नसताना चालवा.',
      'en-IN': 'Sprinkler system good for wheat, gram, mustard. Run when wind is calm.'
    },
    traditional: {
      'hi-IN': 'फव्वारा सिंचाई सुबह छह से आठ बजे या शाम चार से छह बजे करें। दोपहर में न करें।',
      'mr-IN': 'पारंपरिक सिंचन सकाळी 6-8 किंवा संध्याकाळी 4-6 वाजता करा. दुपारी करू नका.',
      'en-IN': 'Traditional irrigation at 6-8 AM or 4-6 PM. Avoid midday watering.'
    }
  },

  // Nutrition and fertilizer management
  nutrition: {
    nitrogen: {
      'hi-IN': 'पत्ते पीले हों तो नाइट्रोजन की कमी। यूरिया या हरी खाद डालें।',
      'mr-IN': 'पाने पिवळी झाली तर नायट्रोजनची कमी. युरिया किंवा हिरवी खत द्या.',
      'en-IN': 'Yellow leaves indicate nitrogen deficiency. Apply urea or green manure.'
    },
    phosphorus: {
      'hi-IN': 'जड़ों के विकास के लिए फॉस्फोरस जरूरी। DAP खाद बुआई के समय दें।',
      'mr-IN': 'मुळांच्या वाढीसाठी फॉस्फरस आवश्यक. डीएपी खत बियाणे वेळी द्या.',
      'en-IN': 'Phosphorus essential for root development. Apply DAP at sowing.'
    },
    potassium: {
      'hi-IN': 'फूल-फल के लिए पोटाश जरूरी। MOP खाद फूल आने से पहले दें।',
      'mr-IN': 'फुल-फळासाठी पोटॅश आवश्यक. एमओपी खत फुले येण्यापूर्वी द्या.',
      'en-IN': 'Potassium needed for flowering and fruiting. Apply MOP before flowering.'
    }
  },

  // Crop diseases by symptom
  diseases: {
    leaf_spots: {
      'hi-IN': 'पत्तों पर धब्बे दिखें तो फफूंद की समस्या। कॉपर सल्फेट छिड़कें।',
      'mr-IN': 'पानांवर ठिपके दिसले तर बुरशीची समस्या. कॉपर सल्फेट फवारा.',
      'en-IN': 'Leaf spots indicate fungal problem. Spray copper sulfate solution.'
    },
    wilting: {
      'hi-IN': 'पौधे मुरझा रहे हों तो जड़ सड़न हो सकती है। पानी कम करें।',
      'mr-IN': 'झाडे कोमेजत असतील तर मुळे कुजण्याची शक्यता. पाणी कमी करा.',
      'en-IN': 'Wilting plants may have root rot. Reduce watering frequency.'
    },
    stunted_growth: {
      'hi-IN': 'धीमी बढ़वार पोषक तत्वों की कमी। मिट्टी टेस्ट कराएं।',
      'mr-IN': 'मंद वाढ म्हणजे पोषक घटकांची कमी. मातीची चाचणी करा.',
      'en-IN': 'Stunted growth indicates nutrient deficiency. Get soil tested.'
    }
  },

  // Modern farming techniques
  modern_techniques: {
    precision_farming: {
      'hi-IN': 'GPS और सेंसर का इस्तेमाल करके सटीक खेती करें। खर्च कम, पैदावार ज्यादा।',
      'mr-IN': 'जीपीएस आणि सेन्सर वापरून अचूक शेती करा. खर्च कमी, उत्पादन जास्त.',
      'en-IN': 'Use GPS and sensors for precision farming. Lower costs, higher yields.'
    },
    hydroponics: {
      'hi-IN': 'हाइड्रोपोनिक्स में मिट्टी के बिना खेती। शहरी क्षेत्रों के लिए अच्छा।',
      'mr-IN': 'हायड्रोपोनिक्समध्ये मातीशिवाय शेती. शहरी भागांसाठी चांगले.',
      'en-IN': 'Hydroponics allows soil-less farming. Good for urban areas.'
    }
  },

  // Quick fixes and emergency solutions
  emergency: {
    pest_attack: {
      'hi-IN': 'तुरंत नीम का पानी बनाकर छिड़कें। 50 ग्राम नीम पत्ती प्रति लीटर पानी।',
      'mr-IN': 'त्वरित कडुलिंबाचे पाणी बनवून फवारा. 50 ग्रॅम कडुलिंब पाने प्रती लिटर पाणी.',
      'en-IN': 'Immediate spray neem water. 50g neem leaves per liter water.'
    },
    drought: {
      'hi-IN': 'सूखा पड़े तो मल्चिंग करें। पानी बचाने के लिए ड्रिप लगाएं।',
      'mr-IN': 'दुष्काळ पडला तर मल्चिंग करा. पाणी वाचवण्यासाठी ठिबक लावा.',
      'en-IN': 'During drought, use mulching. Install drip irrigation to save water.'
    },
    heatwave: {
      'hi-IN': 'लू चलने पर छाया जाल लगाएं। दिन में तीन से चार बार हल्का पानी दें।',
      'mr-IN': 'उष्णतेच्या लाटेत सावलीचे जाळे लावा. दिवसात तीन ते चार वेळा हलके पाणी द्या.',
      'en-IN': 'During heatwave, install shade nets. Light watering 3-4 times daily.'
    }
  },

  // Financial advice
  finance: {
    crop_loan: {
      'hi-IN': 'फसली लोन के लिए बैंक में जमीन के कागज़ात और आधार लेकर जाएं।',
      'mr-IN': 'पीक कर्जासाठी बँकेत जमिनीचे कागदपत्रे आणि आधार घेऊन जा.',
      'en-IN': 'For crop loans, visit bank with land documents and Aadhaar card.'
    },
    subsidy_schemes: {
      'hi-IN': 'खाद सब्सिडी के लिए सॉयल हेल्थ कार्ड बनवाएं। KCC कार्ड बनाएं।',
      'mr-IN': 'खत अनुदानासाठी मातीचे आरोग्य कार्ड बनवा. केसीसी कार्ड बनवा.',
      'en-IN': 'Get soil health card for fertilizer subsidy. Apply for KCC card.'
    }
  }
};

class AgenticFarmingAI {
  private openai: OpenAI;
  private knowledgeBase: typeof AGRICULTURAL_KNOWLEDGE_BASE;
  private marketService: LiveGovernmentMarketService;
  private locationData: { lat: number; lon: number; region?: string } | null = null;
  
  // RAG System Components
  private ragDocuments: RAGDocument[] = [];
  private embeddingsCache = new Map<string, number[]>();
  private isRAGInitialized = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY, // Using OpenRouter API
      dangerouslyAllowBrowser: true,
      baseURL: 'https://openrouter.ai/api/v1' // OpenRouter endpoint
    });
    this.knowledgeBase = AGRICULTURAL_KNOWLEDGE_BASE;
    this.marketService = new LiveGovernmentMarketService();
    
    // Initialize RAG system
    this.initializeRAGSystem();
  }

  // Initialize RAG System with Document Chunking and Embeddings
  private async initializeRAGSystem() {
    if (this.isRAGInitialized) return;

    try {
      console.log('Initializing RAG system...');
      
      // Step 1: Document Chunking - Convert structured knowledge to RAG documents
      this.ragDocuments = await this.chunkKnowledgeBase();
      
      // Step 2: Generate Embeddings for semantic search
      await this.generateEmbeddings();
      
      this.isRAGInitialized = true;
      console.log(`RAG system initialized with ${this.ragDocuments.length} documents`);
    } catch (error) {
      console.error('RAG initialization failed:', error);
      this.isRAGInitialized = false;
    }
  }

  // Document Chunking Strategy
  private async chunkKnowledgeBase(): Promise<RAGDocument[]> {
    const documents: RAGDocument[] = [];
    let docId = 1;

    // Chunk crops knowledge
    for (const [cropName, cropData] of Object.entries(this.knowledgeBase.crops)) {
      for (const [aspect, langData] of Object.entries(cropData)) {
        for (const [lang, content] of Object.entries(langData as any)) {
          documents.push({
            id: `crop-${docId++}`,
            content: content as string,
            category: `crops-${cropName}-${aspect}`,
            language: lang,
            metadata: {
              source: `Agricultural Knowledge Base - ${cropName}`,
              reliability: 0.9,
              region: 'India'
            }
          });
        }
      }
    }

    // Chunk weather knowledge
    for (const [weatherType, langData] of Object.entries(this.knowledgeBase.weather)) {
      for (const [lang, content] of Object.entries(langData)) {
        documents.push({
          id: `weather-${docId++}`,
          content: content as string,
          category: `weather-${weatherType}`,
          language: lang,
          metadata: {
            source: 'Weather Advisory System',
            reliability: 0.85
          }
        });
      }
    }

    // Chunk irrigation knowledge
    for (const [irrigationType, langData] of Object.entries(this.knowledgeBase.irrigation)) {
      for (const [lang, content] of Object.entries(langData)) {
        documents.push({
          id: `irrigation-${docId++}`,
          content: content as string,
          category: `irrigation-${irrigationType}`,
          language: lang,
          metadata: {
            source: 'Irrigation Best Practices',
            reliability: 0.9
          }
        });
      }
    }

    // Chunk nutrition knowledge
    for (const [nutrientType, langData] of Object.entries(this.knowledgeBase.nutrition)) {
      for (const [lang, content] of Object.entries(langData)) {
        documents.push({
          id: `nutrition-${docId++}`,
          content: content as string,
          category: `nutrition-${nutrientType}`,
          language: lang,
          metadata: {
            source: 'Plant Nutrition Guide',
            reliability: 0.9
          }
        });
      }
    }

    // Chunk disease knowledge
    for (const [diseaseType, langData] of Object.entries(this.knowledgeBase.diseases)) {
      for (const [lang, content] of Object.entries(langData)) {
        documents.push({
          id: `disease-${docId++}`,
          content: content as string,
          category: `diseases-${diseaseType}`,
          language: lang,
          metadata: {
            source: 'Plant Disease Management',
            reliability: 0.85
          }
        });
      }
    }

    // Chunk pest knowledge
    for (const [pestType, langData] of Object.entries(this.knowledgeBase.pests)) {
      for (const [lang, content] of Object.entries(langData)) {
        documents.push({
          id: `pest-${docId++}`,
          content: content as string,
          category: `pests-${pestType}`,
          language: lang,
          metadata: {
            source: 'Pest Management System',
            reliability: 0.85
          }
        });
      }
    }

    // Chunk emergency knowledge
    for (const [emergencyType, langData] of Object.entries(this.knowledgeBase.emergency)) {
      for (const [lang, content] of Object.entries(langData)) {
        documents.push({
          id: `emergency-${docId++}`,
          content: content as string,
          category: `emergency-${emergencyType}`,
          language: lang,
          metadata: {
            source: 'Emergency Response System',
            reliability: 0.95
          }
        });
      }
    }

    // Chunk finance knowledge
    for (const [financeType, langData] of Object.entries(this.knowledgeBase.finance)) {
      for (const [lang, content] of Object.entries(langData)) {
        documents.push({
          id: `finance-${docId++}`,
          content: content as string,
          category: `finance-${financeType}`,
          language: lang,
          metadata: {
            source: 'Agricultural Finance Guide',
            reliability: 0.8
          }
        });
      }
    }

    return documents;
  }

  // Generate Embeddings for Semantic Search
  private async generateEmbeddings() {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      console.warn('No API key available for embeddings generation');
      return;
    }

    for (const doc of this.ragDocuments) {
      if (this.embeddingsCache.has(doc.id)) {
        doc.embedding = this.embeddingsCache.get(doc.id);
        continue;
      }

      try {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: doc.content
        });

        doc.embedding = response.data[0].embedding;
        this.embeddingsCache.set(doc.id, doc.embedding);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Embedding generation failed for document ${doc.id}:`, error);
      }
    }

    console.log(`Generated embeddings for ${this.ragDocuments.filter(d => d.embedding).length} documents`);
  }

  // RAG Retrieval - Semantic Search using Vector Similarity
  private async ragRetrieval(query: string, language: string = 'en-IN', topK: number = 5): Promise<RAGDocument[]> {
    if (!this.isRAGInitialized || !import.meta.env.VITE_OPENROUTER_API_KEY) {
      return this.fallbackKeywordRetrieval(query, language, topK);
    }

    try {
      // Generate query embedding
      const queryResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query
      });
      const queryEmbedding = queryResponse.data[0].embedding;

      // Calculate cosine similarity with all documents
      const scoredDocuments = this.ragDocuments
        .filter(doc => doc.embedding && (doc.language === language || doc.language === 'en-IN'))
        .map(doc => ({
          doc,
          score: this.calculateCosineSimilarity(queryEmbedding, doc.embedding!)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      console.log(`RAG retrieval found ${scoredDocuments.length} relevant documents`);
      return scoredDocuments.map(item => item.doc);
      
    } catch (error) {
      console.error('RAG retrieval failed:', error);
      return this.fallbackKeywordRetrieval(query, language, topK);
    }
  }

  // Cosine Similarity Calculation
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

  // Fallback Keyword-based Retrieval
  private fallbackKeywordRetrieval(query: string, language: string, topK: number): RAGDocument[] {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(word => word.length > 2);

    return this.ragDocuments
      .filter(doc => doc.language === language || doc.language === 'en-IN')
      .map(doc => ({
        doc,
        score: keywords.reduce((score, keyword) => 
          score + (doc.content.toLowerCase().includes(keyword) ? 1 : 0), 0
        ) / keywords.length
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.doc);
  }

  // Detect language from user input
  detectLanguage(text: string): string {
    const lowerText = text.toLowerCase();

    // Hindi script detection
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';

    // Bengali script detection
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN';

    // Tamil script detection  
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';

    // Telugu script detection
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';

    // Keyword-based detection for common terms
    for (const [keyword, lang] of Object.entries(LANGUAGE_CODES)) {
      if (lowerText.includes(keyword)) return lang;
    }

    return 'en-IN'; // Default to English
  }

  // RAG-Enhanced Knowledge Retrieval
  async retrieveRelevantKnowledge(query: string, weatherData: any, marketData?: any): Promise<string[]> {
    const relevantInfo: string[] = [];
    const lowerQuery = query.toLowerCase();
    const detectedLang = this.detectLanguage(query);

    // RAG Retrieval - Semantic Search
    const ragResults = await this.ragRetrieval(query, detectedLang, 8);
    relevantInfo.push(...ragResults.map(doc => doc.content));

    // Weather-based context retrieval with enhanced conditions
    if (weatherData) {
      if (weatherData.temperature > 40) {
        relevantInfo.push(this.knowledgeBase.emergency.heatwave[detectedLang] ||
          'Extreme heat warning - protect crops with shade nets');
      } else if (weatherData.temperature > 35) {
        relevantInfo.push(this.knowledgeBase.weather.hot_weather[detectedLang] ||
          'High temperature - increase irrigation frequency');
      }

      if (weatherData.humidity > 80) {
        relevantInfo.push('High humidity - risk of fungal diseases, ensure good ventilation');
      }

      if (weatherData.precipitation > 10) {
        relevantInfo.push(this.knowledgeBase.weather.monsoon[detectedLang] ||
          'Heavy rain expected - ensure drainage and protect from fungal diseases');
      } else if (weatherData.precipitation > 0) {
        relevantInfo.push('Light rain expected - adjust watering schedule');
      }

      if (weatherData.windSpeed > 25) {
        relevantInfo.push('Strong winds - avoid spraying pesticides, support tall crops');
      }

      if (weatherData.temperature < 10) {
        relevantInfo.push(this.knowledgeBase.weather.winter[detectedLang] ||
          'Cold weather - protect from frost');
      }
    }

    // Market data integration
    if (marketData && marketData.length > 0) {
      const marketInsights = this.marketService.generateLiveMarketInsights(marketData, detectedLang);
      relevantInfo.push(...marketInsights);
    }

    // Seasonal context
    const currentMonth = new Date().getMonth() + 1;
    const season = this.getCurrentSeason(currentMonth);
    relevantInfo.push(`Current season: ${season.season} - Recommended crops: ${season.crops.join(', ')}`);

    // Enhanced intent matching with comprehensive knowledge base

    // Water/irrigation queries
    if (lowerQuery.includes('water') || lowerQuery.includes('पानी') || lowerQuery.includes('সেচ') ||
      lowerQuery.includes('தண்ணீர்') || lowerQuery.includes('irrigation') || lowerQuery.includes('सिंचाई')) {
      if (lowerQuery.includes('drip') || lowerQuery.includes('ड्रिप')) {
        relevantInfo.push(this.knowledgeBase.irrigation.drip[detectedLang]);
      } else if (lowerQuery.includes('sprinkler') || lowerQuery.includes('स्प्रिंकलर')) {
        relevantInfo.push(this.knowledgeBase.irrigation.sprinkler[detectedLang]);
      } else {
        relevantInfo.push(this.knowledgeBase.irrigation.traditional[detectedLang]);
      }
    }

    // Fertilizer and nutrition queries
    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('खाद') || lowerQuery.includes('সার') ||
      lowerQuery.includes('உரம்') || lowerQuery.includes('nutrition') || lowerQuery.includes('पोषण')) {
      if (lowerQuery.includes('nitrogen') || lowerQuery.includes('नाइट्रोजन') || lowerQuery.includes('yellow')) {
        relevantInfo.push(this.knowledgeBase.nutrition.nitrogen[detectedLang]);
      } else if (lowerQuery.includes('phosphorus') || lowerQuery.includes('फॉस्फोरस') || lowerQuery.includes('root')) {
        relevantInfo.push(this.knowledgeBase.nutrition.phosphorus[detectedLang]);
      } else if (lowerQuery.includes('potassium') || lowerQuery.includes('पोटाश') || lowerQuery.includes('flower')) {
        relevantInfo.push(this.knowledgeBase.nutrition.potassium[detectedLang]);
      } else {
        relevantInfo.push(this.knowledgeBase.organic.fertilizers[detectedLang]);
      }
    }

    // Crop-specific queries
    ['rice', 'wheat', 'cotton', 'धान', 'गेहूं', 'कपास'].forEach(crop => {
      if (lowerQuery.includes(crop)) {
        const cropKey = crop === 'धान' ? 'rice' : crop === 'गेहूं' ? 'wheat' : crop === 'कपास' ? 'cotton' : crop;
        const cropData = this.knowledgeBase.crops[cropKey as keyof typeof this.knowledgeBase.crops];
        if (cropData) {
          if (lowerQuery.includes('plant') || lowerQuery.includes('बुआई')) {
            const plantingInfo = (cropData as any).planting?.[detectedLang];
            if (plantingInfo) relevantInfo.push(plantingInfo);
          }
          if (lowerQuery.includes('disease') || lowerQuery.includes('रोग') || lowerQuery.includes('pest') || lowerQuery.includes('कीट')) {
            const diseaseInfo = (cropData as any).diseases?.[detectedLang];
            const pestInfo = (cropData as any).pest?.[detectedLang];
            if (diseaseInfo) relevantInfo.push(diseaseInfo);
            if (pestInfo) relevantInfo.push(pestInfo);
          }
          if (lowerQuery.includes('harvest') || lowerQuery.includes('कटाई')) {
            const harvestInfo = (cropData as any).harvest?.[detectedLang];
            if (harvestInfo) relevantInfo.push(harvestInfo);
          }
        }
      }
    });

    // Disease and pest queries
    if (lowerQuery.includes('disease') || lowerQuery.includes('रोग') || lowerQuery.includes('spot') || lowerQuery.includes('धब्बे')) {
      if (lowerQuery.includes('leaf') || lowerQuery.includes('पत्ती') || lowerQuery.includes('spot')) {
        relevantInfo.push(this.knowledgeBase.diseases.leaf_spots[detectedLang]);
      }
      if (lowerQuery.includes('wilt') || lowerQuery.includes('मुरझा')) {
        relevantInfo.push(this.knowledgeBase.diseases.wilting[detectedLang]);
      }
      if (lowerQuery.includes('slow') || lowerQuery.includes('धीमी') || lowerQuery.includes('growth')) {
        relevantInfo.push(this.knowledgeBase.diseases.stunted_growth[detectedLang]);
      }
    }

    // Emergency situations
    if (lowerQuery.includes('emergency') || lowerQuery.includes('urgent') || lowerQuery.includes('तुरंत') ||
      lowerQuery.includes('attack') || lowerQuery.includes('हमला')) {
      if (lowerQuery.includes('pest') || lowerQuery.includes('कीट')) {
        relevantInfo.push(this.knowledgeBase.emergency.pest_attack[detectedLang]);
      }
      if (lowerQuery.includes('drought') || lowerQuery.includes('सूखा')) {
        relevantInfo.push(this.knowledgeBase.emergency.drought[detectedLang]);
      }
      if (lowerQuery.includes('heat') || lowerQuery.includes('गर्मी')) {
        relevantInfo.push(this.knowledgeBase.emergency.heatwave[detectedLang]);
      }
    }

    // Financial and scheme queries
    if (lowerQuery.includes('loan') || lowerQuery.includes('लोन') || lowerQuery.includes('money') ||
      lowerQuery.includes('पैसा') || lowerQuery.includes('subsidy') || lowerQuery.includes('सब्सिडी')) {
      if (lowerQuery.includes('loan') || lowerQuery.includes('लोन')) {
        relevantInfo.push(this.knowledgeBase.finance.crop_loan[detectedLang]);
      }
      if (lowerQuery.includes('subsidy') || lowerQuery.includes('सब्सिडी') || lowerQuery.includes('scheme')) {
        relevantInfo.push(this.knowledgeBase.schemes.subsidy[detectedLang]);
        relevantInfo.push(this.knowledgeBase.finance.subsidy_schemes[detectedLang]);
      }
      if (lowerQuery.includes('insurance') || lowerQuery.includes('बीमा')) {
        relevantInfo.push(this.knowledgeBase.schemes.insurance[detectedLang]);
      }
    }

    // Modern farming techniques
    if (lowerQuery.includes('modern') || lowerQuery.includes('technology') || lowerQuery.includes('tech') ||
      lowerQuery.includes('आधुनिक') || lowerQuery.includes('precision') || lowerQuery.includes('hydroponic')) {
      if (lowerQuery.includes('precision') || lowerQuery.includes('gps') || lowerQuery.includes('sensor')) {
        relevantInfo.push(this.knowledgeBase.modern_techniques.precision_farming[detectedLang]);
      }
      if (lowerQuery.includes('hydroponic') || lowerQuery.includes('soil-less') || lowerQuery.includes('बिना मिट्टी')) {
        relevantInfo.push(this.knowledgeBase.modern_techniques.hydroponics[detectedLang]);
      }
    }

    // Market price queries
    if (lowerQuery.includes('price') || lowerQuery.includes('भाव') || lowerQuery.includes('দাম') ||
      lowerQuery.includes('விலை') || lowerQuery.includes('market') || lowerQuery.includes('बाजार')) {
      if (marketData && marketData.length > 0) {
        marketData.forEach((price: any) => {
          relevantInfo.push(`${price.commodity}: ₹${price.price} ${price.unit} at ${price.market} (${price.trend || 'stable'})`);
        });
      }
    }

    // Filter out empty strings and duplicates
    return [...new Set(relevantInfo.filter(info => info.trim().length > 0))];
  }

  // Agentic AI processing with enhanced context and market data
  async processQuery(
    userQuery: string,
    weatherData: any,
    locationData?: { lat: number; lon: number; region?: string }
  ): Promise<{ response: string; language: string; confidence: number }> {

    const detectedLanguage = this.detectLanguage(userQuery);

    // Always try to gather market data for better context - especially for crop-related queries
    let marketData = null;
    const queryLower = userQuery.toLowerCase();

    // Check if query mentions any crops or is market-related
    const isCropRelated = queryLower.includes('टमाटर') || queryLower.includes('गेहूं') ||
      queryLower.includes('tomato') || queryLower.includes('wheat') || queryLower.includes('rice') ||
      queryLower.includes('धान') || queryLower.includes('कपास') || queryLower.includes('cotton') ||
      queryLower.includes('फसल') || queryLower.includes('crop');

    const isMarketQuery = queryLower.includes('price') || queryLower.includes('भाव') ||
      queryLower.includes('দাম') || queryLower.includes('வिலை') ||
      queryLower.includes('market') || queryLower.includes('sell') ||
      queryLower.includes('बेच') || queryLower.includes('बाजार');

    // Fetch market data for crop-related queries or direct market queries
    if ((isMarketQuery || isCropRelated) && locationData?.region) {
      try {
        marketData = await this.marketService.getLiveMarketPrices(locationData.region);
        console.log('Market data fetched:', marketData?.length || 0, 'items');
      } catch (error) {
        console.error('Market data fetch error:', error);
      }
    }

    const relevantKnowledge = await this.retrieveRelevantKnowledge(userQuery, weatherData, marketData);

    // Build comprehensive context for the AI agent
    const systemPrompt = this.buildSystemPrompt(detectedLanguage, locationData);
    const contextualPrompt = this.buildContextualPrompt(
      userQuery,
      weatherData,
      relevantKnowledge,
      detectedLanguage,
      locationData,
      marketData
    );

    try {
      console.log('AGENTIC_AI: Calling OpenAI with model gpt-4o-mini');
      console.log('AGENTIC_AI: API Key available:', !!import.meta.env.VITE_OPENROUTER_API_KEY);
      
      const completion = await Promise.race([
        this.openai.chat.completions.create({
          model: "gpt-4o-mini", // Using faster, cost-effective model
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: contextualPrompt }
          ],
          temperature: 0.7,
          max_tokens: 600
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API timeout')), 15000)
        )
      ]) as any;

      const response = completion.choices[0]?.message?.content ||
        "I'm sorry, I couldn't process your request. Please try again.";

      console.log('AGENTIC_AI: API response received, length:', response.length);

      return {
        response,
        language: detectedLanguage,
        confidence: this.calculateConfidence(userQuery, response)
      };

    } catch (error) {
      console.error('AGENTIC_AI: OpenAI API error:', error);
      // Fallback to enhanced knowledge base
      return this.getEnhancedFallbackResponse(userQuery, detectedLanguage, weatherData, marketData);
    }
  }

  private buildSystemPrompt(language: string, locationData?: any): string {
    const location = locationData?.region || 'India';

    return `You are an expert agricultural advisor and agronomist specializing in Indian farming practices. 
    
    CRITICAL INSTRUCTIONS:
    1. ALWAYS respond in the detected language: ${language}
    2. Provide practical, actionable advice for smallholder farmers
    3. Consider Indian agricultural seasons (Kharif, Rabi, Zaid)
    4. Use simple, clear language suitable for farmers with limited education
    5. Include specific recommendations based on current weather
    6. Reference traditional Indian farming wisdom when appropriate
    7. Focus on low-cost, accessible solutions
    
    Your knowledge covers:
    - Crop selection and timing for Indian conditions
    - Water management and irrigation techniques
    - Organic and low-cost fertilizer options
    - Pest and disease management
    - Market timing and price optimization
    - Weather-based farming decisions
    
    Location: ${location}
    
    Always provide:
    1. Direct answer to the question
    2. Weather-based reasoning
    3. Next steps or timeline
    4. Any warnings or precautions`;
  }

  private buildContextualPrompt(
    query: string,
    weather: any,
    knowledge: string[],
    language: string,
    locationData?: any,
    marketData?: any
  ): string {
    const currentMonth = new Date().getMonth() + 1;
    const currentSeason = this.getCurrentSeason(currentMonth);

    return `FARMER'S QUESTION: "${query}"
    
    CURRENT CONTEXT:
    - Location: ${locationData ? `Lat: ${locationData.lat}, Lon: ${locationData.lon}` : 'Default location'}
    - Language: ${language}
    - Current Season: ${currentSeason.season} (${currentSeason.period})
    - Recommended crops: ${currentSeason.crops.join(', ')}
    
    WEATHER DATA:
    ${weather ? `
    - Temperature: ${weather.temperature}°C
    - Humidity: ${weather.humidity}%
    - Condition: ${weather.description}
    - Wind Speed: ${weather.windSpeed} km/h
    - Precipitation: ${weather.precipitation}mm
    ` : 'Weather data not available'}
    
    MARKET DATA:
    ${marketData && marketData.length > 0 ?
        marketData.map((m: any) => `- ${m.commodity}: ₹${m.price} ${m.unit} at ${m.market} (${m.trend})`).join('\n') :
        'Market data not available'
      }
    
    RELEVANT AGRICULTURAL KNOWLEDGE:
    ${knowledge.join('\n')}
    
    Please provide a comprehensive answer that:
    1. Directly answers the farmer's question
    2. Explains the reasoning based on weather and season
    3. Includes market insights if relevant
    4. Gives specific next steps
    5. Responds in ${language} language
    6. Uses simple, practical language for rural farmers`;
  }

  private getCurrentSeason(month: number) {
    if (month >= 6 && month <= 10) return INDIAN_CROP_CALENDAR.kharif;
    if (month >= 11 || month <= 2) return INDIAN_CROP_CALENDAR.rabi;
    return INDIAN_CROP_CALENDAR.zaid;
  }

  private calculateConfidence(query: string, response: string): number {
    // Simple confidence calculation based on response length and specificity
    if (response.length > 100 && !response.includes("sorry")) return 0.85;
    if (response.length > 50) return 0.7;
    return 0.5;
  }

  private getEnhancedFallbackResponse(query: string, language: string, weather: any, marketData?: any) {
    const responses = {
      'hi-IN': {
        general: 'मैं आपकी मदद करने की कोशिश कर रहा हूं। कृपया फसल, पानी, मौसम, या बाजार के बारे में स्पष्ट सवाल पूछें।',
        watering: weather?.humidity > 70
          ? `मिट्टी में अच्छी नमी है (${weather.humidity}% नमी)। अभी पानी न दें। तापमान ${weather.temperature}°C है।`
          : `मिट्टी सूखी लगती है। सुबह या शाम को पानी दें। तापमान ${weather.temperature}°C है।`,
        planting: 'बुआई से पहले मौसम और मिट्टी की जांच करें। स्थानीय कृषि विभाग से सलाह लें।',
        market: marketData?.length > 0
          ? `आज के भाव: ${marketData.map((m: any) => `${m.commodity} ₹${m.price}`).join(', ')}`
          : 'बाजार की जानकारी अभी उपलब्ध नहीं है। स्थानीय मंडी से पूछें।'
      },
      'en-IN': {
        general: 'I am here to help you with farming advice. Please ask specific questions about crops, watering, weather, or markets.',
        watering: weather?.humidity > 70
          ? `Soil has good moisture (${weather.humidity}% humidity). Skip watering for now. Temperature is ${weather.temperature}°C.`
          : `Soil appears dry. Water in morning or evening. Temperature is ${weather.temperature}°C.`,
        planting: 'Check weather and soil before planting. Consult local agriculture department.',
        market: marketData?.length > 0
          ? `Today's prices: ${marketData.map((m: any) => `${m.commodity} ₹${m.price}`).join(', ')}`
          : 'Market information not available. Check with local market.'
      },
      'bn-IN': {
        general: 'আমি আপনার কৃষি সমস্যার সমাধানে সাহায্য করতে এসেছি। ফসল, সেচ, আবহাওয়া বা বাজার সম্পর্কে প্রশ্ন করুন।',
        watering: weather?.humidity > 70
          ? `মাটিতে ভাল আর্দ্রতা আছে (${weather.humidity}% আর্দ্রতা)। এখন পানি দেবেন না।`
          : `মাটি শুকনো মনে হচ্ছে। সকাল বা সন্ধ্যায় পানি দিন।`,
        planting: 'রোপণের আগে আবহাওয়া ও মাটি পরীক্ষা করুন।',
        market: 'বাজারের তথ্য এখন পাওয়া যাচ্ছে না। স্থানীয় বাজারে জিজ্ঞাসা করুন।'
      },
      'ta-IN': {
        general: 'நான் உங்கள் விவசாய பிரச்சனைகளுக்கு தீர்வு காண உதவ வந்துள்ளேன். பயிர், நீர்ப்பாசனம், வானிலை அல்லது சந்தை பற்றி கேட்கவும்.',
        watering: weather?.humidity > 70
          ? `மண்ணில் நல்ல ஈரப்பதம் உள்ளது (${weather.humidity}% ஈரப்பதம்)। இப்போது தண்ணீர் விட வேண்டாம்।`
          : `மண் உலர்ந்திருக்கிறது. காலை அல்லது மாலை தண்ணீர் விடுங்கள்।`,
        planting: 'நடவுக்கு முன் வானிலை மற்றும் மண்ணை பரிசோதிக்கவும்.',
        market: 'சந்தை தகவல் இப்போது கிடைக்கவில்லை. உள்ளூர் சந்தையில் விசாரிக்கவும்.'
      }
    };

    const langResponses = responses[language as keyof typeof responses] || responses['hi-IN'];

    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('water') || lowerQuery.includes('পানি') || lowerQuery.includes('தண்ணீர்') || lowerQuery.includes('पानी')) {
      return { response: langResponses.watering, language, confidence: 0.7 };
    }
    if (lowerQuery.includes('plant') || lowerQuery.includes('রোপণ') || lowerQuery.includes('நடவு') || lowerQuery.includes('बुआई')) {
      return { response: langResponses.planting, language, confidence: 0.7 };
    }
    if (lowerQuery.includes('price') || lowerQuery.includes('দাম') || lowerQuery.includes('விலை') || lowerQuery.includes('भाव') || lowerQuery.includes('market')) {
      return { response: langResponses.market, language, confidence: 0.6 };
    }

    return { response: langResponses.general, language, confidence: 0.4 };
  }

  private getFallbackResponse(query: string, language: string, weather: any) {
    // Delegate to enhanced fallback
    return this.getEnhancedFallbackResponse(query, language, weather, null);
  }

  // Get current location using browser geolocation - NO DEFAULT FALLBACKS
  async getCurrentLocation(): Promise<{ lat: number; lon: number; region?: string }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser. Please allow location access.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Get region name using reverse geocoding
            const region = await this.getReverseGeolocation(latitude, longitude);
            resolve({ lat: latitude, lon: longitude, region });
          } catch {
            resolve({ lat: latitude, lon: longitude, region: 'Your Location' });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Location access denied. ';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location permissions in your browser settings and refresh the page.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable. Please check your GPS or internet connection.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += 'An unknown error occurred while retrieving your location.';
              break;
          }

          reject(new Error(errorMessage));
        },
        {
          timeout: 15000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Free reverse geocoding using OpenStreetMap
  private async getReverseGeolocation(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      const data = await response.json();

      const { city, state, country } = data.address || {};
      return `${city || 'Unknown'}, ${state || ''}, ${country || 'India'}`.replace(/,\s*,/g, ',').replace(/^,|,$/g, '');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'India';
    }
  }

  // Enhanced weather fetching with accurate precipitation
  async getLocationBasedWeather(lat?: number, lon?: number) {
    try {
      const location = await this.getCurrentLocation();
      const finalLat = lat || location.lat;
      const finalLon = lon || location.lon;

      this.locationData = { lat: finalLat, lon: finalLon, region: location.region };

      // Using Open-Meteo API with hourly data for accurate precipitation
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3&past_days=1`
      );

      if (!response.ok) throw new Error('Weather API failed');

      const data = await response.json();

      // Calculate today's total precipitation from hourly data
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const currentHour = now.getHours();

      // Get precipitation for current day up to current hour
      const todayPrecipitation = data.hourly.precipitation
        .slice(24, 24 + currentHour + 1) // Past 24 hours + current day up to now
        .reduce((sum: number, precip: number) => sum + (precip || 0), 0);

      // Get current weather description with more accuracy
      const weatherCode = data.current.weather_code;
      const currentTemp = Math.round(data.current.temperature_2m);
      const maxTemp = Math.round(data.daily.temperature_2m_max[1]); // Tomorrow's max

      return {
        temperature: currentTemp,
        humidity: data.current.relative_humidity_2m,
        description: this.getWeatherDescription(weatherCode),
        windSpeed: Math.round(data.current.wind_speed_10m),
        precipitation: Math.round(todayPrecipitation * 10) / 10, // Round to 1 decimal
        forecast: {
          tomorrow: {
            maxTemp: maxTemp,
            minTemp: Math.round(data.daily.temperature_2m_min[1]),
            precipitation: Math.round(data.daily.precipitation_sum[1] * 10) / 10
          }
        },
        location: location.region
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      throw new Error('Unable to fetch weather data');
    }
  }

  private getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: { en: string; hi: string } } = {
      0: { en: 'Clear sky', hi: 'साफ आसमान' },
      1: { en: 'Mainly clear', hi: 'मुख्यतः साफ' },
      2: { en: 'Partly cloudy', hi: 'आंशिक बादल' },
      3: { en: 'Overcast', hi: 'बादल छाए हुए' },
      45: { en: 'Foggy', hi: 'कोहरा' },
      51: { en: 'Light drizzle', hi: 'हल्की बूंदाबांदी' },
      53: { en: 'Moderate drizzle', hi: 'मध्यम बूंदाबांदी' },
      55: { en: 'Dense drizzle', hi: 'तेज बूंदाबांदी' },
      61: { en: 'Slight rain', hi: 'हल्की बारिश' },
      63: { en: 'Moderate rain', hi: 'मध्यम बारिश' },
      65: { en: 'Heavy rain', hi: 'तेज बारिश' },
      71: { en: 'Slight snow', hi: 'हल्की बर्फबारी' },
      95: { en: 'Thunderstorm', hi: 'आंधी-तूफान' }
    };

    return weatherCodes[code]?.en || 'Unknown weather';
  }

  // Generate proactive insights based on weather and season
  async generateProactiveInsights(language: string = 'hi-IN') {
    try {
      const weather = await this.getLocationBasedWeather();
      const currentMonth = new Date().getMonth() + 1;
      const season = this.getCurrentSeason(currentMonth);

      const insights = [];

      // Weather-based insights
      if (weather.forecast.tomorrow.precipitation > 5) {
        insights.push(language === 'hi-IN'
          ? `कल बारिश होगी (${weather.forecast.tomorrow.precipitation}mm)। आज ही बीज बो दें।`
          : `Rain expected tomorrow (${weather.forecast.tomorrow.precipitation}mm). Plant seeds today.`
        );
      }

      if (weather.temperature > 40) {
        insights.push(language === 'hi-IN'
          ? 'बहुत गर्मी है। फसल को छाया दें और ज्यादा पानी दें।'
          : 'Very hot weather. Provide shade and increase watering.'
        );
      }

      // Seasonal insights
      if (season.plantingWindow.start === currentMonth) {
        insights.push(language === 'hi-IN'
          ? `${season.season} की बुआई का समय है। फसलें: ${season.crops.join(', ')}`
          : `Planting time for ${season.season}. Crops: ${season.crops.join(', ')}`
        );
      }

      return insights;
    } catch (error) {
      console.error('Proactive insights error:', error);
      return [];
    }
  }

  // Get RAG System Statistics
  getRAGStats() {
    return {
      isInitialized: this.isRAGInitialized,
      totalDocuments: this.ragDocuments.length,
      documentsWithEmbeddings: this.ragDocuments.filter(d => d.embedding).length,
      categories: [...new Set(this.ragDocuments.map(d => d.category))].length,
      languages: [...new Set(this.ragDocuments.map(d => d.language))],
      cacheSize: this.embeddingsCache.size,
      documentsByCategory: this.ragDocuments.reduce((acc, doc) => {
        const category = doc.category.split('-')[0];
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export default AgenticFarmingAI;

