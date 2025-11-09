import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
  user_id: string;
}

interface CircleChatProps {
  circleId: string | null;
  session: Session;
}

export default function CircleChat({ circleId, session }: CircleChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!circleId) return;

    fetchMessages();

    const channel = supabase
      .channel(`circle_chat_${circleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'circle_messages',
          filter: `circle_id=eq.${circleId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!circleId) return;

    const { data, error } = await supabase
      .from('circle_messages')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      toast.error('Failed to load messages');
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !circleId) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', session.user.id)
        .single();

      const { error } = await supabase.from('circle_messages').insert({
        circle_id: circleId,
        user_id: session.user.id,
        username: profile?.username || 'Anonymous',
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (!circleId) {
    return (
      <Card className="glass-card p-12 text-center">
        <MessageCircle size={64} className="mx-auto mb-4 text-electric/50" />
        <h3 className="text-xl font-bold mb-2">Select a Circle</h3>
        <p className="text-muted-foreground">
          Choose a circle from the Circles tab to start chatting with your community!
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <MessageCircle className="text-electric" size={24} />
        <h2 className="text-xl font-bold font-orbitron">Circle Chat</h2>
      </div>

      {/* Messages */}
      <div className="h-[500px] overflow-y-auto space-y-3 p-4 bg-background/30 rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No messages yet. Start the conversation! ⚡</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 p-3 rounded-lg transition-all ${
                msg.user_id === session.user.id
                  ? 'bg-gradient-nature/20 ml-12'
                  : 'bg-background/50 mr-12'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-electric">
                  {msg.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(msg.created_at), 'HH:mm')}
                </span>
              </div>
              <p className="text-foreground">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message... ⚡"
          disabled={loading}
          className="bg-background/50 border-electric/30 focus:border-electric"
        />
        <Button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className="bg-gradient-nature hover:shadow-elevated"
        >
          <Send size={16} />
        </Button>
      </form>
    </Card>
  );
}
