import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, SpendingSummary } from '../types';
import toast from 'react-hot-toast';

interface FinanceContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_cost'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getSpendingSummary: (startDate?: string, endDate?: string) => Promise<SpendingSummary | null>;
  validateTransaction: (cost: number) => Promise<boolean>;
  generateSampleData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const calculateBalance = (transactions: Transaction[]): number => {
    return transactions.reduce((total, transaction) => {
      if (transaction.type === 'deposit') {
        return total + transaction.total_cost;
      } else {
        return total - transaction.total_cost;
      }
    }, 0);
  };

  const loadTransactions = () => {
    try {
      const savedTransactions = localStorage.getItem('finance-transactions');
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);
        setTransactions(parsedTransactions);
        setBalance(calculateBalance(parsedTransactions));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const saveTransactions = (transactions: Transaction[]) => {
    try {
      localStorage.setItem('finance-transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
      toast.error('Failed to save transactions');
    }
  };

  const refreshData = async () => {
    loadTransactions();
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_cost'>) => {
    try {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        user_id: 'local-user',
        ...transaction,
        total_cost: transaction.quantity * transaction.unit_cost,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      setBalance(calculateBalance(updatedTransactions));
      saveTransactions(updatedTransactions);
      
      toast.success(transaction.type === 'deposit' ? 'Funds added successfully!' : 'Transaction added successfully!');
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const updatedTransactions = transactions.map(transaction => {
        if (transaction.id === id) {
          const updated = { 
            ...transaction, 
            ...updates, 
            updated_at: new Date().toISOString() 
          };
          // Recalculate total_cost if quantity or unit_cost changed
          if (updates.quantity !== undefined || updates.unit_cost !== undefined) {
            updated.total_cost = updated.quantity * updated.unit_cost;
          }
          return updated;
        }
        return transaction;
      });
      
      setTransactions(updatedTransactions);
      setBalance(calculateBalance(updatedTransactions));
      saveTransactions(updatedTransactions);
      toast.success('Transaction updated successfully');
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
      setTransactions(updatedTransactions);
      setBalance(calculateBalance(updatedTransactions));
      saveTransactions(updatedTransactions);
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
      throw error;
    }
  };

  const getSpendingSummary = async (startDate?: string, endDate?: string): Promise<SpendingSummary | null> => {
    try {
      const filteredTransactions = transactions.filter(transaction => {
        if (!startDate || !endDate) return true;
        const transactionDate = new Date(transaction.created_at);
        return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
      });

      const totalSpent = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.total_cost, 0);

      const totalDeposits = filteredTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.total_cost, 0);

      const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
      const avgTransaction = expenseTransactions.length > 0 
        ? totalSpent / expenseTransactions.length 
        : 0;

      const categories = expenseTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = { count: 0, total: 0 };
        }
        acc[transaction.category].count++;
        acc[transaction.category].total += transaction.total_cost;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      return {
        total_spent: totalSpent,
        total_deposits: totalDeposits,
        transaction_count: filteredTransactions.length,
        avg_transaction: avgTransaction,
        categories,
      };
    } catch (error: any) {
      console.error('Error getting spending summary:', error);
      return null;
    }
  };

  const validateTransaction = async (cost: number): Promise<boolean> => {
    return balance >= cost;
  };

  const generateSampleData = async () => {
    try {
      setLoading(true);
      
      // First add some initial funds
      const initialDeposit: Transaction = {
        id: crypto.randomUUID(),
        user_id: 'local-user',
        item_name: 'Initial Deposit',
        description: 'Starting funds',
        quantity: 1,
        unit_cost: 2000,
        total_cost: 2000,
        category: 'other',
        type: 'deposit',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Sample expense items
      const sampleItems = [
        'Coffee', 'Lunch', 'Gas', 'Groceries', 'Movie Ticket', 'Book', 'Snacks', 'Parking',
        'Bus Fare', 'Dinner', 'Breakfast', 'Uber Ride', 'Magazine', 'Water Bottle', 'Candy',
        'Fast Food', 'Taxi', 'Newspaper', 'Energy Drink', 'Ice Cream', 'Pizza Slice', 'Sandwich',
        'Donut', 'Soda', 'Chips', 'Gum', 'Chocolate', 'Tea', 'Juice', 'Muffin'
      ];

      const categories = ['food', 'transport', 'shopping', 'entertainment', 'other'];

      // Generate 150 expense transactions
      const sampleTransactions: Transaction[] = [initialDeposit];
      
      for (let i = 0; i < 150; i++) {
        const randomItem = sampleItems[Math.floor(Math.random() * sampleItems.length)];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomDaysAgo = Math.floor(Math.random() * 29); // 0-29 days ago
        const randomHours = Math.floor(Math.random() * 24);
        const randomMinutes = Math.floor(Math.random() * 60);
        
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - randomDaysAgo);
        transactionDate.setHours(randomHours, randomMinutes, 0, 0);

        const transaction: Transaction = {
          id: crypto.randomUUID(),
          user_id: 'local-user',
          item_name: randomItem,
          description: '',
          quantity: 1,
          unit_cost: 10,
          total_cost: 10,
          category: randomCategory,
          type: 'expense',
          created_at: transactionDate.toISOString(),
          updated_at: transactionDate.toISOString(),
        };
        
        sampleTransactions.push(transaction);
      }

      // Sort by date (newest first)
      sampleTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(sampleTransactions);
      setBalance(calculateBalance(sampleTransactions));
      saveTransactions(sampleTransactions);
      
      toast.success('Sample data generated successfully!');
    } catch (error: any) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    balance,
    transactions,
    loading,
    refreshData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getSpendingSummary,
    validateTransaction,
    generateSampleData,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};