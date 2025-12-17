import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { AddLoanDialog } from "./AddLoanDialog";
import { EditLoanDialog } from "./EditLoanDialog";
import { LoanPaymentDialog } from "./LoanPaymentDialog";
import { EMICalculator } from "./EMICalculator";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Loan {
  id: string;
  name: string;
  type: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string;
  due_day: number;
  emi_amount: number;
  outstanding_balance: number;
  status: string;
  currency: string;
  notes?: string;
}

export const LoansSection = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      personal_loan: "Personal Loan",
      home_loan: "Home Loan",
      auto_loan: "Auto Loan",
      education_loan: "Education Loan",
      credit_card: "Credit Card",
      other: "Other"
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "closed": return "secondary";
      case "defaulted": return "destructive";
      default: return "default";
    }
  };

  const calculateProgress = (outstanding: number, principal: number) => {
    const paid = principal - outstanding;
    return (paid / principal) * 100;
  };

  const totalOutstanding = loans
    .filter(loan => loan.status === "active")
    .reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);

  const totalEMI = loans
    .filter(loan => loan.status === "active")
    .reduce((sum, loan) => sum + Number(loan.emi_amount), 0);

  if (loading) {
    return <div>Loading loans...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Loans & Debts</h2>
        <div className="flex gap-2">
          <Button onClick={() => setCalculatorOpen(true)} variant="outline" size="sm" className="flex-1 sm:flex-none">
            <TrendingUp className="w-4 h-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">EMI Calc</span>
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} size="sm" className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Add Loan</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {loans.filter(l => l.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold truncate">{formatAmount(totalOutstanding)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly EMI</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold truncate">{formatAmount(totalEMI)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {loans.map((loan) => (
          <Card key={loan.id}>
            <CardContent className="p-4 sm:pt-6 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-base sm:text-lg">{loan.name}</h3>
                      <Badge variant={getStatusColor(loan.status)} className="text-xs">
                        {loan.status}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{getTypeLabel(loan.type)}</p>
                  </div>
                  <div className="flex gap-2">
                    {loan.status === "active" && (
                      <Button
                        size="sm"
                        onClick={() => setPaymentLoan(loan)}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        Record Payment
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditLoan(loan)}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Principal</p>
                    <p className="font-semibold text-sm truncate">{formatAmount(Number(loan.principal_amount), loan.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interest Rate</p>
                    <p className="font-semibold text-sm">{loan.interest_rate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EMI Amount</p>
                    <p className="font-semibold text-sm truncate">{formatAmount(Number(loan.emi_amount), loan.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Day</p>
                    <p className="font-semibold text-sm">{loan.due_day} of month</p>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Repayment Progress</span>
                    <span className="font-semibold truncate ml-2">
                      {formatAmount(Number(loan.outstanding_balance), loan.currency)} remaining
                    </span>
                  </div>
                  <Progress 
                    value={calculateProgress(Number(loan.outstanding_balance), Number(loan.principal_amount))} 
                    className="h-2"
                  />
                </div>

                {loan.notes && (
                  <p className="text-xs sm:text-sm text-muted-foreground italic">{loan.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {loans.length === 0 && (
          <Card>
            <CardContent className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
              No loans recorded yet. Click "Add Loan" to get started.
            </CardContent>
          </Card>
        )}
      </div>

      <AddLoanDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={fetchLoans}
      />

      {editLoan && (
        <EditLoanDialog
          loan={editLoan}
          open={!!editLoan}
          onOpenChange={(open) => !open && setEditLoan(null)}
          onUpdate={fetchLoans}
        />
      )}

      {paymentLoan && (
        <LoanPaymentDialog
          loan={paymentLoan}
          open={!!paymentLoan}
          onOpenChange={(open) => !open && setPaymentLoan(null)}
          onPayment={fetchLoans}
        />
      )}

      <EMICalculator
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />
    </div>
  );
};
