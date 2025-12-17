import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditBudgetDialogProps {
  budget: {
    id: string;
    category: string;
    limit_amount: number;
    period: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBudgetUpdated: () => void;
}

export const EditBudgetDialog = ({ budget, open, onOpenChange, onBudgetUpdated }: EditBudgetDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    limit: "",
    period: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        limit: budget.limit_amount.toString(),
        period: budget.period,
      });
    }
  }, [budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from("budgets")
        .update({
          category: formData.category,
          limit_amount: parseFloat(formData.limit),
          period: formData.period,
        })
        .eq("id", budget.id);

      if (error) throw error;

      toast({
        title: "Budget updated",
        description: "Your budget has been updated successfully",
      });

      onOpenChange(false);
      onBudgetUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!budget) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.from("budgets").delete().eq("id", budget.id);

      if (error) throw error;

      toast({
        title: "Budget deleted",
        description: "Your budget has been deleted successfully",
      });

      onOpenChange(false);
      onBudgetUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update your budget details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Groceries">Groceries</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Dining Out">Dining Out</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-limit">Budget Limit</Label>
              <Input
                id="edit-limit"
                type="number"
                step="0.01"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-period">Period</Label>
              <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
