import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY';

interface CurrencyContextType {
  displayCurrency: SupportedCurrency;
  setDisplayCurrency: (currency: SupportedCurrency) => void;
  convertAmount: (amount: number, fromCurrency: string) => number;
  formatAmount: (amount: number, fromCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates relative to USD (1 USD = X currency)
const exchangeRates: Record<SupportedCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.12,
  JPY: 149.50,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
};

const currencySymbols: Record<SupportedCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>('USD');

  const convertAmount = (amount: number, fromCurrency: string = 'USD'): number => {
    const normalizedFrom = fromCurrency.toUpperCase() as SupportedCurrency;
    
    // If currency not supported, default to USD
    const fromRate = exchangeRates[normalizedFrom] || 1;
    const toRate = exchangeRates[displayCurrency];
    
    // Convert from source currency to USD, then to target currency
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;
    
    return convertedAmount;
  };

  const formatAmount = (amount: number, fromCurrency: string = 'USD'): string => {
    const convertedAmount = convertAmount(amount, fromCurrency);
    const symbol = currencySymbols[displayCurrency];
    
    // Format based on currency (some currencies don't use decimals)
    const decimals = displayCurrency === 'JPY' ? 0 : 2;
    
    return `${symbol}${Math.abs(convertedAmount).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        displayCurrency,
        setDisplayCurrency,
        convertAmount,
        formatAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
