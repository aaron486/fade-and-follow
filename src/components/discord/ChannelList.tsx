import React from 'react';
import { Hash, Users, Lock, ChevronDown, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'group' | 'direct';
}

interface ChannelListProps {
  serverName: string;
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
  isAdmin: boolean;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  serverName,
  channels,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  isAdmin
}) => {
  const publicChannels = channels.filter(c => c.type === 'public');
  const groupChannels = channels.filter(c => c.type === 'group');
  const directChannels = channels.filter(c => c.type === 'direct');

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Hash className="w-5 h-5" />;
      case 'group':
        return <Users className="w-5 h-5" />;
      case 'direct':
        return <Hash className="w-5 h-5" />;
      default:
        return <Hash className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col">
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#1e1f22] shadow-sm">
        <h2 className="font-semibold text-white truncate">{serverName}</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#b5bac1] hover:text-white">
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Public Channels */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <div className="flex items-center gap-1">
                <ChevronDown className="w-3 h-3 text-[#80848e]" />
                <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wide">
                  Public Channels
                </span>
              </div>
              {isAdmin && (
                <Button
                  onClick={onCreateChannel}
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 text-[#80848e] hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="space-y-0.5">
              {publicChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel.id)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded group ${
                    selectedChannelId === channel.id
                      ? 'bg-[#404249] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                  }`}
                >
                  {getChannelIcon(channel.type)}
                  <span className="text-sm truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Private Groups */}
          {groupChannels.length > 0 && (
            <div>
              <div className="flex items-center gap-1 px-2 mb-1">
                <ChevronDown className="w-3 h-3 text-[#80848e]" />
                <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wide">
                  Private Groups
                </span>
              </div>
              <div className="space-y-0.5">
                {groupChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded group ${
                      selectedChannelId === channel.id
                        ? 'bg-[#404249] text-white'
                        : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                    }`}
                  >
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Messages */}
          {directChannels.length > 0 && (
            <div>
              <div className="flex items-center gap-1 px-2 mb-1">
                <ChevronDown className="w-3 h-3 text-[#80848e]" />
                <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wide">
                  Direct Messages
                </span>
              </div>
              <div className="space-y-0.5">
                {directChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded group ${
                      selectedChannelId === channel.id
                        ? 'bg-[#404249] text-white'
                        : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                    }`}
                  >
                    {getChannelIcon(channel.type)}
                    <span className="text-sm truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
