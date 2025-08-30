
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SecureUserList from './SecureUserList';
import Navigation from './Navigation';
import Footer from './Footer';
import AdminThemeProvider from './AdminThemeProvider';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  attachment_url: string | null;
  sender_name: string;
  recipient_name: string;
}

interface MessageCenterProps {
  language: 'en' | 'es';
}

const MessageCenter = ({ language }: MessageCenterProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const content = {
    en: {
      title: "Message Center",
      selectUser: "Select a user to start messaging",
      typeMessage: "Type your message...",
      send: "Send",
      noMessages: "No messages yet. Start a conversation!",
      online: "Online",
      offline: "Offline"
    },
    es: {
      title: "Centro de Mensajes", 
      selectUser: "Selecciona un usuario para comenzar a enviar mensajes",
      typeMessage: "Escribe tu mensaje...",
      send: "Enviar",
      noMessages: "Aún no hay mensajes. ¡Inicia una conversación!",
      online: "En línea",
      offline: "Desconectado"
    }
  };

  const t = content[language];

  useEffect(() => {
    if (selectedUser?.id) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [selectedUser?.id]);

  const fetchMessages = async () => {
    if (!user || !selectedUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(first_name, last_name),
          recipient:recipient_id(first_name, last_name)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Map the data to include display names
      const mappedMessages = (data || []).map((msg: any) => ({
        ...msg,
        sender_name: msg.sender?.first_name + ' ' + (msg.sender?.last_name || ''),
        recipient_name: msg.recipient?.first_name + ' ' + (msg.recipient?.last_name || '')
      }));

      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!user || !selectedUser?.id) return;

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', selectedUser.id)
        .eq('recipient_id', user.id)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedUser?.id || !newMessage.trim()) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: selectedUser.id,
          content: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();

      toast({
        title: language === 'es' ? 'Mensaje enviado' : 'Message sent',
        description: language === 'es' ? 
          'Tu mensaje ha sido enviado exitosamente' : 
          'Your message has been sent successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AdminThemeProvider>
      <Navigation language={language} setLanguage={() => {}} />
      
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        <h1 className="text-3xl font-bold mb-6">{t.title}</h1>
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Users List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>
                {language === 'es' ? 'Usuarios' : 'Users'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <SecureUserList 
                  onUserSelect={setSelectedUser}
                  selectedUserId={selectedUser?.id}
                  language={language}
                />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>
                {selectedUser ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {selectedUser.display_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedUser.display_name}</div>
                      <Badge variant="secondary" className="text-xs">
                        {selectedUser.role}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  t.selectUser
                )}
              </CardTitle>
            </CardHeader>

            {selectedUser ? (
              <>
                {/* Messages */}
                <CardContent className="flex-1 min-h-0">
                  <ScrollArea className="h-full pr-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t.noMessages}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.sender_id === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div className="text-xs opacity-70 mt-1">
                                {new Date(message.created_at).toLocaleString()}
                                {message.sender_id === user?.id && message.read_at && (
                                  <span className="ml-2">✓✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t.typeMessage}
                      className="flex-1 min-h-[40px] max-h-32"
                      disabled={loading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !newMessage.trim()}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  {t.selectUser}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <Footer language={language} />
    </AdminThemeProvider>
  );
};

export default MessageCenter;
