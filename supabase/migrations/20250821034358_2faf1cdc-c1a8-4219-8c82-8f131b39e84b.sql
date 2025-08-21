-- Add business_name field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_name TEXT;