import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ContextBot() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! ⚡ I'm Watt the Hack, your bright and compassionate AI companion here to support you on your sustainability journey! Whether you're looking for eco-tips, feeling overwhelmed by climate change, or just want to chat — I'm here for you. What's on your mind today? 💚",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [botMood, setBotMood] = useState<'calm' | 'thinking' | 'excited'>('calm');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);
    setBotMood('thinking');

    try {
      // Call Lovable AI through edge function
      const { data, error } = await supabase.functions.invoke('chat-with-watt', {
        body: { 
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to get response from AI');
      }

      if (data?.error) {
        console.error('AI error:', data.error);
        throw new Error(data.error);
      }

      // Simulate typing delay for more natural feel
      await new Promise(resolve => setTimeout(resolve, 800));

      const botMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setBotMood('excited');
      setTimeout(() => setBotMood('calm'), 2000);

      // Auto-play response if enabled
      if (autoPlay) {
        setTimeout(() => playAudio(botMessage.id, data.content), 1000);
      }
    } catch (error) {
      console.error('Error calling chat function:', error);
      toast({
        title: "Connection issue 😔",
        description: error instanceof Error ? error.message : "Couldn't reach Watt right now. Please try again!",
        variant: "destructive",
      });
      setBotMood('calm');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const playAudio = (messageId: number, text: string) => {
    // Stop any currently playing speech
    window.speechSynthesis.cancel();
    
    setPlayingMessageId(messageId);
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices and select a pleasant one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Female') ||
      v.name.includes('Samantha')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Configure speech parameters
    utterance.rate = 1.0;  // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume
    
    // Handle completion
    utterance.onend = () => {
      setPlayingMessageId(null);
    };
    
    // Handle errors
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setPlayingMessageId(null);
      toast({
        title: "Audio Error",
        description: "Couldn't play speech. Your browser may not support this feature.",
        variant: "destructive",
      });
    };
    
    // Speak!
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setPlayingMessageId(null);
  };

  const moodColors = {
    calm: 'from-aqua/40 to-forest/40',
    thinking: 'from-amber/40 to-aqua/40',
    excited: 'from-aqua/60 to-amber/60',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Bot Avatar and Controls */}
      <div className="flex items-center justify-between px-4 py-6">
        <div className="flex-1" />
        
        <motion.div
          animate={{
            scale: botMood === 'thinking' ? [1, 1.1, 1] : 1,
            rotate: botMood === 'excited' ? [0, 5, -5, 0] : 0,
          }}
          transition={{ duration: 0.5, repeat: botMood === 'thinking' ? Infinity : 0 }}
          className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${moodColors[botMood]} shadow-glow flex items-center justify-center`}
        >
          <Sparkles className="text-foreground" size={32} />
          {botMood === 'thinking' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-2 border-t-aqua border-transparent rounded-full"
            />
          )}
        </motion.div>

        {/* Auto-play Toggle */}
        <div className="flex-1 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAutoPlay(!autoPlay)}
            className={`gap-2 transition-all ${
              autoPlay 
                ? 'text-aqua hover:text-aqua/80' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={autoPlay ? "Disable auto-play" : "Enable auto-play"}
          >
            <Volume2 size={16} />
            <span className="text-xs">Auto-play</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'glass-card text-foreground shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-aqua/20'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Audio Controls for Assistant Messages */}
                {message.role === 'assistant' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (playingMessageId === message.id) {
                        stopAudio();
                      } else {
                        playAudio(message.id, message.content);
                      }
                    }}
                    className={`h-8 w-8 rounded-full transition-all ${
                      playingMessageId === message.id 
                        ? 'bg-aqua/20 text-aqua animate-pulse' 
                        : 'hover:bg-aqua/10 text-muted-foreground hover:text-aqua'
                    }`}
                    aria-label={playingMessageId === message.id ? "Stop audio" : "Play audio"}
                  >
                    {playingMessageId === message.id ? (
                      <VolumeX size={16} />
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="glass-card text-foreground shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-aqua/20 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Watt is typing</span>
                <div className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    className="w-1.5 h-1.5 bg-aqua rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-aqua rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-aqua rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 glass-card border-t border-border/50">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask about climate, sustainability, or anything on your mind..."
            disabled={isLoading}
            className="flex-1 bg-input rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-smooth disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-full bg-gradient-glow hover:shadow-elevated transition-spring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
