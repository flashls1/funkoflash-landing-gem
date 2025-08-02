import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  subject?: string;
  thread_id?: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  recipient?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface TypingUser {
  userId: string;
  conversationId: string;
  timestamp: number;
}

export const useRealtimeMessaging = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [userPresence, setUserPresence] = useState<Map<string, { status: string; lastSeen: Date }>>(new Map());
  const channelRef = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Set up real-time subscription for user presence
  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase
      .channel('user-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });
    
    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const presenceMap = new Map();
        
        Object.entries(newState).forEach(([userId, presence]: [string, any]) => {
          if (presence && presence[0]) {
            presenceMap.set(userId, {
              status: presence[0].status || 'offline',
              lastSeen: new Date(presence[0].lastSeen || Date.now())
            });
          }
        });
        
        setUserPresence(presenceMap);
        console.log('Presence synced:', presenceMap.size, 'users online');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        setUserPresence(prev => {
          const newMap = new Map(prev);
          if (newPresences[0]) {
            newMap.set(key, {
              status: newPresences[0].status || 'online',
              lastSeen: new Date(newPresences[0].lastSeen || Date.now())
            });
          }
          return newMap;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        setUserPresence(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      })
      .subscribe(async (status) => {
        console.log('Presence subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await presenceChannel.track({
            user_id: user.id,
            status: 'online',
            lastSeen: new Date().toISOString()
          });
        }
      });

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [user]);

  // Set up real-time message subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        },
        async (payload) => {
          console.log('New message received via realtime:', payload);
          
          // Fetch the complete message with profile data
          const { data: messageWithProfiles } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url),
              recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .maybeSingle();

          if (messageWithProfiles) {
            setMessages(prev => {
              // Avoid duplicates
              const exists = prev.some(msg => msg.id === messageWithProfiles.id);
              if (exists) return prev;
              
              // Show toast notification if this message is from someone else
              if (messageWithProfiles.sender_id !== user.id) {
                toast({
                  title: "New Message",
                  description: "You have received a new message",
                });
              }
              
              // Type the message properly  
              const typedMessage = messageWithProfiles as unknown as Message;
              
              return [typedMessage, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        },
        (payload) => {
          console.log('Message updated via realtime:', payload);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === payload.new.id
                ? { ...msg, ...payload.new }
                : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, toast]);

  const connect = useCallback(async () => {
    // No longer needed with Supabase realtime - connection is automatic
    console.log('Using Supabase Realtime - no manual connection needed');
  }, []);

  const handleTypingIndicator = useCallback((data: any) => {
    const { userId, isTyping, conversationId } = data;
    
    if (isTyping) {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== userId);
        return [...filtered, { userId, conversationId, timestamp: Date.now() }];
      });

      // Clear typing after 3 seconds of inactivity
      const existingTimeout = typingTimeoutRef.current.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        typingTimeoutRef.current.delete(userId);
      }, 3000);

      typingTimeoutRef.current.set(userId, timeout);
    } else {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      const timeout = typingTimeoutRef.current.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        typingTimeoutRef.current.delete(userId);
      }
    }
  }, []);

  const sendMessage = useCallback(async (recipientId: string, content: string, subject?: string, threadId?: string, attachmentUrl?: string) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to send messages",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          subject,
          thread_id: threadId,
          attachment_url: attachmentUrl
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        throw error;
      }

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [user, toast]);

  const sendTypingIndicator = useCallback((recipientId: string, isTyping: boolean, conversationId?: string) => {
    if (!presenceChannelRef.current || !user) return;

    // Update presence with typing status
    presenceChannelRef.current.track({
      user_id: user.id,
      status: 'online',
      lastSeen: new Date().toISOString(),
      typing: isTyping ? recipientId : null
    });
  }, [user]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user.id);

      if (error) {
        console.error('Error marking message as read:', error);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url),
          recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages((data as any[])?.map((msg: any) => ({
        ...msg,
        sender: msg.sender || undefined,
        recipient: msg.recipient || undefined
      })) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    // Clean up Supabase channels
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    setIsConnected(false);
    // Clear all typing timeouts
    typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    typingTimeoutRef.current.clear();
  }, []);

  const getUserPresence = useCallback((userId: string) => {
    return userPresence.get(userId) || { status: 'offline', lastSeen: new Date() };
  }, [userPresence]);

  const getLastSeenText = useCallback((lastSeen: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, fetchMessages, connect, disconnect]);

  return {
    messages,
    isConnected,
    typingUsers,
    userPresence,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    fetchMessages,
    connect,
    disconnect,
    getUserPresence,
    getLastSeenText
  };
};