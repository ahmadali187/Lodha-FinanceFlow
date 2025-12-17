-- Create assets_liabilities table for net worth tracking
CREATE TABLE public.assets_liabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability')),
  name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets_liabilities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own assets/liabilities"
ON public.assets_liabilities
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assets/liabilities"
ON public.assets_liabilities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets/liabilities"
ON public.assets_liabilities
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets/liabilities"
ON public.assets_liabilities
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_assets_liabilities_updated_at
BEFORE UPDATE ON public.assets_liabilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();