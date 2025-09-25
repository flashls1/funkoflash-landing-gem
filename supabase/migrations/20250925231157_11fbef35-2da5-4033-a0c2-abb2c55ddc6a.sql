-- Add contact_email field to business_event_contact table
ALTER TABLE public.business_event_contact 
ADD COLUMN contact_email text;