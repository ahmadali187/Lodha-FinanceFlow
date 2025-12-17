import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];

export function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch transaction data
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: true });

      if (transactions) {
        // Monthly trends
        const monthlyTotals = transactions.reduce((acc: any, t) => {
          const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!acc[month]) {
            acc[month] = { month, income: 0, expenses: 0 };
          }
          if (t.type === "income") {
            acc[month].income += parseFloat(String(t.amount));
          } else {
            acc[month].expenses += parseFloat(String(t.amount));
          }
          return acc;
        }, {});
        setMonthlyData(Object.values(monthlyTotals).slice(-6));

        // Category breakdown
        const categoryTotals = transactions
          .filter(t => t.type === "expense")
          .reduce((acc: any, t) => {
            if (!acc[t.category]) {
              acc[t.category] = 0;
            }
            acc[t.category] += parseFloat(String(t.amount));
            return acc;
          }, {});
        
        const categoryChartData = Object.entries(categoryTotals)
          .map(([name, value]) => ({ name, value }))
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 5);
        setCategoryData(categoryChartData);

        // User activity
        const userTotals = transactions.reduce((acc: any, t) => {
          if (!acc[t.user_id]) {
            acc[t.user_id] = { transactions: 0, total: 0 };
          }
          acc[t.user_id].transactions += 1;
          acc[t.user_id].total += parseFloat(String(t.amount));
          return acc;
        }, {});

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", Object.keys(userTotals));

        const userActivityData = Object.entries(userTotals)
          .map(([userId, data]: [string, any]) => ({
            name: profiles?.find(p => p.user_id === userId)?.username || "Unknown",
            transactions: data.transactions,
            total: data.total,
          }))
          .sort((a, b) => b.transactions - a.transactions)
          .slice(0, 10);

        setUserActivity(userActivityData);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Comprehensive financial insights and trends</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--success))" name="Income" />
                <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / categoryData.reduce((sum: number, e: any) => sum + e.value, 0)) * 100).toFixed(1)}%`}
                  outerRadius={80}
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

        {/* User Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Most Active Users (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="transactions" fill="hsl(var(--primary))" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
