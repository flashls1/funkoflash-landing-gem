-- Add zipcode field to business_events table
ALTER TABLE public.business_events 
ADD COLUMN zipcode text;