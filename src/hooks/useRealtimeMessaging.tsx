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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Set up real-time subscription for user presence
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-presence')
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
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
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            status: 'online',
            lastSeen: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const connect = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const wsUrl = `wss://gytjgmeoepglbrjrbfie.functions.supabase.co/messaging-websocket?token=${session.access_token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to messaging service",
          variant: "destructive",
        });
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [user, toast]);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connection_established':
        console.log('Connection established:', data);
        break;
      
      case 'new_message':
        setMessages(prev => [data.message, ...prev]);
        toast({
          title: "New Message",
          description: `Message from ${data.message.sender?.first_name || 'Unknown'}`,
        });
        break;
      
      case 'message_sent':
        setMessages(prev => [data.message, ...prev]);
        break;
      
      case 'typing_indicator':
        handleTypingIndicator(data);
        break;
      
      case 'message_read':
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, is_read: true, read_at: data.readAt }
            : msg
        ));
        break;
      
      case 'user_presence_update':
        setUserPresence(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userId, {
            status: data.status,
            lastSeen: new Date(data.lastSeen)
          });
          return newMap;
        });
        break;
      
      case 'error':
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
        break;
    }
  }, [toast]);

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

  const sendMessage = useCallback((recipientId: string, content: string, subject?: string, threadId?: string, attachmentUrl?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Connection Error",
        description: "Not connected to messaging service",
        variant: "destructive",
      });
      return;
    }

    const message = {
      type: 'send_message',
      recipientId,
      content,
      subject,
      threadId,
      attachmentUrl
    };

    wsRef.current.send(JSON.stringify(message));
  }, [toast]);

  const sendTypingIndicator = useCallback((recipientId: string, isTyping: boolean, conversationId?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const message = {
      type: isTyping ? 'typing_start' : 'typing_stop',
      recipientId,
      conversationId: conversationId || `${user?.id}-${recipientId}`
    };

    wsRef.current.send(JSON.stringify(message));
  }, [user?.id]);

  const markAsRead = useCallback((messageId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const message = {
      type: 'mark_read',
      messageId
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

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
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
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