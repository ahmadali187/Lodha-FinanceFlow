import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, ArrowLeftRight, Target, Receipt, TrendingUp } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalAccounts: number;
  totalTransactions: number;
  totalBudgets: number;
  totalBills: number;
  totalNetWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    totalBudgets: 0,
    totalBills: 0,
    totalNetWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [transactionTrends, setTransactionTrends] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchStats();
    fetchTransactionTrends();
    fetchCategoryData();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [users, accounts, transactions, budgets, bills, assets] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("accounts").select("id", { count: "exact" }),
        supabase.from("transactions").select("id", { count: "exact" }),
        supabase.from("budgets").select("id", { count: "exact" }),
        supabase.from("bills").select("id", { count: "exact" }),
        supabase.from("assets_liabilities").select("type, value"),
      ]);

      // Calculate net worth
      const assetsTotal = (assets.data || [])
        .filter(a => a.type === "asset")
        .reduce((sum, a) => sum + parseFloat(String(a.value)), 0);
      const liabilitiesTotal = (assets.data || [])
        .filter(a => a.type === "liability")
        .reduce((sum, a) => sum + parseFloat(String(a.value)), 0);

      // Get current month transactions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyTrans } = await supabase
        .from("transactions")
        .select("type, amount")
        .gte("date", startOfMonth.toISOString().split("T")[0]);

      const monthlyIncome = (monthlyTrans || [])
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);
      
      const monthlyExpenses = (monthlyTrans || [])
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

      setStats({
        totalUsers: users.count || 0,
        totalAccounts: accounts.count || 0,
        totalTransactions: transactions.count || 0,
        totalBudgets: budgets.count || 0,
        totalBills: bills.count || 0,
        totalNetWorth: assetsTotal - liabilitiesTotal,
        monthlyIncome,
        monthlyExpenses,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchTransactionTrends = async () => {
    try {
      const { data } = await supabase
        .from("transactions")
        .select("date, type, amount")
        .order("date", { ascending: true });

      if (!data) return;

      // Group by month
      const monthlyData = data.reduce((acc: any, transaction) => {
        const month = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { month, income: 0, expenses: 0 };
        }
        if (transaction.type === "income") {
          acc[month].income += parseFloat(String(transaction.amount));
        } else {
          acc[month].expenses += parseFloat(String(transaction.amount));
        }
        return acc;
      }, {});

      setTransactionTrends(Object.values(monthlyData).slice(-6));
    } catch (error) {
      console.error("Error fetching transaction trends:", error);
    }
  };

  const fetchCategoryData = async () => {
    try {
      const { data } = await supabase
        .from("transactions")
        .select("category, amount")
        .eq("type", "expense");

      if (!data) return;

      const categoryTotals = data.reduce((acc: any, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = 0;
        }
        acc[transaction.category] += parseFloat(String(transaction.amount));
        return acc;
      }, {});

      const chartData = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5);

      setCategoryData(chartData);
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  };

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { title: "Total Accounts", value: stats.totalAccounts, icon: Wallet, color: "text-success" },
    { title: "Transactions", value: stats.totalTransactions, icon: ArrowLeftRight, color: "text-warning" },
    { title: "Budgets", value: stats.totalBudgets, icon: Target, color: "text-primary" },
    { title: "Bills", value: stats.totalBills, icon: Receipt, color: "text-destructive" },
    { title: "Net Worth", value: formatAmount(stats.totalNetWorth), icon: TrendingUp, color: "text-success" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Overview of your finance management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className={`text-lg sm:text-2xl font-bold ${stat.color} truncate`}>
                  {typeof stat.value === 'number' && !stat.title.includes('Worth') 
                    ? stat.value.toLocaleString() 
                    : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-success truncate">
              {formatAmount(stats.monthlyIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-destructive truncate">
              {formatAmount(stats.monthlyExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg">Net Savings</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className={`text-lg sm:text-2xl font-bold truncate ${stats.monthlyIncome - stats.monthlyExpenses >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatAmount(stats.monthlyIncome - stats.monthlyExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Transaction Trends */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Transaction Trends (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--success))" name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
