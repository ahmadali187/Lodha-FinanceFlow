import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddAssetLiabilityDialog } from "./AddAssetLiabilityDialog";
import { EditAssetLiabilityDialog } from "./EditAssetLiabilityDialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AssetLiability {
  id: string;
  type: "asset" | "liability";
  name: string;
  value: number;
  category: string;
  date: string;
  currency: string;
  notes?: string;
}

interface NetWorthSectionProps {
  onDataChange?: () => void;
}

export function NetWorthSection({ onDataChange }: NetWorthSectionProps) {
  const [items, setItems] = useState<AssetLiability[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<AssetLiability | null>(null);
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("assets_liabilities")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setItems((data || []) as AssetLiability[]);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assets and liabilities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("assets_liabilities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      fetchItems();
      onDataChange?.();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    const assets = items.filter(i => i.type === "asset").reduce((sum, i) => sum + parseFloat(String(i.value)), 0);
    const liabilities = items.filter(i => i.type === "liability").reduce((sum, i) => sum + parseFloat(String(i.value)), 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  };

  const getChartData = () => {
    const dataByDate = items.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date, assets: 0, liabilities: 0 };
      }
      if (item.type === "asset") {
        acc[date].assets += parseFloat(String(item.value));
      } else {
        acc[date].liabilities += parseFloat(String(item.value));
      }
      return acc;
    }, {} as Record<string, { date: string; assets: number; liabilities: number }>);

    return Object.values(dataByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(d => ({ ...d, netWorth: d.assets - d.liabilities }));
  };

  const { assets, liabilities, netWorth } = calculateTotals();
  const chartData = getChartData();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-success truncate">
              {formatAmount(assets)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-destructive truncate">
              {formatAmount(liabilities)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className={`text-xl sm:text-2xl font-bold truncate ${netWorth >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatAmount(netWorth)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Net Worth Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Track your financial health over time</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="assets" stroke="hsl(var(--success))" name="Assets" />
                <Line type="monotone" dataKey="liabilities" stroke="hsl(var(--destructive))" name="Liabilities" />
                <Line type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" name="Net Worth" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Assets & Liabilities List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Assets & Liabilities</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage your financial positions</CardDescription>
            </div>
            <AddAssetLiabilityDialog
              onSuccess={() => {
                fetchItems();
                onDataChange?.();
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No assets or liabilities yet</p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === "asset" ? "default" : "destructive"} className="text-xs">
                          {item.type}
                        </Badge>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <span className={`font-bold text-sm ${item.type === "asset" ? "text-success" : "text-destructive"}`}>
                        {formatAmount(parseFloat(String(item.value)))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.category}</span>
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => setEditingItem(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Value</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={item.type === "asset" ? "default" : "destructive"} className="text-xs">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                        <TableCell className="text-sm">{item.category}</TableCell>
                        <TableCell className={`text-sm ${item.type === "asset" ? "text-success" : "text-destructive"}`}>
                          {formatAmount(parseFloat(String(item.value)))}
                        </TableCell>
                        <TableCell className="text-sm">{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => setEditingItem(item)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editingItem && (
        <EditAssetLiabilityDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSuccess={() => {
            fetchItems();
            onDataChange?.();
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}