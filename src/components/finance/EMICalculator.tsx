import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";

interface EMICalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EMICalculator = ({ open, onOpenChange }: EMICalculatorProps) => {
  const { formatAmount, displayCurrency } = useCurrency();

  // Helper to format without conversion (EMI values are already in selected currency)
  const formatDisplay = (value: number) => formatAmount(value, displayCurrency);
  const [formData, setFormData] = useState({
    principal: "100",
    rate: "5",
    tenure: "12",
  });

  const result = useMemo(() => {
    const principal = Number(formData.principal);
    const rate = Number(formData.rate);
    const months = Number(formData.tenure);

    // Validation guards
    if (
      isNaN(principal) ||
      isNaN(rate) ||
      isNaN(months) ||
      principal <= 0 ||
      months <= 0
    ) {
      return { emi: 0, totalInterest: 0, totalPayment: 0 };
    }

    // Zero interest case
    if (rate === 0) {
      const emi = principal / months;
      const emiRounded = Number(emi.toFixed(2));

      return {
        emi: emiRounded,
        totalInterest: 0,
        totalPayment: Number((emiRounded * months).toFixed(2)),
      };
    }

    const monthlyRate = rate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, months);

    const emi =
      (principal * monthlyRate * factor) / (factor - 1);

    const emiRounded = Number(emi.toFixed(2));
    const totalPayment = Number((emiRounded * months).toFixed(2));
    const totalInterest = Number(
      (totalPayment - principal).toFixed(2)
    );

    return { emi: emiRounded, totalInterest, totalPayment };
  }, [formData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>EMI Calculator</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Inputs */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="principal">Loan Amount (Principal)</Label>
              <Input
                id="principal"
                type="number"
                min="1"
                value={formData.principal}
                onChange={(e) =>
                  setFormData({ ...formData, principal: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="rate">Interest Rate (% per annum)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.1"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="tenure">Loan Tenure (Months)</Label>
              <Input
                id="tenure"
                type="number"
                min="1"
                value={formData.tenure}
                onChange={(e) =>
                  setFormData({ ...formData, tenure: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                {Number(formData.tenure) || 0} months ={" "}
                {((Number(formData.tenure) || 0) / 12).toFixed(1)} years
              </p>
            </div>
          </div>

          {/* Result */}
          <Card className="bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly EMI</p>
                <p className="text-3xl font-bold">
                  {formatDisplay(result.emi)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Principal Amount
                  </p>
                  <p className="text-xl font-semibold">
                    {formatDisplay(Number(formData.principal) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Interest
                  </p>
                  <p className="text-xl font-semibold">
                    {formatDisplay(result.totalInterest)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total Payment (Principal + Interest)
                </p>
                <p className="text-2xl font-bold">
                  {formatDisplay(result.totalPayment)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Formula */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">
              How EMI is Calculated?
            </h4>
            <p className="text-sm text-muted-foreground">
              EMI = [P × R × (1+R)<sup>N</sup>] / [(1+R)<sup>N</sup> − 1]
              <br />
              Where:
              <br />
              P = Principal
              <br />
              R = Monthly Interest Rate
              <br />
              N = Number of Months
            </p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
