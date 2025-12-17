-- Add user-based RLS policies for accounts table
CREATE POLICY "Users can view their own accounts"
ON public.accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
ON public.accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
ON public.accounts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
ON public.accounts
FOR DELETE
USING (auth.uid() = user_id);

-- Add user-based RLS policies for transactions table
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.transactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add user-based RLS policies for budgets table
CREATE POLICY "Users can view their own budgets"
ON public.budgets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
ON public.budgets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
ON public.budgets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
ON public.budgets
FOR DELETE
USING (auth.uid() = user_id);

-- Add user-based RLS policies for bills table
CREATE POLICY "Users can view their own bills"
ON public.bills
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bills"
ON public.bills
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
ON public.bills
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
ON public.bills
FOR DELETE
USING (auth.uid() = user_id);