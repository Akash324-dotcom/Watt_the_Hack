import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Sparkles } from 'lucide-react';

interface IndividualAnalyticsProps {
  session: Session | null;
}

interface ActionData {
  day: string;
  actions: number;
  isToday: boolean;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACTION_TYPES = [
  { name: 'Recycling', color: '#00C9A7' },
  { name: 'Water Saving', color: '#1A5134' },
  { name: 'Energy Reduction', color: '#FFD88D' },
  { name: 'Transport', color: '#4ECDC4' },
];

export default function IndividualAnalytics({ session }: IndividualAnalyticsProps) {
  const [weeklyData, setWeeklyData] = useState<ActionData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [glowDay, setGlowDay] = useState<string | null>(null);

  const getCurrentDay = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
  };

  const loadUserActions = async () => {
    if (!session?.user?.id) return;

    // Get date range for this week (Mon-Sun)
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    try {
      const { data, error } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', monday.toISOString().split('T')[0])
        .lte('date', sunday.toISOString().split('T')[0]);

      if (error) throw error;

      // Process weekly data
      const dayMap = new Map<string, number>();
      const categoryMap = new Map<string, number>();
      const currentDay = getCurrentDay();

      DAYS_OF_WEEK.forEach(day => dayMap.set(day, 0));
      ACTION_TYPES.forEach(type => categoryMap.set(type.name, 0));

      data?.forEach(action => {
        const day = action.day;
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
        categoryMap.set(action.action_type, (categoryMap.get(action.action_type) || 0) + 1);
      });

      const newWeeklyData: ActionData[] = DAYS_OF_WEEK.map(day => ({
        day,
        actions: dayMap.get(day) || 0,
        isToday: day === currentDay,
      }));

      const newCategoryData: CategoryData[] = ACTION_TYPES.map(type => ({
        name: type.name,
        value: categoryMap.get(type.name) || 0,
        color: type.color,
      }));

      setWeeklyData(newWeeklyData);
      setCategoryData(newCategoryData);
    } catch (error) {
      console.error('Error loading user actions:', error);
    }
  };

  useEffect(() => {
    loadUserActions();
  }, [session]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('user-actions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_actions',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('New action logged!', payload);
          // Trigger glow animation
          const newAction = payload.new as any;
          setGlowDay(newAction.day);
          setTimeout(() => setGlowDay(null), 2000);
          
          // Reload data
          loadUserActions();
          setUpdateTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const totalActions = categoryData.reduce((sum, cat) => sum + cat.value, 0);

  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, payload } = props;
    const isGlowing = glowDay === payload.day;
    
    return (
      <g>
        {isGlowing && (
          <motion.rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              filter: [
                'drop-shadow(0 0 0px #00C9A7)',
                'drop-shadow(0 0 20px #00C9A7)',
                'drop-shadow(0 0 0px #00C9A7)',
              ]
            }}
            transition={{ duration: 2 }}
          />
        )}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          opacity={payload.isToday ? 1 : 0.8}
          style={{
            filter: payload.isToday ? 'drop-shadow(0 0 8px #00C9A7)' : 'none',
          }}
        />
      </g>
    );
  };

  if (!session) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-muted-foreground text-lg">
          Sign in to track your personal impact analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        key={updateTrigger}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-3xl font-bold text-foreground">
            Your Personal Impact Analytics
          </h2>
          <AnimatePresence>
            {updateTrigger > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="text-electric animate-spark" size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-muted-foreground">
          Your actions, your impact — see it grow day by day ⚡
        </p>
        <p className="text-sm text-aqua mt-2">
          🔥 Live updates • Total actions: {totalActions}
        </p>
      </motion.div>

      {/* Weekly Actions Chart */}
      <motion.div
        key={`weekly-${updateTrigger}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-2xl p-6 shadow-card"
      >
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Weekly Climate Actions
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Current day highlighted with energy pulse • Updates instantly when you log actions
        </p>
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
              shape={<CustomBar />}
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

      {/* Category Pie Chart */}
      <motion.div
        key={`category-${updateTrigger}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card rounded-2xl p-6 shadow-card"
      >
        <h3 className="text-xl font-semibold text-foreground mb-6">
          Action Categories Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData.filter(cat => cat.value > 0)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => {
                const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                return `${name} ${percent}%`;
              }}
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
        {totalActions === 0 && (
          <p className="text-center text-muted-foreground mt-4">
            Start logging actions to see your impact breakdown!
          </p>
        )}
      </motion.div>
    </div>
  );
}