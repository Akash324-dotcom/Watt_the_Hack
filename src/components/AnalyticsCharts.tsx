import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { WeatherData } from '@/services/weatherService';

const categoryData = [
  { name: 'Recycling', value: 35, color: '#00C9A7' },
  { name: 'Water Saving', value: 25, color: '#1A5134' },
  { name: 'Energy Reduction', value: 20, color: '#FFD88D' },
  { name: 'Transport', value: 20, color: '#4ECDC4' },
];

interface AnalyticsChartsProps {
  weatherData: WeatherData | null;
  selectedCity: string;
  onActionsUpdate?: (total: number) => void;
}

// Generate dynamic weekly data based on weather conditions
const generateWeeklyData = (weather: WeatherData | null) => {
  const baseActions = [
    { day: 'Mon', actions: 12 },
    { day: 'Tue', actions: 19 },
    { day: 'Wed', actions: 15 },
    { day: 'Thu', actions: 25 },
    { day: 'Fri', actions: 22 },
    { day: 'Sat', actions: 30 },
    { day: 'Sun', actions: 28 },
  ];

  if (!weather) return baseActions;

  // Calculate weather-based multipliers
  let multiplier = 1;
  
  // Rainy weather → increase water-related actions
  if (weather.precipitation > 5) {
    multiplier += 0.3;
  } else if (weather.precipitation > 10) {
    multiplier += 0.5;
  }
  
  // Hot weather → increase energy-saving actions
  if (weather.temperature > 25) {
    multiplier += 0.2;
  } else if (weather.temperature > 30) {
    multiplier += 0.4;
  }
  
  // Cold weather → increase heating awareness
  if (weather.temperature < 0) {
    multiplier += 0.25;
  }
  
  // Windy weather → increase renewable energy awareness
  if (weather.windSpeed > 30) {
    multiplier += 0.2;
  } else if (weather.windSpeed > 50) {
    multiplier += 0.4;
  }
  
  // High humidity → water conservation
  if (weather.humidity > 80) {
    multiplier += 0.15;
  }

  // Apply multiplier with some randomness for variety
  return baseActions.map(day => ({
    ...day,
    actions: Math.round(day.actions * multiplier * (0.9 + Math.random() * 0.2))
  }));
};

export default function AnalyticsCharts({ weatherData, selectedCity, onActionsUpdate }: AnalyticsChartsProps) {
  const [weeklyData, setWeeklyData] = useState(generateWeeklyData(weatherData));
  const [key, setKey] = useState(0);

  // Update graph when weather data changes
  useEffect(() => {
    const newData = generateWeeklyData(weatherData);
    setWeeklyData(newData);
    setKey(prev => prev + 1); // Force re-render with animation
    
    // Calculate total actions and notify parent
    if (onActionsUpdate) {
      const total = newData.reduce((sum, day) => sum + day.actions, 0);
      onActionsUpdate(total);
    }
  }, [weatherData, onActionsUpdate]);

  // Refresh data every 45 seconds to show real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateWeeklyData(weatherData);
      setWeeklyData(newData);
      setKey(prev => prev + 1);
      
      // Update total actions
      if (onActionsUpdate) {
        const total = newData.reduce((sum, day) => sum + day.actions, 0);
        onActionsUpdate(total);
      }
    }, 45000); // 45 seconds

    return () => clearInterval(interval);
  }, [weatherData, onActionsUpdate]);
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Community Impact Analytics
        </h2>
        <p className="text-muted-foreground">
          {selectedCity ? `Real-time climate actions in ${selectedCity}` : 'Tracking collective climate actions across Canada'}
        </p>
        {weatherData && (
          <p className="text-sm text-aqua mt-2">
            ⚡ Live data • Updates every 45s based on current weather conditions
          </p>
        )}
      </motion.div>

      {/* Weekly Actions Chart */}
      <motion.div
        key={`chart-${key}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-2xl p-6 shadow-card"
      >
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Weekly Climate Actions • {selectedCity}
        </h3>
        {weatherData && (
          <div className="mb-4 text-sm text-muted-foreground space-y-1">
            <p>📊 Activity influenced by:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {weatherData.precipitation > 5 && (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-xs">
                  🌧️ Rain: +Water Actions
                </span>
              )}
              {weatherData.temperature > 25 && (
                <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md text-xs">
                  ☀️ Heat: +Energy Actions
                </span>
              )}
              {weatherData.temperature < 0 && (
                <span className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-md text-xs">
                  ❄️ Cold: +Heating Actions
                </span>
              )}
              {weatherData.windSpeed > 30 && (
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs">
                  💨 Wind: +Renewable Energy
                </span>
              )}
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 201, 167, 0.1)" />
            <XAxis
              dataKey="day"
              stroke="#F7FFF7"
              tick={{ fill: '#F7FFF7' }}
            />
            <YAxis stroke="#F7FFF7" tick={{ fill: '#F7FFF7' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(26, 81, 52, 0.95)',
                border: '1px solid rgba(0, 201, 167, 0.3)',
                borderRadius: '12px',
                color: '#F7FFF7',
              }}
            />
            <Bar
              dataKey="actions"
              fill="url(#colorGradient)"
              radius={[8, 8, 0, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C9A7" stopOpacity={1} />
                <stop offset="100%" stopColor="#1A5134" stopOpacity={0.8} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-2xl p-6 shadow-card"
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Action Categories
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26, 81, 52, 0.95)',
                  border: '1px solid rgba(0, 201, 167, 0.3)',
                  borderRadius: '12px',
                  color: '#F7FFF7',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Climate Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card rounded-2xl p-6 shadow-card"
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Collective Climate Score
          </h3>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5, type: 'spring' }}
                className="text-7xl font-bold bg-gradient-glow bg-clip-text text-transparent mb-4"
              >
                8,450
              </motion.div>
              <p className="text-muted-foreground text-lg">
                Community actions this month
              </p>
              <div className="mt-6 w-full bg-muted rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '84.5%' }}
                  transition={{ duration: 1.5, delay: 0.7 }}
                  className="bg-gradient-nature h-3 rounded-full"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                84.5% towards monthly goal
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
