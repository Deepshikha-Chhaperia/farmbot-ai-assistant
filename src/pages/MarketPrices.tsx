import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  ArrowLeft,
  Volume2,
  Search,
  MapPin,
  Calendar,
  Mic,
  MicOff
} from 'lucide-react';
import { useProfile } from '@/components/Profile/ProfileProvider';
import OptimizedSpeechService from '@/services/OptimizedSpeechService';
import ReliableMarketService from '@/services/ReliableMarketService';

interface MarketPrice {
  commodity: string;
  price: number;
  unit: string;
  market: string;
  trend: string;
  change: number;
  date: string;
  noData?: boolean;
}

interface CommodityMarkets {
  commodity: string;
  markets: MarketPrice[];
}

const MarketPrices: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [marketData, setMarketData] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNextCrop, setIsLoadingNextCrop] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasUsedVoiceSearch, setHasUsedVoiceSearch] = useState(false);
  const [userLocation, setUserLocation] = useState<{city: string, region: string} | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');
  const [speechService] = useState(() => new OptimizedSpeechService());
  const [marketService] = useState(() => new ReliableMarketService());

  const language = profile?.language || 'hi-IN';

  const messages = {
    'hi-IN': {
      title: 'बाजार भाव',
      subtitle: 'आपकी फसल',
      askForMore: 'और फसलों के भाव पूछें',
      listening: 'सुन रहा हूं...',
      per: 'per',
      listen: 'Listen'
    },
    'en-IN': {
      title: 'Market Prices', 
      subtitle: 'Your Crop',
      askForMore: 'Ask for more crop prices',
      listening: 'Listening...',
      per: 'per',
      listen: 'Listen'
    }
  };

  const currentMessages = messages[language as keyof typeof messages] || messages['hi-IN'];

  // Get user location
  const getUserLocation = async () => {
    try {
      console.log('LOCATION: Fetching user location...');
      const locationResponse = await fetch('https://ipapi.co/json/');
      
      if (!locationResponse.ok) {
        throw new Error('Location API failed');
      }
      
      const locationData = await locationResponse.json();
      console.log('LOCATION: Raw location data:', locationData);
      
      const detectedLocation = {
        city: locationData.city || locationData.city_name || 'Mumbai',
        region: locationData.region || locationData.region_name || locationData.state || 'Maharashtra'
      };
      
      console.log('LOCATION: Setting user location to:', detectedLocation);
      setUserLocation(detectedLocation);
      
    } catch (error) {
      console.error('LOCATION: Failed to get location, using Mumbai as fallback:', error);
      const fallbackLocation = {
        city: 'Mumbai',
        region: 'Maharashtra'
      };
      console.log('LOCATION: Using fallback location:', fallbackLocation);
      setUserLocation(fallbackLocation);
    }
  };

  // Get state info for API
  const getStateInfo = (region: string) => {
    const trimmedRegion = region?.trim() || 'Maharashtra';
    return {
      state: trimmedRegion,
      locations: [userLocation?.city?.toLowerCase() || 'mumbai']
    };
  };

  const toTitleCase = (value: string = '') =>
    value
      .toLowerCase()
      .split(/\s+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const prepareMarketEntries = (entries: any[] | undefined, fallbackCrop: string): MarketPrice[] => {
    if (!entries || entries.length === 0) {
      return [];
    }

    const displayName = entries[0]?.commodity || toTitleCase(fallbackCrop);
    const defaultMarket = userLocation?.city
      ? `${toTitleCase(userLocation.city)} Market`
      : userLocation?.region
        ? `${toTitleCase(userLocation.region)} Market`
        : 'Local Market';
    const cityLower = (userLocation?.city || '').toLowerCase();

    const formatted = entries
      .map(entry => {
        const numericPrice = Number(entry.price);
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
          return null;
        }

        const rawChange = Math.abs(Number(entry.change ?? 0));
        const sanitizedChange = Number.isFinite(rawChange) ? Number(rawChange.toFixed(1)) : 0;

        return {
          commodity: entry.commodity || displayName,
          price: Math.round(numericPrice),
          unit: entry.unit || 'quintal',
          market: entry.market || defaultMarket,
          trend: entry.trend || '=',
          change: sanitizedChange,
          date: entry.date || new Date().toLocaleDateString('en-IN')
        } as MarketPrice;
      })
      .filter((entry): entry is MarketPrice => entry !== null);

    if (formatted.length === 0) {
      return [];
    }

    formatted.sort((a, b) => {
      const aLocal = cityLower ? a.market.toLowerCase().includes(cityLower) : false;
      const bLocal = cityLower ? b.market.toLowerCase().includes(cityLower) : false;

      if (aLocal !== bLocal) {
        return aLocal ? -1 : 1;
      }

      return b.price - a.price;
    });

    return formatted.slice(0, Math.min(3, formatted.length));
  };

  const safeSpeak = async (text: string) => {
    if (!text) {
      return;
    }

    try {
      await speechService.speak(text, language);
    } catch (err) {
      console.error('SPEECH: Unable to play audio', err);
    }
  };

  const groupedMarketData = useMemo<CommodityMarkets[]>(() => {
    if (!marketData || marketData.length === 0) {
      return [];
    }

    const cityLower = (userLocation?.city || '').toLowerCase();
    const groups = new Map<string, CommodityMarkets>();

    marketData.forEach(entry => {
      const key = entry.commodity.toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, { commodity: entry.commodity, markets: [] });
      }
      groups.get(key)!.markets.push(entry);
    });

    const rankedGroups = Array.from(groups.values()).map(group => {
      const sortedMarkets = [...group.markets].sort((a, b) => {
        const aLocal = cityLower ? a.market.toLowerCase().includes(cityLower) : false;
        const bLocal = cityLower ? b.market.toLowerCase().includes(cityLower) : false;

        if (aLocal !== bLocal) {
          return aLocal ? -1 : 1;
        }

        if (a.noData && !b.noData) return 1;
        if (!a.noData && b.noData) return -1;

        return b.price - a.price;
      });

      return {
        commodity: group.commodity,
        markets: sortedMarkets
      };
    });

    return rankedGroups.sort((a, b) => a.commodity.localeCompare(b.commodity));
  }, [marketData, userLocation?.city]);

  const loadFarmerCrops = async () => {
    if (!userLocation) {
      console.log('MARKET: Waiting for location...');
      return;
    }

    console.log('PROGRESSIVE LOADING: Starting...');
    setIsLoading(true);

    try {
      await safeSpeak(
        language === 'hi-IN'
          ? 'मैं आपके लिए बाजार के भाव लोड कर रहा हूं'
          : 'I am loading market prices for you'
      );

      if (marketData.length === 0) {
        setMarketData([]);
      }

      const farmerCropTypes = profile?.cropType
        ? [...new Set(profile.cropType.split(/[,&]|\sand\s/).map(crop => crop.trim().toLowerCase()).filter(Boolean))]
        : ['wheat', 'onion'];

      console.log('FARMER CROPS:', farmerCropTypes);
      console.log(`TOTAL CROPS TO PROCESS: ${farmerCropTypes.length}`);

      const stateInfo = getStateInfo(userLocation.region);
      let completedCount = 0;

      for (let i = 0; i < farmerCropTypes.length; i++) {
        const crop = farmerCropTypes[i];
        console.log(`PROCESSING CROP ${i + 1}/${farmerCropTypes.length}: ${crop}`);

        if (i > 0) {
          setIsLoadingNextCrop(false);
        }

        try {
          const cropData = await marketService.getMarketPrices(stateInfo.state, crop, 10, userLocation.city);
          console.log(`Market data for ${crop}:`, cropData);

          let marketOptions = prepareMarketEntries(cropData, crop);

          if (marketOptions.length === 0) {
            const fallbackData = await marketService.getFallbackData(stateInfo.state, crop, 3, userLocation.city);
            console.log(`Using fallback data for ${crop}:`, fallbackData);
            marketOptions = prepareMarketEntries(fallbackData, crop);
          }

          if (marketOptions.length === 0) {
            const noDataEntry: MarketPrice = {
              commodity: crop.charAt(0).toUpperCase() + crop.slice(1),
              price: 0,
              unit: 'quintal',
              market: 'Government data not available',
              trend: '=',
              change: 0,
              date: new Date().toLocaleDateString('en-IN'),
              noData: true
            };

            setMarketData(prevData => {
              const filtered = prevData.filter(item => item.commodity.toLowerCase() !== crop.toLowerCase());
              return [...filtered, noDataEntry];
            });

            if (i === 0) {
              setIsLoading(false);
            }

            const errorText = language === 'hi-IN'
              ? `${noDataEntry.commodity} के लिए सरकारी डेटा उपलब्ध नहीं है`
              : `Government data not available for ${noDataEntry.commodity}`;

            await safeSpeak(errorText);
            console.log(`Announced no data: ${errorText}`);
          } else {
            const cropLower = crop.toLowerCase();

            setMarketData(prevData => {
              const filtered = prevData.filter(item => item.commodity.toLowerCase() !== cropLower);
              const updated = [...filtered, ...marketOptions];
              console.log(`MARKET OPTIONS: ${crop} → ${marketOptions.map(opt => `${opt.market} ₹${opt.price}`).join(' | ')}`);
              return updated;
            });

            if (i === 0) {
              setIsLoading(false);
            }

            const [primary, ...additionalMarkets] = marketOptions;
            const priceText = language === 'hi-IN'
              ? `${primary.commodity} का भाव ${primary.price} रुपये प्रति ${primary.unit} है ${primary.market} में`
              : `${primary.commodity} price is ${primary.price} rupees per ${primary.unit} at ${primary.market}`;

            await safeSpeak(priceText);
            console.log(`Announced: ${priceText}`);

            if (additionalMarkets.length > 0) {
              const summary = additionalMarkets
                .map(option => `${option.market} ₹${option.price}`)
                .join(language === 'hi-IN' ? ', ' : ', ');

              const varietyText = language === 'hi-IN'
                ? `अन्य पास की मंडियां: ${summary}`
                : `Other nearby markets: ${summary}`;

              await safeSpeak(varietyText);
              console.log(`Variety info: ${varietyText}`);
            }
          }

          completedCount++;
          console.log(`Completed processing ${crop} (${completedCount}/${farmerCropTypes.length})`);

          if (i < farmerCropTypes.length - 1) {
            setIsLoadingNextCrop(true);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            setIsLoadingNextCrop(false);
          }
        } catch (innerError) {
          console.error(`Error fetching ${crop}:`, innerError);
          if (i > 0) {
            setIsLoadingNextCrop(false);
          }
          completedCount++;
        }
      }

      setIsLoading(false);
      setIsLoadingNextCrop(false);
      console.log('Loading process completed');
    } catch (error) {
      console.error(`MARKET: Critical error in loadFarmerCrops:`, error);
      setIsLoading(false);
      setIsLoadingNextCrop(false);

      setMarketData([{
        commodity: 'Error Loading Data',
        price: 0,
        unit: '',
        market: 'Please try refreshing the page',
        trend: '=',
        change: 0,
        date: new Date().toLocaleDateString('en-IN'),
        noData: true
      }]);
    }
  };

  const startListening = async () => {
    console.log('startListening function called');
    
    if (isListening || isSearching) {
      console.log('Already listening or searching');
      return;
    }

    setIsListening(true);
    setIsSearching(false);

    await safeSpeak(
      language === 'hi-IN' ? 'कृपया फसल का नाम बोलें' : 'Please say the crop name'
    );

    try {
      // Use Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language;

        recognition.onstart = () => {
          console.log('Voice recognition started');
          setIsListening(true);
        };

        recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          console.log('Voice input received:', transcript);
          
          setIsListening(false);
          setIsSearching(true);
          
          await handleVoiceQuery(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Voice recognition error:', event.error);
          setIsListening(false);
          setIsSearching(false);
        };

        recognition.onend = () => {
          console.log('Voice recognition ended');
          setIsListening(false);
        };

        recognition.start();
      } else {
        console.error('Speech recognition not supported');
        await safeSpeak(
          language === 'hi-IN' 
            ? 'माफ करें, आपका ब्राउज़र वॉयस सर्च को सपोर्ट नहीं करता'
            : 'Sorry, your browser does not support voice search'
        );
        setIsListening(false);
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      setIsListening(false);
    }
  };

  // Handle voice query
  const handleVoiceQuery = async (query: string) => {
    console.log(`Processing voice query: "${query}"`);
    setHasUsedVoiceSearch(true); // Mark that user has used voice search
    
    try {
      // Extract crop name from query
      const cropMappings: { [key: string]: string } = {
        // English
        'tomato': 'tomato', 'tamatar': 'tomato', 'टमाटर': 'tomato',
        'onion': 'onion', 'pyaz': 'onion', 'प्याज': 'onion',
        'potato': 'potato', 'aloo': 'potato', 'आलू': 'potato',
        'wheat': 'wheat', 'gehun': 'wheat', 'गेहूं': 'wheat',
        'rice': 'rice', 'chawal': 'rice', 'चावल': 'rice',
        'carrot': 'carrot', 'gajar': 'carrot', 'गाजर': 'carrot'
      };

      let foundCrop: string | null = null;
      
      // Find crop in query
      for (const [key, value] of Object.entries(cropMappings)) {
        if (query.includes(key)) {
          foundCrop = value;
          break;
        }
      }

      if (foundCrop && userLocation) {
        console.log(`Found crop in voice query: ${foundCrop}`);
        
        // Announce that we're searching
        const searchingText = language === 'hi-IN'
          ? `${foundCrop} के भाव खोज रहा हूं`
          : `Searching for ${foundCrop} prices`;
        await safeSpeak(searchingText);
        
        // Fetch data for the specific crop
        const stateInfo = getStateInfo(userLocation.region);
        const cropData = await marketService.getMarketPrices(stateInfo.state, foundCrop, 10, userLocation.city);

        let marketOptions = prepareMarketEntries(cropData, foundCrop);

        if (marketOptions.length === 0) {
          const fallbackData = await marketService.getFallbackData(stateInfo.state, foundCrop, 3, userLocation.city);
          marketOptions = prepareMarketEntries(fallbackData, foundCrop);
        }

        if (marketOptions.length > 0) {
          const cropLower = foundCrop.toLowerCase();

          setMarketData(prevData => {
            const filtered = prevData.filter(item => item.commodity.toLowerCase() !== cropLower);
            const updated = [...filtered, ...marketOptions];
            console.log(`VOICE SEARCH: ${foundCrop} options -> ${marketOptions.map(opt => `${opt.market} ₹${opt.price}`).join(' | ')}`);
            return updated;
          });

          const [primary, ...additional] = marketOptions;
          const primaryText = language === 'hi-IN'
            ? `${primary.commodity} का भाव ${primary.price} रुपये प्रति ${primary.unit} है ${primary.market} में`
            : `${primary.commodity} price is ${primary.price} rupees per ${primary.unit} at ${primary.market}`;

          await safeSpeak(primaryText);
          console.log(`Spoke result: ${primaryText}`);

          if (additional.length > 0) {
            const summary = additional
              .map(option => `${option.market} ₹${option.price}`)
              .join(language === 'hi-IN' ? ', ' : ', ');

            const moreText = language === 'hi-IN'
              ? `अन्य मंडियां: ${summary}`
              : `Other markets: ${summary}`;

            await safeSpeak(moreText);
          }
        } else {
          const noDataText = language === 'hi-IN'
            ? `${foundCrop} के लिए बाजार डेटा उपलब्ध नहीं है`
            : `Market data not available for ${foundCrop}`;

          await safeSpeak(noDataText);
        }
      } else {
        const notFoundText = language === 'hi-IN'
          ? 'कृपया किसी फसल का नाम बोलें जैसे टमाटर, प्याज, या आलू'
          : 'Please say a crop name like tomato, onion, or potato';
        
        await safeSpeak(notFoundText);
      }
    } catch (error) {
      console.error('Voice query processing error:', error);
      const errorText = language === 'hi-IN'
        ? 'माफ करें, कुछ गलती हुई है'
        : 'Sorry, something went wrong';
      
      await safeSpeak(errorText);
    } finally {
      setIsSearching(false);
    }
  };

  // Speak market summary
  const speakMarketSummary = async () => {
    if (groupedMarketData.length === 0) {
      return;
    }

    const summaryParts = groupedMarketData.map(group => {
      const primary = group.markets[0];
      if (!primary || primary.noData) {
        return language === 'hi-IN'
          ? `${group.commodity} का डेटा उपलब्ध नहीं`
          : `${group.commodity} data unavailable`;
      }

      return language === 'hi-IN'
        ? `${group.commodity} ${primary.price} रुपये`
        : `${group.commodity} ${primary.price} rupees`;
    });

    const text = language === 'hi-IN'
      ? `आपकी ${groupedMarketData.length} फसलों के भाव: ${summaryParts.join(', ')}`
      : `Your ${groupedMarketData.length} crop prices: ${summaryParts.join(', ')}`;

    console.log('VOICE SUMMARY:', text);
    await safeSpeak(text);
  };

  // Test API function
  const testGovernmentAPIs = async () => {
    setApiStatus('Testing government APIs...\n');
    
    try {
      const testResults = await Promise.allSettled([
        marketService.getMarketPrices('West Bengal', 'wheat', 5),
        marketService.getMarketPrices('', 'tomato', 5),
        marketService.getMarketPrices('Maharashtra', 'onion', 5)
      ]);

      let status = 'API Test Results:\n\n';
      
      testResults.forEach((result, index) => {
        const apiNames = ['AGMARKNET (Wheat)', 'General (Tomato)', 'Maharashtra (Onion)'];
        if (result.status === 'fulfilled') {
          status += `${apiNames[index]}: ${result.value.length} records\n`;
        } else {
          status += `${apiNames[index]}: Failed - ${result.reason}\n`;
        }
      });

      setApiStatus(status);
    } catch (error) {
      setApiStatus(`Error testing APIs: ${error}`);
    }
  };

  // Effects
  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      console.log('LOCATION: User location set, starting to load farmer crops');
      loadFarmerCrops();
    }
  }, [userLocation]);

  useEffect(() => {
    if (userLocation && profile?.cropType) {
      console.log('PROFILE: Crop type changed, reloading data');
      loadFarmerCrops();
    }
  }, [profile?.cropType]);

  // Individual crop announcements happen in the loading function now
  // No more bulk voice sequences

  // DEBUG: Log state before render
  console.log(`RENDER: isLoadingNextCrop=${isLoadingNextCrop}, groups=${groupedMarketData.length}, commodities=`, groupedMarketData.map(group => group.commodity));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="lg"
                className="p-2"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 rounded-xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{currentMessages.title}</h1>
                <p className="text-sm text-gray-600">{userLocation?.city || 'Loading location...'}, {userLocation?.region || ''}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={startListening}
                disabled={isListening || isSearching}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Voice Search
                  </>
                )}
              </Button>
              
              <Button
                onClick={speakMarketSummary}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Volume2 className="h-4 w-4" />
                Listen to Prices
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 pb-24">
        {/* Market Summary Card - Only show when data is loaded */}
        {!isLoading && groupedMarketData.length > 0 && (
          <Card className="mb-8 shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Your Crop Prices</h2>
                  <p className="text-green-100 text-lg">
                    {profile?.cropType || 'wheat, onion'}
                  </p>
                  <p className="text-green-200 text-sm mt-1">
                    Government prices from {userLocation?.city || 'your area'}, {userLocation?.region || ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{groupedMarketData.length}</div>
                  <div className="text-green-100">
                    {groupedMarketData.length === 1 ? 'Crop' : 'Crops'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        {/* Market Price Cards */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-green-500 mx-auto mb-6"></div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Loading Market Prices...</h3>
            <p className="text-gray-600 mb-4 text-lg">
              Fetching government data for your crops in <strong>{userLocation?.region || 'your area'}</strong>
            </p>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="animate-pulse h-3 w-3 bg-green-500 rounded-full"></div>
                <div className="animate-pulse h-3 w-3 bg-green-500 rounded-full" style={{animationDelay: '0.2s'}}></div>
                <div className="animate-pulse h-3 w-3 bg-green-500 rounded-full" style={{animationDelay: '0.4s'}}></div>
              </div>
              <p className="text-sm text-green-700 font-medium">
                Getting real-time prices from AGMARKNET and government databases...
              </p>
            </div>

            <p className="text-xs text-gray-500">
              Prices will appear as soon as data is available
            </p>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            {groupedMarketData.map(({ commodity, markets }) => {
              const primary = markets[0];
              const locationLabel = userLocation
                ? `${toTitleCase(userLocation.city)}${userLocation.region ? `, ${toTitleCase(userLocation.region)}` : ''}`
                : primary?.market || 'Local Market';
              const hasPrimaryData = primary && !primary.noData;

              return (
                <Card key={commodity} className="shadow-xl border-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl shadow-inner">
                          <TrendingUp className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{commodity}</h3>
                          <p className="text-blue-100 flex items-center gap-2 text-sm md:text-base">
                            <MapPin className="h-4 w-4" />
                            {locationLabel}
                          </p>
                          <p className="text-blue-100/80 text-sm mt-1">
                            {markets.length} nearby market{markets.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        {hasPrimaryData ? (
                          <>
                            <div className="text-4xl font-bold">₹{primary.price.toLocaleString()}</div>
                            <div className="text-blue-100">{currentMessages.per} {primary.unit}</div>
                          </>
                        ) : (
                          <div className="text-lg font-semibold text-yellow-100">
                            {language === 'hi-IN' ? 'डेटा उपलब्ध नहीं' : 'Data unavailable'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 bg-gradient-to-br from-white via-blue-50/40 to-white">
                    <div className="space-y-4">
                      {markets.map((market, idx) => {
                        const trendLabel = market.trend === '+' ? `+${market.change}%` : market.trend === '-' ? `-${market.change}%` : `${market.change}%`;
                        const speakText = market.noData
                          ? (language === 'hi-IN'
                              ? `${market.commodity} के लिए सरकारी डेटा उपलब्ध नहीं है`
                              : `Government data not available for ${market.commodity}`)
                          : (language === 'hi-IN'
                              ? `${market.commodity} का भाव ${market.price} रुपये प्रति ${market.unit} है ${market.market} में`
                              : `${market.commodity} price is ${market.price} rupees per ${market.unit} at ${market.market}`);

                        return (
                          <div
                            key={`${market.market}-${idx}`}
                            className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-blue-100/70 bg-white/70 shadow-sm px-4 py-4"
                          >
                            <div>
                              <p className="font-semibold text-gray-800 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                {market.market}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <span className="inline-flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {market.date}
                                </span>
                                {!market.noData && (
                                  <Badge
                                    variant={market.trend === '+' ? 'default' : market.trend === '-' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {trendLabel}
                                  </Badge>
                                )}
                                {market.noData && (
                                  <Badge variant="secondary" className="text-xs">{language === 'hi-IN' ? 'डेटा नहीं' : 'No data'}</Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className="text-left sm:text-right">
                                <div className={`text-2xl font-bold ${market.noData ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {market.noData ? '--' : `₹${market.price.toLocaleString()}`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {market.noData ? (language === 'hi-IN' ? 'भाव उपलब्ध नहीं' : 'Rate unavailable') : `${currentMessages.per} ${market.unit}`}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => safeSpeak(speakText)}
                                className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                              >
                                <Volume2 className="h-4 w-4 mr-2" />
                                {currentMessages.listen}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Progressive Loading Spinner - Shows between crops */}
            {isLoadingNextCrop && groupedMarketData.length >= 1 && (
              <Card className="shadow-xl border-0 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-amber-500 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-white animate-spin" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold animate-pulse">Loading...</h3>
                        <p className="text-orange-100">Fetching next crop price</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <div className="text-gray-600 font-medium">
                      Getting government market data for your next crop...
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Search Status */}
        {isSearching && (
          <div className="text-center py-4">
            <div className="animate-pulse text-blue-600">
              Searching for crop prices...
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketPrices;