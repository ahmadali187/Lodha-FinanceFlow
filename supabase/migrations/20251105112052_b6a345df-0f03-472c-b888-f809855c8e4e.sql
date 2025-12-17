-- Add use_family_mode column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN use_family_mode boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.use_family_mode IS 'Whether user wants to use family mode (true) or personal mode (false)';

-- Add email column to profiles for invite lookup (avoiding SQL injection)
ALTER TABLE public.profiles 
ADD COLUMN email text;

-- Create index on email for faster lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Create a trigger to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile with user email
  UPDATE public.profiles 
  SET email = (
    SELECT email 
    FROM auth.users 
    WHERE id = NEW.id
  )
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger to sync email when user is created
CREATE TRIGGER on_auth_user_created_sync_email
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_profile_email();

-- Backfill existing profiles with email data
DO $$
DECLARE
  profile_record RECORD;
  user_email text;
BEGIN
  FOR profile_record IN SELECT user_id FROM public.profiles LOOP
    -- Get email from service role (this runs in migration context)
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = profile_record.user_id;
    
    -- Update profile
    UPDATE public.profiles 
    SET email = user_email 
    WHERE user_id = profile_record.user_id;
  END LOOP;
END $$;