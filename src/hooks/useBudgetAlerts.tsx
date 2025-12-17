import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BudgetAlert {
  category: string;
  budgetLimit: number;
  spent: number;
  percentage: number;
  currency: string;
}

export const useBudgetAlerts = () => {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgetAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month start and end
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Fetch budgets
      const { data: budgets, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("period", "monthly");

      if (budgetError) throw budgetError;

      if (!budgets || budgets.length === 0) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      // Fetch transactions for current month
      const { data: transactions, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", monthStart)
        .lte("date", monthEnd);

      if (transactionError) throw transactionError;

      // Calculate spending per category
      const categorySpending: { [key: string]: { total: number; currency: string } } = {};
      
      transactions?.forEach((transaction) => {
        const category = transaction.category;
        if (!categorySpending[category]) {
          categorySpending[category] = { total: 0, currency: transaction.currency };
        }
        categorySpending[category].total += Number(transaction.amount);
      });

      // Create alerts for categories exceeding 80% of budget
      const budgetAlerts: BudgetAlert[] = [];
      
      budgets.forEach((budget) => {
        const spent = categorySpending[budget.category]?.total || 0;
        const percentage = (spent / Number(budget.limit_amount)) * 100;
        
        if (percentage >= 80) {
          budgetAlerts.push({
            category: budget.category,
            budgetLimit: Number(budget.limit_amount),
            spent,
            percentage,
            currency: categorySpending[budget.category]?.currency || "USD",
          });
        }
      });

      setAlerts(budgetAlerts);
    } catch (error) {
      console.error("Error fetching budget alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetAlerts();
  }, []);

  return { alerts, loading, refetch: fetchBudgetAlerts };
};
