import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { Receipt, CreditCard, Landmark } from "lucide-react";

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  type: "transaction" | "bill" | "loan";
}

interface BudgetDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  transactions: Transaction[];
  spent: number;
  limit: number;
}

export const BudgetDetailsDialog = ({
  open,
  onOpenChange,
  category,
  transactions,
  spent,
  limit,
}: BudgetDetailsDialogProps) => {
  const { formatAmount } = useCurrency();
  const percentage = (spent / limit) * 100;
  const isOverBudget = percentage > 100;

  const getIcon = (type: string) => {
    switch (type) {
      case "bill":
        return <Receipt className="h-4 w-4 text-primary" />;
      case "loan":
        return <Landmark className="h-4 w-4 text-secondary" />;
      default:
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "bill":
        return "Bill Payment";
      case "loan":
        return "Loan Payment";
      default:
        return "Transaction";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{category} Budget Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Spent</span>
              <span className={`font-semibold ${isOverBudget ? "text-destructive" : ""}`}>
                {formatAmount(spent)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Limit</span>
              <span className="font-semibold">{formatAmount(limit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isOverBudget ? "Over Budget" : "Remaining"}
              </span>
              <span className={`font-semibold ${isOverBudget ? "text-destructive" : "text-success"}`}>
                {isOverBudget ? "-" : ""}{formatAmount(Math.abs(limit - spent))}
              </span>
            </div>
          </div>

          {/* Transaction List */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              Transactions ({transactions.length})
            </h4>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transactions this month
              </p>
            ) : (
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-2">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 bg-card border rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getIcon(t.type)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t.description || getTypeLabel(t.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-destructive ml-2">
                        -{formatAmount(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
