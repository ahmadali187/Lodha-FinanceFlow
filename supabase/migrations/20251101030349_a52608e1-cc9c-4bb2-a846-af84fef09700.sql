-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.is_admin());

-- Update RLS policies for all tables to allow admin access

-- Accounts
CREATE POLICY "Admins can view all accounts"
  ON public.accounts
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert all accounts"
  ON public.accounts
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all accounts"
  ON public.accounts
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete all accounts"
  ON public.accounts
  FOR DELETE
  USING (public.is_admin());

-- Transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert all transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all transactions"
  ON public.transactions
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete all transactions"
  ON public.transactions
  FOR DELETE
  USING (public.is_admin());

-- Budgets
CREATE POLICY "Admins can view all budgets"
  ON public.budgets
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert all budgets"
  ON public.budgets
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all budgets"
  ON public.budgets
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete all budgets"
  ON public.budgets
  FOR DELETE
  USING (public.is_admin());

-- Bills
CREATE POLICY "Admins can view all bills"
  ON public.bills
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert all bills"
  ON public.bills
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all bills"
  ON public.bills
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete all bills"
  ON public.bills
  FOR DELETE
  USING (public.is_admin());

-- Assets/Liabilities
CREATE POLICY "Admins can view all assets/liabilities"
  ON public.assets_liabilities
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert all assets/liabilities"
  ON public.assets_liabilities
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all assets/liabilities"
  ON public.assets_liabilities
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete all assets/liabilities"
  ON public.assets_liabilities
  FOR DELETE
  USING (public.is_admin());

-- Profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());