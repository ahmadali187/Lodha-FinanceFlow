import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard, PiggyBank, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddAccountDialog } from "./AddAccountDialog";
import { EditAccountDialog } from "./EditAccountDialog";
import { useCurrency } from "@/contexts/CurrencyContext";

interface AccountsSectionProps {
  onDataChange?: () => void;
}

export const AccountsSection = ({ onDataChange }: AccountsSectionProps = {}) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
      onDataChange?.();
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
    fetchAccounts();
  }, []);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "savings":
        return PiggyBank;
      case "credit":
        return CreditCard;
      case "investment":
        return TrendingUp;
      default:
        return Wallet;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case "savings":
        return "text-success";
      case "credit":
        return "text-destructive";
      case "investment":
        return "text-primary";
      default:
        return "text-foreground";
    }
  };

  const handleEdit = (account: any) => {
    setEditAccount(account);
    setEditDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading accounts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Accounts</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage your wallets and bank accounts</p>
        </div>
        <AddAccountDialog onAccountAdded={fetchAccounts} />
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <Wallet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No accounts yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">Create your first account to start tracking your finances</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.type);
            const isNegative = account.balance < 0;
            
            return (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-secondary ${getAccountColor(account.type)}`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">{account.name}</CardTitle>
                        <CardDescription className="capitalize text-xs sm:text-sm">{account.type}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Current Balance</p>
                      <p className={`text-2xl sm:text-3xl font-bold truncate ${
                        isNegative ? "text-destructive" : "text-foreground"
                      }`}>
                        {isNegative ? "-" : ""}{formatAmount(Math.abs(account.balance), account.currency)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={() => handleEdit(account)}>
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={() => handleEdit(account)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EditAccountDialog
        account={editAccount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onAccountUpdated={fetchAccounts}
      />
    </div>
  );
};
