import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency, SupportedCurrency } from "@/contexts/CurrencyContext";

const currencies: { value: SupportedCurrency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
];

export const CurrencySelector = () => {
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const currentCurrency = currencies.find(c => c.value === displayCurrency);

  return (
    <Select value={displayCurrency} onValueChange={(value) => setDisplayCurrency(value as SupportedCurrency)}>
      <SelectTrigger className="w-auto gap-2 border-primary/20 hover:bg-primary/5">
        <Globe className="h-4 w-4 text-primary" />
        <SelectValue>
          <span className="font-semibold text-foreground">
            {currentCurrency?.symbol}{displayCurrency}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            <span className="flex items-center gap-2">
              <span className="font-semibold">{currency.symbol}</span>
              {currency.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
