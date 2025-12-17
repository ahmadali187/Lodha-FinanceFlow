import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Trash2, Loader2 } from "lucide-react";

interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  frequency: string;
  category: string;
  is_active: boolean;
  currency: string;
  user_email?: string;
}

export function AdminBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;

      const userIds = [...new Set(data?.map(b => b.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const billsWithEmails = (data || []).map(bill => ({
        ...bill,
        user_email: profiles?.find(p => p.user_id === bill.user_id)?.username || "Unknown",
      }));

      setBills(billsWithEmails);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;

    try {
      const { error } = await supabase
        .from("bills")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bill deleted successfully",
      });

      fetchBills();
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({
        title: "Error",
        description: "Failed to delete bill",
        variant: "destructive",
      });
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
        <h1 className="text-3xl font-bold">Bills Management</h1>
        <p className="text-muted-foreground">View and manage all bills</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bills ({bills.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Bill Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>{bill.user_email}</TableCell>
                  <TableCell className="font-medium">{bill.name}</TableCell>
                  <TableCell className="text-destructive font-semibold">
                    {formatAmount(parseFloat(String(bill.amount)))}
                  </TableCell>
                  <TableCell>{new Date(bill.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge>{bill.frequency}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={bill.is_active ? "default" : "secondary"}>
                      {bill.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(bill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
