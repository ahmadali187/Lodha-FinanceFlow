import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpCircle, ArrowDownCircle, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
  account_id: string | null;
}

interface TransactionsSectionProps {
  onDataChange?: () => void;
}

export const TransactionsSection = ({ onDataChange }: TransactionsSectionProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const categories = ["Groceries", "Dining Out", "Transportation", "Utilities", "Entertainment", "Health", "Shopping", "Salary", "Freelance", "Investment", "Other"];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
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

  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    await fetchTransactions();
    onDataChange?.();
  };

  const handleTransactionAdded = async () => {
    await fetchTransactions();
    onDataChange?.();
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    return true;
  });

  const clearFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
  };

  const hasActiveFilters = filterType !== "all" || filterCategory !== "all";

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Transactions</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Track all your income and expenses</p>
        </div>
        <AddTransactionDialog onTransactionAdded={handleTransactionAdded} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
            <div className="flex-1 min-w-0 sm:min-w-[150px]">
              <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Type</label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-0 sm:min-w-[150px]">
              <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} size="sm" className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Results */}
      <div className="text-xs sm:text-sm text-muted-foreground">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">All Transactions</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Recent financial activity across all accounts</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm">
              {transactions.length === 0 
                ? "No transactions yet. Add your first transaction to get started." 
                : "No transactions match the current filters."}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTransactions.map((transaction, index) => (
                <div 
                  key={transaction.id}
                  className={`flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-secondary/50 transition-colors gap-3 ${
                    index !== filteredTransactions.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                      transaction.type === "income" ? "bg-success/10" : "bg-destructive/10"
                    }`}>
                      {transaction.type === "income" ? (
                        <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{transaction.description || "No description"}</p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {transaction.category}
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className={`text-sm sm:text-lg font-bold ${
                      transaction.type === "income" ? "text-success" : "text-destructive"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatAmount(Math.abs(transaction.amount), (transaction as any).currency)}
                    </div>
                    <EditTransactionDialog 
                      transaction={transaction} 
                      onUpdate={handleUpdateTransaction}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
