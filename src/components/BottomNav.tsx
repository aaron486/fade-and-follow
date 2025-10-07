import { useState, useEffect } from 'react';
import { User, Newspaper, Trophy, Receipt, Users, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const BottomNav = ({ activeView, onViewChange }: BottomNavProps) => {
  const { user, userProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(data || false);
    };
    checkAdmin();
  }, [user]);
  
  const displayName = userProfile?.display_name || userProfile?.username || user?.email?.split('@')[0] || 'User';
  const avatarUrl = userProfile?.avatar_url;

  const navItems = [
    { id: 'feed', icon: Newspaper, label: 'Feed' },
    { id: 'bets', icon: Receipt, label: 'Bets' },
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
    ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin' }] : []),
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
