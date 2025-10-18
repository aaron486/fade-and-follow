import React from 'react';
import { Crown, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: {
    display_name: string;
    avatar_url?: string;
    username: string;
  };
}

interface MemberListProps {
  members: Member[];
  onlineMembers: string[];
}

export const MemberList: React.FC<MemberListProps> = ({ members, onlineMembers }) => {
  const adminMembers = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role === 'member');

  const MemberItem: React.FC<{ member: Member }> = ({ member }) => {
    const isOnline = onlineMembers.includes(member.user_id);
    
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#35373c] cursor-pointer group">
        <div className="relative">
          <Avatar className="w-8 h-8">
            <AvatarImage src={member.profile.avatar_url} />
            <AvatarFallback className="bg-[#5865f2] text-white text-xs">
              {member.profile.display_name[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${
              isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isOnline ? 'text-[#f2f3f5]' : 'text-[#80848e]'}`}>
            {member.profile.display_name}
          </p>
        </div>
        {member.role === 'admin' && (
          <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        )}
      </div>
    );
  };

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col">
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-4">
          {/* Admins */}
          {adminMembers.length > 0 && (
            <div>
              <div className="px-2 mb-1">
                <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wide">
                  Admins — {adminMembers.length}
                </span>
              </div>
              <div className="space-y-0.5">
                {adminMembers.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          <div>
            <div className="px-2 mb-1">
              <span className="text-xs font-semibold text-[#949ba4] uppercase tracking-wide">
                Members — {regularMembers.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {regularMembers.map((member) => (
                <MemberItem key={member.id} member={member} />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
