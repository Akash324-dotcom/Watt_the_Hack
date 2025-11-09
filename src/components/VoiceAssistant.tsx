import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@11labs/react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface VoiceAssistantProps {
  weatherData?: any;
  location?: string;
  userPoints?: number;
}

const VoiceAssistant = ({ weatherData, location, userPoints }: VoiceAssistantProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [agentId] = useState('agent_7401k9jw4c77erxaqw0chwbd5p58');

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice assistant connected');
      toast({
        title: "Voice Assistant Active",
        description: "You can now speak to get help navigating Watt the Hack",
      });
    },
    onDisconnect: () => {
      console.log('Voice assistant disconnected');
      toast({
        title: "Voice Assistant Stopped",
        description: "Voice assistant has been disconnected",
      });
    },
    onError: (error) => {
      console.error('Voice assistant error:', error);
      toast({
        title: "Connection Error",
        description: 'Voice assistant encountered an error',
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log('Voice message:', message);
    },
  });

  const startConversation = async () => {
    setIsLoading(true);
    try {
      // Request microphone permission with better error handling
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permError) {
        throw new Error('Microphone access denied. Please allow microphone access in your browser settings and try again.');
      }
      
      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-session', {
        body: { agentId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Failed to connect to voice service. Please try again.');
      }
      
      if (!data?.signedUrl) {
        throw new Error('Failed to get session URL from server');
      }

      // Start ElevenLabs conversation
      await conversation.startSession({ 
        signedUrl: data.signedUrl 
      });

    } catch (error) {
      console.error('Error starting voice assistant:', error);
      toast({
        title: "Cannot Start Voice Assistant",
        description: error instanceof Error ? error.message : 'Failed to start voice assistant',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = async () => {
    await conversation.endSession();
  };

  useEffect(() => {
    return () => {
      conversation.endSession();
    };
  }, []);

  return (
    <div 
      className="fixed bottom-8 right-8 z-50"
      role="region"
      aria-label="Voice Assistant"
    >
      <AnimatePresence>
        {conversation.status === 'connected' && conversation.isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-16 right-0 flex items-center gap-2 glass-card px-4 py-2 rounded-full"
          >
            <Volume2 className="text-aqua animate-pulse" size={20} />
            <span className="text-sm text-foreground">Speaking...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {conversation.status !== 'connected' ? (
        <Button
          onClick={startConversation}
          disabled={isLoading}
          size="lg"
          className="rounded-full h-16 w-16 shadow-glow bg-primary hover:bg-primary/90"
          aria-label="Start voice assistant for accessibility help"
        >
          {isLoading ? (
            <div className="animate-spin h-6 w-6 border-2 border-primary-foreground border-t-transparent rounded-full" />
          ) : (
            <Mic size={28} />
          )}
        </Button>
      ) : (
        <Button
          onClick={endConversation}
          size="lg"
          variant="destructive"
          className="rounded-full h-16 w-16 shadow-glow"
          aria-label="Stop voice assistant"
        >
          <MicOff size={28} />
        </Button>
      )}
      
      {conversation.status === 'connected' && (
        <div 
          className="sr-only" 
          role="status" 
          aria-live="polite"
        >
          Voice assistant is active. {conversation.isSpeaking ? 'Assistant is speaking.' : 'Listening for your voice.'}
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
