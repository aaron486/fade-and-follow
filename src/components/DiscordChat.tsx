import { useState } from 'react';
import { Hash, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FakeUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
}

interface TeamChannel {
  id: string;
  name: string;
  icon: string;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
}

const fakeUsers: FakeUser[] = [
  { id: '1', name: 'Mike Johnson', username: 'mikej', status: 'online' },
  { id: '2', name: 'Sarah Williams', username: 'sarahw', status: 'online' },
  { id: '3', name: 'Alex Chen', username: 'alexc', status: 'away' },
  { id: '4', name: 'Emma Davis', username: 'emmad', status: 'offline' },
  { id: '5', name: 'Chris Martinez', username: 'chrism', status: 'online' },
];

const groups: Group[] = [
  { id: 'cashdat', name: 'Cash Dat', memberCount: 23 },
  { id: 'fadekings', name: 'FADE KINGS', memberCount: 47 },
];

const teamChannels: TeamChannel[] = [
  { id: 'lakers', name: 'Lakers Nation', icon: '🏀' },
  { id: 'chiefs', name: 'Chiefs Kingdom', icon: '🏈' },
  { id: 'yankees', name: 'Yankees Squad', icon: '⚾' },
];

const fakeDmMessages: Record<string, Message[]> = {
  '1': [
    { id: 'm1', userId: '1', content: 'Hey! Did you see that Lakers game last night?', timestamp: new Date(Date.now() - 3600000) },
    { id: 'm2', userId: 'me', content: 'Yeah! LeBron was on fire 🔥', timestamp: new Date(Date.now() - 3500000) },
    { id: 'm3', userId: '1', content: 'I know right! I won my parlay because of him', timestamp: new Date(Date.now() - 3400000) },
  ],
  '2': [
    { id: 'm4', userId: '2', content: 'What are your picks for tonight?', timestamp: new Date(Date.now() - 7200000) },
  ],
};

const fakeGroupMessages: Record<string, Message[]> = {
  'cashdat': [
    { id: 'g1', userId: '1', content: 'Just hit a 5-leg parlay! 💰💰💰', timestamp: new Date(Date.now() - 900000) },
    { id: 'g2', userId: '5', content: 'Congrats bro! What were your picks?', timestamp: new Date(Date.now() - 800000) },
    { id: 'g3', userId: '2', content: 'I need to get in on this action', timestamp: new Date(Date.now() - 700000) },
  ],
  'fadekings': [
    { id: 'g4', userId: '3', content: 'Public is all over Lakers tonight... you know what that means 👀', timestamp: new Date(Date.now() - 3600000) },
    { id: 'g5', userId: '1', content: 'Fade the public = profit', timestamp: new Date(Date.now() - 3500000) },
  ],
};

const fakeChannelMessages: Record<string, Message[]> = {
  'lakers': [
    { id: 'c1', userId: '1', content: 'Lakers looking good this season!', timestamp: new Date(Date.now() - 1800000) },
    { id: 'c2', userId: '5', content: 'AD is playing like an MVP', timestamp: new Date(Date.now() - 1700000) },
    { id: 'c3', userId: '2', content: 'Anyone going to the game tonight?', timestamp: new Date(Date.now() - 1600000) },
  ],
  'chiefs': [
    { id: 'c4', userId: '3', content: 'Chiefs defense is unstoppable', timestamp: new Date(Date.now() - 5400000) },
  ],
  'yankees': [
    { id: 'c5', userId: '4', content: 'Season starts next week! Hyped!', timestamp: new Date(Date.now() - 10800000) },
  ],
};

export const DiscordChat = () => {
  const [selectedType, setSelectedType] = useState<'dm' | 'channel' | 'group'>('dm');
  const [selectedId, setSelectedId] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');

  const currentMessages = selectedType === 'dm' 
    ? fakeDmMessages[selectedId] || []
    : selectedType === 'group'
    ? fakeGroupMessages[selectedId] || []
    : fakeChannelMessages[selectedId] || [];

  const selectedItem = selectedType === 'dm'
    ? fakeUsers.find(u => u.id === selectedId)
    : selectedType === 'group'
    ? groups.find(g => g.id === selectedId)
    : teamChannels.find(c => c.id === selectedId);

  const getStatusColor = (status: FakeUser['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
    }
  };

  const getUserById = (userId: string) => {
    if (userId === 'me') return { name: 'You', username: 'you' };
    return fakeUsers.find(u => u.id === userId);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // In a real app, this would send the message
    setMessageInput('');
  };

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar */}
      <div className="w-60 flex flex-col border-r bg-card">
        {/* Direct Messages Section */}
        <div className="p-3 border-b">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Direct Messages
          </h3>
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {fakeUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedType('dm');
                    setSelectedId(user.id);
                  }}
                  className={`w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-accent transition-colors ${
                    selectedType === 'dm' && selectedId === user.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${getStatusColor(user.status)}`} />
                  </div>
                  <span className="text-sm font-medium truncate">{user.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Groups Section */}
        <div className="p-3 border-b">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Groups
          </h3>
          <div className="space-y-1">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedType('group');
                  setSelectedId(group.id);
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-accent transition-colors ${
                  selectedType === 'group' && selectedId === group.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate">{group.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{group.memberCount}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Team Channels Section */}
        <div className="p-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Team Channels
          </h3>
          <div className="space-y-1">
            {teamChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setSelectedType('channel');
                  setSelectedId(channel.id);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors ${
                  selectedType === 'channel' && selectedId === channel.id ? 'bg-accent' : ''
                }`}
              >
                <span className="text-lg">{channel.icon}</span>
                <span className="text-sm font-medium truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-12 border-b px-4 flex items-center gap-2 bg-card">
          {selectedType === 'dm' ? (
            <>
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">
                {selectedItem && 'name' in selectedItem ? selectedItem.name : ''}
              </span>
            </>
          ) : selectedType === 'group' ? (
            <>
              <Hash className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">
                {selectedItem && 'name' in selectedItem ? selectedItem.name : ''}
              </span>
              {selectedItem && 'memberCount' in selectedItem && (
                <span className="text-sm text-muted-foreground">
                  {selectedItem.memberCount} members
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-lg">
                {selectedItem && 'icon' in selectedItem ? selectedItem.icon : ''}
              </span>
              <span className="font-semibold">
                {selectedItem && 'name' in selectedItem ? selectedItem.name : ''}
              </span>
            </>
          )}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {currentMessages.map((message) => {
              const sender = getUserById(message.userId);
              return (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {sender?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{sender?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{message.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Input
              placeholder={`Message ${selectedType === 'dm' && selectedItem && 'name' in selectedItem ? selectedItem.name : selectedType === 'channel' && selectedItem && 'name' in selectedItem ? selectedItem.name : ''}`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
