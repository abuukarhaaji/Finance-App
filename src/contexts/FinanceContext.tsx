import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, SpendingSummary } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface FinanceContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_cost'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllTransactions: (transactionsToDelete: Transaction[]) => Promise<void>;
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      // Clear data when user logs out
      setTransactions([]);
      setBalance(0);
    }
  }, [user]);

  const calculateBalance = (transactions: Transaction[]): number => {
    return transactions.reduce((total, transaction) => {
      if (transaction.type === 'deposit') {
        return total + transaction.total_cost;
      } else {
        return total - transaction.total_cost;
      }
    }, 0);
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transactionData = data || [];
      setTransactions(transactionData);
      setBalance(calculateBalance(transactionData));
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
      
      // Fallback to localStorage for development
      try {
        const savedTransactions = localStorage.getItem(`finance-transactions-${user.id}`);
        if (savedTransactions) {
          const parsedTransactions = JSON.parse(savedTransactions);
          setTransactions(parsedTransactions);
          setBalance(calculateBalance(parsedTransactions));
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveTransactionsLocally = (transactions: Transaction[]) => {
    if (!user) return;
    
    try {
      localStorage.setItem(`finance-transactions-${user.id}`, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const refreshData = async () => {
    await loadTransactions();
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_cost'>) => {
    if (!user) {
      toast.error('Please sign in to add transactions');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          ...transaction,
        }])
        .select()
        .single();

      if (error) throw error;

      const updatedTransactions = [data, ...transactions];
      setTransactions(updatedTransactions);
      setBalance(calculateBalance(updatedTransactions));
      saveTransactionsLocally(updatedTransactions);
      
      toast.success(transaction.type === 'deposit' ? 'Funds added successfully!' : 'Transaction added successfully!');
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      
      // Fallback to localStorage for development
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        user_id: user.id,
        ...transaction,
        total_cost: transaction.quantity * transaction.unit_cost,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      setBalance(calculateBalance(updatedTransactions));
      saveTransactionsLocally(updatedTransactions);
      
      toast.success(transaction.type === 'deposit' ? 'Funds added successfully!' : 'Transaction added successfully!');
      toast.error('Using offline mode - data saved locally');
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) {
      toast.error('Please sign in to update transactions');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedTransactions = transactions.map(transaction => 
        transaction.id === id ? data : transaction
      );
      
      setTransactions(updatedTransactions);
      setBalance(calculateBalance(updatedTransactions));
      saveTransactionsLocally(updatedTransactions);
      toast.success('Transaction updated successfully');
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      
      // Fallback to localStorage for development
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
      saveTransactionsLocally(updatedTransactions);
      toast.success('Transaction updated successfully');
      toast.error('Using offline mode - data saved locally');
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) {
      toast.error('Please sign in to delete transactions');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
      setTransactions(updatedTransactions);
      setBalance(calculateBalance(updatedTransactions));
      saveTransactionsLocally(updatedTransactions);
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      
      // Fallback to localStorage for development
      const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
      setTransactions(updatedTransactions);
      setBalance(calculateBalance(updatedTransactions));
      saveTransactionsLocally(updatedTransactions);
      toast.success('Transaction deleted successfully');
      toast.error('Using offline mode - data saved locally');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllTransactions = async (transactionsToDelete: Transaction[]) => {
    if (!user) {
      toast.error('Please sign in to delete transactions');
      return;
    }

    try {
      setLoading(true);
      
      // Check if we're deleting ALL transactions or just filtered ones
      const isDeleteAll = transactionsToDelete.length === transactions.length;
      
      if (isDeleteAll) {
        // Delete all transactions for the user
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;

        // Clear all data
        setTransactions([]);
        setBalance(0);
        saveTransactionsLocally([]);
      } else {
        // Delete specific transactions in batch
        const transactionIds = transactionsToDelete.map(t => t.id);
        
        const { error } = await supabase
          .from('transactions')
          .delete()
          .in('id', transactionIds)
          .eq('user_id', user.id);

        if (error) throw error;

        const updatedTransactions = transactions.filter(
          transaction => !transactionIds.includes(transaction.id)
        );
        setTransactions(updatedTransactions);
        setBalance(calculateBalance(updatedTransactions));
        saveTransactionsLocally(updatedTransactions);
      }
      
      toast.success('All transactions deleted successfully');
    } catch (error: any) {
      console.error('Error deleting transactions:', error);
      
      // Fallback to localStorage for development
      const isDeleteAll = transactionsToDelete.length === transactions.length;
      
      if (isDeleteAll) {
        // Clear all data
        setTransactions([]);
        setBalance(0);
        saveTransactionsLocally([]);
      } else {
        const transactionIds = transactionsToDelete.map(t => t.id);
        const updatedTransactions = transactions.filter(
          transaction => !transactionIds.includes(transaction.id)
        );
        setTransactions(updatedTransactions);
        setBalance(calculateBalance(updatedTransactions));
        saveTransactionsLocally(updatedTransactions);
      }
      
      toast.success('All transactions deleted successfully');
      toast.error('Using offline mode - data saved locally');
    } finally {
      setLoading(false);
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
    if (!user) {
      toast.error('Please sign in to generate sample data');
      return;
    }

    try {
      setLoading(true);
      
      // First add some initial funds
      const initialDeposit: Transaction = {
        id: crypto.randomUUID(),
        user_id: user.id,
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
          user_id: user.id,
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
      saveTransactionsLocally(sampleTransactions);
      
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
    deleteAllTransactions,
    getSpendingSummary,
    validateTransaction,
    generateSampleData,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};