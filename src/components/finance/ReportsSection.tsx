import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, TrendingUp, Calendar, AlertCircle, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DateRangeDialog } from "./DateRangeDialog";
import { format, isBefore, addDays } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Progress } from "@/components/ui/progress";

export const ReportsSection = () => {
  const [loading, setLoading] = useState(true);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [billsSummary, setBillsSummary] = useState({
    upcomingBills: 0,
    totalBillsAmount: 0,
    unpaidCount: 0,
  });
  const [loansSummary, setLoansSummary] = useState({
    activeLoans: 0,
    totalOutstanding: 0,
    monthlyEMI: 0,
  });
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const fetchReportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      // Fetch transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startStr)
        .lte("date", endStr);

      if (error) throw error;

      const income = transactions
        ?.filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) || 0;

      const expenses = transactions
        ?.filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) || 0;

      const netSavings = income - expenses;
      const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

      setSummary({
        totalIncome: income,
        totalExpenses: expenses,
        netSavings,
        savingsRate,
      });

      // Calculate category breakdown
      const categoryTotals = transactions
        ?.filter(t => t.type === "expense")
        .reduce((acc: any, t: any) => {
          acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
          return acc;
        }, {}) || {};

      const breakdown = Object.entries(categoryTotals).map(([category, amount]: [string, any]) => ({
        category,
        amount,
        percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
      }));

      breakdown.sort((a, b) => b.amount - a.amount);
      setCategoryBreakdown(breakdown);

      // Fetch bills data
      const { data: bills } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const upcomingBills = bills?.filter(b => {
        const dueDate = new Date(b.due_date);
        const today = new Date();
        const reminderDate = addDays(today, b.reminder_days);
        return !b.is_paid && isBefore(dueDate, reminderDate);
      }).length || 0;

      const totalBillsAmount = bills?.reduce((sum, b) => sum + parseFloat(String(b.amount)), 0) || 0;
      const unpaidCount = bills?.filter(b => !b.is_paid).length || 0;

      setBillsSummary({
        upcomingBills,
        totalBillsAmount,
        unpaidCount,
      });

      // Fetch loans data
      const { data: loans } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      const activeLoans = loans?.length || 0;
      const totalOutstanding = loans?.reduce((sum, l) => sum + parseFloat(String(l.outstanding_balance)), 0) || 0;
      const monthlyEMI = loans?.reduce((sum, l) => sum + parseFloat(String(l.emi_amount)), 0) || 0;

      setLoansSummary({
        activeLoans,
        totalOutstanding,
        monthlyEMI,
      });
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
    fetchReportData();
  }, [startDate, endDate]);

  const handleDateRangeSelect = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const exportCSV = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      // Fetch all data
      const [{ data: transactions }, { data: bills }, { data: loans }] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user.id).gte("date", startStr).lte("date", endStr).order("date", { ascending: false }),
        supabase.from("bills").select("*").eq("user_id", user.id).eq("is_active", true),
        supabase.from("loans").select("*").eq("user_id", user.id).eq("status", "active"),
      ]);

      let csv = "TRANSACTIONS\n";
      csv += ["Date", "Description", "Category", "Type", "Amount"].join(",") + "\n";
      csv += (transactions || []).map(t => [t.date, t.description || "", t.category, t.type, t.amount].join(",")).join("\n");
      
      csv += "\n\nBILLS\n";
      csv += ["Name", "Category", "Amount", "Due Date", "Frequency", "Status"].join(",") + "\n";
      csv += (bills || []).map(b => [b.name, b.category, b.amount, b.due_date, b.frequency, b.is_paid ? "Paid" : "Unpaid"].join(",")).join("\n");
      
      csv += "\n\nLOANS\n";
      csv += ["Name", "Type", "Principal", "Interest Rate", "EMI", "Outstanding Balance", "Status"].join(",") + "\n";
      csv += (loans || []).map(l => [l.name, l.type, l.principal_amount, l.interest_rate + "%", l.emi_amount, l.outstanding_balance, l.status].join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`;
      a.click();

      toast({
        title: "Export successful",
        description: "Complete financial report CSV downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportPDF = () => {
    const content = `
Financial Report
Period: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}

=== TRANSACTION SUMMARY ===
Total Income: ${formatAmount(summary.totalIncome)}
Total Expenses: ${formatAmount(summary.totalExpenses)}
Net Savings: ${formatAmount(summary.netSavings)}
Savings Rate: ${summary.savingsRate.toFixed(1)}%

=== EXPENSE BREAKDOWN ===
${categoryBreakdown.map(c => `${c.category}: ${formatAmount(c.amount)} (${c.percentage.toFixed(1)}%)`).join("\n")}

=== BILLS SUMMARY ===
Active Bills: ${billsSummary.unpaidCount}
Upcoming Bills (Due Soon): ${billsSummary.upcomingBills}
Total Bills Amount: ${formatAmount(billsSummary.totalBillsAmount)}

=== LOANS SUMMARY ===
Active Loans: ${loansSummary.activeLoans}
Total Outstanding: ${formatAmount(loansSummary.totalOutstanding)}
Monthly EMI Total: ${formatAmount(loansSummary.monthlyEMI)}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.txt`;
    a.click();

    toast({
      title: "Export successful",
      description: "Complete financial report downloaded",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading report...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-sm text-muted-foreground">Generate insights and export your data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDateDialogOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Change Period
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>
              Financial Summary - {format(startDate, "MMM dd, yyyy")} to {format(endDate, "MMM dd, yyyy")}
            </CardTitle>
            <CardDescription>Overview of your financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">
                  +{formatAmount(summary.totalIncome)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  -{formatAmount(summary.totalExpenses)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Net Savings</p>
                <p className="text-2xl font-bold text-primary">
                  {formatAmount(summary.netSavings)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {summary.savingsRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bills & Loans Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Bills Summary
              </CardTitle>
              <CardDescription>Overview of your recurring bills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Upcoming Bills</span>
                <span className="text-lg font-bold text-warning">{billsSummary.upcomingBills}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unpaid Bills</span>
                <span className="text-lg font-bold">{billsSummary.unpaidCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-lg font-bold text-primary">{formatAmount(billsSummary.totalBillsAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-destructive" />
                Loans Summary
              </CardTitle>
              <CardDescription>Overview of your active loans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Loans</span>
                <span className="text-lg font-bold">{loansSummary.activeLoans}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Outstanding</span>
                <span className="text-lg font-bold text-destructive">{formatAmount(loansSummary.totalOutstanding)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly EMI</span>
                <span className="text-lg font-bold text-primary">{formatAmount(loansSummary.monthlyEMI)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown by Category</CardTitle>
            <CardDescription>Where your money went this period</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No expenses in this period</p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.category}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold">{formatAmount(item.amount)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download your financial reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={exportCSV}>
                <FileText className="h-6 w-6" />
                <span>Export CSV</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={exportPDF}>
                <Download className="h-6 w-6" />
                <span>Export PDF</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={exportPDF}>
                <TrendingUp className="h-6 w-6" />
                <span>Detailed Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DateRangeDialog
        open={dateDialogOpen}
        onOpenChange={setDateDialogOpen}
        onDateRangeSelect={handleDateRangeSelect}
      />
    </div>
  );
};
