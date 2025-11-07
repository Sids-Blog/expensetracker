import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency-context";
import { useEnhancedData } from "@/lib/enhanced-data-context";
import { useEnhancedTransactions } from "@/lib/enhanced-transaction-context";
import { TrendingDown } from "lucide-react";
import { getCurrencyIcon, getCurrencySymbol } from "@/components/ui/currency-display";
import { useState } from "react";

const ExpenseForm = () => {
  const { currency } = useCurrency();
  const { expenseCategories, paymentMethods } = useEnhancedData();
  const { addTransaction, isLoading } = useEnhancedTransactions();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullySettled, setFullySettled] = useState(true);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category || !paymentMethod || !date) {
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
        type: 'expense',
        amount: parseFloat(amount),
        category,
        description,
        currency,
        payment_method: paymentMethod,
        fully_settled: fullySettled, // new field
      });

      // Reset form
      setAmount("");
      setCategory("");
      setDescription("");
      setPaymentMethod("");
      setDate(new Date().toISOString().split('T')[0]);
      setFullySettled(true);
      
      toast({
        title: "Expense Added",
        description: `Successfully added ${getCurrencySymbol()}${parseFloat(amount).toFixed(2)} expense`,
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense. Please try again.",
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
          <TrendingDown className="h-5 w-5 text-red-600" />
          Add Expense
        </CardTitle>
            <CardDescription>Record a new expense transaction</CardDescription>
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
              label="Category"
              value={category}
              onChange={setCategory}
              placeholder="Select a category"
              options={expenseCategories.map(cat => ({ value: cat, label: cat }))}
              required
              disabled={isFormDisabled}
            />

            <FormField
              type="select"
              label="Payment Method"
              value={paymentMethod}
              onChange={setPaymentMethod}
              placeholder="Select payment method"
              options={paymentMethods.map(method => ({ value: method, label: method }))}
              required
              disabled={isFormDisabled}
            />

            <FormField
              type="textarea"
              label="Description (Optional)"
              value={description}
              onChange={setDescription}
              placeholder="What was this expense for?"
              rows={3}
              disabled={isFormDisabled}
            />

            <FormField
              type="checkbox"
              label="Fully settled (Uncheck if Recovery needs to be done)"
              checked={fullySettled}
              onChange={setFullySettled}
              disabled={isFormDisabled}
            />

            <Button type="submit" className="w-full" disabled={isFormDisabled}>
              {isSubmitting ? 'Adding Expense...' : 'Add Expense'}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
};

export default ExpenseForm;
