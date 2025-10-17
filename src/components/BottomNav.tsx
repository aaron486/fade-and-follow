import { User, Newspaper, Trophy, Receipt, Users, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const BottomNav = ({ activeView, onViewChange }: BottomNavProps) => {
  const { user, userProfile } = useAuth();
  const { isAdmin } = useIsAdmin();
  
  const displayName = userProfile?.display_name || userProfile?.username || user?.email?.split('@')[0] || 'User';
  const avatarUrl = userProfile?.avatar_url;

  const navItems = [
    { id: 'feed', icon: Newspaper, label: 'Feed' },
    { id: 'bets', icon: Receipt, label: 'Bets' },
    { id: 'fade', icon: User, label: 'Fade' },
    ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <div className="flex-shrink-0 h-20 bg-black/95 backdrop-blur-lg border-t border-border/50 safe-area-inset-bottom relative">
      {/* Subtle gradient line on top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      
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
                  ? 'text-primary scale-105' 
                  : 'text-muted-foreground active:scale-95 hover:text-foreground'
              }`}
            >
              {item.id === 'fade' ? (
                <Avatar className={`h-6 w-6 transition-all ${isActive ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-black' : ''}`}>
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-accent to-primary text-white font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon className={`h-6 w-6 transition-all ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : ''}`} />
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
