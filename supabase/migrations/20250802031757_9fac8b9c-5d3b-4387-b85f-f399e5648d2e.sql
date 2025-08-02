-- Create message attachments bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', false);

-- Create policies for message attachments
CREATE POLICY "Users can view attachments in their messages" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'message-attachments' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR 
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.attachment_url LIKE '%' || name || '%' 
      AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can upload attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'message-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their attachments" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'message-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'message-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

-- Enable RLS for message reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for message reactions
CREATE POLICY "Users can view reactions on messages they can see" 
ON public.message_reactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_reactions.message_id 
    AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions to messages they can see" 
ON public.message_reactions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_reactions.message_id 
    AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
  )
);

CREATE POLICY "Users can remove their own reactions" 
ON public.message_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  browser_notifications BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT false,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for notification preferences timestamps
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();