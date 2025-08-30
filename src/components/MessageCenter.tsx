import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Mail } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender_profile: {
    full_name: string;
    avatar_url: string;
  };
}

interface MessageCenterProps {
  language: 'en' | 'es';
}

export default function MessageCenter({ language }: MessageCenterProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          subject,
          body,
          is_read,
          created_at,
          sender_profile:profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('recipient_id', supabase.auth.user()?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the sender_profile
      const formattedMessages = data.map(message => ({
        ...message,
        sender_profile: message.sender_profile ? {
          full_name: message.sender_profile.full_name,
          avatar_url: message.sender_profile.avatar_url,
        } : { full_name: 'Unknown', avatar_url: null },
      }));

      setMessages(formattedMessages as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  if (isLoading) {
    return <Card>
      <CardHeader>
        <CardTitle>Loading Messages...</CardTitle>
      </CardHeader>
    </Card>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Message List */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px] w-full">
              <div className="divide-y divide-border">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`px-4 py-3 hover:bg-secondary cursor-pointer ${
                      selectedMessage?.id === message.id ? 'bg-secondary' : ''
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={message.sender_profile.avatar_url || ""} />
                        <AvatarFallback>{message.sender_profile.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{message.sender_profile.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{message.subject}</p>
                      </div>
                      {!message.is_read && (
                        <Badge variant="secondary" className="ml-auto">New</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Message Content */}
      <div className="md:col-span-3">
        {selectedMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>{selectedMessage.subject}</CardTitle>
              <div className="ml-auto flex items-center space-x-2">
                {selectedMessage.is_read ? (
                  <Badge variant="outline">
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Read
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Mail className="h-4 w-4 mr-2" />
                    Unread
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={selectedMessage.sender_profile.avatar_url || ""} />
                  <AvatarFallback>{selectedMessage.sender_profile.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{selectedMessage.sender_profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <p>{selectedMessage.body}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center p-24">
              Select a message to view its content.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
