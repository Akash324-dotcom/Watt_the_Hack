import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, LogOut, Zap, ArrowLeft, BarChart3 } from 'lucide-react';
import CommunityCircles from '@/components/CommunityCircles';
import CircleChat from '@/components/CircleChat';
import AnalyticsTab from '@/components/AnalyticsTab';
import ActionLogger from '@/components/ActionLogger';
import { toast } from 'sonner';

export default function Community() {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('⚡ See you later, eco-warrior!');
    navigate('/');
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="glass-card border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-nature rounded-full flex items-center justify-center animate-electric-pulse">
                <Zap className="text-background" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-orbitron holographic-text">Watt the Hack</h1>
                <p className="text-xs text-muted-foreground">Community Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/')} variant="outline" className="border-electric/30">
                <ArrowLeft size={16} className="mr-2" />
                Back to Home
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="border-electric/30">
                <LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
              <ActionLogger session={session} onActionVerified={() => {
                if (session?.user) {
                  // Refetch points after action is verified
                  supabase
                    .from('user_actions')
                    .select('points')
                    .eq('user_id', session.user.id)
                    .then(({ data }) => {
                      if (data) {
                        const totalPoints = data.reduce((sum, action) => sum + (action.points || 0), 0);
                        // This would need to be passed down if we want to update it here
                        // For now, it will update on page refresh
                      }
                    });
                }
              }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="circles" className="space-y-6">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="circles" className="data-[state=active]:bg-gradient-nature">
              <Users size={16} className="mr-2" />
              Circles
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-gradient-nature">
              <MessageCircle size={16} className="mr-2" />
              Community Chat
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-nature">
              <BarChart3 size={16} className="mr-2" />
              My Impact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="circles" className="space-y-6">
            <CommunityCircles 
              selectedCity="Toronto" 
              onSelectCircle={setSelectedCircleId}
              session={session}
            />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <CircleChat circleId={selectedCircleId} session={session} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab session={session} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}