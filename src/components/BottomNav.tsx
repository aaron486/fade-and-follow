import { User, Newspaper, Trophy, Receipt, Users } from 'lucide-react';

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const BottomNav = ({ activeView, onViewChange }: BottomNavProps) => {
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
              <Icon className={`h-6 w-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
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
