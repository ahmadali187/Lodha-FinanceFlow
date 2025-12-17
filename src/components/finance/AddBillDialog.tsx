import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { billSchema, BILL_CATEGORIES, BILL_FREQUENCIES } from "@/lib/validations/financial";
import { useCurrency } from "@/contexts/CurrencyContext";

interface AddBillDialogProps {
  onBillAdded: () => void;
}

export const AddBillDialog = ({ onBillAdded }: AddBillDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { displayCurrency } = useCurrency();
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "",
    due_date: "",
    frequency: "monthly",
    reminder_days: "3",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const amount = parseFloat(formData.amount);
      const reminderDays = parseInt(formData.reminder_days);

      // Validate with Zod
      const validationResult = billSchema.safeParse({
        name: formData.name,
        amount: isNaN(amount) ? 0 : amount,
        currency: displayCurrency,
        category: formData.category || undefined,
        due_date: formData.due_date,
        frequency: formData.frequency,
        reminder_days: isNaN(reminderDays) ? 0 : reminderDays,
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

      const { error } = await supabase.from("bills").insert({
        user_id: user.id,
        name: validationResult.data.name,
        amount: validationResult.data.amount,
        currency: validationResult.data.currency,
        category: validationResult.data.category,
        due_date: validationResult.data.due_date,
        frequency: validationResult.data.frequency,
        reminder_days: validationResult.data.reminder_days,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Bill added successfully");
      setFormData({
        name: "",
        amount: "",
        category: "",
        due_date: "",
        frequency: "monthly",
        reminder_days: "3",
      });
      setOpen(false);
      onBillAdded();
    } catch (error: any) {
      toast.error("Failed to add bill");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Bill or Subscription</DialogTitle>
            <DialogDescription>
              Track recurring bills and get reminders before they're due
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Bill Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Netflix Subscription"
                maxLength={100}
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ({displayCurrency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="999999999"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BILL_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
                {errors.due_date && <p className="text-sm text-destructive">{errors.due_date}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
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
                    {BILL_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reminder_days">Reminder (days before)</Label>
              <Input
                id="reminder_days"
                type="number"
                min="0"
                max="30"
                value={formData.reminder_days}
                onChange={(e) =>
                  setFormData({ ...formData, reminder_days: e.target.value })
                }
                required
              />
              {errors.reminder_days && <p className="text-sm text-destructive">{errors.reminder_days}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
