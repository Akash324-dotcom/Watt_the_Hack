// 🌦️ Weather API service using OpenWeatherMap via edge function

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  description: string;
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  id: number;
  type: string;
  message: string;
  severity: "low" | "moderate" | "high";
}

const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  Toronto: { lat: 43.6532, lon: -79.3832 },
  Halifax: { lat: 44.6488, lon: -63.5752 },
  Vancouver: { lat: 49.2827, lon: -123.1207 },
  Montreal: { lat: 45.5017, lon: -73.5673 },
  Calgary: { lat: 51.0447, lon: -114.0719 },
  Ottawa: { lat: 45.4215, lon: -75.6972 },
};

/**
 * Returns human-readable description from weather code
 */
const getWeatherDescription = (code: number): string => {
  if (code === 800) return "Clear sky";
  if (code >= 801 && code <= 804) return "Cloudy";
  if (code >= 700 && code < 800) return "Foggy";
  if (code >= 500 && code < 600) return "Rainy";
  if (code >= 600 && code < 700) return "Snowy";
  if (code >= 300 && code < 400) return "Drizzle";
  if (code >= 200 && code < 300) return "Thunderstorm";
  return "Unknown";
};

/**
 * Returns air quality category based on AQI-like value
 */
const getAirQualityDescription = (value: number): string => {
  if (value < 50) return "Good";
  if (value < 100) return "Moderate";
  if (value < 150) return "Unhealthy for Sensitive Groups";
  return "Unhealthy";
};

/**
 * Generates context-aware alerts based on live weather readings
 */
const generateWeatherAlerts = (data: {
  temperature: number;
  windSpeed: number;
  precipitation: number;
}): WeatherAlert[] => {
  const alerts: WeatherAlert[] = [];

  if (data.precipitation > 10) {
    alerts.push({
      id: 1,
      type: "rain",
      message:
        "Heavy rainfall expected in the next 24–48 hours. Prepare drainage systems and consider indoor activities.",
      severity: "moderate",
    });
  }

  if (data.windSpeed > 50) {
    alerts.push({
      id: 2,
      type: "wind",
      message: "Strong winds detected. Secure outdoor objects and be cautious when driving.",
      severity: "high",
    });
  }

  if (data.temperature < 0) {
    alerts.push({
      id: 3,
      type: "cold",
      message: "Freezing temperatures detected. Protect pipes and ensure adequate heating.",
      severity: "moderate",
    });
  } else if (data.temperature > 30) {
    alerts.push({
      id: 4,
      type: "heat",
      message: "High temperatures expected. Stay hydrated and limit outdoor activity.",
      severity: "moderate",
    });
  }

  // Randomized air quality alert
  const airQuality = Math.floor(Math.random() * 120);
  if (airQuality > 50) {
    alerts.push({
      id: 5,
      type: "air",
      message: `Air quality is ${getAirQualityDescription(
        airQuality,
      )}. Sensitive groups should reduce prolonged outdoor exposure.`,
      severity: airQuality > 100 ? "high" : "moderate",
    });
  }

  return alerts;
};

/**
 * ✅ Main function: Fetch live weather using OpenWeatherMap API via edge function
 */
export const fetchWeatherData = async (cityName: string): Promise<WeatherData> => {
  const coords = CITY_COORDINATES[cityName];

  if (!coords) throw new Error(`City "${cityName}" not found.`);

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    
    const { data, error } = await supabase.functions.invoke('fetch-weather', {
      body: { lat: coords.lat, lon: coords.lon }
    });

    if (error) throw error;
    if (!data) throw new Error("No data received from weather service");

    const temp = data.main.temp;
    const windKmh = Math.round(data.wind.speed * 3.6);
    const precipitation = data.rain?.["1h"] || data.snow?.["1h"] || 0;

    return {
      temperature: Math.round(temp),
      weatherCode: data.weather[0].id,
      windSpeed: windKmh,
      humidity: data.main.humidity,
      precipitation,
      description: getWeatherDescription(data.weather[0].id),
      alerts: generateWeatherAlerts({
        temperature: temp,
        windSpeed: windKmh,
        precipitation,
      }),
    };
  } catch (error) {
    console.error("❌ Error fetching weather data:", error);
    throw new Error("Failed to fetch weather data.");
  }
};

/**
 * 🔸 Simulated air quality (for dashboard widgets)
 */
export const getAirQuality = (): { value: string; trend: "up" | "down" | "neutral" } => {
  const qualities = ["Good", "Moderate", "Fair"];
  const trends: ("up" | "down" | "neutral")[] = ["up", "down", "neutral"];
  return {
    value: qualities[Math.floor(Math.random() * qualities.length)],
    trend: trends[Math.floor(Math.random() * trends.length)],
  };
};

/**
 * 🔸 Simulated user sentiment / community mood (for analytics page)
 */
export const getSentiment = (): { value: string; trend: "up" | "down" | "neutral" } => {
  const sentiments = ["Positive", "Hopeful", "Engaged", "Motivated"];
  const trends: ("up" | "down" | "neutral")[] = ["up", "down", "neutral"];
  return {
    value: sentiments[Math.floor(Math.random() * sentiments.length)],
    trend: trends[Math.floor(Math.random() * trends.length)],
  };
};

/**
 * 🌟 Dynamic community sentiment based on real-time weather and climate actions
 * Returns sentiment that reflects how weather conditions and community engagement interact
 */
export const getCommunitySentiment = (
  weatherData: WeatherData | null,
  actionsTaken: number
): { value: string; trend: "up" | "down" | "neutral"; description: string } => {
  if (!weatherData) {
    return {
      value: "Neutral",
      trend: "neutral",
      description: "Awaiting weather data...",
    };
  }

  const { temperature, windSpeed, precipitation, alerts, humidity } = weatherData;
  
  // Calculate base engagement level
  const isHighEngagement = actionsTaken > 120; // Average ~20 actions/day
  const isMildWeather = temperature >= 15 && temperature <= 25;
  const isSunny = precipitation < 2 && humidity < 60;
  const hasAlerts = alerts.length > 0;
  const isExtremeWeather = temperature < -5 || temperature > 32 || windSpeed > 50 || precipitation > 15;
  const isStrongWind = windSpeed > 30;
  const isHotWeather = temperature > 25;
  const isRainyWeather = precipitation > 5;
  
  // Determine sentiment based on conditions
  
  // MOTIVATED: Mild/sunny weather + high community actions
  if (isMildWeather && isSunny && isHighEngagement) {
    return {
      value: "Motivated",
      trend: "up",
      description: "Perfect conditions driving strong climate action!",
    };
  }
  
  // HOPEFUL: Improving conditions or moderate engagement
  if ((temperature > 10 && temperature < 28 && precipitation < 5) || (actionsTaken > 80 && actionsTaken <= 120)) {
    return {
      value: "Hopeful",
      trend: "up",
      description: "Community showing positive engagement with favorable conditions.",
    };
  }
  
  // ENGAGED: Active participation driven by weather awareness (alerts, wind, etc.)
  if ((hasAlerts && isHighEngagement) || (isStrongWind && actionsTaken > 90) || (isRainyWeather && actionsTaken > 100)) {
    return {
      value: "Engaged",
      trend: "up",
      description: "Weather conditions sparking increased climate awareness!",
    };
  }
  
  // CONCERNED: Extreme weather but low actions
  if (isExtremeWeather && actionsTaken < 80) {
    return {
      value: "Concerned",
      trend: "down",
      description: "Challenging weather conditions need more community response.",
    };
  }
  
  // ACTIVE: Good engagement despite mixed weather
  if (actionsTaken > 100 && !isExtremeWeather) {
    return {
      value: "Active",
      trend: "up",
      description: "Strong community participation in climate actions.",
    };
  }
  
  // CAUTIOUS: Moderate concerns with moderate engagement
  if ((hasAlerts || isExtremeWeather) && actionsTaken >= 80 && actionsTaken <= 100) {
    return {
      value: "Cautious",
      trend: "neutral",
      description: "Community responding to weather challenges with awareness.",
    };
  }
  
  // Default: Steady state
  return {
    value: "Steady",
    trend: "neutral",
    description: "Community maintaining consistent climate action.",
  };
};
