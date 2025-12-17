import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ScrollArea } from "@/components/ui/scroll-area";

export const BudgetAlertBell = () => {
  const { alerts, loading } = useBudgetAlerts();
  const { formatAmount } = useCurrency();

  if (loading) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {alerts.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Budget Alerts</h4>
            {alerts.length > 0 && (
              <Badge variant="destructive">{alerts.length}</Badge>
            )}
          </div>
          
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No budget alerts. You're doing great! 🎉
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.category}
                    className="p-3 rounded-lg border bg-card space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{alert.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAmount(alert.spent, alert.currency)} / {formatAmount(alert.budgetLimit, alert.currency)}
                        </p>
                      </div>
                      <Badge 
                        variant={alert.percentage >= 100 ? "destructive" : "default"}
                        className="ml-2"
                      >
                        {Math.round(alert.percentage)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          alert.percentage >= 100 
                            ? "bg-destructive" 
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                      />
                    </div>
                    {alert.percentage >= 100 && (
                      <p className="text-xs text-destructive font-medium">
                        Budget exceeded by {formatAmount(alert.spent - alert.budgetLimit, alert.currency)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
