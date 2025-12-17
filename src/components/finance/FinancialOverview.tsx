import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Pie, PieChart, Cell, XAxis, YAxis } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { startOfToday, endOfToday, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FinancialOverviewProps {
  onDataChange?: () => void;
}

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  type: string;
  date: string;
  category: string;
  source?: "transaction" | "bill" | "loan";
}

interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  period: string;
  spent: number;
  billsSpent: number;
  transactionsSpent: number;
  loansSpent: number;
  color: string;
}

export const FinancialOverview = ({ onDataChange }: FinancialOverviewProps = {}) => {
  const [filterPeriod, setFilterPeriod] = useState<"today" | "this-month" | "last-month" | "this-year">("this-month");
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = () => {
    const now = new Date();
    switch (filterPeriod) {
      case "today":
        return { start: startOfToday(), end: endOfToday() };
      case "this-month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last-month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "this-year":
        return { start: startOfYear(now), end: endOfYear(now) };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { start, end } = getDateRange();
      
      // Fetch transactions for the period
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"))
        .order("date", { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch paid bills for the period
      const { data: paidBillsData, error: billsError } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_paid", true)
        .gte("paid_at", format(start, "yyyy-MM-dd"))
        .lte("paid_at", format(end, "yyyy-MM-dd"));

      if (billsError) throw billsError;

      // Fetch loan payments for the period
      const { data: loanPaymentsData, error: loanPaymentsError } = await supabase
        .from("loan_payments")
        .select("*")
        .eq("user_id", user.id)
        .gte("payment_date", format(start, "yyyy-MM-dd"))
        .lte("payment_date", format(end, "yyyy-MM-dd"));

      if (loanPaymentsError) throw loanPaymentsError;

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (budgetsError) throw budgetsError;

      // Calculate spending per category for the period - track bills and transactions separately
      const categorySpending: { [key: string]: { transactions: number; bills: number; loans: number } } = {};
      
      // Helper to ensure category exists
      const ensureCategory = (category: string) => {
        if (!categorySpending[category]) {
          categorySpending[category] = { transactions: 0, bills: 0, loans: 0 };
        }
      };

      transactionsData?.forEach((transaction) => {
        if (transaction.type === "expense") {
          const amount = parseFloat(transaction.amount.toString());
          ensureCategory(transaction.category);
          categorySpending[transaction.category].transactions += amount;
        }
      });

      // Add paid bills to their actual categories
      paidBillsData?.forEach((bill) => {
        const amount = parseFloat(bill.amount.toString());
        ensureCategory(bill.category);
        categorySpending[bill.category].bills += amount;
      });

      // Add loan payments to "Loans" category
      loanPaymentsData?.forEach((payment) => {
        const amount = parseFloat(payment.amount.toString());
        ensureCategory("Loans");
        categorySpending["Loans"].loans += amount;
      });

      // Map budgets with actual spending
      const chartColors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
        "hsl(var(--primary))",
        "hsl(var(--secondary))",
      ];

      const budgetsWithSpending = budgetsData?.map((budget, index) => {
        const spending = categorySpending[budget.category] || { transactions: 0, bills: 0, loans: 0 };
        const totalSpent = spending.transactions + spending.bills + spending.loans;
        return {
          id: budget.id,
          category: budget.category,
          limit_amount: parseFloat(budget.limit_amount.toString()),
          period: budget.period,
          spent: totalSpent,
          billsSpent: spending.bills,
          transactionsSpent: spending.transactions,
          loansSpent: spending.loans,
          color: chartColors[index % chartColors.length],
        };
      }) || [];

      // Create combined transactions list including bills and loans for display
      const allTransactions: Transaction[] = [
        ...(transactionsData?.map(t => ({
          id: t.id,
          description: t.description,
          amount: parseFloat(t.amount.toString()),
          type: t.type,
          date: t.date,
          category: t.category,
          source: "transaction" as const,
        })) || []),
        ...(paidBillsData?.map(b => ({
          id: b.id,
          description: `Bill: ${b.name}`,
          amount: parseFloat(b.amount.toString()),
          type: "expense" as string,
          date: b.paid_at ? format(new Date(b.paid_at), "yyyy-MM-dd") : b.due_date,
          category: b.category,
          source: "bill" as const,
        })) || []),
        ...(loanPaymentsData?.map(lp => ({
          id: lp.id,
          description: `Loan Payment`,
          amount: parseFloat(lp.amount.toString()),
          type: "expense" as string,
          date: lp.payment_date,
          category: "Loans",
          source: "loan" as const,
        })) || []),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);
      setBudgets(budgetsWithSpending);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterPeriod]);

  // Calculate chart data from real transactions
  const getChartData = () => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
    
    if (filterPeriod === "today") {
      // Group by hour
      const hourlyData: { [key: string]: number } = {};
      transactions.forEach(t => {
        if (t.type === "expense") {
          const hour = new Date(t.date).getHours();
          const timeKey = `${hour.toString().padStart(2, '0')}:00`;
          hourlyData[timeKey] = (hourlyData[timeKey] || 0) + t.amount;
        }
      });
      
      const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];
      let cumulative = 0;
      return hours.map(time => {
        cumulative += hourlyData[time] || 0;
        return { time, expenses: cumulative, budget: totalBudget };
      });
    } else if (filterPeriod === "this-month" || filterPeriod === "last-month") {
      // Group by week
      const weeklyData: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
      transactions.forEach(t => {
        if (t.type === "expense") {
          const date = new Date(t.date);
          const day = date.getDate();
          const week = Math.ceil(day / 7);
          weeklyData[week] = (weeklyData[week] || 0) + t.amount;
        }
      });
      
      return [1, 2, 3, 4].map(week => ({
        time: `Week ${week}`,
        expenses: weeklyData[week] || 0,
        budget: totalBudget / 4,
      }));
    } else {
      // Group by month for this-year
      const monthlyData: { [key: string]: number } = {};
      transactions.forEach(t => {
        if (t.type === "expense") {
          const month = format(new Date(t.date), "MMM");
          monthlyData[month] = (monthlyData[month] || 0) + t.amount;
        }
      });
      
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.map(month => ({
        time: month,
        expenses: monthlyData[month] || 0,
        budget: totalBudget,
      }));
    }
  };

  const chartData = getChartData();

  const chartConfig = {
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
    budget: {
      label: "Budget",
      color: "hsl(var(--primary))",
    },
  };

  // Pie chart data
  const pieChartData = budgets.map((budget) => ({
    name: budget.category,
    value: budget.spent,
    color: budget.color,
  }));

  const pieChartConfig = {
    value: {
      label: "Spent",
    },
    groceries: {
      label: "Groceries",
      color: "hsl(var(--chart-1))",
    },
    entertainment: {
      label: "Entertainment",
      color: "hsl(var(--chart-2))",
    },
    transportation: {
      label: "Transportation",
      color: "hsl(var(--chart-3))",
    },
    diningOut: {
      label: "Dining Out",
      color: "hsl(var(--chart-4))",
    },
    bills: {
      label: "Bills",
      color: "hsl(var(--chart-5))",
    },
    loans: {
      label: "Loans",
      color: "hsl(var(--primary))",
    },
  };
  const budgetAlerts = budgets.map(budget => {
    const percentage = (budget.spent / budget.limit_amount) * 100;
    let severity: "warning" | "critical" | null = null;
    
    if (percentage >= 90) {
      severity = "critical";
    } else if (percentage >= 50) {
      severity = "warning";
    }
    
    return {
      category: budget.category,
      percentage: percentage.toFixed(0),
      spent: budget.spent,
      limit: budget.limit_amount,
      severity
    };
  }).filter(alert => alert.severity !== null);

  // Generate AI Suggestions based on real data
  const generateAISuggestions = () => {
    const suggestions = [];
    
    // Check high budget usage
    budgets.forEach(budget => {
      const percentage = (budget.spent / budget.limit_amount) * 100;
      if (percentage >= 75 && percentage < 90) {
        suggestions.push({
          title: `Watch ${budget.category} Spending`,
          description: `You've spent ${percentage.toFixed(0)}% of your ${budget.category} budget ($${budget.spent.toFixed(2)} of $${budget.limit_amount.toFixed(2)}).`,
          priority: "medium",
        });
      }
    });

    // Check for savings opportunity
    const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const savings = totalIncome - totalExpenses;
    
    if (savings > 1000) {
      suggestions.push({
        title: "Investment Opportunity",
        description: `You have $${savings.toFixed(2)} in savings this period. Consider investing for better returns.`,
        priority: "high",
      });
    }

    // Category-specific suggestions
    const categoryTotals: { [key: string]: number } = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] > 200) {
      suggestions.push({
        title: `Optimize ${topCategory[0]} Spending`,
        description: `${topCategory[0]} is your highest expense category at $${topCategory[1].toFixed(2)}. Look for ways to reduce costs.`,
        priority: "low",
      });
    }

    return suggestions.length > 0 ? suggestions : [
      {
        title: "Great Financial Health!",
        description: "Keep up the good work managing your finances.",
        priority: "low",
      }
    ];
  };

  const aiSuggestions = generateAISuggestions();

  // Show toast notifications for critical alerts on mount
  useEffect(() => {
    const criticalAlerts = budgetAlerts.filter(alert => alert.severity === "critical");
    if (criticalAlerts.length > 0) {
      criticalAlerts.forEach(alert => {
        toast({
          title: "Critical Budget Alert!",
          description: `${alert.category}: ${alert.percentage}% of budget used (${formatAmount(alert.spent)}/${formatAmount(alert.limit)})`,
          variant: "destructive",
        });
      });
    }
  }, []);

  // Get recent transactions for display (max 5)
  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading financial data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Period */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filter Metrics</CardTitle>
            <Select value={filterPeriod} onValueChange={(value: any) => setFilterPeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-3">
          {budgetAlerts.map((alert) => (
            <Alert 
              key={alert.category}
              variant={alert.severity === "critical" ? "destructive" : "default"}
              className={alert.severity === "warning" ? "border-warning bg-warning/10" : ""}
            >
              {alert.severity === "critical" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              <AlertTitle>
                {alert.severity === "critical" ? "Critical Alert" : "Warning"} - {alert.category}
              </AlertTitle>
              <AlertDescription>
                You've used <strong>{alert.percentage}%</strong> of your budget 
                ({formatAmount(alert.spent)} of {formatAmount(alert.limit)}). 
                {alert.severity === "critical" 
                  ? " Immediate action recommended!" 
                  : " Consider reviewing your spending."}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Expense & Budget Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Expense & Budget Trends</CardTitle>
          <CardDescription>Track your spending against your budget for {filterPeriod.replace('-', ' ')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tickFormatter={(value) => formatAmount(value)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="budget"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorBudget)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--destructive))"
                fillOpacity={1}
                fill="url(#colorExpenses)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Spending Pie Chart with Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>Category breakdown with bills vs transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieChartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            
            {/* Category Breakdown */}
            <div className="mt-4 space-y-3 max-h-[200px] overflow-y-auto">
              {budgets.filter(b => b.spent > 0).map((budget) => (
                <div key={budget.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: budget.color }}
                      />
                      <span className="font-medium">{budget.category}</span>
                    </div>
                    <span className="text-muted-foreground">{formatAmount(budget.spent)}</span>
                  </div>
                  
                  {/* Breakdown bar */}
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    {budget.transactionsSpent > 0 && (
                      <div 
                        className="bg-primary h-full" 
                        style={{ width: `${(budget.transactionsSpent / budget.spent) * 100}%` }}
                        title={`Transactions: ${formatAmount(budget.transactionsSpent)}`}
                      />
                    )}
                    {budget.billsSpent > 0 && (
                      <div 
                        className="bg-chart-2 h-full" 
                        style={{ width: `${(budget.billsSpent / budget.spent) * 100}%` }}
                        title={`Bills: ${formatAmount(budget.billsSpent)}`}
                      />
                    )}
                    {budget.loansSpent > 0 && (
                      <div 
                        className="bg-chart-4 h-full" 
                        style={{ width: `${(budget.loansSpent / budget.spent) * 100}%` }}
                        title={`Loans: ${formatAmount(budget.loansSpent)}`}
                      />
                    )}
                  </div>
                  
                  {/* Legend for breakdown */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {budget.transactionsSpent > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        Transactions: {formatAmount(budget.transactionsSpent)}
                      </span>
                    )}
                    {budget.billsSpent > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-chart-2" />
                        Bills: {formatAmount(budget.billsSpent)}
                      </span>
                    )}
                    {budget.loansSpent > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-chart-4" />
                        Loans: {formatAmount(budget.loansSpent)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {budgets.filter(b => b.spent > 0).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No spending data for this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Suggestions</CardTitle>
            </div>
            <CardDescription>Smart insights to optimize your finances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="border-l-2 border-primary pl-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">{suggestion.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      suggestion.priority === "high" 
                        ? "bg-destructive/20 text-destructive" 
                        : suggestion.priority === "medium"
                        ? "bg-warning/20 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {transaction.description || "No description"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-sm font-bold ${
                      transaction.type === "income" ? "text-success" : "text-destructive"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatAmount(Math.abs(transaction.amount))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions for this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Track your spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {budgets.length > 0 ? (
                budgets.map((budget) => {
                  const percentage = (budget.spent / budget.limit_amount) * 100;
                  const isOverBudget = percentage > 100;
                  
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{budget.category}</span>
                        <span className={isOverBudget ? "text-destructive font-bold" : "text-muted-foreground"}>
                          {formatAmount(budget.spent)} / {formatAmount(budget.limit_amount)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`}
                      />
                      {isOverBudget && (
                        <p className="text-xs text-destructive">
                          Over budget by {formatAmount(budget.spent - budget.limit_amount)}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No budgets set. Create budgets to track spending.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};