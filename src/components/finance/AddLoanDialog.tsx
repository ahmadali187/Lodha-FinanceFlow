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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { loanSchema, LOAN_TYPES } from "@/lib/validations/financial";

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  personal_loan: "Personal Loan",
  home_loan: "Home Loan",
  auto_loan: "Auto Loan",
  education_loan: "Education Loan",
  credit_card: "Credit Card",
  other: "Other",
};

export const AddLoanDialog = ({ open, onOpenChange, onAdd }: AddLoanDialogProps) => {
  const { displayCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    type: "personal_loan",
    principal_amount: "",
    interest_rate: "",
    tenure_months: "",
    start_date: new Date().toISOString().split("T")[0],
    due_day: "1",
    notes: "",
  });

  const calculateEMI = (principal: number, rate: number, months: number) => {
    if (rate === 0) return principal / months;
    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                 (Math.pow(1 + monthlyRate, months) - 1);
    return emi;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const principal = parseFloat(formData.principal_amount);
      const rate = parseFloat(formData.interest_rate);
      const months = parseInt(formData.tenure_months);
      const dueDay = parseInt(formData.due_day);

      // Validate with Zod
      const validationResult = loanSchema.safeParse({
        name: formData.name,
        type: formData.type,
        principal_amount: isNaN(principal) ? 0 : principal,
        interest_rate: isNaN(rate) ? 0 : rate,
        tenure_months: isNaN(months) ? 0 : months,
        start_date: formData.start_date,
        due_day: isNaN(dueDay) ? 0 : dueDay,
        notes: formData.notes || undefined,
      });

      if (!validationResult.success) {
        const fieldErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      const emi = calculateEMI(validationResult.data.principal_amount, validationResult.data.interest_rate, validationResult.data.tenure_months);

      const { error } = await supabase.from("loans").insert({
        user_id: user.id,
        name: validationResult.data.name,
        type: validationResult.data.type,
        principal_amount: validationResult.data.principal_amount,
        interest_rate: validationResult.data.interest_rate,
        tenure_months: validationResult.data.tenure_months,
        start_date: validationResult.data.start_date,
        due_day: validationResult.data.due_day,
        emi_amount: emi,
        outstanding_balance: validationResult.data.principal_amount,
        currency: displayCurrency,
        notes: validationResult.data.notes || null,
      });

      if (error) throw error;

      toast.success("Loan added successfully");
      onAdd();
      onOpenChange(false);
      setFormData({
        name: "",
        type: "personal_loan",
        principal_amount: "",
        interest_rate: "",
        tenure_months: "",
        start_date: new Date().toISOString().split("T")[0],
        due_day: "1",
        notes: "",
      });
    } catch (error) {
      console.error("Error adding loan:", error);
      toast.error("Failed to add loan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Loan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Home Loan - HDFC"
              maxLength={100}
              required
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="type">Loan Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {LOAN_TYPE_LABELS[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="principal">Principal Amount</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                min="0.01"
                max="999999999999"
                value={formData.principal_amount}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                placeholder="100000"
                required
              />
              {errors.principal_amount && <p className="text-sm text-destructive">{errors.principal_amount}</p>}
            </div>

            <div>
              <Label htmlFor="rate">Interest Rate (% p.a.)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                placeholder="8.5"
                required
              />
              {errors.interest_rate && <p className="text-sm text-destructive">{errors.interest_rate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tenure">Tenure (Months)</Label>
              <Input
                id="tenure"
                type="number"
                min="1"
                max="600"
                value={formData.tenure_months}
                onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                placeholder="60"
                required
              />
              {errors.tenure_months && <p className="text-sm text-destructive">{errors.tenure_months}</p>}
            </div>

            <div>
              <Label htmlFor="due_day">Due Day of Month</Label>
              <Input
                id="due_day"
                type="number"
                min="1"
                max="31"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                required
              />
              {errors.due_day && <p className="text-sm text-destructive">{errors.due_day}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            {errors.start_date && <p className="text-sm text-destructive">{errors.start_date}</p>}
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details about this loan"
              maxLength={500}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Loan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
