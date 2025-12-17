-- =============================================
-- COMPLETE FAMILY FEATURE REMOVAL MIGRATION
-- =============================================

-- Step 1: Drop family-based RLS policies from accounts
DROP POLICY IF EXISTS "Family members can view family accounts" ON public.accounts;
DROP POLICY IF EXISTS "Family members can create family accounts" ON public.accounts;
DROP POLICY IF EXISTS "Family members can update family accounts" ON public.accounts;
DROP POLICY IF EXISTS "Family admins can delete family accounts" ON public.accounts;

-- Step 2: Drop family-based RLS policies from transactions
DROP POLICY IF EXISTS "Family members can view family transactions" ON public.transactions;
DROP POLICY IF EXISTS "Family members can create family transactions" ON public.transactions;
DROP POLICY IF EXISTS "Family members can update family transactions" ON public.transactions;
DROP POLICY IF EXISTS "Family admins can delete family transactions" ON public.transactions;

-- Step 3: Drop family-based RLS policies from budgets
DROP POLICY IF EXISTS "Family members can view family budgets" ON public.budgets;
DROP POLICY IF EXISTS "Family members can create family budgets" ON public.budgets;
DROP POLICY IF EXISTS "Family members can update family budgets" ON public.budgets;
DROP POLICY IF EXISTS "Family admins can delete family budgets" ON public.budgets;

-- Step 4: Drop family-based RLS policies from bills
DROP POLICY IF EXISTS "Family members can view family bills" ON public.bills;
DROP POLICY IF EXISTS "Family members can create family bills" ON public.bills;
DROP POLICY IF EXISTS "Family members can update family bills" ON public.bills;
DROP POLICY IF EXISTS "Family admins can delete family bills" ON public.bills;

-- Step 5: Drop family-based RLS policies from assets_liabilities
DROP POLICY IF EXISTS "Family members can view family assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Family members can create family assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Family members can update family assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Family admins can delete family assets/liabilities" ON public.assets_liabilities;

-- Step 6: Drop family-based RLS policies from loans
DROP POLICY IF EXISTS "Family members can view family loans" ON public.loans;
DROP POLICY IF EXISTS "Family members can create family loans" ON public.loans;
DROP POLICY IF EXISTS "Family members can update family loans" ON public.loans;
DROP POLICY IF EXISTS "Family admins can delete family loans" ON public.loans;

-- Step 7: Drop family-based RLS policies from loan_payments
DROP POLICY IF EXISTS "Family members can view family loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Family members can create family loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Family members can update family loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Family admins can delete family loan payments" ON public.loan_payments;

-- Step 8: Drop family_id columns from all tables
ALTER TABLE public.accounts DROP COLUMN IF EXISTS family_id;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS family_id;
ALTER TABLE public.budgets DROP COLUMN IF EXISTS family_id;
ALTER TABLE public.bills DROP COLUMN IF EXISTS family_id;
ALTER TABLE public.loans DROP COLUMN IF EXISTS family_id;
ALTER TABLE public.assets_liabilities DROP COLUMN IF EXISTS family_id;

-- Step 9: Drop use_family_mode column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS use_family_mode;

-- Step 10: Drop family_members table policies and table
DROP POLICY IF EXISTS "Users can view their family members" ON public.family_members;
DROP POLICY IF EXISTS "Admins can view all family members" ON public.family_members;
DROP POLICY IF EXISTS "Family admins can add members" ON public.family_members;
DROP POLICY IF EXISTS "Family admins can update member roles" ON public.family_members;
DROP POLICY IF EXISTS "Family admins can remove members" ON public.family_members;
DROP TABLE IF EXISTS public.family_members;

-- Step 11: Drop families table policies and table
DROP POLICY IF EXISTS "Users can view their own family" ON public.families;
DROP POLICY IF EXISTS "Users can create families" ON public.families;
DROP POLICY IF EXISTS "Family admins can update their family" ON public.families;
DROP POLICY IF EXISTS "Admins can view all families" ON public.families;
DROP TABLE IF EXISTS public.families;

-- Step 12: Drop family-related functions
DROP FUNCTION IF EXISTS public.is_family_member(uuid);
DROP FUNCTION IF EXISTS public.is_family_admin(uuid);
DROP FUNCTION IF EXISTS public.get_user_family_id();

-- Step 13: Drop family_role enum type
DROP TYPE IF EXISTS public.family_role;