import React from 'react';
import ExpenseSummary from '../components/dashboard/ExpenseSummary';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import AddExpenseCard from '../components/dashboard/AddExpenseCard';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      <ExpenseSummary />
      <AddExpenseCard />
      <RecentTransactions />
    </div>
  );
};

export default Dashboard;