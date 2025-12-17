import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Wallet, PieChart, LogOut, ShieldCheck } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import { AccountsSection } from "@/components/finance/AccountsSection";
import { TransactionsSection } from "@/components/finance/TransactionsSection";
import { BudgetsSection } from "@/components/finance/BudgetsSection";
import { ReportsSection } from "@/components/finance/ReportsSection";
import { FinancialOverview } from "@/components/finance/FinancialOverview";
import { BillsSection } from "@/components/finance/BillsSection";
import { NetWorthSection } from "@/components/finance/NetWorthSection";
import { LoansSection } from "@/components/finance/LoansSection";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { BudgetAlertBell } from "@/components/BudgetAlertBell";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
  });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch total balance from user's accounts
      const { data: accounts } = await supabase
        .from("accounts")
        .select("balance")
        .eq("user_id", user.id);

      const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(String(acc.balance)), 0) || 0;

      // Get current month transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      const monthlyIncome = transactions
        ?.filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) || 0;

      const monthlyExpenses = transactions
        ?.filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) || 0;

      const savingsRate = monthlyIncome > 0 
        ? Number((((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1))
        : 0;

      setStats({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">
                Lodha FinanceFlow
              </h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <CurrencySelector />
              <BudgetAlertBell />
              {isAdmin && (
                <Button variant="default" size="sm" onClick={() => navigate("/admin")} className="hidden sm:flex">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              {isAdmin && (
                <Button variant="default" size="icon" onClick={() => navigate("/admin")} className="sm:hidden h-8 w-8">
                  <ShieldCheck className="h-4 w-4" />
                </Button>
              )}
              <p className="text-sm text-muted-foreground hidden lg:block">
                {profile?.username || user.email?.split('@')[0]}
              </p>
              <UserProfileDialog userEmail={user.email || ""} />
              <Button variant="outline" size="icon" onClick={handleSignOut} className="h-8 w-8 sm:h-9 sm:w-9">
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {formatAmount(stats.totalBalance)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Across all accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-success">
                +{formatAmount(stats.monthlyIncome)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-destructive">
                -{formatAmount(stats.monthlyExpenses)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Savings Rate</CardTitle>
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {stats.savingsRate}%
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Of monthly income</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-2">
            <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-4 lg:grid-cols-8 gap-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 sm:px-4">Overview</TabsTrigger>
              <TabsTrigger value="accounts" className="text-xs sm:text-sm px-3 sm:px-4">Accounts</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm px-3 sm:px-4">Transactions</TabsTrigger>
              <TabsTrigger value="budgets" className="text-xs sm:text-sm px-3 sm:px-4">Budgets</TabsTrigger>
              <TabsTrigger value="bills" className="text-xs sm:text-sm px-3 sm:px-4">Bills</TabsTrigger>
              <TabsTrigger value="loans" className="text-xs sm:text-sm px-3 sm:px-4">Loans</TabsTrigger>
              <TabsTrigger value="networth" className="text-xs sm:text-sm px-3 sm:px-4">Net Worth</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs sm:text-sm px-3 sm:px-4">Reports</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <FinancialOverview onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <AccountsSection onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <TransactionsSection onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            <BudgetsSection />
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            <BillsSection onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="loans" className="space-y-4">
            <LoansSection />
          </TabsContent>

          <TabsContent value="networth" className="space-y-4">
            <NetWorthSection onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ReportsSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">Made by Ahmadali Lodha</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;