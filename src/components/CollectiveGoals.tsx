import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Droplets, Zap, Leaf, Trophy, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  icon: any;
  deadline: string;
  color: string;
  participants: number;
}

const mockGoals: Goal[] = [
  {
    id: 'water-weekend',
    title: 'Weekend Water Warriors',
    description: 'Save 100,000 liters of water across all cities by Sunday',
    target: 100000,
    current: 67800,
    unit: 'L',
    icon: Droplets,
    deadline: '2 days left',
    color: '#4ECDC4',
    participants: 1240,
  },
  {
    id: 'energy-week',
    title: 'Energy Efficiency Week',
    description: 'Reduce energy consumption by 50,000 kWh this week',
    target: 50000,
    current: 38500,
    unit: 'kWh',
    icon: Zap,
    deadline: '5 days left',
    color: '#FFD88D',
    participants: 980,
  },
  {
    id: 'carbon-month',
    title: 'Carbon Neutral Month',
    description: 'Offset 100 tons of CO₂ through collective climate actions',
    target: 100,
    current: 84,
    unit: 'tons',
    icon: Leaf,
    deadline: '12 days left',
    color: '#00C9A7',
    participants: 2340,
  },
];

export default function CollectiveGoals() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedGoalId, setCompletedGoalId] = useState<string | null>(null);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      mockGoals.forEach(goal => {
        if (goal.current < goal.target && Math.random() > 0.5) {
          const increment = Math.floor(Math.random() * (goal.target * 0.02));
          goal.current = Math.min(goal.current + increment, goal.target);
          
          // Check if goal just completed
          if (goal.current >= goal.target && completedGoalId !== goal.id) {
            setCompletedGoalId(goal.id);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 5000);
          }
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [completedGoalId]);

  return (
    <div className="space-y-6">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 1, repeat: 2 }}
              className="text-9xl"
            >
              🎉
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute mt-48 glass-card rounded-2xl p-8 shadow-elevated pointer-events-auto max-w-md"
            >
              <h2 className="text-3xl font-bold bg-gradient-glow bg-clip-text text-transparent text-center">
                🌍 Goal Achieved!
              </h2>
              <p className="text-xl text-foreground text-center mt-4">
                Together, we made it happen! The community has reached a new milestone.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Target className="text-aqua" size={32} />
          Collective Missions
        </h2>
        <p className="text-muted-foreground">
          Join thousands of climate champions working toward shared goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockGoals.map((goal, idx) => {
          const Icon = goal.icon;
          const progressPercent = (goal.current / goal.target) * 100;
          const isComplete = goal.current >= goal.target;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all ${
                isComplete ? 'ring-2 ring-green' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-3 rounded-full">
                    <Icon className="text-aqua" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{goal.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {goal.deadline}
                    </p>
                  </div>
                </div>
                {isComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 360] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Trophy className="text-amber" size={28} />
                  </motion.div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>

              {/* Progress */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">
                    {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-xs text-muted-foreground text-right">
                  {progressPercent.toFixed(1)}% complete
                </p>
              </div>

              {/* Participants */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-nature border-2 border-background"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    +{goal.participants.toLocaleString()} participants
                  </span>
                </div>
                {isComplete ? (
                  <span className="text-sm font-semibold text-green">✓ Completed</span>
                ) : (
                  <span className="text-sm font-semibold text-amber">In Progress</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add New Goal CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-8 text-center shadow-card"
      >
        <h3 className="text-xl font-bold text-foreground mb-2">Have an idea for a new mission?</h3>
        <p className="text-muted-foreground mb-4">
          Suggest a collective goal and rally your community around it!
        </p>
        <button className="px-6 py-3 bg-gradient-nature text-white font-semibold rounded-lg hover:shadow-elevated transition-all">
          Propose a Mission
        </button>
      </motion.div>
    </div>
  );
}
