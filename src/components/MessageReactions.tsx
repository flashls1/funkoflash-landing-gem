import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MessageReaction {
  id: string;
  reaction: string;
  user_id: string;
  count?: number;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  onReactionChange: () => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '😊', '😂', '😮', '😢', '😡'];

const MessageReactions: React.FC<MessageReactionsProps> = ({ 
  messageId, 
  reactions, 
  onReactionChange 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Group reactions by emoji and count them
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = {
        emoji: reaction.reaction,
        count: 0,
        userReacted: false,
        users: []
      };
    }
    acc[reaction.reaction].count++;
    acc[reaction.reaction].users.push(reaction.user_id);
    if (reaction.user_id === user?.id) {
      acc[reaction.reaction].userReacted = true;
    }
    return acc;
  }, {} as Record<string, { emoji: string; count: number; userReacted: boolean; users: string[] }>);

  const addReaction = async (emoji: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji: emoji
        });

      if (error) {
        throw error;
      }

      onReactionChange();
      setShowReactionPicker(false);
    } catch (error: any) {
      if (error.code === '23505') {
        // Duplicate reaction, remove it instead
        await removeReaction(emoji);
      } else {
        console.error('Error adding reaction:', error);
        toast({
          title: "Error",
          description: "Failed to add reaction",
          variant: "destructive",
        });
      }
    }
  };

  const removeReaction = async (emoji: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) {
        throw error;
      }

      onReactionChange();
    } catch (error: any) {
      console.error('Error removing reaction:', error);
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive",
      });
    }
  };

  const handleReactionClick = (emoji: string, userReacted: boolean) => {
    if (userReacted) {
      removeReaction(emoji);
    } else {
      addReaction(emoji);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {/* Existing reactions */}
      {Object.values(groupedReactions).map(({ emoji, count, userReacted }) => (
        <Button
          key={emoji}
          variant={userReacted ? "default" : "outline"}
          size="sm"
          className={`h-6 px-2 text-xs ${userReacted ? 'bg-primary/20' : ''}`}
          onClick={() => handleReactionClick(emoji, userReacted)}
        >
          <span className="mr-1">{emoji}</span>
          {count}
        </Button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setShowReactionPicker(!showReactionPicker)}
        >
          <span className="text-base">😊</span>
          <span className="ml-1 text-xs">+</span>
        </Button>

        {/* Reaction picker */}
        {showReactionPicker && (
          <div className="absolute bottom-full left-0 mb-1 p-2 bg-background border rounded-lg shadow-lg z-10 animate-fade-in">
            <div className="flex gap-1">
              {COMMON_REACTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => addReaction(emoji)}
                >
                  <span className="text-base">{emoji}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
