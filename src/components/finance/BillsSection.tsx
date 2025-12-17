import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddBillDialog } from "./AddBillDialog";
import { EditBillDialog } from "./EditBillDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, differenceInDays } from "date-fns";
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

interface BillsSectionProps {
  onDataChange?: () => void;
}

export const BillsSection = ({ onDataChange }: BillsSectionProps) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { formatAmount } = useCurrency();

  const fetchBills = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch bills");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleBillAdded = () => {
    fetchBills();
    onDataChange?.();
  };

  const handleBillUpdated = () => {
    fetchBills();
    onDataChange?.();
    setEditDialogOpen(false);
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setEditDialogOpen(true);
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const getUpcomingBills = () => {
    return bills.filter(bill => {
      // Don't show paid bills in upcoming
      if (bill.is_paid) return false;
      
      const daysUntil = getDaysUntilDue(bill.due_date);
      return daysUntil >= 0 && daysUntil <= bill.reminder_days;
    });
  };

  const upcomingBills = getUpcomingBills();

  if (loading) {
    return <div className="text-center p-8">Loading bills...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Bills & Subscriptions</h2>
        <AddBillDialog onBillAdded={handleBillAdded} />
      </div>

      {upcomingBills.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            You have {upcomingBills.length} bill(s) due soon!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {bills.map((bill) => {
          const daysUntil = getDaysUntilDue(bill.due_date);
          const isDueSoon = daysUntil >= 0 && daysUntil <= bill.reminder_days;
          const isOverdue = daysUntil < 0 && !bill.is_paid;
          const isPaid = bill.is_paid;

          return (
            <Card
              key={bill.id}
              className={`p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow ${
                isPaid
                  ? "border-success bg-success/5"
                  : isOverdue
                  ? "border-destructive"
                  : isDueSoon
                  ? "border-warning"
                  : ""
              }`}
              onClick={() => handleEditBill(bill)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{bill.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {bill.category}
                    </p>
                  </div>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                </div>

                <div className="space-y-1">
                  <p className="text-xl sm:text-2xl font-bold truncate">
                    {formatAmount(Number(bill.amount), bill.currency)}
                  </p>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {isPaid ? "Next due: " : "Due: "}
                      {format(new Date(bill.due_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                    {bill.frequency}
                  </p>
                </div>

                {isPaid && (
                  <p className="text-xs sm:text-sm text-success font-medium">
                    ✓ Paid - Due in {daysUntil} days
                  </p>
                )}
                {isOverdue && (
                  <p className="text-xs sm:text-sm text-destructive font-medium">
                    Overdue by {Math.abs(daysUntil)} days
                  </p>
                )}
                {isDueSoon && !isOverdue && !isPaid && (
                  <p className="text-xs sm:text-sm text-warning font-medium">
                    Due in {daysUntil} days
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {bills.length === 0 && (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No bills or subscriptions yet. Add one to get started!
          </p>
        </Card>
      )}

      <EditBillDialog
        bill={editingBill}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onBillUpdated={handleBillUpdated}
      />
    </div>
  );
};