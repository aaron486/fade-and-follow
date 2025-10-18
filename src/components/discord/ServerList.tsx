import React from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Server {
  id: string;
  name: string;
  avatar_url?: string;
}

interface ServerListProps {
  servers: Server[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
  onCreateServer: () => void;
}

export const ServerList: React.FC<ServerListProps> = ({
  servers,
  selectedServerId,
  onSelectServer,
  onCreateServer
}) => {
  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2">
      <TooltipProvider>
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-2 px-3">
            {servers.map((server) => (
              <Tooltip key={server.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectServer(server.id)}
                    className={`relative w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 ${
                      selectedServerId === server.id ? 'rounded-[16px]' : ''
                    }`}
                  >
                    <Avatar className="w-full h-full">
                      <AvatarImage src={server.avatar_url} />
                      <AvatarFallback className="bg-[#313338] text-white">
                        {server.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedServerId === server.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{server.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>

        <div className="px-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCreateServer}
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-[24px] hover:rounded-[16px] hover:bg-[#23a559] bg-[#313338] transition-all duration-200"
              >
                <Plus className="w-6 h-6 text-[#23a559] hover:text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Create Server</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};
