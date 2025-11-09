import { motion } from 'framer-motion';
import { Leaf, Sparkles } from 'lucide-react';

interface GreenPointsBadgeProps {
  points: number;
  level: string;
}

export default function GreenPointsBadge({ points, level }: GreenPointsBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, delay: 0.3, type: "spring", bounce: 0.6 }}
      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
      className="holographic-card rounded-2xl p-4 shadow-elevated cursor-pointer"
    >
      <div className="flex items-center space-x-3">
        <motion.div
          animate={{ 
            rotate: [0, 15, -15, 0],
            y: [0, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <div className="p-3 rounded-xl bg-gradient-glow animate-electric-pulse">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Leaf className="text-circuit" size={28} />
            </motion.div>
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1], 
              opacity: [0.8, 1, 0.8],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="text-neon" size={16} />
          </motion.div>
          <motion.div
            className="absolute -bottom-1 -left-1 text-lg"
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              rotate: [0, -180, -360]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            ⚡
          </motion.div>
        </motion.div>
        
        <div>
          <motion.div 
            className="text-2xl font-bold text-electric font-orbitron"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {points} 🌿
          </motion.div>
          <div className="text-xs text-muted-foreground font-poppins">GreenPoints</div>
        </div>
        
        <div className="ml-auto text-right">
          <motion.div 
            className="text-sm font-semibold text-neon font-poppins"
            animate={{ textShadow: ["0 0 5px #FFE600", "0 0 15px #FFE600", "0 0 5px #FFE600"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⭐ {level}
          </motion.div>
          <div className="text-xs text-muted-foreground">Level</div>
        </div>
      </div>
    </motion.div>
  );
}
