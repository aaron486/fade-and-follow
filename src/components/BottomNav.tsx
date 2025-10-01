import { MessageSquare, User, Newspaper, Users, TrendingUp } from 'lucide-react';

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const BottomNav = ({ activeView, onViewChange }: BottomNavProps) => {
  const navItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'feed', icon: Newspaper, label: 'Feed' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'groups', icon: Users, label: 'Groups' },
    { id: 'stats', icon: TrendingUp, label: 'Stats' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40">
      <div className="h-full flex items-center justify-around max-w-2xl mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
