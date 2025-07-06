import React, { useState } from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Button } from '../ui/Button';
import { 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronUpIcon 
} from '@heroicons/react/24/outline';
import { useFinance } from '../../contexts/FinanceContext';

interface TransactionListProps {
  transactions: Transaction[];
  showPagination?: boolean;
  itemsPerPage?: number;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  showPagination = true,
  itemsPerPage = 15,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const { deleteTransaction, balance } = useFinance();

  // Filter out deposits - only show expenses
  const expenseTransactions = transactions.filter(transaction => transaction.type === 'expense');

  const totalPages = Math.ceil(expenseTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = showPagination 
    ? expenseTransactions.slice(startIndex, endIndex)
    : expenseTransactions;

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
      // Reset to page 1 if current page becomes empty
      if (currentTransactions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
      for (const transaction of expenseTransactions) {
        await deleteTransaction(transaction.id);
      }
      setCurrentPage(1);
    }
  };

  const toggleSection = (monthYear: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(monthYear)) {
      newCollapsed.delete(monthYear);
    } else {
      newCollapsed.add(monthYear);
    }
    setCollapsedSections(newCollapsed);
  };

  // Group transactions by month for collapsible sections
  const groupedTransactions = currentTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.created_at);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        transactions: [],
        isOld: date < twoMonthsAgo,
      };
    }
    acc[monthYear].transactions.push(transaction);
    return acc;
  }, {} as Record<string, { transactions: Transaction[]; isOld: boolean }>);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (expenseTransactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
        <p className="text-gray-500">Start by adding your first transaction!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        {expenseTransactions.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteAll}
            className="flex items-center space-x-2"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete All</span>
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedTransactions).map(([monthYear, { transactions: monthTransactions, isOld }]) => (
              <React.Fragment key={monthYear}>
                {isOld && (
                  <tr className="bg-gray-50 cursor-pointer" onClick={() => toggleSection(monthYear)}>
                    <td colSpan={5} className="px-6 py-3 text-sm font-medium text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>
                          {new Date(monthYear + '-01').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })} ({monthTransactions.length} transactions)
                        </span>
                        {collapsedSections.has(monthYear) ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronUpIcon className="h-5 w-5" />
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {(!isOld || !collapsedSections.has(monthYear)) && monthTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.item_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className="text-red-600">
                        -{formatCurrency(transaction.total_cost)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            
            {/* Balance Row */}
            <tr className="bg-blue-50 border-t-2 border-blue-200">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-blue-900">
                  Current Balance
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                -
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                <span className={`${balance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                -
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, expenseTransactions.length)} of {expenseTransactions.length} transactions
            </div>
            
            {/* Numbered Pagination */}
            <div className="flex items-center space-x-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1"
              >
                Previous
              </Button>
              
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-1 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page as number)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};