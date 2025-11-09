import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, LogOut, BarChart3, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface UserMenuProps {
  session: Session;
}

export default function UserMenu({ session }: UserMenuProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const userEmail = session.user?.email || '';
  const userName = session.user?.user_metadata?.username || userEmail.split('@')[0];
  const avatarUrl = session.user?.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      toast.success('⚡ See you later, eco-warrior!');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 px-6 py-3 glass-card rounded-full border border-electric/30 shadow-lg backdrop-blur-xl hover:border-electric/50 transition-all h-auto"
        >
          <span className="text-base font-semibold text-foreground">
            🌱 {userName}
          </span>
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="bg-gradient-nature text-background text-sm">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass-card border-electric/30 bg-background/95 backdrop-blur-xl z-[100]" align="center">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">
              🌱 {userName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-electric/20" />
        <DropdownMenuItem
          onClick={() => navigate('/community')}
          className="cursor-pointer hover:bg-electric/10"
        >
          <BarChart3 className="mr-2 h-4 w-4 text-electric" />
          <span>My Impact</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/community')}
          className="cursor-pointer hover:bg-electric/10"
        >
          <Trophy className="mr-2 h-4 w-4 text-neon" />
          <span>Achievements</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.info('Settings coming soon!')}
          className="cursor-pointer hover:bg-electric/10"
        >
          <Settings className="mr-2 h-4 w-4 text-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-electric/20" />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="cursor-pointer hover:bg-destructive/10 text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
