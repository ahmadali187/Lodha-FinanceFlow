-- Create app_role enum if not exists (for family roles)
DO $$ BEGIN
  CREATE TYPE public.family_role AS ENUM ('admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create family_members table (junction table linking users to families)
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role family_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(family_id, user_id)
);

-- Add family_id to existing tables
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.assets_liabilities ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;

-- Migrate existing data: Create a family for each existing user
INSERT INTO public.families (name, created_by)
SELECT 
  COALESCE(p.full_name || '''s Family', p.username || '''s Family', 'My Family'),
  p.user_id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.family_members fm WHERE fm.user_id = p.user_id
);

-- Link each user to their newly created family as admin
INSERT INTO public.family_members (family_id, user_id, role, invited_by)
SELECT 
  f.id,
  f.created_by,
  'admin'::family_role,
  f.created_by
FROM public.families f
WHERE f.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.family_members fm 
  WHERE fm.family_id = f.id AND fm.user_id = f.created_by
);

-- Update existing records to link to family_id
UPDATE public.accounts a
SET family_id = fm.family_id
FROM public.family_members fm
WHERE a.user_id = fm.user_id AND a.family_id IS NULL;

UPDATE public.transactions t
SET family_id = fm.family_id
FROM public.family_members fm
WHERE t.user_id = fm.user_id AND t.family_id IS NULL;

UPDATE public.budgets b
SET family_id = fm.family_id
FROM public.family_members fm
WHERE b.user_id = fm.user_id AND b.family_id IS NULL;

UPDATE public.bills b
SET family_id = fm.family_id
FROM public.family_members fm
WHERE b.user_id = fm.user_id AND b.family_id IS NULL;

UPDATE public.assets_liabilities al
SET family_id = fm.family_id
FROM public.family_members fm
WHERE al.user_id = fm.user_id AND al.family_id IS NULL;

-- Enable RLS on new tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is family member
CREATE OR REPLACE FUNCTION public.is_family_member(_family_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = _family_id AND user_id = auth.uid()
  )
$$;

-- Helper function to check if user is family admin
CREATE OR REPLACE FUNCTION public.is_family_admin(_family_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = _family_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
$$;

-- Helper function to get user's family id
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.family_members
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- RLS Policies for families table
CREATE POLICY "Users can view their own family"
ON public.families FOR SELECT
USING (is_family_member(id));

CREATE POLICY "Family admins can update their family"
ON public.families FOR UPDATE
USING (is_family_admin(id));

CREATE POLICY "Users can create families"
ON public.families FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all families"
ON public.families FOR SELECT
USING (is_admin());

-- RLS Policies for family_members table
CREATE POLICY "Users can view their family members"
ON public.family_members FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Family admins can add members"
ON public.family_members FOR INSERT
WITH CHECK (is_family_admin(family_id));

CREATE POLICY "Family admins can remove members"
ON public.family_members FOR DELETE
USING (is_family_admin(family_id));

CREATE POLICY "Family admins can update member roles"
ON public.family_members FOR UPDATE
USING (is_family_admin(family_id));

CREATE POLICY "Admins can view all family members"
ON public.family_members FOR SELECT
USING (is_admin());

-- Update RLS policies for existing tables to use family_id

-- Accounts policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;

CREATE POLICY "Family members can view family accounts"
ON public.accounts FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Family members can create family accounts"
ON public.accounts FOR INSERT
WITH CHECK (family_id = get_user_family_id());

CREATE POLICY "Family members can update family accounts"
ON public.accounts FOR UPDATE
USING (is_family_member(family_id));

CREATE POLICY "Family admins can delete family accounts"
ON public.accounts FOR DELETE
USING (is_family_admin(family_id));

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Family members can view family transactions"
ON public.transactions FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Family members can create family transactions"
ON public.transactions FOR INSERT
WITH CHECK (family_id = get_user_family_id());

CREATE POLICY "Family members can update family transactions"
ON public.transactions FOR UPDATE
USING (is_family_member(family_id));

CREATE POLICY "Family admins can delete family transactions"
ON public.transactions FOR DELETE
USING (is_family_admin(family_id));

-- Budgets policies
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Family members can view family budgets"
ON public.budgets FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Family members can create family budgets"
ON public.budgets FOR INSERT
WITH CHECK (family_id = get_user_family_id());

CREATE POLICY "Family members can update family budgets"
ON public.budgets FOR UPDATE
USING (is_family_member(family_id));

CREATE POLICY "Family admins can delete family budgets"
ON public.budgets FOR DELETE
USING (is_family_admin(family_id));

-- Bills policies
DROP POLICY IF EXISTS "Users can view their own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can create their own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can update their own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can delete their own bills" ON public.bills;

CREATE POLICY "Family members can view family bills"
ON public.bills FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Family members can create family bills"
ON public.bills FOR INSERT
WITH CHECK (family_id = get_user_family_id());

CREATE POLICY "Family members can update family bills"
ON public.bills FOR UPDATE
USING (is_family_member(family_id));

CREATE POLICY "Family admins can delete family bills"
ON public.bills FOR DELETE
USING (is_family_admin(family_id));

-- Assets/Liabilities policies
DROP POLICY IF EXISTS "Users can view their own assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Users can create their own assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Users can update their own assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Users can delete their own assets/liabilities" ON public.assets_liabilities;

CREATE POLICY "Family members can view family assets/liabilities"
ON public.assets_liabilities FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Family members can create family assets/liabilities"
ON public.assets_liabilities FOR INSERT
WITH CHECK (family_id = get_user_family_id());

CREATE POLICY "Family members can update family assets/liabilities"
ON public.assets_liabilities FOR UPDATE
USING (is_family_member(family_id));

CREATE POLICY "Family admins can delete family assets/liabilities"
ON public.assets_liabilities FOR DELETE
USING (is_family_admin(family_id));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_accounts_family_id ON public.accounts(family_id);
CREATE INDEX IF NOT EXISTS idx_transactions_family_id ON public.transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_budgets_family_id ON public.budgets(family_id);
CREATE INDEX IF NOT EXISTS idx_bills_family_id ON public.bills(family_id);
CREATE INDEX IF NOT EXISTS idx_assets_liabilities_family_id ON public.assets_liabilities(family_id);

-- Trigger for updating families updated_at
CREATE TRIGGER update_families_updated_at
BEFORE UPDATE ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();