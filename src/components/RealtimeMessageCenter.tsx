import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Search, Plus, Circle, Loader2, Bell, BellOff, Filter, Paperclip, X } from 'lucide-react';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import { useAuth } from '@/hooks/useAuth';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import FileUpload from './FileUpload';
import AttachmentPreview from './AttachmentPreview';
import MessageReactions from './MessageReactions';

interface Profile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email: string;
  status?: string;
}

interface RealtimeMessageCenterProps {
  language: string;
}

const RealtimeMessageCenter: React.FC<RealtimeMessageCenterProps> = ({ language }) => {
  const { user } = useAuth();
  const { currentTheme } = useColorTheme();
  const { 
    messages, 
    isConnected, 
    typingUsers, 
    userPresence,
    sendMessage, 
    sendTypingIndicator, 
    markAsRead,
    getUserPresence,
    getLastSeenText
  } = useRealtimeMessaging();
  
  const { 
    preferences, 
    permission, 
    requestPermission, 
    showMessageNotification 
  } = useNotifications();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'unread' | 'attachments'>('all');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    content: '',
    attachmentUrl: '',
    attachmentName: '',
    attachmentType: ''
  });
  const [isTyping, setIsTyping] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [messageReactions, setMessageReactions] = useState<Record<string, any[]>>({});
  const [showFileUpload, setShowFileUpload] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const text = {
    en: {
      messageCenter: 'Message Center',
      compose: 'Compose',
      search: 'Search messages...',
      noMessages: 'No messages found',
      selectMessage: 'Select a message to view details',
      newMessage: 'New Message',
      recipient: 'Recipient',
      subject: 'Subject',
      message: 'Message',
      attachment: 'Attachment URL',
      send: 'Send',
      cancel: 'Cancel',
      reply: 'Reply',
      markRead: 'Mark as Read',
      connectionStatus: 'Connection Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      typing: 'is typing...',
      online: 'Online',
      offline: 'Offline',
      invisible: 'Invisible',
      lastSeen: 'Last seen',
      delivered: 'Delivered',
      read: 'Read',
      notifications: 'Notifications',
      attachFile: 'Attach File',
      removeAttachment: 'Remove Attachment',
      filter: 'Filter',
      all: 'All',
      unread: 'Unread',
      attachments: 'With Attachments'
    },
    es: {
      messageCenter: 'Centro de Mensajes',
      compose: 'Redactar',
      search: 'Buscar mensajes...',
      noMessages: 'No se encontraron mensajes',
      selectMessage: 'Selecciona un mensaje para ver detalles',
      newMessage: 'Nuevo Mensaje',
      recipient: 'Destinatario',
      subject: 'Asunto',
      message: 'Mensaje',
      attachment: 'URL del Adjunto',
      send: 'Enviar',
      cancel: 'Cancelar',
      reply: 'Responder',
      markRead: 'Marcar como Leído',
      connectionStatus: 'Estado de Conexión',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      typing: 'está escribiendo...',
      online: 'En línea',
      offline: 'Desconectado',
      invisible: 'Invisible',
      lastSeen: 'Visto por última vez',
      delivered: 'Entregado',
      read: 'Leído',
      notifications: 'Notificaciones',
      attachFile: 'Adjuntar Archivo',
      removeAttachment: 'Eliminar Adjunto',
      filter: 'Filtrar',
      all: 'Todos',
      unread: 'No leídos',
      attachments: 'Con Adjuntos'
    }
  };

  const t = text[language as keyof typeof text] || text.en;

  useEffect(() => {
    fetchProfiles();
    fetchAllMessageReactions();
    
    // Request notification permission on mount
    if (permission === 'default') {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    // Show notification for new messages
    if (messages.length > 0) {
      const latestMessage = messages[0];
      if (latestMessage.recipient_id === user?.id && !latestMessage.is_read) {
        const senderName = getDisplayName(latestMessage.sender);
        showMessageNotification(senderName, latestMessage.content);
      }
    }
  }, [messages]);

  const fetchAllMessageReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*');

      if (error) {
        console.error('Error fetching reactions:', error);
        return;
      }

      // Group reactions by message_id
      const grouped = (data || []).reduce((acc, reaction) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
        return acc;
      }, {} as Record<string, any[]>);

      setMessageReactions(grouped);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDisplayName(message.sender).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (searchFilter) {
      case 'unread':
        return !message.is_read && message.recipient_id === user?.id;
      case 'attachments':
        return !!message.attachment_url;
      default:
        return true;
    }
  });

  const getDisplayName = (profile?: any) => {
    if (!profile) return 'Unknown User';
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || profile.last_name || profile.email || 'Unknown User';
  };

  const getPresenceIndicator = (userId: string) => {
    const presence = getUserPresence(userId);
    const statusColors = {
      online: 'text-green-500',
      offline: 'text-red-500',
      invisible: 'text-blue-500'
    };
    
    return {
      color: statusColors[presence.status as keyof typeof statusColors] || statusColors.offline,
      text: t[presence.status as keyof typeof t] || t.offline,
      lastSeen: getLastSeenText(presence.lastSeen)
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (!newMessage.recipient || !newMessage.content.trim()) return;

    sendMessage(
      newMessage.recipient,
      newMessage.content,
      newMessage.subject,
      undefined,
      newMessage.attachmentUrl
    );

    setNewMessage({ 
      recipient: '', 
      subject: '', 
      content: '', 
      attachmentUrl: '',
      attachmentName: '',
      attachmentType: ''
    });
    setIsComposeOpen(false);
    setShowFileUpload(false);
  };

  const handleFileUploaded = (url: string, fileName: string, fileType: string) => {
    setNewMessage(prev => ({
      ...prev,
      attachmentUrl: url,
      attachmentName: fileName,
      attachmentType: fileType
    }));
    setShowFileUpload(false);
  };

  const removeAttachment = () => {
    setNewMessage(prev => ({
      ...prev,
      attachmentUrl: '',
      attachmentName: '',
      attachmentType: ''
    }));
  };

  const handleReactionsChange = () => {
    fetchAllMessageReactions();
  };

  const handleReply = () => {
    if (!selectedMessage || !replyContent.trim()) return;

    const recipientId = selectedMessage.sender_id === user?.id 
      ? selectedMessage.recipient_id 
      : selectedMessage.sender_id;

    sendMessage(
      recipientId,
      replyContent,
      `Re: ${selectedMessage.subject || 'No Subject'}`,
      selectedMessage.thread_id || selectedMessage.id
    );

    setReplyContent('');
  };

  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    if (!message.is_read && message.recipient_id === user?.id) {
      markAsRead(message.id);
    }
  };

  const handleTyping = (content: string, recipientId?: string) => {
    if (recipientId && content.length > 0) {
      if (!isTyping) {
        setIsTyping(true);
        sendTypingIndicator(recipientId, true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(recipientId, false);
      }, 1000);
    }
  };

  const getTypingStatus = (conversationId: string) => {
    const typing = typingUsers.find(tu => 
      tu.conversationId === conversationId && 
      tu.userId !== user?.id
    );
    
    if (typing) {
      const profile = profiles.find(p => p.user_id === typing.userId);
      return `${getDisplayName(profile)} ${t.typing}`;
    }
    return null;
  };

  return (
    <Card 
      className="w-full h-[600px] border-2 hover:border-primary/50 transition-colors"
      style={{
        backgroundColor: currentTheme.cardBackground,
        borderColor: currentTheme.border,
        color: currentTheme.cardForeground
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" style={{ color: currentTheme.accent }} />
            {t.messageCenter}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <Circle 
                className={`h-3 w-3 fill-current ${isConnected ? 'text-green-500' : 'text-red-500'}`} 
              />
              {isConnected ? t.connected : t.disconnected}
            </div>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button variant="business" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {t.compose}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.newMessage}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">{t.recipient}</label>
                    <Select 
                      value={newMessage.recipient} 
                      onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.recipient} />
                      </SelectTrigger>
                       <SelectContent>
                        {profiles
                          .filter(profile => profile.user_id !== user?.id)
                          .map(profile => {
                            const presence = getUserPresence(profile.user_id);
                            return (
                              <SelectItem key={profile.id} value={profile.user_id}>
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${getPresenceIndicator(profile.user_id).color}`} />
                                  {getDisplayName(profile)}
                                  <span className="text-xs text-muted-foreground">({getPresenceIndicator(profile.user_id).text})</span>
                                </div>
                              </SelectItem>
                            );
                          })
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t.subject}</label>
                    <Input
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder={t.subject}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t.message}</label>
                    <Textarea
                      value={newMessage.content}
                      onChange={(e) => {
                        setNewMessage(prev => ({ ...prev, content: e.target.value }));
                        handleTyping(e.target.value, newMessage.recipient);
                      }}
                      placeholder={t.message}
                      rows={4}
                    />
                  </div>
                  
                  {/* File Upload Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">{t.attachFile}</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFileUpload(!showFileUpload)}
                      >
                        <Paperclip className="h-4 w-4 mr-1" />
                        {t.attachFile}
                      </Button>
                    </div>
                    
                    {showFileUpload && (
                      <div className="animate-fade-in">
                        <FileUpload onFileUploaded={handleFileUploaded} />
                      </div>
                    )}
                    
                    {newMessage.attachmentUrl && (
                      <div className="mt-2 animate-fade-in">
                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm truncate">{newMessage.attachmentName || 'Attachment'}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeAttachment}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">{t.attachment}</label>
                    <Input
                      value={newMessage.attachmentUrl}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, attachmentUrl: e.target.value }))}
                      placeholder={t.attachment}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                      {t.cancel}
                    </Button>
                    <Button variant="business" onClick={handleSendMessage}>
                      <Send className="h-4 w-4 mr-1" />
                      {t.send}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-20"
            />
          </div>
          <Select value={searchFilter} onValueChange={(value: any) => setSearchFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              <SelectItem value="unread">{t.unread}</SelectItem>
              <SelectItem value="attachments">{t.attachments}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 h-[500px]">
          {/* Messages List */}
          <div className="border-r">
            <ScrollArea className="h-full">
              {filteredMessages.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {t.noMessages}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedMessage?.id === message.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender?.avatar_url} />
                          <AvatarFallback>
                            {getDisplayName(message.sender).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium truncate">
                                {getDisplayName(message.sender)}
                              </h4>
                              {message.sender_id !== user?.id && (
                                <div className="flex items-center gap-1">
                                  <div className={`h-2 w-2 rounded-full ${getPresenceIndicator(message.sender_id).color} ${getPresenceIndicator(message.sender_id).color === 'text-green-500' ? 'animate-pulse' : ''}`} />
                                  <span className="text-xs text-muted-foreground">
                                    {getPresenceIndicator(message.sender_id).text}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {!message.is_read && message.recipient_id === user?.id && (
                                <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground truncate">
                            {message.subject || 'No Subject'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {message.content}
                          </p>
                          {message.attachment_url && (
                            <div className="flex items-center gap-1 mt-1">
                              <Paperclip className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Attachment</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Message Detail */}
          <div className="flex flex-col">
            {selectedMessage ? (
              <>
                <div className="p-4 border-b">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={selectedMessage.sender?.avatar_url} />
                        <AvatarFallback>
                          {getDisplayName(selectedMessage.sender).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{getDisplayName(selectedMessage.sender)}</h3>
                          {selectedMessage.sender_id !== user?.id && (
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${getPresenceIndicator(selectedMessage.sender_id).color} ${getPresenceIndicator(selectedMessage.sender_id).color === 'text-green-500' ? 'animate-pulse' : ''}`} />
                              <span className="text-xs text-muted-foreground">
                                {getPresenceIndicator(selectedMessage.sender_id).text}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedMessage.subject || 'No Subject'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(selectedMessage.created_at)}
                        </p>
                        {selectedMessage.sender_id !== user?.id && (
                          <p className="text-xs text-muted-foreground">
                            {t.lastSeen} {getPresenceIndicator(selectedMessage.sender_id).lastSeen}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {selectedMessage.is_read ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-green-600">{t.read}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(selectedMessage.updated_at)}
                            </span>
                          </div>
                        ) : (
                          <Badge className="bg-blue-600">{t.delivered}</Badge>
                        )}
                      </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                    {selectedMessage.attachment_url && (
                      <div className="mt-4">
                        <AttachmentPreview
                          url={selectedMessage.attachment_url}
                          fileName={selectedMessage.attachment_url.split('/').pop() || 'attachment'}
                          fileType="application/octet-stream"
                          size="md"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Message Reactions */}
                  {selectedMessage && (
                    <MessageReactions
                      messageId={selectedMessage.id}
                      reactions={messageReactions[selectedMessage.id] || []}
                      onReactionChange={handleReactionsChange}
                    />
                  )}
                  
                  {/* Typing Indicator */}
                  {(() => {
                    const conversationId = selectedMessage.sender_id === user?.id 
                      ? `${user.id}-${selectedMessage.recipient_id}`
                      : `${selectedMessage.sender_id}-${user?.id}`;
                    const typingStatus = getTypingStatus(conversationId);
                    
                    return typingStatus && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {typingStatus}
                      </div>
                    );
                  })()}
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={t.reply}
                      value={replyContent}
                      onChange={(e) => {
                        setReplyContent(e.target.value);
                        const recipientId = selectedMessage.sender_id === user?.id 
                          ? selectedMessage.recipient_id 
                          : selectedMessage.sender_id;
                        handleTyping(e.target.value, recipientId);
                      }}
                      rows={2}
                      className="flex-1"
                    />
                    <Button onClick={handleReply} disabled={!replyContent.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {t.selectMessage}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeMessageCenter;