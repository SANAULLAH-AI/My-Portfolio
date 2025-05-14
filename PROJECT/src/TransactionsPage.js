import React from 'react';
import { PlusCircle } from 'lucide-react';
import ExpenseList from '../components/expenses/ExpenseList';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { useState } from 'react';

const TransactionsPage: React.FC = () => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  
  const handleAddClick = () => {
    setIsAddingExpense(true);
  };
  
  const handleFormSubmit = () => {
    setIsAddingExpense(false);
  };
  
  const handleFormCancel = () => {
    setIsAddingExpense(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <Button 
          onClick={handleAddClick}
          icon={<PlusCircle size={16} />}
          disabled={isAddingExpense}
        >
          Add Expense
        </Button>
      </div>
      
      {isAddingExpense && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm 
              onSubmit={handleFormSubmit} 
              onCancel={handleFormCancel}
            />
          </CardContent>
        </Card>
      )}
      
      <ExpenseList />
    </div>
  );
};

export default TransactionsPage;