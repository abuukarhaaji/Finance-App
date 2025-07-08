import React from 'react';
import { TransactionForm } from '../components/Finance/TransactionForm';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 transition-colors">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Track Your Expenses
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Add a new transaction to keep track of your spending
          </p>
        </div>
        
        <TransactionForm />
      </div>
    </div>
  );
};