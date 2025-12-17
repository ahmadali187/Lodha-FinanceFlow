import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Loan {
  id: string;
  name: string;
  type: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  outstanding_balance: number;
  status: string;
  start_date: string;
  due_day: number;
  currency: string;
  user_id: string;
  full_name?: string;
  email?: string;
}

export function AdminLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to flatten the profiles object
      const transformedLoans = (data || []).map((loan: any) => ({
        ...loan,
        full_name: loan.profiles?.full_name,
        email: loan.profiles?.email,
      }));
      
      setLoans(transformedLoans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast({
        title: "Error",
        description: "Failed to fetch loans",
        variant: "destructive",
      });
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

  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => l.status === "active").length;
  const totalOutstanding = loans.reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);
  const totalMonthlyEMI = loans
    .filter((l) => l.status === "active")
    .reduce((sum, loan) => sum + Number(loan.emi_amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Loans Management</h1>
        <p className="text-muted-foreground">View and manage all user loans</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly EMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalMonthlyEMI)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Loans ({totalLoans})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Loan Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>EMI</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{loan.full_name || "N/A"}</span>
                      <span className="text-sm text-muted-foreground">{loan.email || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{loan.name}</TableCell>
                  <TableCell className="capitalize">{loan.type}</TableCell>
                  <TableCell>{formatAmount(Number(loan.principal_amount))}</TableCell>
                  <TableCell>{formatAmount(Number(loan.outstanding_balance))}</TableCell>
                  <TableCell>{formatAmount(Number(loan.emi_amount))}</TableCell>
                  <TableCell>{loan.interest_rate}%</TableCell>
                  <TableCell>
                    <Badge variant={loan.status === "active" ? "default" : "secondary"}>
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(loan.start_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
