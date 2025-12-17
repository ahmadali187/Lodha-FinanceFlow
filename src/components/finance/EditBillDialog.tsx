import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Bill {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  due_date: string;
  frequency: string;
  is_active: boolean;
  reminder_days: number;
  is_paid?: boolean;
  paid_at?: string;
}

interface EditBillDialogProps {
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBillUpdated: () => void;
}

const categories = ["Rent", "Utilities", "Internet", "Phone", "Subscriptions", "Insurance", "Loan", "Other"];
const frequencies = ["monthly", "yearly", "weekly", "quarterly"];

export const EditBillDialog = ({
  bill,
  open,
  onOpenChange,
  onBillUpdated,
}: EditBillDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { displayCurrency } = useCurrency();
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "",
    due_date: "",
    frequency: "monthly",
    reminder_days: "3",
  });

  useEffect(() => {
    if (bill) {
      setFormData({
        name: bill.name,
        amount: bill.amount.toString(),
        category: bill.category,
        due_date: bill.due_date,
        frequency: bill.frequency,
        reminder_days: bill.reminder_days.toString(),
      });
    }
  }, [bill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("bills")
        .update({
          name: formData.name,
          amount: parseFloat(formData.amount),
          currency: displayCurrency,
          category: formData.category,
          due_date: formData.due_date,
          frequency: formData.frequency,
          reminder_days: parseInt(formData.reminder_days),
        })
        .eq("id", bill.id);

      if (error) throw error;

      toast.success("Bill updated successfully");
      onBillUpdated();
    } catch (error: any) {
      toast.error("Failed to update bill");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!bill) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("bills")
        .update({ is_active: false })
        .eq("id", bill.id);

      if (error) throw error;

      toast.success("Bill deleted successfully");
      onBillUpdated();
    } catch (error: any) {
      toast.error("Failed to delete bill");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!bill) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Calculate next due date based on frequency
      const currentDueDate = new Date(formData.due_date);
      let nextDueDate = new Date(currentDueDate);
      
      switch (formData.frequency) {
        case "weekly":
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case "monthly":
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case "quarterly":
          nextDueDate.setMonth(nextDueDate.getMonth() + 3);
          break;
        case "yearly":
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          break;
      }

      // Create transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          description: formData.name,
          amount: parseFloat(formData.amount),
          type: "expense",
          category: formData.category,
          currency: displayCurrency,
          date: new Date().toISOString().split('T')[0],
        });

      if (transactionError) throw transactionError;

      // Update bill with next due date and reset paid status
      const { error: billError } = await supabase
        .from("bills")
        .update({ 
          is_paid: false,
          paid_at: new Date().toISOString(),
          due_date: nextDueDate.toISOString().split('T')[0]
        })
        .eq("id", bill.id);

      if (billError) throw billError;

      toast.success("Payment recorded and next bill scheduled");
      onBillUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to mark bill as paid");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
            <DialogDescription>
              Update bill details or delete it
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Bill Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount ({displayCurrency})</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-due_date">Due Date</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-reminder_days">Reminder (days before)</Label>
              <Input
                id="edit-reminder_days"
                type="number"
                min="0"
                value={formData.reminder_days}
                onChange={(e) =>
                  setFormData({ ...formData, reminder_days: e.target.value })
                }
                required
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="default"
                onClick={handleMarkAsPaid}
                disabled={loading}
              >
                Mark as Paid
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};