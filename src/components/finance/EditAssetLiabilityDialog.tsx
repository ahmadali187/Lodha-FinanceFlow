import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

const assetCategories = ["Cash", "Savings", "Investments", "Real Estate", "Vehicles", "Other"];
const liabilityCategories = ["Credit Card", "Loan", "Mortgage", "Student Loan", "Other"];

interface AssetLiability {
  id: string;
  type: "asset" | "liability";
  name: string;
  value: number;
  category: string;
  date: string;
  currency: string;
  notes?: string;
}

interface EditAssetLiabilityDialogProps {
  item: AssetLiability;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAssetLiabilityDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: EditAssetLiabilityDialogProps) {
  const [loading, setLoading] = useState(false);
  const { displayCurrency } = useCurrency();
  const [formData, setFormData] = useState({
    type: item.type,
    name: item.name,
    value: String(item.value),
    category: item.category,
    date: item.date,
    notes: item.notes || "",
  });
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      type: item.type,
      name: item.name,
      value: String(item.value),
      category: item.category,
      date: item.date,
      notes: item.notes || "",
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("assets_liabilities")
        .update({
          type: formData.type,
          name: formData.name,
          value: parseFloat(formData.value),
          category: formData.category,
          date: formData.date,
          currency: displayCurrency,
          notes: formData.notes || null,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = formData.type === "asset" ? assetCategories : liabilityCategories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Asset/Liability</DialogTitle>
          <DialogDescription>
            Update the details of your asset or liability
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "asset" | "liability") =>
                setFormData({ ...formData, type: value, category: "" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value ({displayCurrency})</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}