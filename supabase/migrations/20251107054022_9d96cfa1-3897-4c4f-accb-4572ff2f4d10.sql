-- Create loans table
CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  family_id uuid,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('personal_loan', 'home_loan', 'auto_loan', 'education_loan', 'credit_card', 'other')),
  principal_amount numeric NOT NULL,
  interest_rate numeric NOT NULL DEFAULT 0,
  tenure_months integer NOT NULL,
  start_date date NOT NULL,
  due_day integer NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  emi_amount numeric NOT NULL,
  outstanding_balance numeric NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted')),
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create loan_payments table
CREATE TABLE public.loan_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  payment_date date NOT NULL,
  amount numeric NOT NULL,
  principal_paid numeric NOT NULL DEFAULT 0,
  interest_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'partial')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loans
CREATE POLICY "Admins can view all loans"
  ON public.loans FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert all loans"
  ON public.loans FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all loans"
  ON public.loans FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete all loans"
  ON public.loans FOR DELETE
  USING (is_admin());

CREATE POLICY "Family members can view family loans"
  ON public.loans FOR SELECT
  USING (is_family_member(family_id));

CREATE POLICY "Family members can create family loans"
  ON public.loans FOR INSERT
  WITH CHECK (family_id = get_user_family_id());

CREATE POLICY "Family members can update family loans"
  ON public.loans FOR UPDATE
  USING (is_family_member(family_id));

CREATE POLICY "Family admins can delete family loans"
  ON public.loans FOR DELETE
  USING (is_family_admin(family_id));

-- RLS Policies for loan_payments
CREATE POLICY "Admins can view all loan payments"
  ON public.loan_payments FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert all loan payments"
  ON public.loan_payments FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all loan payments"
  ON public.loan_payments FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete all loan payments"
  ON public.loan_payments FOR DELETE
  USING (is_admin());

CREATE POLICY "Family members can view family loan payments"
  ON public.loan_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loans
      WHERE loans.id = loan_payments.loan_id
      AND is_family_member(loans.family_id)
    )
  );

CREATE POLICY "Family members can create family loan payments"
  ON public.loan_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loans
      WHERE loans.id = loan_payments.loan_id
      AND family_id = get_user_family_id()
    )
  );

CREATE POLICY "Family members can update family loan payments"
  ON public.loan_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.loans
      WHERE loans.id = loan_payments.loan_id
      AND is_family_member(loans.family_id)
    )
  );

CREATE POLICY "Family admins can delete family loan payments"
  ON public.loan_payments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.loans
      WHERE loans.id = loan_payments.loan_id
      AND is_family_admin(loans.family_id)
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_payments_updated_at
  BEFORE UPDATE ON public.loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();