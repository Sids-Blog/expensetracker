import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Transaction } from "@/lib/supabase";
import { Calendar, Trash2, TrendingDown, TrendingUp, Edit } from "lucide-react";
import { CurrencyDisplay, getCurrencyIcon, Currency } from "./currency-display";

interface TransactionCardProps {
    transaction: Transaction;
    onDelete?: (id: string) => void;
    onEdit?: (transaction: Transaction) => void;
    showActions?: boolean;
    className?: string;
}

export const TransactionCard = ({
    transaction,
    onDelete,
    onEdit,
    showActions = true,
    className = ""
}: TransactionCardProps) => {
    const isExpense = transaction.type === 'expense';

    return (
        <Card className={`${isExpense ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'} ${className}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {isExpense ? (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : (
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            )}
                            <span className={`font-medium ${isExpense ? 'text-red-800' : 'text-emerald-800'}`}>
                                {transaction.category}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            {getCurrencyIcon(transaction.currency)}
                            <CurrencyDisplay
                                amount={transaction.amount}
                                currency={transaction.currency as Currency}
                                className={`text-lg font-semibold ${isExpense ? 'text-red-700' : 'text-emerald-700'}`}
                            />
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                            <Calendar className="h-3 w-3" />
                            {transaction.date}
                        </div>

                        {transaction.description && (
                            <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                        )}

                        <p className="text-xs text-gray-500">
                            {transaction.payment_method}
                        </p>

                        {transaction.fully_settled === false && (
                            <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Unsettled
                                </span>
                            </div>
                        )}
                    </div>

                    {showActions && (
                        <div className="flex gap-1">
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(transaction)}
                                    className="text-gray-400 hover:text-blue-600"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(transaction.id!)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};