-- Only create policies that don't exist yet (using DROP IF EXISTS first)

-- LOANS
DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can create their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can update their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can delete their own loans" ON public.loans;
DROP POLICY IF EXISTS "Admins can view all loans" ON public.loans;
DROP POLICY IF EXISTS "Admins can insert all loans" ON public.loans;
DROP POLICY IF EXISTS "Admins can update all loans" ON public.loans;
DROP POLICY IF EXISTS "Admins can delete all loans" ON public.loans;

CREATE POLICY "Users can view their own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loans" ON public.loans FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all loans" ON public.loans FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert all loans" ON public.loans FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update all loans" ON public.loans FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all loans" ON public.loans FOR DELETE USING (public.is_admin());

-- LOAN_PAYMENTS
DROP POLICY IF EXISTS "Users can view their own loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Users can create their own loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Users can update their own loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Users can delete their own loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Admins can view all loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Admins can insert all loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Admins can update all loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Admins can delete all loan payments" ON public.loan_payments;

CREATE POLICY "Users can view their own loan payments" ON public.loan_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own loan payments" ON public.loan_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loan payments" ON public.loan_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loan payments" ON public.loan_payments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all loan payments" ON public.loan_payments FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert all loan payments" ON public.loan_payments FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update all loan payments" ON public.loan_payments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all loan payments" ON public.loan_payments FOR DELETE USING (public.is_admin());

-- ASSETS_LIABILITIES
DROP POLICY IF EXISTS "Users can view their own assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Users can create their own assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Users can update their own assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Users can delete their own assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Admins can view all assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Admins can insert all assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Admins can update all assets/liabilities" ON public.assets_liabilities;
DROP POLICY IF EXISTS "Admins can delete all assets/liabilities" ON public.assets_liabilities;

CREATE POLICY "Users can view their own assets/liabilities" ON public.assets_liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assets/liabilities" ON public.assets_liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets/liabilities" ON public.assets_liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets/liabilities" ON public.assets_liabilities FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all assets/liabilities" ON public.assets_liabilities FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert all assets/liabilities" ON public.assets_liabilities FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update all assets/liabilities" ON public.assets_liabilities FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all assets/liabilities" ON public.assets_liabilities FOR DELETE USING (public.is_admin());