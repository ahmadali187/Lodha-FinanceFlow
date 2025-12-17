-- Add currency support to accounts table
ALTER TABLE public.accounts 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

-- Add currency to transactions table
ALTER TABLE public.transactions 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

-- Create bills/subscriptions table
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL,
  due_date DATE NOT NULL,
  frequency TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reminder_days INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bills table
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bills
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

-- Add trigger for updated_at
CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();