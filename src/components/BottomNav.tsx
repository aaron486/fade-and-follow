import { useState, useEffect } from 'react';
import { User, Newspaper, Trophy, Receipt, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const BottomNav = ({ activeView, onViewChange }: BottomNavProps) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, display_name, username')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setAvatarUrl(data.avatar_url);
        setDisplayName(data.display_name || data.username || user.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const navItems = [
    { id: 'feed', icon: Newspaper, label: 'Feed' },
    { id: 'bets', icon: Receipt, label: 'Bets' },
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex-shrink-0 h-20 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[3rem] min-w-[3.5rem] ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground active:scale-95'
              }`}
            >
              {item.id === 'profile' ? (
                <Avatar className={`h-6 w-6 transition-transform ${isActive ? 'scale-110 border-2 border-primary' : ''}`}>
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon className={`h-6 w-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
              )}
              <span className={`text-xs font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
