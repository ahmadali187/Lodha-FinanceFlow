-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN username TEXT;