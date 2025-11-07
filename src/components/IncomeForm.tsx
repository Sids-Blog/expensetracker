import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency-context";
import { useEnhancedData } from "@/lib/enhanced-data-context";
import { useEnhancedTransactions } from "@/lib/enhanced-transaction-context";
import { TrendingUp } from "lucide-react";
import { getCurrencyIcon, getCurrencySymbol } from "@/components/ui/currency-display";
import { useState } from "react";

const IncomeForm = () => {
  const { currency } = useCurrency();
  const { incomeCategories } = useEnhancedData();
  const { addTransaction, isLoading } = useEnhancedTransactions();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !source || !date) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addTransaction({
        date,
        type: 'income',
        amount: parseFloat(amount),
        category: source,
        description,
        currency,
        payment_method: source, // For income, we use source as payment method
      });

      // Reset form
      setAmount("");
      setSource("");
      setDescription("");
      setDate(new Date().toISOString().split('T')[0]);
      
      toast({
        title: "Income Added",
        description: `Successfully added ${getCurrencySymbol()}${parseFloat(amount).toFixed(2)} income`,
      });
    } catch (error) {
      console.error('Error adding income:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add income. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isLoading;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Add Income
        </CardTitle>
            <CardDescription>Record a new income transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                type="number"
                label={`Amount (${getCurrencySymbol(currency as any)})`}
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                disabled={isFormDisabled}
                icon={getCurrencyIcon(currency as any)}
              />
              <FormField
                type="date"
                label="Date"
                value={date}
                onChange={setDate}
                required
                disabled={isFormDisabled}
              />
            </div>

            <FormField
              type="select"
              label="Income Source"
              value={source}
              onChange={setSource}
              placeholder="Select income source"
              options={incomeCategories.map(src => ({ value: src, label: src }))}
              required
              disabled={isFormDisabled}
            />

            <FormField
              type="textarea"
              label="Description (Optional)"
              value={description}
              onChange={setDescription}
              placeholder="What was this income for?"
              rows={3}
              disabled={isFormDisabled}
            />

            <Button type="submit" className="w-full" disabled={isFormDisabled}>
              {isSubmitting ? 'Adding Income...' : 'Add Income'}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
};

export default IncomeForm;
