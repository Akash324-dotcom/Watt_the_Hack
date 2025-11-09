import { motion } from 'framer-motion';
import { MapPin, TrendingUp, Droplets, Zap, Trophy, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CityStats {
  name: string;
  province: string;
  points: number;
  rank: number;
  energySaved: string;
  waterSaved: string;
  co2Reduced: string;
  activeUsers: number;
  color: string;
}

const mockCityData: CityStats[] = [
  {
    name: 'Toronto',
    province: 'Ontario',
    points: 125400,
    rank: 1,
    energySaved: '45,200 kWh',
    waterSaved: '2.3M L',
    co2Reduced: '18.5 tons',
    activeUsers: 3420,
    color: '#00C9A7',
  },
  {
    name: 'Vancouver',
    province: 'British Columbia',
    points: 118300,
    rank: 2,
    energySaved: '42,800 kWh',
    waterSaved: '2.1M L',
    co2Reduced: '17.2 tons',
    activeUsers: 3180,
    color: '#4ECDC4',
  },
  {
    name: 'Montreal',
    province: 'Quebec',
    points: 112900,
    rank: 3,
    energySaved: '40,500 kWh',
    waterSaved: '1.9M L',
    co2Reduced: '16.8 tons',
    activeUsers: 2940,
    color: '#FFD88D',
  },
  {
    name: 'Calgary',
    province: 'Alberta',
    points: 98700,
    rank: 4,
    energySaved: '35,200 kWh',
    waterSaved: '1.6M L',
    co2Reduced: '14.1 tons',
    activeUsers: 2510,
    color: '#95E1D3',
  },
  {
    name: 'Ottawa',
    province: 'Ontario',
    points: 87500,
    rank: 5,
    energySaved: '31,400 kWh',
    waterSaved: '1.4M L',
    co2Reduced: '12.6 tons',
    activeUsers: 2180,
    color: '#C7CEEA',
  },
];

interface CommunityDashboardProps {
  selectedCity: string;
}

export default function CommunityDashboard({ selectedCity }: CommunityDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Trophy className="text-amber" size={32} />
          Community Leaderboard
        </h2>
        <p className="text-muted-foreground">
          Cities leading the sustainability movement across Canada
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 items-end mb-8">
        {/* 2nd Place */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="glass-card rounded-2xl p-6 shadow-card h-40 flex flex-col justify-end">
            <div className="text-5xl mb-2">🥈</div>
            <h3 className="font-bold text-lg text-foreground">{mockCityData[1].name}</h3>
            <p className="text-sm text-muted-foreground">{mockCityData[1].province}</p>
            <p className="text-2xl font-bold bg-gradient-glow bg-clip-text text-transparent mt-2">
              {mockCityData[1].points.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* 1st Place */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="glass-card rounded-2xl p-6 shadow-elevated h-56 flex flex-col justify-end relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-nature opacity-20"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative z-10">
              <div className="text-6xl mb-2">👑</div>
              <h3 className="font-bold text-xl text-foreground">{mockCityData[0].name}</h3>
              <p className="text-sm text-muted-foreground">{mockCityData[0].province}</p>
              <p className="text-3xl font-bold bg-gradient-glow bg-clip-text text-transparent mt-2">
                {mockCityData[0].points.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3rd Place */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="glass-card rounded-2xl p-6 shadow-card h-32 flex flex-col justify-end">
            <div className="text-4xl mb-2">🥉</div>
            <h3 className="font-bold text-base text-foreground">{mockCityData[2].name}</h3>
            <p className="text-xs text-muted-foreground">{mockCityData[2].province}</p>
            <p className="text-xl font-bold bg-gradient-glow bg-clip-text text-transparent mt-2">
              {mockCityData[2].points.toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rest of Rankings */}
      <div className="space-y-4">
        {mockCityData.slice(3).map((city, idx) => (
          <motion.div
            key={city.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className={`glass-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all cursor-pointer ${
              city.name === selectedCity ? 'ring-2 ring-aqua' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-muted-foreground">#{city.rank}</div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{city.name}</h3>
                  <p className="text-sm text-muted-foreground">{city.province}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold bg-gradient-glow bg-clip-text text-transparent">
                  {city.points.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">GreenPoints</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* City Details (for selected city) */}
      {selectedCity && mockCityData.find(c => c.name === selectedCity) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="glass-card rounded-2xl p-8 shadow-elevated"
        >
          <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="text-aqua" />
            {selectedCity} Impact Dashboard
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 glass border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber/20 p-3 rounded-full">
                  <Zap className="text-amber" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Energy Saved</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockCityData.find(c => c.name === selectedCity)?.energySaved}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-aqua/20 p-3 rounded-full">
                  <Droplets className="text-aqua" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Water Saved</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockCityData.find(c => c.name === selectedCity)?.waterSaved}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green/20 p-3 rounded-full">
                  <TrendingUp className="text-green" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CO₂ Reduced</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockCityData.find(c => c.name === selectedCity)?.co2Reduced}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/20 p-3 rounded-full">
                  <Users className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockCityData.find(c => c.name === selectedCity)?.activeUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
