import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ContextCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

export default function ContextCard({ 
  icon: Icon, 
  title, 
  value, 
  unit, 
  trend = 'neutral',
  delay = 0 
}: ContextCardProps) {
  const trendColors = {
    up: 'text-destructive',
    down: 'text-electric',
    neutral: 'text-neon',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95, rotate: -5 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, delay, type: "spring", bounce: 0.4 }}
      whileHover={{ 
        scale: 1.05, 
        y: -10,
        rotate: [0, 2, -2, 0],
        transition: { duration: 0.3 }
      }}
      className="holographic-card scanlines rounded-2xl p-6 shadow-elevated transition-spring cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div 
          className="p-3 rounded-xl bg-gradient-glow animate-electric-pulse"
          whileHover={{ rotate: [0, 360], transition: { duration: 0.5 } }}
        >
          <Icon className="text-circuit" size={24} />
        </motion.div>
        {trend !== 'neutral' && (
          <motion.div 
            className={`text-2xl font-bold ${trendColors[trend]}`}
            animate={{ y: trend === 'up' ? [-5, 0] : [0, -5] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          >
            {trend === 'up' ? '🔺' : '🔻'}
          </motion.div>
        )}
      </div>
      
      <h3 className="text-muted-foreground text-sm mb-2">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {unit && <span className="ml-2 text-muted-foreground">{unit}</span>}
      </div>
    </motion.div>
  );
}
