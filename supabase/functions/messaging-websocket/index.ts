import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active connections
const connections = new Map<string, WebSocket>();
const userConnections = new Map<string, Set<string>>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  
  if (!token) {
    return new Response("Missing authentication token", { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  // Verify user authentication
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return new Response("Invalid authentication token", { status: 401 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const connectionId = crypto.randomUUID();
  const userId = user.id;

  socket.onopen = () => {
    console.log(`WebSocket connection opened for user ${userId}`);
    connections.set(connectionId, socket);
    
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(connectionId);

    // Send connection confirmation
    socket.send(JSON.stringify({
      type: 'connection_established',
      userId,
      connectionId
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'send_message':
          await handleSendMessage(supabase, message, userId);
          break;
        case 'join_conversation':
          await handleJoinConversation(message, connectionId, userId);
          break;
        case 'typing_start':
          await handleTypingIndicator(message, userId, true);
          break;
        case 'typing_stop':
          await handleTypingIndicator(message, userId, false);
          break;
        case 'mark_read':
          await handleMarkRead(supabase, message, userId);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  };

  socket.onclose = () => {
    console.log(`WebSocket connection closed for user ${userId}`);
    connections.delete(connectionId);
    
    const userConns = userConnections.get(userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        userConnections.delete(userId);
      }
    }
  };

  return response;
});

async function handleSendMessage(supabase: any, message: any, senderId: string) {
  try {
    // Insert message into database
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: message.recipientId,
        content: message.content,
        subject: message.subject,
        thread_id: message.threadId,
        attachment_url: message.attachmentUrl
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return;
    }

    // Send to recipient if online
    const recipientConnections = userConnections.get(message.recipientId);
    if (recipientConnections) {
      const messagePayload = {
        type: 'new_message',
        message: newMessage
      };

      recipientConnections.forEach(connId => {
        const socket = connections.get(connId);
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(messagePayload));
        }
      });
    }

    // Send confirmation to sender
    const senderConnections = userConnections.get(senderId);
    if (senderConnections) {
      const confirmPayload = {
        type: 'message_sent',
        message: newMessage
      };

      senderConnections.forEach(connId => {
        const socket = connections.get(connId);
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(confirmPayload));
        }
      });
    }

  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function handleJoinConversation(message: any, connectionId: string, userId: string) {
  // This can be extended for group conversations
  console.log(`User ${userId} joined conversation ${message.conversationId}`);
}

async function handleTypingIndicator(message: any, userId: string, isTyping: boolean) {
  const recipientConnections = userConnections.get(message.recipientId);
  if (recipientConnections) {
    const typingPayload = {
      type: 'typing_indicator',
      userId,
      isTyping,
      conversationId: message.conversationId
    };

    recipientConnections.forEach(connId => {
      const socket = connections.get(connId);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(typingPayload));
      }
    });
  }
}

async function handleMarkRead(supabase: any, message: any, userId: string) {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', message.messageId)
      .eq('recipient_id', userId);

    if (error) {
      console.error('Error marking message as read:', error);
      return;
    }

    // Notify sender about read receipt
    const { data: messageData } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', message.messageId)
      .single();

    if (messageData) {
      const senderConnections = userConnections.get(messageData.sender_id);
      if (senderConnections) {
        const readPayload = {
          type: 'message_read',
          messageId: message.messageId,
          readBy: userId
        };

        senderConnections.forEach(connId => {
          const socket = connections.get(connId);
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(readPayload));
          }
        });
      }
    }
  } catch (error) {
    console.error('Error handling mark read:', error);
  }
}