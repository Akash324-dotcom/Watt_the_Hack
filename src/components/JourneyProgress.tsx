import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, TrendingUp, Droplets, Zap, Leaf } from 'lucide-react';

interface JourneyProgressProps {
  points: number;
  onLogAction: () => void;
  selectedCity: string;
}

interface Level {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  emoji: string;
}

const levels: Level[] = [
  { name: 'Eco Novice', minPoints: 0, maxPoints: 999, color: '#4ECDC4', emoji: '🌱' },
  { name: 'Climate Hero', minPoints: 1000, maxPoints: 2499, color: '#00C9A7', emoji: '⭐' },
  { name: 'Earth Guardian', minPoints: 2500, maxPoints: 9999, color: '#FFD88D', emoji: '🌍' },
];

const motivationalQuotes = [
  "Small steps. Big impact.",
  "Your efforts are making your city greener.",
  "Every action brings us closer to a sustainable future.",
  "You're an inspiration to your community.",
  "Together, we're creating real change.",
];

const impactStats = [
  { icon: Droplets, label: 'Water Saved', value: '500L', sublabel: 'this month' },
  { icon: Zap, label: 'Energy Reduced', value: '15%', sublabel: 'vs last month' },
  { icon: Leaf, label: 'CO₂ Offset', value: '2.3kg', sublabel: 'this week' },
  { icon: TrendingUp, label: 'City Impact', value: '4,200', sublabel: 'collective actions' },
];

export default function JourneyProgress({ points, onLogAction, selectedCity }: JourneyProgressProps) {
  const [currentLevel, setCurrentLevel] = useState<Level>(levels[0]);
  const [progress, setProgress] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [motivation, setMotivation] = useState(motivationalQuotes[0]);

  // Calculate current level and progress
  useEffect(() => {
    const level = levels.find(l => points >= l.minPoints && points <= l.maxPoints) || levels[levels.length - 1];
    const oldLevel = currentLevel;
    
    setCurrentLevel(level);
    const progressInLevel = points - level.minPoints;
    const totalLevelPoints = level.maxPoints - level.minPoints;
    const progressPercent = (progressInLevel / totalLevelPoints) * 100;
    setProgress(Math.min(progressPercent, 100));

    // Trigger level up animation
    if (oldLevel.name !== level.name && points > 0) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    // Update motivation
    setMotivation(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, [points]);

  // Rotate stats carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % impactStats.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nextLevel = levels.find(l => l.minPoints > points);
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - points : 0;

  // Calculate circle progress
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Level Up Celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-9xl"
            >
              {currentLevel.emoji}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute mt-48 glass-card rounded-2xl p-6 shadow-elevated pointer-events-auto"
            >
              <h2 className="text-3xl font-bold bg-gradient-glow bg-clip-text text-transparent text-center">
                🎉 Level Up!
              </h2>
              <p className="text-xl text-foreground text-center mt-2">
                You're now a <span style={{ color: currentLevel.color }} className="font-bold">{currentLevel.name}</span>!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circular Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-8 shadow-card text-center relative overflow-hidden"
      >
        {/* Background particles */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-aqua rounded-full"
              animate={{
                x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                y: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: '50%',
                top: '50%',
              }}
            />
          ))}
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-6 relative z-10">Your Sustainability Journey</h2>

        {/* Circular Progress Arc */}
        <div className="relative flex items-center justify-center mb-6">
          <svg width="280" height="280" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="rgba(0, 201, 167, 0.1)"
              strokeWidth="20"
            />
            {/* Progress circle */}
            <motion.circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(0, 201, 167, 0.6))',
              }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C9A7" />
                <stop offset="100%" stopColor="#FFD88D" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={points}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl mb-2"
            >
              {currentLevel.emoji}
            </motion.div>
            <motion.div
              key={`points-${points}`}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold bg-gradient-glow bg-clip-text text-transparent"
            >
              {points}
            </motion.div>
            <p className="text-sm text-muted-foreground mt-1">GreenPoints</p>
          </div>
        </div>

        {/* Level Info */}
        <motion.div
          key={currentLevel.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 relative z-10"
        >
          <p className="text-2xl font-bold" style={{ color: currentLevel.color }}>
            {currentLevel.name}
          </p>
          <p className="text-muted-foreground italic">"{motivation}"</p>
          {nextLevel && (
            <p className="text-amber font-semibold text-lg">
              🎯 {pointsToNextLevel} points to {nextLevel.name}!
            </p>
          )}
          {!nextLevel && (
            <p className="text-aqua font-semibold text-lg">
              🌟 You've reached the highest level!
            </p>
          )}
        </motion.div>

        {/* Level Indicators */}
        <div className="flex items-center justify-center gap-4 mt-6 relative z-10">
          {levels.map((level, idx) => (
            <div
              key={level.name}
              className={`text-center transition-all ${
                points >= level.minPoints ? 'opacity-100 scale-110' : 'opacity-40 scale-90'
              }`}
            >
              <div className="text-2xl mb-1">{level.emoji}</div>
              <p className="text-xs text-muted-foreground">{level.name}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Impact Stats Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-6 shadow-card"
      >
        <h3 className="text-xl font-semibold text-foreground mb-4 text-center">Your Impact in {selectedCity}</h3>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStatIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-4 p-6 glass rounded-xl"
          >
            {(() => {
              const stat = impactStats[currentStatIndex];
              const Icon = stat.icon;
              return (
                <>
                  <div className="bg-primary/20 p-4 rounded-full">
                    <Icon className="text-aqua" size={32} />
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-center gap-2 mt-4">
          {impactStats.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStatIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStatIndex ? 'bg-aqua w-6' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Achievement Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Recent Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Water Saver', desc: 'Saved 500L this month', icon: '💧', unlocked: points >= 500 },
            { title: 'Recycling Champion', desc: '20 days streak', icon: '♻️', unlocked: points >= 800 },
            { title: 'Energy Reducer', desc: '15% reduction', icon: '⚡', unlocked: points >= 1000 },
          ].map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`glass-card rounded-2xl p-6 text-center shadow-card transition-all ${
                badge.unlocked
                  ? 'hover:shadow-elevated hover:scale-105 cursor-pointer'
                  : 'opacity-40 grayscale'
              }`}
            >
              <motion.div
                animate={badge.unlocked ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-5xl mb-3"
              >
                {badge.icon}
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground">{badge.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{badge.desc}</p>
              {!badge.unlocked && (
                <p className="text-xs text-amber mt-2">🔒 Keep going to unlock!</p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
