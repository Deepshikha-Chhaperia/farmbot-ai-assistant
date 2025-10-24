# FarmBot AI Assistant

Voice-first agricultural AI assistant for India's 600+ million farmers with real government data integration.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Now-brightgreen?style=for-the-badge)](https://farmbot-ai.vercel.app/)
[![GitHub Stars](https://img.shields.io/github/stars/Deepshikha-Chhaperia/farmbot-ai-assistant?style=for-the-badge)](https://github.com/Deepshikha-Chhaperia/farmbot-ai-assistant/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Made with Love](https://img.shields.io/badge/Made%20with-Love%20for%20Farmers-red?style=for-the-badge)](https://github.com/Deepshikha-Chhaperia/farmbot-ai-assistant)

## The Problem

**68% of Indian farmers are illiterate or semi-literate**, yet they desperately need access to:
- **Real-time weather forecasts** for irrigation decisions
- **Crop care guidance** for pest management and disease prevention  
- **Live market prices** to sell at the right time and place
- **Smart irrigation advice** to optimize water usage

Most agricultural apps fail because they assume literacy and provide mock data instead of real, actionable information that farmers can trust.

## The Solution

FarmBot is a **revolutionary voice-first AI assistant** that:

- **Speaks naturally** in Hindi, English, and Marathi with authentic pronunciation
- **Uses 100% real government data** from official APIs (eNAM, Data.gov.in)
- **Powered by AI** that understands Indian farming contexts and seasons
- **Optimized for low-bandwidth environments** typical of rural India
- **Gives actionable advice** farmers can use immediately in their fields

## See It In Action

### Voice Commands You Can Try:
| Hindi | English | Response |
|-------|---------|----------|
| "मेरी फसल में कीड़े लग गए हैं" | "My crops have pest attacks" | AI-powered pest management guidance |
| "गेहूं का भाव क्या है?" | "What's the wheat price?" | Live mandi prices from government APIs |
| "मौसम कैसा है?" | "How's the weather?" | 4-day forecast with farming advice |
| "सिंचाई कब करें?" | "When should I irrigate?" | Smart watering recommendations |

## Architecture & Features

### AI-Powered Intelligence
- **Hybrid AI Architecture**: Combines Agentic AI with RAG for contextual responses
- **OpenAI GPT-4 Integration**: Via OpenRouter for intelligent agricultural advice
- **600+ Agricultural Knowledge Base**: Covers Indian crops, seasons, and farming practices

### Premium Voice Experience
- **ElevenLabs Integration**: Natural Hindi/English voices with agricultural terminology
- **Web Speech API**: Browser-native voice recognition with fallbacks
- **Smart Voice Flow**: Page-specific prompts to avoid confusion

### Real Government Data
- **Agmarknet API**: Ministry of Agriculture market data
- **eNAM Platform**: Electronic National Agriculture Market integration
- **Live Weather APIs**: Open-Meteo, WeatherAPI.com, OpenWeatherMap
- **MSP Data**: Minimum Support Price from government sources

### Performance & Reliability
- **Smart Caching**: 30-min market data, 10-min weather cache
- **Multi-tier Fallbacks**: Never shows "No data available"
- **Rural Accessibility**: Optimized API calls and voice-first interface to reduce literacy barriers
- **Sub-3-second Responses**: Even on slow connections

## Quick Start

### Try the Live Demo
**[farmbot-ai-assistant.vercel.app](https://farmbot-ai.vercel.app/)**


https://github.com/user-attachments/assets/4b3883a4-a14f-41f8-90f9-857c37aad1f2


### Run Locally

```bash
# Clone the repository
git clone https://github.com/Deepshikha-Chhaperia/farmbot-ai-assistant.git
cd farmbot-ai-assistant

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys (see Environment Setup below)

# Start development server
npm run dev
```

### Environment Setup

Create a `.env` file with these API keys:

```env
# AI Services (Required)
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Voice Services (Required for premium voice)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key

# Weather Services (Optional - has free fallbacks)
VITE_OPENWEATHER_API_KEY=your_openweather_key

# Government Data (Optional - enhanced market data)
VITE_DATA_GOV_IN_API_KEY=your_data_gov_key
```

> **Note**: The app works with free APIs if you don't have premium keys. ElevenLabs gracefully falls back to browser text-to-speech.

## Tech Stack

### Frontend Core
- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **Tailwind CSS** + **shadcn/ui** components
- **TanStack Query** for smart caching

### AI & Voice Services
- **OpenAI GPT-4** via OpenRouter API
- **ElevenLabs** premium text-to-speech
- **Web Speech API** for recognition
- **Custom RAG Pipeline** with agricultural knowledge

### Data Sources
- **Government APIs**: Agmarknet, eNAM
- **Weather Services**: Open-Meteo, WeatherAPI
- **Local Storage**: Farmer profiles & preferences

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- OpenRouter API key (for AI features)
- ElevenLabs API key (for premium voice)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/farmbot.git
cd farmbot
bun install  # or npm install
```

### 2. Environment Setup
Create `.env` file:
```env
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 3. Start Development
```bash
bun dev  # or npm run dev
# Open http://localhost:5173
```

### 4. Enable Voice Features
1. **Allow microphone access** when prompted
2. **Enable audio** for TTS responses
3. **Try Hindi/English commands** on any page

## Core Features

### 1. Voice-First Language Selection
- Clean landing page with 3 language options
- Voice prompts: *"हिंदी के लिए यहाँ दबाएं"* (Press here for Hindi)
- UI adapts completely to selected language

### 2. Smart Profile Creation
- Minimal 3-field setup: Name, Crop, Village
- Voice confirmation: *"You said your crop is wheat, is that correct?"*
- Privacy-first: all data stored locally

### 3. Intelligent Dashboard
- 4 main features: Crop Care, Weather, Irrigation, Market Prices
- Voice greeting: *"नमस्ते Ramesh! आज मैं आपकी कैसे मदद कर सकता हूं?"*
- Click or voice navigation

### 4. Feature Pages

#### Weather Forecast
- Live 4-day weather with farming context
- Voice summary: *"Tomorrow: rain expected. Don't irrigate today."*
- Temperature, humidity, precipitation with alerts

#### Crop Care
- AI-powered advice for Indian crops and seasons
- Pest management with Kharif/Rabi context
- Voice explanations of treatment recommendations

#### Market Prices
- Live government mandi data from multiple states
- Voice readout: *"In Nashik mandi, wheat price is ₹2100 per quintal"*
- Price trends and selling recommendations

#### Irrigation Advice
- Smart watering based on weather + crop + season
- Water conservation tips for sustainable farming
- Drought and flood management guidance

## What Makes This Special

### Competitive Advantages
1. **Real Government Data** - Not mock data like other projects
2. **Premium Voice AI** - ElevenLabs for authentic pronunciation  
3. **Cultural Authenticity** - Built with deep understanding of Indian agriculture
4. **Rural Accessibility** - Optimized for low-bandwidth environments with voice-first design
5. **Production Ready** - Actually deployed and working, not just a demo

### Social Impact
- **Democratizes agricultural knowledge** for illiterate farmers
- **Reduces crop losses** through timely weather alerts
- **Increases farmer income** with transparent market access
- **Bridges the digital divide** with inclusive voice-first design

## Roadmap

### Coming Soon
- [ ] **WhatsApp Bot Integration** for farmers without smartphones
- [ ] **Offline Mode** with cached advice for poor connectivity
- [ ] **13+ Indian Languages** (Bengali, Tamil, Telugu, Gujarati, etc.)
- [ ] **IoT Sensor Integration** for soil moisture and NPK monitoring
- [ ] **Crop Calendar Reminders** via SMS/voice calls

### Long-term Vision
- [ ] **Satellite Imagery Analysis** for crop health monitoring
- [ ] **AI-Powered Yield Prediction** based on historical data
- [ ] **Microfinance Integration** for input purchases
- [ ] **Supply Chain Connections** direct farmer-to-consumer
- [ ] **International Expansion** (Bangladesh, Sri Lanka, Nepal)

## Contributing

We welcome contributions from developers, agricultural experts, and language specialists!

### How to Contribute
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`  
5. Open a Pull Request

### Areas We Need Help
- **Language Experts**: Help improve translations for regional Indian languages
- **Agricultural Specialists**: Enhance crop care knowledge base
- **Designers**: Improve UI/UX for rural users
- **Performance Engineers**: Optimize for slower networks
- **Mobile Developers**: React Native app development

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Why Open Source?
We believe agricultural technology should be accessible to everyone. By open-sourcing FarmBot, we enable:
- **Global collaboration** on agricultural AI
- **Local customization** for different regions  
- **Educational use** in computer science and agriculture programs
- **Innovation acceleration** through community contributions

## Acknowledgments

- **Government of India** for open agricultural data APIs
- **ElevenLabs** for premium voice synthesis technology
- **Open-Meteo** for free, reliable weather data
- **OpenAI** for GPT-4 agricultural intelligence
- **Indian Farmers** who inspired this project

## Impact Stats

- **Target Audience**: 600+ million farmers in India
- **Languages Supported**: 3 (expanding to 13+)
- **Data Sources**: 5+ real government and weather APIs
- **Performance**: <3 second response times
- **Accessibility**: Voice-first design optimized for low-bandwidth rural environments

---

<div align="center">

### **Built for India's Farmers 🇮🇳**

[Star this repo](https://github.com/Deepshikha-Chhaperia/farmbot-ai-assistant) • [Try Live Demo](https://farmbot-ai.vercel.app/) • [Report Bug](https://github.com/Deepshikha-Chhaperia/farmbot-ai-assistant/issues) • [Request Feature](https://github.com/Deepshikha-Chhaperia/farmbot-ai-assistant/issues)

**"Technology should serve humanity, especially those who feed us."**

</div>

