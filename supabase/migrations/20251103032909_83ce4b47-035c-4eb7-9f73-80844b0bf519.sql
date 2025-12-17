-- Add paid status tracking to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;