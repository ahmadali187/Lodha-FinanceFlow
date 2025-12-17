import { useState, useEffect } from "react";
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

interface Loan {
  id: string;
  name: string;
  type: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string;
  due_day: number;
  emi_amount: number;
  outstanding_balance: number;
  status: string;
  notes?: string;
}

interface EditLoanDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const EditLoanDialog = ({ loan, open, onOpenChange, onUpdate }: EditLoanDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: loan.name,
    type: loan.type,
    status: loan.status,
    outstanding_balance: loan.outstanding_balance.toString(),
    notes: loan.notes || "",
  });

  useEffect(() => {
    setFormData({
      name: loan.name,
      type: loan.type,
      status: loan.status,
      outstanding_balance: loan.outstanding_balance.toString(),
      notes: loan.notes || "",
    });
  }, [loan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("loans")
        .update({
          name: formData.name,
          type: formData.type,
          status: formData.status,
          outstanding_balance: parseFloat(formData.outstanding_balance),
          notes: formData.notes || null,
        })
        .eq("id", loan.id);

      if (error) throw error;

      toast.success("Loan updated successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating loan:", error);
      toast.error("Failed to update loan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this loan?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("loans").delete().eq("id", loan.id);

      if (error) throw error;

      toast.success("Loan deleted successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast.error("Failed to delete loan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Loan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
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
                <SelectItem value="personal_loan">Personal Loan</SelectItem>
                <SelectItem value="home_loan">Home Loan</SelectItem>
                <SelectItem value="auto_loan">Auto Loan</SelectItem>
                <SelectItem value="education_loan">Education Loan</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="outstanding">Outstanding Balance</Label>
            <Input
              id="outstanding"
              type="number"
              step="0.01"
              value={formData.outstanding_balance}
              onChange={(e) => setFormData({ ...formData, outstanding_balance: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
