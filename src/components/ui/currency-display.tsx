import { DollarSign, Euro, IndianRupee, PoundSterling } from "lucide-react";

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR' | 'CHF' | 'CNY' | 'BRL';

interface CurrencyDisplayProps {
  amount: number;
  currency: Currency;
  showIcon?: boolean;
  className?: string;
}

export const getCurrencySymbol = (currency: Currency | string): string => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    case 'INR': return '₹';
    case 'CNY': return '¥';
    case 'BRL': return 'R$';
    case 'CHF': return 'Fr';
    default: return '$';
  }
};

export const getCurrencyIcon = (currency: Currency | string) => {
  switch (currency) {
    case 'INR': return <IndianRupee className="h-4 w-4" />;
    case 'EUR': return <Euro className="h-4 w-4" />;
    case 'GBP': return <PoundSterling className="h-4 w-4" />;
    default: return <DollarSign className="h-4 w-4" />;
  }
};

export const CurrencyDisplay = ({ amount, currency, showIcon = false, className = "" }: CurrencyDisplayProps) => {
  const formatAmount = (amount: number) => {
    return `${getCurrencySymbol(currency)}${Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <span className={`flex items-center gap-1 ${className}`}>
      {showIcon && getCurrencyIcon(currency)}
      {formatAmount(amount)}
    </span>
  );
};