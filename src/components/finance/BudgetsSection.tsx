import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddBudgetDialog } from "./AddBudgetDialog";
import { EditBudgetDialog } from "./EditBudgetDialog";
import { BudgetDetailsDialog } from "./BudgetDetailsDialog";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CategoryTransaction {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  type: "transaction" | "bill" | "loan";
}

export const BudgetsSection = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsBudget, setDetailsBudget] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [categoryTransactions, setCategoryTransactions] = useState<Record<string, CategoryTransaction[]>>({});
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (budgetsError) throw budgetsError;

      // Get transactions for this month to calculate spent amounts
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("id, category, amount, type, description, date")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startOfMonthStr);

      if (transactionsError) throw transactionsError;

      // Fetch paid bills for this month
      const { data: paidBillsData, error: billsError } = await supabase
        .from("bills")
        .select("id, name, amount, paid_at, category")
        .eq("user_id", user.id)
        .eq("is_paid", true)
        .gte("paid_at", startOfMonthStr);

      if (billsError) throw billsError;

      // Fetch loan payments for this month
      const { data: loanPaymentsData, error: loanPaymentsError } = await supabase
        .from("loan_payments")
        .select("id, amount, payment_date, notes")
        .eq("user_id", user.id)
        .gte("payment_date", startOfMonthStr);

      if (loanPaymentsError) throw loanPaymentsError;

      // Build transactions by category
      const transByCategory: Record<string, CategoryTransaction[]> = {};

      // Add regular transactions
      (transactionsData || []).forEach((t) => {
        if (!transByCategory[t.category]) {
          transByCategory[t.category] = [];
        }
        transByCategory[t.category].push({
          id: t.id,
          description: t.description,
          amount: parseFloat(t.amount.toString()),
          date: t.date,
          type: "transaction",
        });
      });

      // Add paid bills to their actual category
      (paidBillsData || []).forEach((b) => {
        const category = b.category || "Bills";
        if (!transByCategory[category]) {
          transByCategory[category] = [];
        }
        transByCategory[category].push({
          id: b.id,
          description: b.name,
          amount: parseFloat(b.amount.toString()),
          date: b.paid_at || "",
          type: "bill" as const,
        });
      });

      // Add loan payments to "Loans" category
      if (loanPaymentsData && loanPaymentsData.length > 0) {
        transByCategory["Loans"] = (transByCategory["Loans"] || []).concat(
          loanPaymentsData.map((lp) => ({
            id: lp.id,
            description: lp.notes || "Loan Payment",
            amount: parseFloat(lp.amount.toString()),
            date: lp.payment_date,
            type: "loan" as const,
          }))
        );
      }

      // Sort transactions by date (newest first)
      Object.keys(transByCategory).forEach((cat) => {
        transByCategory[cat].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });

      setCategoryTransactions(transByCategory);

      // Calculate spent amounts per category
      const spentByCategory: Record<string, number> = {};
      Object.keys(transByCategory).forEach((cat) => {
        spentByCategory[cat] = transByCategory[cat].reduce((sum, t) => sum + t.amount, 0);
      });

      const budgetsWithSpent = (budgetsData || []).map((budget: any) => ({
        ...budget,
        spent: spentByCategory[budget.category] || 0,
      }));

      setBudgets(budgetsWithSpent);
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

  useEffect(() => {
    fetchBudgets();
  }, []);

  const overBudgetCategories = budgets.filter(b => b.spent > b.limit_amount);

  const handleEdit = (budget: any) => {
    setEditBudget(budget);
    setEditDialogOpen(true);
  };

  const handleViewDetails = (budget: any) => {
    setDetailsBudget(budget);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading budgets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Budgets</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Set limits and track spending by category</p>
        </div>
        <AddBudgetDialog onBudgetAdded={fetchBudgets} />
      </div>

      {overBudgetCategories.length > 0 && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive text-sm sm:text-base">Budget Alert</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            You're over budget in {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category' : 'categories'}: {overBudgetCategories.map(b => b.category).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <Target className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">Create your first budget to start tracking spending</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.limit_amount) * 100;
            const isOverBudget = percentage > 100;
            const remaining = budget.limit_amount - budget.spent;
            
            return (
              <Card key={budget.id} className={isOverBudget ? "border-destructive" : ""}>
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg">{budget.category}</CardTitle>
                    <div className="text-[10px] sm:text-xs text-muted-foreground capitalize">{budget.period}</div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className={`font-bold ${isOverBudget ? "text-destructive" : "text-foreground"}`}>
                        {formatAmount(budget.spent)} / {formatAmount(budget.limit_amount)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`}
                    />
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                      <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {percentage.toFixed(0)}% used
                      </span>
                      <span className={isOverBudget ? "text-destructive font-medium" : "text-success"}>
                        {isOverBudget ? (
                          <>Over by {formatAmount(Math.abs(remaining))}</>
                        ) : (
                          <>{formatAmount(remaining)} remaining</>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-1 sm:pt-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={() => handleViewDetails(budget)}>
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={() => handleEdit(budget)}>
                      Edit Budget
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EditBudgetDialog
        budget={editBudget}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onBudgetUpdated={fetchBudgets}
      />

      <BudgetDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        category={detailsBudget?.category || ""}
        transactions={categoryTransactions[detailsBudget?.category] || []}
        spent={detailsBudget?.spent || 0}
        limit={detailsBudget?.limit_amount || 0}
      />
    </div>
  );
};
