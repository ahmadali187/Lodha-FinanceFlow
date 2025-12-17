import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Loan {
  id: string;
  name: string;
  emi_amount: number;
  outstanding_balance: number;
  interest_rate: number;
  currency: string;
}

interface LoanPaymentDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayment: () => void;
}

export const LoanPaymentDialog = ({ loan, open, onOpenChange, onPayment }: LoanPaymentDialogProps) => {
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: loan.emi_amount.toString(),
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const calculateSplit = (amount: number) => {
    const monthlyRate = loan.interest_rate / 12 / 100;
    const interestPaid = loan.outstanding_balance * monthlyRate;
    const principalPaid = amount - interestPaid;
    return { principalPaid, interestPaid };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const amount = parseFloat(formData.amount);
      const { principalPaid, interestPaid } = calculateSplit(amount);
      const newBalance = Math.max(0, loan.outstanding_balance - principalPaid);

      const { error: paymentError } = await supabase.from("loan_payments").insert({
        loan_id: loan.id,
        user_id: user.id,
        payment_date: formData.payment_date,
        amount,
        principal_paid: principalPaid,
        interest_paid: interestPaid,
        status: "paid",
        notes: formData.notes || null,
      });

      if (paymentError) throw paymentError;

      const updateData: any = {
        outstanding_balance: newBalance,
      };

      if (newBalance === 0) {
        updateData.status = "closed";
      }

      const { error: loanError } = await supabase
        .from("loans")
        .update(updateData)
        .eq("id", loan.id);

      if (loanError) throw loanError;

      toast.success("Payment recorded successfully");
      onPayment();
      onOpenChange(false);
      setFormData({
        amount: loan.emi_amount.toString(),
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const amount = parseFloat(formData.amount) || 0;
  const { principalPaid, interestPaid } = calculateSplit(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment - {loan.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding Balance:</span>
              <span className="font-semibold">{formatAmount(loan.outstanding_balance, loan.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Regular EMI:</span>
              <span className="font-semibold">{formatAmount(loan.emi_amount, loan.currency)}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Payment Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          {amount > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p className="font-semibold">Payment Breakdown:</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Principal:</span>
                <span>{formatAmount(principalPaid, loan.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest:</span>
                <span>{formatAmount(interestPaid, loan.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>New Balance:</span>
                <span>{formatAmount(Math.max(0, loan.outstanding_balance - principalPaid), loan.currency)}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Payment details or remarks"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
