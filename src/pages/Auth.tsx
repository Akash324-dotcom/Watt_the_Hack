import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Zap, Sparkles, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('⚡ Welcome back!');
        navigate('/');
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username || email.split('@')[0],
            },
          },
        });
        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              username: username || email.split('@')[0],
            });
          if (profileError) throw profileError;
        }

        toast.success('⚡ Account created! Welcome to Watt the Hack!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-electric/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md p-8 glass-card holographic-card relative z-50">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-muted-foreground hover:text-electric"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-nature rounded-full mb-4 animate-electric-pulse">
            <Zap className="text-background" size={32} />
          </div>
          <h1 className="text-3xl font-bold font-orbitron mb-2 holographic-text">
            Watt the Hack
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-neon" />
            {isLogin ? 'Welcome back, eco-warrior!' : 'Join the sustainability revolution'}
            <Sparkles size={16} className="text-electric" />
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 relative z-10">
          {!isLogin && (
            <div className="relative z-10">
              <label className="text-sm font-medium mb-2 block">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="eco_champion"
                required={!isLogin}
                className="bg-background/50 border-electric/30 focus:border-electric transition-all relative z-10"
                autoComplete="username"
              />
            </div>
          )}
          
          <div className="relative z-10">
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-background/50 border-electric/30 focus:border-electric transition-all relative z-10"
              autoComplete="email"
            />
          </div>

          <div className="relative z-10">
            <label className="text-sm font-medium mb-2 block">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-background/50 border-electric/30 focus:border-electric transition-all relative z-10"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-nature hover:shadow-elevated transition-all"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap size={16} />
                {isLogin ? 'Sign In' : 'Create Account'}
              </span>
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full border-electric/30 hover:bg-electric/10"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading ? 'Connecting...' : 'Sign in with Google'}
        </Button>

        <div className="mt-6 text-center relative z-10">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              // Clear form when switching
              setEmail('');
              setPassword('');
              setUsername('');
            }}
            className="text-sm text-electric hover:text-neon transition-colors font-medium underline decoration-electric/30 hover:decoration-neon cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </Card>
    </div>
  );
}
