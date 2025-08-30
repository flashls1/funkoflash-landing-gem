import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, Search, Users, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  thread_id?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  attachment_url?: string;
  created_at: string;
  sender_profile?: any;
  recipient_profile?: any;
}

interface Profile {
  user_id: string;
  display_name: string;
  role: 'admin' | 'staff' | 'talent' | 'business';
}

interface MessageCenterProps {
  language: 'en' | 'es';
}

const MessageCenter = ({ language }: MessageCenterProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Compose form state
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    attachment_url: ''
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();

  const content = {
    en: {
      messageCenter: "Message Center",
      compose: "Compose",
      search: "Search messages...",
      noMessages: "No messages found",
      from: "From",
      to: "To",
      subject: "Subject",
      message: "Message",
      send: "Send",
      cancel: "Cancel",
      newMessage: "New Message",
      selectRecipient: "Select recipient...",
      attachment: "Attachment URL",
      unread: "Unread",
      markAsRead: "Mark as Read",
      reply: "Reply"
    },
    es: {
      messageCenter: "Centro de Mensajes",
      compose: "Redactar",
      search: "Buscar mensajes...",
      noMessages: "No se encontraron mensajes",
      from: "De",
      to: "Para",
      subject: "Asunto",
      message: "Mensaje",
      send: "Enviar",
      cancel: "Cancelar",
      newMessage: "Nuevo Mensaje",
      selectRecipient: "Seleccionar destinatario...",
      attachment: "URL del Adjunto",
      unread: "No leído",
      markAsRead: "Marcar como Leído",
      reply: "Responder"
    }
  };

  const t = content[language];

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchProfiles();
      
      // Set up real-time subscription
      const messagesSubscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages' },
          () => fetchMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(first_name, last_name, role),
          recipient_profile:profiles!messages_recipient_id_fkey(first_name, last_name, role)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_users_for_messaging');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.recipient_id || !newMessage.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject || 'No Subject',
          content: newMessage.content,
          attachment_url: newMessage.attachment_url || null
        }]);

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });

      setNewMessage({ recipient_id: '', subject: '', content: '', attachment_url: '' });
      setShowCompose(false);
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDisplayName = (profile: any) => {
    if (profile?.display_name) {
      return profile.display_name;
    }
    return `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown User';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading messages...</div>;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>{t.messageCenter}</CardTitle>
          </div>
          <Button onClick={() => setShowCompose(true)}>
            <Send className="h-4 w-4 mr-2" />
            {t.compose}
          </Button>
        </div>
        <CardDescription>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
          {/* Messages List */}
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {filteredMessages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t.noMessages}</p>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-muted' : ''
                    } ${!message.is_read && message.recipient_id === user?.id ? 'border-primary' : ''}`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.is_read && message.recipient_id === user?.id) {
                        markAsRead(message.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {message.sender_id === user?.id 
                              ? `${t.to}: ${getDisplayName(message.recipient_profile)}`
                              : `${t.from}: ${getDisplayName(message.sender_profile)}`
                            }
                          </p>
                          {!message.is_read && message.recipient_id === user?.id && (
                            <Badge variant="default" className="text-xs">
                              {t.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{message.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                      {message.attachment_url && (
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Message Detail */}
          <div className="border rounded-lg">
            {selectedMessage ? (
              <div className="p-4 h-full flex flex-col">
                <div className="border-b pb-3 mb-3">
                  <h3 className="font-semibold">{selectedMessage.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMessage.sender_id === user?.id 
                      ? `${t.to}: ${getDisplayName(selectedMessage.recipient_profile)}`
                      : `${t.from}: ${getDisplayName(selectedMessage.sender_profile)}`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="whitespace-pre-wrap text-sm">
                    {selectedMessage.content}
                  </div>
                  {selectedMessage.attachment_url && (
                    <div className="mt-4 pt-3 border-t">
                      <a
                        href={selectedMessage.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        View Attachment
                      </a>
                    </div>
                  )}
                </ScrollArea>
                {selectedMessage.sender_id !== user?.id && (
                  <div className="pt-3 border-t mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setNewMessage({
                          recipient_id: selectedMessage.sender_id,
                          subject: `Re: ${selectedMessage.subject}`,
                          content: '',
                          attachment_url: ''
                        });
                        setShowCompose(true);
                      }}
                    >
                      {t.reply}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="h-8 w-8 mb-2" />
                <p>Select a message to view</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.newMessage}</DialogTitle>
            <DialogDescription>
              Send a message to another user on the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.to}</label>
              <select
                value={newMessage.recipient_id}
                onChange={(e) => setNewMessage({...newMessage, recipient_id: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="">{t.selectRecipient}</option>
                {profiles
                  .filter(p => p.user_id !== user?.id)
                  .map(profile => (
                    <option key={profile.user_id} value={profile.user_id}>
                      {getDisplayName(profile)} ({profile.role})
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.subject}</label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                placeholder={t.subject}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.message}</label>
              <Textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                placeholder={t.message}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.attachment}</label>
              <Input
                value={newMessage.attachment_url}
                onChange={(e) => setNewMessage({...newMessage, attachment_url: e.target.value})}
                placeholder={t.attachment}
                type="url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>
              {t.cancel}
            </Button>
            <Button onClick={sendMessage}>
              <Send className="h-4 w-4 mr-2" />
              {t.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MessageCenter;