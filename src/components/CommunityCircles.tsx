import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Trophy, TrendingUp, Plus, School, Building2, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { z } from 'zod';

const createCircleSchema = z.object({
  name: z.string().trim().min(1, 'Circle name is required').max(100, 'Name must be less than 100 characters'),
  location: z.string().trim().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
  type: z.enum(['university', 'neighborhood', 'workplace'], { required_error: 'Please select a circle type' }),
});

interface Circle {
  id: string;
  name: string;
  type: 'university' | 'neighborhood' | 'workplace';
  location: string;
  members: number;
  points: number;
  weekly_points: number;
  icon: string;
  description: string;
  badges: Array<{ badge_name: string; badge_emoji: string }>;
  isJoined?: boolean;
}

interface CommunityCirclesProps {
  selectedCity: string;
  onSelectCircle?: (circleId: string) => void;
  session?: Session | null;
}

export default function CommunityCircles({ selectedCity, onSelectCircle, session }: CommunityCirclesProps) {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: selectedCity || '',
    description: '',
    type: '' as 'university' | 'neighborhood' | 'workplace' | '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCircles();

    const channel = supabase
      .channel('circles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circles',
        },
        () => {
          fetchCircles();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circle_members',
        },
        () => {
          fetchCircles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchCircles = async () => {
    try {
      const { data: circlesData, error: circlesError } = await supabase
        .from('circles')
        .select('*')
        .order('points', { ascending: false });

      if (circlesError) throw circlesError;

      const circlesWithDetails = await Promise.all(
        (circlesData || []).map(async (circle) => {
          const { data: members } = await supabase
            .from('circle_members')
            .select('user_id')
            .eq('circle_id', circle.id);

          const { data: achievements } = await supabase
            .from('circle_achievements')
            .select('badge_name, badge_emoji')
            .eq('circle_id', circle.id);

          const isJoined = session
            ? members?.some((m) => m.user_id === session.user.id)
            : false;

          return {
            ...circle,
            type: circle.type as 'university' | 'neighborhood' | 'workplace',
            members: members?.length || 0,
            badges: achievements || [],
            isJoined,
          };
        })
      );

      setCircles(circlesWithDetails);
    } catch (error: any) {
      toast.error('Failed to load circles');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCircle = async (circleId: string) => {
    if (!session) {
      toast.error('Please sign in to join circles');
      return;
    }

    try {
      const circle = circles.find((c) => c.id === circleId);
      
      if (circle?.isJoined) {
        const { error } = await supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circleId)
          .eq('user_id', session.user.id);

        if (error) throw error;
        toast.success('⚡ Left the circle');
      } else {
        const { error } = await supabase
          .from('circle_members')
          .insert({
            circle_id: circleId,
            user_id: session.user.id,
          });

        if (error) throw error;
        toast.success('⚡ Joined the circle!');
        
        if (onSelectCircle) {
          onSelectCircle(circleId);
        }
      }

      fetchCircles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update membership');
    }
  };

  const handleCreateCircle = async () => {
    if (!session) {
      toast.error('Please sign in to create a circle');
      return;
    }

    setFormErrors({});

    try {
      // Validate form data
      const validatedData = createCircleSchema.parse(formData);
      setIsSubmitting(true);

      // Determine icon based on type
      const iconMap = {
        university: 'School',
        neighborhood: 'Home',
        workplace: 'Building2',
      };

      // Insert new circle
      const { data: newCircle, error: circleError } = await supabase
        .from('circles')
        .insert({
          name: validatedData.name,
          location: validatedData.location,
          description: validatedData.description || '',
          type: validatedData.type,
          icon: iconMap[validatedData.type],
          points: 0,
          weekly_points: 0,
        })
        .select()
        .single();

      if (circleError) throw circleError;

      // Auto-join the creator to the circle
      const { error: memberError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: newCircle.id,
          user_id: session.user.id,
        });

      if (memberError) throw memberError;

      toast.success('🎉 Your circle has been created successfully!');
      setShowCreateDialog(false);
      setFormData({
        name: '',
        location: selectedCity || '',
        description: '',
        type: '',
      });
      fetchCircles();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
      } else {
        toast.error(error.message || 'Failed to create circle');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'university':
        return 'hsl(var(--neon))';
      case 'neighborhood':
        return 'hsl(var(--electric))';
      case 'workplace':
        return 'hsl(var(--cyber))';
      default:
        return 'hsl(var(--aqua))';
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'School':
        return School;
      case 'Home':
        return Home;
      case 'Building2':
        return Building2;
      default:
        return Users;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-electric border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading circles... ⚡</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Users className="text-aqua" size={32} />
          Community Circles
        </h2>
        <p className="text-muted-foreground">
          Join local groups and amplify your impact together
        </p>
      </div>

      {/* Circle List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {circles.map((circle, idx) => {
          const Icon = getIconComponent(circle.icon);

          return (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all cursor-pointer"
              onClick={() => navigate(`/circle/${circle.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-full"
                    style={{ backgroundColor: `${getTypeColor(circle.type)}33` }}
                  >
                    <Icon className="text-foreground" size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{circle.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} />
                      {circle.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber">
                    <Trophy size={16} />
                    <span className="text-sm font-semibold">#{idx + 1}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">{circle.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="p-3 glass border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Members</p>
                  <p className="text-lg font-bold text-foreground">{circle.members}</p>
                </Card>
                <Card className="p-3 glass border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Points</p>
                  <p className="text-lg font-bold bg-gradient-glow bg-clip-text text-transparent">
                    {circle.points.toLocaleString()}
                  </p>
                </Card>
                <Card className="p-3 glass border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-lg font-bold text-green">{circle.weekly_points}</p>
                </Card>
              </div>

              {/* Badges */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-muted-foreground">Achievements</p>
                <div className="flex flex-wrap gap-2">
                  {circle.badges.map((badge, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 glass rounded-full border border-border/50 animate-bounce-fun"
                    >
                      {badge.badge_emoji} {badge.badge_name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Join Button */}
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinCircle(circle.id);
                }}
                className={`w-full transition-all ${
                  circle.isJoined
                    ? 'bg-background/50 border border-electric hover:bg-background/70'
                    : 'bg-gradient-nature hover:shadow-elevated'
                }`}
              >
                {circle.isJoined ? '✓ Joined' : 'Join Circle'}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Create New Circle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-8 text-center shadow-card"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-block p-4 bg-primary/20 rounded-full mb-2">
            <Plus className="text-aqua" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Start Your Own Circle</h3>
          <p className="text-muted-foreground">
            Create a sustainability circle for your university, neighborhood, or workplace. Rally your community
            and make a collective impact!
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-nature hover:shadow-elevated transition-all mt-4"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-2" size={20} />
            Create Circle
          </Button>
        </div>
      </motion.div>

      {/* Create Circle Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-card border-2 border-primary/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-glow bg-clip-text text-transparent">
              Create Your Circle
            </DialogTitle>
            <DialogDescription>
              Start a sustainability community and make a collective impact
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Circle Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Circle Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Green Campus Initiative"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground">
                City/Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., Toronto, Ontario"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="glass"
              />
              {formErrors.location && (
                <p className="text-sm text-red-500">{formErrors.location}</p>
              )}
            </div>

            {/* Type (Tags) */}
            <div className="space-y-2">
              <Label className="text-foreground">
                Circle Type <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={formData.type === 'university' ? 'default' : 'outline'}
                  className={`h-auto flex-col gap-2 py-3 ${
                    formData.type === 'university'
                      ? 'bg-gradient-nature border-neon'
                      : 'border-border/50'
                  }`}
                  onClick={() => setFormData({ ...formData, type: 'university' })}
                >
                  <School size={20} />
                  <span className="text-xs">University</span>
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'neighborhood' ? 'default' : 'outline'}
                  className={`h-auto flex-col gap-2 py-3 ${
                    formData.type === 'neighborhood'
                      ? 'bg-gradient-nature border-electric'
                      : 'border-border/50'
                  }`}
                  onClick={() => setFormData({ ...formData, type: 'neighborhood' })}
                >
                  <Home size={20} />
                  <span className="text-xs">Neighborhood</span>
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'workplace' ? 'default' : 'outline'}
                  className={`h-auto flex-col gap-2 py-3 ${
                    formData.type === 'workplace'
                      ? 'bg-gradient-nature border-cyber'
                      : 'border-border/50'
                  }`}
                  onClick={() => setFormData({ ...formData, type: 'workplace' })}
                >
                  <Building2 size={20} />
                  <span className="text-xs">Workplace</span>
                </Button>
              </div>
              {formErrors.type && (
                <p className="text-sm text-red-500">{formErrors.type}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Tell us about your circle's mission and goals..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glass resize-none"
                rows={3}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleCreateCircle}
              disabled={isSubmitting}
              className="w-full bg-gradient-nature hover:shadow-elevated transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Circle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Motivation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6 shadow-card bg-gradient-to-br from-aqua/10 to-primary/10"
      >
        <div className="flex items-start gap-4">
          <div className="bg-primary/20 p-3 rounded-full">
            <TrendingUp className="text-aqua" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground mb-2">🤖 AI Community Insight</h3>
            <p className="text-foreground">
              <span className="font-semibold text-aqua">{selectedCity}</span> is close to hitting its
              monthly recycling target! Join a circle and help push the city over the finish line. 
              Your next action could be the one that makes the difference! 🎯
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
