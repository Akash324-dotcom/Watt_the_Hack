import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, User, TrendingUp, TrendingDown } from 'lucide-react';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface AnalyticsData {
  label: string;
  actions: number;
  previousActions?: number;
}

interface AnalyticsTabProps {
  session: Session | null;
}

export default function AnalyticsTab({ session }: AnalyticsTabProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showComparison, setShowComparison] = useState(true);
  const [individualData, setIndividualData] = useState<AnalyticsData[]>([]);
  const [communityData, setCommunityData] = useState<AnalyticsData[]>([]);
  const [previousIndividualTotal, setPreviousIndividualTotal] = useState(0);
  const [previousCommunityTotal, setPreviousCommunityTotal] = useState(0);

  const getDateRange = (period: TimePeriod, offset: number = 0) => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start = new Date(now);
    
    switch (period) {
      case 'day':
        start.setDate(start.getDate() - offset);
        end.setDate(end.getDate() - offset);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const currentDay = start.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        start.setDate(start.getDate() + mondayOffset - (offset * 7));
        end.setDate(start.getDate() + 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setMonth(start.getMonth() - offset, 1);
        end.setMonth(end.getMonth() - offset + 1, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - offset, 0, 1);
        end.setFullYear(end.getFullYear() - offset, 11, 31);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const getLabels = (period: TimePeriod): string[] => {
    switch (period) {
      case 'day':
        return Array.from({ length: 24 }, (_, i) => `${i}:00`);
      case 'week':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'month':
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      case 'year':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  };

  const loadIndividualData = async () => {
    if (!session?.user?.id) {
      setIndividualData([]);
      setPreviousIndividualTotal(0);
      return;
    }

    const { start, end } = getDateRange(timePeriod, 0);
    const { start: prevStart, end: prevEnd } = getDateRange(timePeriod, 1);
    const labels = getLabels(timePeriod);

    try {
      const { data, error } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      const { data: prevData } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const dataMap = new Map<string, number>();
      const prevDataMap = new Map<string, number>();
      labels.forEach(label => {
        dataMap.set(label, 0);
        prevDataMap.set(label, 0);
      });

      data?.forEach(action => {
        const actionDate = new Date(action.created_at);
        let label = '';

        switch (timePeriod) {
          case 'day':
            label = `${actionDate.getHours()}:00`;
            break;
          case 'week':
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            label = days[actionDate.getDay()];
            break;
          case 'month':
            label = `${actionDate.getDate()}`;
            break;
          case 'year':
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            label = months[actionDate.getMonth()];
            break;
        }

        dataMap.set(label, (dataMap.get(label) || 0) + 1);
      });

      prevData?.forEach(action => {
        const actionDate = new Date(action.created_at);
        let label = '';

        switch (timePeriod) {
          case 'day':
            label = `${actionDate.getHours()}:00`;
            break;
          case 'week':
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            label = days[actionDate.getDay()];
            break;
          case 'month':
            label = `${actionDate.getDate()}`;
            break;
          case 'year':
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            label = months[actionDate.getMonth()];
            break;
        }

        prevDataMap.set(label, (prevDataMap.get(label) || 0) + 1);
      });

      const chartData: AnalyticsData[] = labels.map(label => ({
        label,
        actions: dataMap.get(label) || 0,
        previousActions: prevDataMap.get(label) || 0,
      }));

      setIndividualData(chartData);
      setPreviousIndividualTotal(prevData?.length || 0);
    } catch (error) {
      console.error('Error loading individual data:', error);
      setIndividualData([]);
      setPreviousIndividualTotal(0);
    }
  };

  const loadCommunityData = async () => {
    const { start, end } = getDateRange(timePeriod, 0);
    const { start: prevStart, end: prevEnd } = getDateRange(timePeriod, 1);
    const labels = getLabels(timePeriod);

    try {
      const { data, error } = await supabase
        .from('user_actions')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      const { data: prevData } = await supabase
        .from('user_actions')
        .select('*')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const dataMap = new Map<string, number>();
      const prevDataMap = new Map<string, number>();
      labels.forEach(label => {
        dataMap.set(label, 0);
        prevDataMap.set(label, 0);
      });

      data?.forEach(action => {
        const actionDate = new Date(action.created_at);
        let label = '';

        switch (timePeriod) {
          case 'day':
            label = `${actionDate.getHours()}:00`;
            break;
          case 'week':
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            label = days[actionDate.getDay()];
            break;
          case 'month':
            label = `${actionDate.getDate()}`;
            break;
          case 'year':
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            label = months[actionDate.getMonth()];
            break;
        }

        dataMap.set(label, (dataMap.get(label) || 0) + 1);
      });

      prevData?.forEach(action => {
        const actionDate = new Date(action.created_at);
        let label = '';

        switch (timePeriod) {
          case 'day':
            label = `${actionDate.getHours()}:00`;
            break;
          case 'week':
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            label = days[actionDate.getDay()];
            break;
          case 'month':
            label = `${actionDate.getDate()}`;
            break;
          case 'year':
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            label = months[actionDate.getMonth()];
            break;
        }

        prevDataMap.set(label, (prevDataMap.get(label) || 0) + 1);
      });

      const chartData: AnalyticsData[] = labels.map(label => ({
        label,
        actions: dataMap.get(label) || 0,
        previousActions: prevDataMap.get(label) || 0,
      }));

      setCommunityData(chartData);
      setPreviousCommunityTotal(prevData?.length || 0);
    } catch (error) {
      console.error('Error loading community data:', error);
      setCommunityData([]);
      setPreviousCommunityTotal(0);
    }
  };

  useEffect(() => {
    loadIndividualData();
    loadCommunityData();
  }, [session, timePeriod]);

  const totalIndividual = individualData.reduce((sum, item) => sum + item.actions, 0);
  const totalCommunity = communityData.reduce((sum, item) => sum + item.actions, 0);

  const individualChange = previousIndividualTotal > 0 
    ? ((totalIndividual - previousIndividualTotal) / previousIndividualTotal * 100).toFixed(1)
    : '0';
  const communityChange = previousCommunityTotal > 0
    ? ((totalCommunity - previousCommunityTotal) / previousCommunityTotal * 100).toFixed(1)
    : '0';

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'day': return 'previous day';
      case 'week': return 'previous week';
      case 'month': return 'previous month';
      case 'year': return 'previous year';
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Period Selector & Comparison Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Time Period
            </h2>
            <div className="flex items-center gap-3">
              <Switch
                id="comparison-mode"
                checked={showComparison}
                onCheckedChange={setShowComparison}
              />
              <Label htmlFor="comparison-mode" className="text-sm text-muted-foreground cursor-pointer">
                Compare with {getPeriodLabel()}
              </Label>
            </div>
          </div>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Community Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-aqua/10 rounded-xl">
              <Users className="h-6 w-6 text-aqua" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Community Impact
              </h3>
              <p className="text-sm text-muted-foreground">
                Total actions: {totalCommunity}
              </p>
            </div>
          </div>
          {showComparison && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-aqua/10">
              {parseFloat(communityChange) >= 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-aqua" />
                  <span className="font-semibold text-aqua">+{communityChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <span className="font-semibold text-red-400">{communityChange}%</span>
                </>
              )}
              <span className="text-sm text-muted-foreground">vs {getPeriodLabel()}</span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={communityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 201, 167, 0.1)" />
            <XAxis
              dataKey="label"
              stroke="#F7FFF7"
              tick={{ fill: '#F7FFF7', fontSize: 12 }}
              angle={timePeriod === 'day' || timePeriod === 'month' ? -45 : 0}
              textAnchor={timePeriod === 'day' || timePeriod === 'month' ? 'end' : 'middle'}
              height={timePeriod === 'day' || timePeriod === 'month' ? 80 : 30}
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
            <Legend />
            <Bar
              dataKey="actions"
              fill="url(#communityGradient)"
              radius={[8, 8, 0, 0]}
              name="Current Period"
            />
            {showComparison && (
              <Bar
                dataKey="previousActions"
                fill="url(#communityGradientPrev)"
                radius={[8, 8, 0, 0]}
                name={`Previous ${timePeriod}`}
                opacity={0.5}
              />
            )}
            <defs>
              <linearGradient id="communityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C9A7" stopOpacity={1} />
                <stop offset="100%" stopColor="#1A5134" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="communityGradientPrev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C9A7" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#1A5134" stopOpacity={0.4} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Individual Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-electric/10 rounded-xl">
              <User className="h-6 w-6 text-electric" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Individual Impact
              </h3>
              <p className="text-sm text-muted-foreground">
                {session ? `Total actions: ${totalIndividual}` : 'Sign in to track your impact'}
              </p>
            </div>
          </div>
          {session && showComparison && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-electric/10">
              {parseFloat(individualChange) >= 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-electric" />
                  <span className="font-semibold text-electric">+{individualChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <span className="font-semibold text-red-400">{individualChange}%</span>
                </>
              )}
              <span className="text-sm text-muted-foreground">vs {getPeriodLabel()}</span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={individualData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 213, 0, 0.1)" />
            <XAxis
              dataKey="label"
              stroke="#F7FFF7"
              tick={{ fill: '#F7FFF7', fontSize: 12 }}
              angle={timePeriod === 'day' || timePeriod === 'month' ? -45 : 0}
              textAnchor={timePeriod === 'day' || timePeriod === 'month' ? 'end' : 'middle'}
              height={timePeriod === 'day' || timePeriod === 'month' ? 80 : 30}
            />
            <YAxis stroke="#F7FFF7" tick={{ fill: '#F7FFF7' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(26, 81, 52, 0.95)',
                border: '1px solid rgba(255, 213, 0, 0.3)',
                borderRadius: '12px',
                color: '#F7FFF7',
              }}
            />
            <Legend />
            <Bar
              dataKey="actions"
              fill="url(#individualGradient)"
              radius={[8, 8, 0, 0]}
              name="Current Period"
            />
            {showComparison && (
              <Bar
                dataKey="previousActions"
                fill="url(#individualGradientPrev)"
                radius={[8, 8, 0, 0]}
                name={`Previous ${timePeriod}`}
                opacity={0.5}
              />
            )}
            <defs>
              <linearGradient id="individualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD500" stopOpacity={1} />
                <stop offset="100%" stopColor="#1A5134" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="individualGradientPrev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD500" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#1A5134" stopOpacity={0.4} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
