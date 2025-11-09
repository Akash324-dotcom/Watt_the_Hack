import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import Earth3D from "@/components/Earth3D";
import FloatingParticles from "@/components/FloatingParticles";
import SearchBar from "@/components/SearchBar";
import ContextCard from "@/components/ContextCard";
import GreenPointsBadge from "@/components/GreenPointsBadge";
import ContextBot from "@/components/ContextBot";
import GlobalMap from "@/components/GlobalMap";
import JourneyProgress from "@/components/JourneyProgress";
import CommunityDashboard from "@/components/CommunityDashboard";
import CollectiveGoals from "@/components/CollectiveGoals";
import CommunityCircles from "@/components/CommunityCircles";
import VoiceAssistant from "@/components/VoiceAssistant";
import UserMenu from "@/components/UserMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchWeatherData, getAirQuality, getSentiment, getCommunitySentiment, WeatherData } from "@/services/weatherService";
import {
  Thermometer,
  Wind,
  Heart,
  AlertTriangle,
  MessageSquare,
  Trophy,
  Globe,
  Sparkles,
  ArrowLeft,
  Plus,
  Droplets,
  Users,
  LogIn,
  Target,
} from "lucide-react";

// Helper function to generate dynamic AI suggestions based on weather
const generateSuggestions = (weather: WeatherData | null, city: string): string[] => {
  if (!weather) {
    return [
      "🌍 Select a city to get personalized climate action suggestions!",
      "💚 Every small action contributes to a healthier planet.",
      "✨ Join thousands of climate champions making a difference daily.",
    ];
  }

  const suggestions: string[] = [];
  const { temperature, windSpeed, humidity, precipitation, description, alerts } = weather;

  // Temperature-based suggestions
  if (temperature >= 15 && temperature <= 25 && precipitation < 2) {
    suggestions.push(`☀️ Beautiful weather in ${city}! Perfect for outdoor climate activities like tree planting or community cleanups.`);
  } else if (temperature > 25 && temperature <= 30) {
    suggestions.push(`🌡️ It's warm in ${city} today. Focus on energy-saving actions like using fans instead of AC.`);
  } else if (temperature > 30) {
    suggestions.push(`🔥 Hot day in ${city}! Stay cool and reduce energy use. Consider heat-reducing home improvements.`);
  } else if (temperature < 0) {
    suggestions.push(`❄️ Cold day ahead in ${city}! Focus on home insulation or reducing heating waste.`);
  } else if (temperature >= 0 && temperature < 15) {
    suggestions.push(`🧥 Cool weather in ${city}. Great time for indoor sustainability projects like waste sorting or DIY repairs.`);
  }

  // Precipitation-based suggestions
  if (precipitation > 10) {
    suggestions.push(`🌧️ Heavy rain in ${city} today. Perfect time for indoor activities like planning your climate garden or learning about water conservation.`);
  } else if (precipitation > 5) {
    suggestions.push(`☔ It's rainy in ${city}. Try indoor sustainability activities like waste sorting, composting prep, or DIY eco-crafts.`);
  } else if (precipitation > 0 && precipitation <= 5) {
    suggestions.push(`🌦️ Light rain in ${city}. Great opportunity to set up rainwater harvesting systems!`);
  }

  // Wind-based suggestions
  if (windSpeed > 50) {
    suggestions.push(`🌬️ Strong winds in ${city} — avoid outdoor burning or bike rides. Stay safe indoors and plan your next eco-project.`);
  } else if (windSpeed > 30) {
    suggestions.push(`💨 Windy day in ${city}! A reminder of renewable energy potential. Consider learning about wind power solutions.`);
  } else if (windSpeed < 10 && temperature >= 15 && temperature <= 25) {
    suggestions.push(`🚴 Perfect cycling weather in ${city}! Low wind and comfortable temperature — swap your car for a bike today.`);
  }

  // Humidity-based suggestions
  if (humidity > 80 && temperature > 20) {
    suggestions.push(`💧 High humidity in ${city}. Save water by skipping lawn watering today — nature's got you covered!`);
  }

  // Alert-based suggestions
  if (alerts.length > 0) {
    const hasAirAlert = alerts.some(a => a.type === "air");
    const hasHeatAlert = alerts.some(a => a.type === "heat");
    const hasWindAlert = alerts.some(a => a.type === "wind");
    
    if (hasAirAlert) {
      suggestions.push("💨 Air quality alert active. Sensitive groups should reduce prolonged outdoor exposure. Consider carpooling or remote work today.");
    }
    if (hasHeatAlert) {
      suggestions.push("🌡️ Heat warning in effect. Stay hydrated and reduce energy consumption during peak hours.");
    }
    if (hasWindAlert) {
      suggestions.push("⚠️ Wind advisory active. Secure outdoor items and avoid activities that could cause sparks or fires.");
    }
  }

  // Community engagement suggestion (always include one)
  const communityTips = [
    `💚 Your neighborhood in ${city} has saved energy this week. Log your actions to inspire others!`,
    `🌱 Join other ${city} residents in the community climate challenge. Every action counts!`,
    `⭐ ${city} climate champions are making waves. Add your contribution today!`,
  ];
  suggestions.push(communityTips[Math.floor(Math.random() * communityTips.length)]);

  // Ensure we return 3-4 suggestions
  return suggestions.slice(0, 4);
};

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showMotivation, setShowMotivation] = useState(false);
  const [showActionLog, setShowActionLog] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [userPoints, setUserPoints] = useState(0);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<{ value: string; trend: "up" | "down" | "neutral" }>({
    value: "Good",
    trend: "neutral",
  });
  const [sentiment, setSentiment] = useState<{ value: string; trend: "up" | "down" | "neutral"; description?: string }>({
    value: "Positive",
    trend: "up",
    description: "Awaiting weather data...",
  });
  const [totalWeeklyActions, setTotalWeeklyActions] = useState(151); // Sum of weekly actions
  const [sentimentKey, setSentimentKey] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>(generateSuggestions(null, ""));
  const [suggestionsKey, setSuggestionsKey] = useState(0);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{
    title: string;
    value: string;
    description: string;
    icon: string;
  } | null>(null);
  const { toast } = useToast();

  // Fetch user points from database
  const fetchUserPoints = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_actions')
      .select('points')
      .eq('user_id', userId);

    if (!error && data) {
      const totalPoints = data.reduce((sum, action) => sum + (action.points || 0), 0);
      setUserPoints(totalPoints);
    }
  };

  // Check auth state and set up points listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserPoints(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserPoints(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to real-time updates for user actions
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('user_actions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_actions',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          // Refetch points when actions change
          fetchUserPoints(session.user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const motivationalMessages = [
    "🌟 Every small action counts! You're making a real difference.",
    "💚 Your efforts today will create a better tomorrow for generations to come.",
    "🌍 By taking action, you're part of a global movement for positive change.",
    "✨ Remember: The best time to plant a tree was 20 years ago. The second best time is now!",
    "🌱 Your commitment to sustainability inspires others to follow your lead.",
  ];

  const handleLocationSelect = async (location: string) => {
    setSelectedLocation(location);
    setIsLoadingWeather(true);

    try {
      const data = await fetchWeatherData(location);
      setWeatherData(data);
      setAirQuality(getAirQuality());
      
      // Calculate dynamic sentiment based on weather and actions
      const newSentiment = getCommunitySentiment(data, totalWeeklyActions);
      setSentiment(newSentiment);
      setSentimentKey(prev => prev + 1); // Trigger animation
      
      // Generate dynamic suggestions
      const newSuggestions = generateSuggestions(data, location);
      setSuggestions(newSuggestions);
      setSuggestionsKey(prev => prev + 1);
      
      // Stay on landing page - don't show dashboard
      toast({
        title: `📍 ${location} Selected!`,
        description: "Background updated with live weather data. Sign in to explore your dashboard!",
      });
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch weather data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (selectedLocation && showDashboard) {
      // Refresh weather data every 5 minutes
      const interval = setInterval(async () => {
        try {
          const data = await fetchWeatherData(selectedLocation);
          setWeatherData(data);
          setAirQuality(getAirQuality());
          
          // Update sentiment with current actions data
          const newSentiment = getCommunitySentiment(data, totalWeeklyActions);
          setSentiment(newSentiment);
          setSentimentKey(prev => prev + 1); // Trigger animation
          
          // Update suggestions
          const newSuggestions = generateSuggestions(data, selectedLocation);
          setSuggestions(newSuggestions);
          setSuggestionsKey(prev => prev + 1);
        } catch (error) {
          console.error("Failed to refresh weather data:", error);
        }
      }, 300000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [selectedLocation, showDashboard, totalWeeklyActions]);
  
  // Update sentiment when weekly actions change
  useEffect(() => {
    if (weatherData) {
      const newSentiment = getCommunitySentiment(weatherData, totalWeeklyActions);
      setSentiment(newSentiment);
      setSentimentKey(prev => prev + 1); // Trigger animation
    }
  }, [totalWeeklyActions, weatherData]);

  const handleMotivateMe = () => {
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setShowMotivation(true);
    toast({
      title: "Daily Motivation",
      description: randomMessage,
    });
  };

  const handleLogAction = () => {
    if (!actionTitle.trim()) return;

    const pointsEarned = Math.floor(Math.random() * 30) + 20; // 20-50 points
    setUserPoints((prev) => prev + pointsEarned);

    toast({
      title: "Action Logged! 🎉",
      description: `You earned ${pointsEarned} GreenPoints for: ${actionTitle}`,
    });

    setActionTitle("");
    setActionDescription("");
    setShowActionLog(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" role="main">
      <FloatingParticles />
      
      {/* Voice Assistant for Accessibility */}
      <VoiceAssistant 
        weatherData={weatherData}
        location={selectedLocation}
        userPoints={userPoints}
      />

      <AnimatePresence mode="wait">
        {!showDashboard ? (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4"
          >
            {/* Welcome Message - Top of Page */}
            {session && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 right-4 z-50"
              >
                <UserMenu session={session} />
              </motion.div>
            )}

            {/* Earth Background */}
            <div className="absolute inset-0 z-0">
              <Earth3D />
            </div>

            {/* Floating Climate Data Cards - Creative Background - BELOW CONTENT */}
            {selectedLocation && weatherData && (
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Floating Temperature Card - TOP LEFT CORNER */}
                <motion.div
                  className="absolute top-4 left-4 md:top-8 md:left-8 opacity-50 hover:opacity-100 transition-all cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  animate={{
                    y: [0, -20, 0],
                    rotate: [-5, 5, -5],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.15, opacity: 1, rotate: 0 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => setSelectedCard({
                    title: "Temperature",
                    value: `${weatherData.temperature}°C`,
                    description: `The current temperature in ${selectedLocation} is ${weatherData.temperature}°C. ${weatherData.description}. ${
                      weatherData.temperature > 30 ? "It's quite hot! Stay hydrated and reduce energy consumption during peak hours." :
                      weatherData.temperature < 0 ? "It's freezing! Focus on home insulation and reducing heating waste." :
                      weatherData.temperature < 15 ? "Cool weather - perfect for indoor sustainability projects!" :
                      "Pleasant temperature - great for outdoor climate activities!"
                    }`,
                    icon: "thermometer"
                  })}
                >
                  <div className="glass-card rounded-3xl p-6 w-56 border-4 border-aqua/60 shadow-2xl backdrop-blur-xl hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:border-aqua transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="text-aqua" size={28} />
                      <span className="text-lg font-black text-aqua">Temp</span>
                    </div>
                    <div className="text-5xl font-black text-foreground">{weatherData.temperature}°C</div>
                    <p className="text-xs text-muted-foreground mt-1 capitalize truncate">{weatherData.description}</p>
                  </div>
                </motion.div>

                {/* Precipitation Card - TOP CENTER */}
                <motion.div
                  className="absolute top-4 left-1/2 -translate-x-1/2 md:top-8 opacity-50 hover:opacity-100 transition-all cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  animate={{
                    y: [0, -25, 0],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  whileHover={{ scale: 1.15, opacity: 1, rotate: 0 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => setSelectedCard({
                    title: "Precipitation",
                    value: `${weatherData.precipitation} mm`,
                    description: `Current precipitation in ${selectedLocation} is ${weatherData.precipitation}mm. ${
                      weatherData.precipitation > 10 ? "Heavy rain - perfect time for indoor sustainability projects like waste sorting or planning your climate garden!" :
                      weatherData.precipitation > 5 ? "Moderate rain - great for setting up rainwater harvesting systems!" :
                      weatherData.precipitation > 0 ? "Light rain - nature is watering your garden for you!" :
                      "No rain expected - remember to water your plants efficiently!"
                    }`,
                    icon: "droplets"
                  })}
                >
                  <div className="glass-card rounded-3xl p-6 w-56 border-4 border-cyber/60 shadow-2xl backdrop-blur-xl hover:shadow-[0_0_30px_rgba(138,43,226,0.5)] hover:border-cyber transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="text-cyber" size={28} />
                      <span className="text-lg font-black text-cyber">Rain</span>
                    </div>
                    <div className="text-5xl font-black text-foreground">{weatherData.precipitation}</div>
                    <p className="text-xs text-muted-foreground mt-1">mm</p>
                  </div>
                </motion.div>

                {/* Bouncing Wind Card - TOP RIGHT CORNER */}
                <motion.div
                  className="absolute top-4 right-4 md:top-8 md:right-8 opacity-50 hover:opacity-100 transition-all cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  animate={{
                    y: [0, 30, 0],
                    x: [-8, 8, -8],
                    rotate: [5, -5, 5],
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  whileHover={{ scale: 1.15, opacity: 1, rotate: 0 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => setSelectedCard({
                    title: "Wind Speed",
                    value: `${weatherData.windSpeed} km/h`,
                    description: `Current wind speed in ${selectedLocation} is ${weatherData.windSpeed} km/h. ${
                      weatherData.windSpeed > 50 ? "Very strong winds! Stay indoors and secure outdoor items. Great reminder of wind energy potential." :
                      weatherData.windSpeed > 30 ? "Windy conditions - a good day to learn about renewable wind power!" :
                      weatherData.windSpeed < 10 ? "Calm conditions - perfect for cycling or outdoor activities!" :
                      "Moderate winds - consider sustainable transportation options today."
                    }`,
                    icon: "wind"
                  })}
                >
                  <div className="glass-card rounded-3xl p-6 w-56 border-4 border-neon/60 shadow-2xl backdrop-blur-xl hover:shadow-[0_0_30px_rgba(0,255,170,0.5)] hover:border-neon transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="text-neon" size={28} />
                      <span className="text-lg font-black text-neon">Wind</span>
                    </div>
                    <div className="text-5xl font-black text-foreground">{weatherData.windSpeed}</div>
                    <p className="text-sm text-muted-foreground mt-1">km/h</p>
                  </div>
                </motion.div>

                {/* Wiggling Humidity Card - BOTTOM LEFT CORNER */}
                <motion.div
                  className="absolute bottom-4 left-4 md:bottom-8 md:left-8 opacity-50 hover:opacity-100 transition-all cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  animate={{
                    rotate: [-6, 6, -6],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  whileHover={{ scale: 1.15, opacity: 1, rotate: 0 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => setSelectedCard({
                    title: "Humidity",
                    value: `${weatherData.humidity}%`,
                    description: `The humidity level in ${selectedLocation} is currently ${weatherData.humidity}%. ${
                      weatherData.humidity > 80 ? "Very humid conditions! You can skip watering your garden today - nature's got it covered. Save water!" :
                      weatherData.humidity > 60 ? "High moisture in the air. Great for plants, but consider using dehumidifiers efficiently to save energy." :
                      weatherData.humidity < 30 ? "Dry conditions - conserve water and consider using humidifiers for comfort." :
                      "Comfortable humidity levels - ideal for most outdoor and indoor activities!"
                    }`,
                    icon: "droplets"
                  })}
                >
                  <div className="glass-card rounded-3xl p-6 w-56 border-4 border-electric/60 shadow-2xl backdrop-blur-xl hover:shadow-[0_0_30px_rgba(255,230,0,0.5)] hover:border-electric transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="text-electric" size={28} />
                      <span className="text-lg font-black text-electric">Humidity</span>
                    </div>
                    <div className="text-5xl font-black text-foreground">{weatherData.humidity}%</div>
                    <p className="text-xs text-muted-foreground mt-1">moisture</p>
                  </div>
                </motion.div>

                {/* Air Quality Badge - BOTTOM CENTER */}
                <motion.div
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-8 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  animate={{
                    y: [0, 20, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                  whileHover={{ scale: 1.15, opacity: 1, rotate: 0 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => setSelectedCard({
                    title: "Air Quality",
                    value: airQuality.value,
                    description: `The air quality in ${selectedLocation} is currently ${airQuality.value}. ${
                      airQuality.value === "Good" ? "Perfect time for outdoor activities and exercise! Enjoy the fresh air." :
                      airQuality.value === "Moderate" ? "Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion." :
                      "Air quality is poor. Reduce prolonged outdoor exposure and consider carpooling or remote work today."
                    }`,
                    icon: "sparkles"
                  })}
                >
                  <div className="glass-card rounded-3xl p-6 w-56 border-4 border-circuit/60 shadow-2xl backdrop-blur-xl hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:border-circuit transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="text-circuit" size={28} />
                      <span className="text-lg font-black text-circuit">Air</span>
                    </div>
                    <div className="text-4xl font-black text-foreground">{airQuality.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">quality</p>
                  </div>
                </motion.div>

                {/* Sentiment Heart - BOTTOM RIGHT CORNER */}
                <motion.div
                  className="absolute bottom-4 right-4 md:bottom-8 md:right-8 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, -8, 8, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  whileHover={{ scale: 1.15, opacity: 1, rotate: 0 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => setSelectedCard({
                    title: "Community Sentiment",
                    value: sentiment.value,
                    description: `The community vibe in ${selectedLocation} is ${sentiment.value.toLowerCase()}! ${sentiment.description} The community has completed ${totalWeeklyActions} climate actions this week, contributing to a healthier planet. Your participation matters - every action counts toward our collective goal!`,
                    icon: "heart"
                  })}
                >
                  <div className="glass-card rounded-3xl p-6 w-64 border-4 border-pink-500/60 shadow-2xl backdrop-blur-xl hover:shadow-[0_0_30px_rgba(255,105,180,0.5)] hover:border-pink-500 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="text-pink-500" size={28} />
                      <span className="text-lg font-black text-pink-500">Vibe</span>
                    </div>
                    <div className="text-4xl font-black text-foreground">{sentiment.value}</div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{sentiment.description}</p>
                  </div>
                </motion.div>

                {/* Spinning Alert Badge - FAR LEFT MIDDLE */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 left-4 md:left-12 opacity-60 hover:opacity-100 transition-all cursor-pointer hidden lg:block"
                  style={{ pointerEvents: 'auto' }}
                  animate={{
                    rotate: 360,
                    scale: [1, 1.15, 1],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  whileHover={{ scale: 1.2, opacity: 1 }}
                  whileTap={{ scale: 1.15 }}
                  onClick={() => setSelectedCard({
                    title: "Weather Alerts",
                    value: `${weatherData.alerts.length} Active`,
                    description: weatherData.alerts.length > 0 
                      ? `There are ${weatherData.alerts.length} active weather alert(s) in ${selectedLocation}: ${weatherData.alerts.map(a => a.message).join('; ')}. Stay safe and adjust your climate activities accordingly.`
                      : `Great news! There are no active weather alerts in ${selectedLocation}. It's a perfect time for outdoor climate actions like tree planting, community cleanups, or cycling instead of driving!`,
                    icon: "alert"
                  })}
                >
                  <div className="glass-card rounded-full p-8 w-32 h-32 border-4 border-amber/60 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl hover:shadow-[0_0_30px_rgba(255,191,0,0.5)] hover:border-amber transition-all">
                    <AlertTriangle className="text-amber mb-1" size={36} />
                    <span className="text-4xl font-black text-foreground">{weatherData.alerts.length}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">alerts</span>
                  </div>
                </motion.div>

                {/* Floating Suggestions - SIDE EDGES ONLY */}
                <motion.div
                  className="absolute top-1/3 left-4 md:left-8 opacity-40 hover:opacity-70 transition-opacity max-w-xs hidden xl:block"
                  animate={{
                    y: [0, -15, 0],
                    rotate: [-2, 2, -2],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="glass-card rounded-2xl p-4 border-2 border-aqua/40 shadow-xl backdrop-blur-xl">
                    <p className="text-sm text-foreground font-medium leading-relaxed">{suggestions[0]?.slice(0, 80)}...</p>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute top-2/3 right-4 md:right-8 opacity-40 hover:opacity-70 transition-opacity max-w-xs hidden xl:block"
                  animate={{
                    y: [0, -15, 0],
                    rotate: [2, -2, 2],
                  }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                >
                  <div className="glass-card rounded-2xl p-4 border-2 border-neon/40 shadow-xl backdrop-blur-xl">
                    <p className="text-sm text-foreground font-medium leading-relaxed">{suggestions[1]?.slice(0, 80)}...</p>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Futuristic Grid Overlay */}
            <div className="absolute inset-0 z-10 opacity-20 pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(29, 215, 91, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(29, 215, 91, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }} />
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 z-10 scanlines pointer-events-none" />

            {/* Content - HIGHER Z-INDEX */}
            <div className="relative z-20 w-full max-w-6xl mx-auto text-center px-4">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                {/* Futuristic Title with Neon Glow */}
                <motion.div
                  className="relative mb-8"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                >
                  <motion.h1
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 relative whitespace-nowrap"
                    style={{
                      textShadow: `
                        0 0 20px rgba(29, 215, 91, 0.8),
                        0 0 40px rgba(29, 215, 91, 0.6),
                        0 0 60px rgba(29, 215, 91, 0.4),
                        0 0 80px rgba(0, 191, 255, 0.3)
                      `
                    }}
                    animate={{
                      textShadow: [
                        '0 0 20px rgba(29, 215, 91, 0.8), 0 0 40px rgba(29, 215, 91, 0.6)',
                        '0 0 30px rgba(255, 230, 0, 0.8), 0 0 50px rgba(29, 215, 91, 0.6)',
                        '0 0 20px rgba(29, 215, 91, 0.8), 0 0 40px rgba(29, 215, 91, 0.6)',
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    whileHover={{
                      scale: 1.05,
                      transition: { duration: 0.3 },
                    }}
                  >
                    <span className="bg-gradient-to-r from-electric via-neon to-cyber bg-clip-text text-transparent">
                      ⚡ WATT THE HACK ⚡
                    </span>
                  </motion.h1>
                  
                  {/* Holographic underline */}
                  <motion.div
                    className="h-1 mx-auto rounded-full"
                    style={{
                      width: '60%',
                      background: 'linear-gradient(90deg, transparent, #1DD75B, #FFE600, #00BFFF, transparent)',
                      boxShadow: '0 0 20px rgba(29, 215, 91, 0.8)'
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      boxShadow: [
                        '0 0 20px rgba(29, 215, 91, 0.8)',
                        '0 0 40px rgba(255, 230, 0, 0.8)',
                        '0 0 20px rgba(29, 215, 91, 0.8)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>

                {/* Cyberpunk Subtitle */}
                <motion.div
                  className="relative inline-block mb-6"
                  animate={{ 
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-electric/20 via-neon/20 to-cyber/20 blur-xl" />
                  <p className="relative text-base md:text-lg font-bold px-6 py-2 border-2 border-electric/40 rounded-lg bg-background/30 backdrop-blur-sm"
                     style={{
                       boxShadow: '0 0 20px rgba(29, 215, 91, 0.3), inset 0 0 20px rgba(29, 215, 91, 0.1)'
                     }}>
                    <span className="text-neon">💡 HACK THE WATTS</span>
                    <span className="text-electric mx-2">•</span>
                    <span className="text-cyber">SAVE THE PLANET</span>
                    <span className="text-electric mx-2">•</span>
                    <span className="text-foreground">🌍</span>
                  </p>
                </motion.div>

                {/* Animated Icons with Enhanced Effects */}
                <motion.div 
                  className="flex gap-4 justify-center text-3xl mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    className="relative"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    whileHover={{ scale: 1.3 }}
                  >
                    <div className="absolute inset-0 bg-electric/30 blur-xl rounded-full animate-pulse" />
                    <span className="relative">🔋</span>
                  </motion.div>
                  <motion.div
                    className="relative"
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    whileHover={{ scale: 1.3 }}
                  >
                    <div className="absolute inset-0 bg-neon/30 blur-xl rounded-full animate-pulse" />
                    <span className="relative">♻️</span>
                  </motion.div>
                  <motion.div
                    className="relative"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    whileHover={{ scale: 1.4 }}
                  >
                    <div className="absolute inset-0 bg-cyber/30 blur-xl rounded-full animate-pulse" />
                    <span className="relative">🌱</span>
                  </motion.div>
                  <motion.div
                    className="relative"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    whileHover={{ scale: 1.3 }}
                  >
                    <div className="absolute inset-0 bg-electric/30 blur-xl rounded-full animate-pulse" />
                    <span className="relative">⚡</span>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Enhanced Search Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6 scale-90"
              >
                <SearchBar onSelect={handleLocationSelect} />
              </motion.div>

              {/* Futuristic CTA Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 flex justify-center"
              >
                {session ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => setShowDashboard(true)} 
                      size="lg"
                      className="relative overflow-hidden bg-gradient-to-r from-electric via-neon to-cyber text-background font-bold text-base px-6 py-4 rounded-xl border-2 border-electric/50 shadow-[0_0_30px_rgba(29,215,91,0.5)] hover:shadow-[0_0_50px_rgba(29,215,91,0.8)] transition-all group"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Users size={20} />
                        ENTER DASHBOARD
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-neon via-cyber to-electric opacity-0 group-hover:opacity-100 transition-opacity"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => navigate('/auth')} 
                      size="lg"
                      className="relative overflow-hidden bg-gradient-to-r from-electric via-neon to-cyber text-background font-bold text-base px-8 py-4 rounded-xl border-2 border-electric/50 shadow-[0_0_30px_rgba(29,215,91,0.5)] hover:shadow-[0_0_50px_rgba(29,215,91,0.8)] transition-all group"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <LogIn size={20} />
                        SIGN IN
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-neon via-cyber to-electric opacity-0 group-hover:opacity-100 transition-opacity"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              {/* Enhanced Footer Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-12"
              >
                <div className="inline-block relative">
                  <div className="absolute inset-0 bg-electric/10 blur-xl" />
                  <p className="relative text-sm text-muted-foreground px-6 py-3 border border-electric/30 rounded-full bg-background/40 backdrop-blur-sm"
                     style={{
                       boxShadow: '0 0 15px rgba(29, 215, 91, 0.2), inset 0 0 15px rgba(29, 215, 91, 0.05)'
                     }}>
                    <span className="text-electric">⚡</span> Powered by Cognizant's "No AI Without Context" Philosophy <span className="text-electric">⚡</span>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 min-h-screen"
          >
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border/50 px-6 py-4" role="banner">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowDashboard(false)} 
                    className="mr-2 hover:animate-wiggle"
                    aria-label="Return to home page"
                  >
                    <ArrowLeft size={20} />
                  </Button>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="text-electric animate-spark" size={32} aria-hidden="true" />
                  </motion.div>
                  <h1 className="text-2xl font-bold bg-gradient-glow bg-clip-text text-transparent font-orbitron animate-hologram">
                    ⚡ Watt the Hack 🌍
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground hidden md:block" aria-label={`Current location: ${selectedLocation}`}>
                    {selectedLocation}
                  </span>
                  <Button 
                    onClick={() => navigate('/community')} 
                    variant="outline"
                    className="border-electric/30 hover:bg-electric/10"
                  >
                    <Users size={16} className="mr-2" />
                    Community
                  </Button>
                  {session ? (
                    <>
                      <GreenPointsBadge points={userPoints} level="Climate Hero" />
                      <UserMenu session={session} />
                    </>
                  ) : (
                    <Button 
                      onClick={() => navigate('/auth')} 
                      variant="outline"
                      className="border-neon/30 hover:bg-neon/10"
                    >
                      <LogIn size={16} className="mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </header>

            {/* Main Dashboard */}
            <main className="max-w-7xl mx-auto px-6 py-8">
              <Tabs defaultValue="chatbot" className="w-full">
                <TabsList className="glass-card mb-8 p-2 grid grid-cols-3 w-full max-w-2xl mx-auto" role="tablist" aria-label="Dashboard sections">
                  <TabsTrigger value="chatbot" className="data-[state=active]:bg-primary/20" aria-label="Chat with AI assistant">
                    <MessageSquare className="mr-2" size={18} aria-hidden="true" />
                    ContextBot
                  </TabsTrigger>
                  <TabsTrigger value="gamification" className="data-[state=active]:bg-primary/20" aria-label="Your climate action journey">
                    <Trophy className="mr-2" size={18} aria-hidden="true" />
                    Journey
                  </TabsTrigger>
                  <TabsTrigger value="global" className="data-[state=active]:bg-primary/20" aria-label="Global climate map">
                    <Globe className="mr-2" size={18} aria-hidden="true" />
                    Global Lens
                  </TabsTrigger>
                </TabsList>

                {/* ChatBot Tab */}
                <TabsContent value="chatbot" className="h-[600px]">
                  <div className="glass-card rounded-2xl shadow-elevated h-full">
                    <ContextBot />
                  </div>
                </TabsContent>

                {/* Journey Tab - Individual Progress */}
                <TabsContent value="gamification" className="space-y-8">
                  {/* Individual Progress */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <JourneyProgress 
                      points={userPoints} 
                      onLogAction={() => setShowActionLog(true)}
                      selectedCity={selectedLocation}
                    />
                  </motion.div>
                </TabsContent>

                {/* Global Lens Tab */}
                <TabsContent value="global">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="glass-card rounded-2xl p-8 shadow-card">
                      <h2 className="text-3xl font-bold text-foreground mb-4">Global Context Lens</h2>
                      <p className="text-muted-foreground mb-6">
                        Explore climate action hotspots worldwide. Click markers to see local sustainability
                        achievements.
                      </p>
                      <div className="h-[600px] rounded-xl overflow-hidden">
                        <GlobalMap apiKey="AIzaSyDT8pg-mXO9N8EObZo9x98mxbeu2_IGdRo" />
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Motivation Dialog */}
      <Dialog open={showMotivation} onOpenChange={setShowMotivation}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-glow bg-clip-text text-transparent">
              Daily Motivation ✨
            </DialogTitle>
          </DialogHeader>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-6">
            <p className="text-lg text-foreground text-center leading-relaxed">
              {motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}
            </p>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Climate Card Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="glass-card border-2 border-primary/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl bg-gradient-glow bg-clip-text text-transparent flex items-center gap-3">
              {selectedCard?.icon === "thermometer" && <Thermometer className="text-aqua" size={32} />}
              {selectedCard?.icon === "wind" && <Wind className="text-neon" size={32} />}
              {selectedCard?.icon === "droplets" && <Droplets className="text-electric" size={32} />}
              {selectedCard?.icon === "heart" && <Heart className="text-pink-500" size={32} />}
              {selectedCard?.icon === "alert" && <AlertTriangle className="text-amber" size={32} />}
              {selectedCard?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Climate data insights for {selectedLocation}
            </DialogDescription>
          </DialogHeader>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="py-6 space-y-6"
          >
            <div className="text-center">
              <motion.div 
                className="text-7xl font-black bg-gradient-glow bg-clip-text text-transparent mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {selectedCard?.value}
              </motion.div>
              <p className="text-lg text-foreground leading-relaxed">
                {selectedCard?.description}
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setSelectedCard(null)}
                className="bg-gradient-glow hover:shadow-elevated"
              >
                Got it! 🌱
              </Button>
              <Button
                onClick={() => {
                  setSelectedCard(null);
                  if (session) {
                    setShowDashboard(true);
                  } else {
                    navigate('/auth');
                  }
                }}
                variant="outline"
                className="border-neon/30 hover:bg-neon/10"
              >
                {session ? "View Dashboard" : "Sign In to Track"}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Log Action Dialog */}
      <Dialog open={showActionLog} onOpenChange={setShowActionLog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-glow bg-clip-text text-transparent">
              Log Your Climate Action 🌱
            </DialogTitle>
            <DialogDescription>Track your sustainability efforts and earn GreenPoints!</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">What did you do?</label>
              <Input
                placeholder="e.g., Recycled 5kg of paper"
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                className="glass"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Details (optional)</label>
              <Textarea
                placeholder="Add more details about your action..."
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                className="glass resize-none"
                rows={3}
              />
            </div>
            <Button
              onClick={handleLogAction}
              className="w-full bg-gradient-nature hover:shadow-elevated transition-spring"
              disabled={!actionTitle.trim()}
            >
              Log Action & Earn Points
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
