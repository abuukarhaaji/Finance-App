import React, { useState } from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Button } from '../ui/Button';
import { 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useFinance } from '../../contexts/FinanceContext';
import toast from 'react-hot-toast';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'item' | 'amount'>('item');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { deleteTransaction, deleteAllTransactions, balance } = useFinance();

  // Filter out deposits - only show expenses
  const expenseTransactions = transactions.filter(transaction => transaction.type === 'expense');

  // Apply search filter
  const filteredTransactions = expenseTransactions.filter(transaction => {
    if (!searchQuery.trim()) return true;
    
    if (searchType === 'item') {
      return transaction.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (searchType === 'amount') {
      const searchAmount = parseFloat(searchQuery);
      if (isNaN(searchAmount)) return false;
      return transaction.total_cost === searchAmount;
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = showPagination 
    ? filteredTransactions.slice(startIndex, endIndex)
    : filteredTransactions;

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
      toast.success('Transaction deleted successfully');
      // Reset to page 1 if current page becomes empty
      if (currentTransactions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleDeleteAll = async () => {
    const transactionsToDelete = searchQuery.trim() ? filteredTransactions : transactions;
    const confirmMessage = searchQuery.trim() 
      ? `Are you sure you want to delete ${filteredTransactions.length} filtered transactions? This action cannot be undone.`
      : 'Are you sure you want to delete ALL transactions? This action cannot be undone.';
      
    if (window.confirm(confirmMessage)) {
      await deleteAllTransactions(transactionsToDelete);
      setCurrentPage(1);
    }
  };

  const handleSearchTypeChange = (type: 'item' | 'amount') => {
    setSearchType(type);
    setShowSearchDropdown(false);
    setSearchQuery(''); // Clear search when changing type
    setCurrentPage(1); // Reset to first page
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center transition-colors">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Start by adding your first transaction!</p>
      </div>
    );
  }

  // Show "no results" message when search returns empty
  if (filteredTransactions.length === 0 && searchQuery.trim()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h3>
          {transactions.length > 0 && (
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
        
        {/* Search Controls */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {/* Mobile Layout - Stacked */}
          <div className="md:hidden space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search by:
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                  className="flex items-center justify-between w-32 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="capitalize">{searchType}</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${showSearchDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSearchDropdown && (
                  <div className="absolute right-0 z-10 w-32 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                    <button
                      onClick={() => handleSearchTypeChange('item')}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg ${
                        searchType === 'item' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Item
                    </button>
                    <button
                      onClick={() => handleSearchTypeChange('amount')}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 last:rounded-b-lg ${
                        searchType === 'amount' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Amount
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Input for Mobile */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={searchType === 'amount' ? 'number' : 'text'}
                placeholder={searchType === 'item' ? 'Search by item name...' : 'Search by exact amount...'}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                step={searchType === 'amount' ? '0.01' : undefined}
                min={searchType === 'amount' ? '0' : undefined}
              />
              {searchQuery.trim() && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Desktop Layout - Same Line */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Search by:
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                  className="flex items-center justify-between w-32 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="capitalize">{searchType}</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${showSearchDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSearchDropdown && (
                  <div className="absolute right-0 z-10 w-32 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                    <button
                      onClick={() => handleSearchTypeChange('item')}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg ${
                        searchType === 'item' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Item
                    </button>
                    <button
                      onClick={() => handleSearchTypeChange('amount')}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 last:rounded-b-lg ${
                        searchType === 'amount' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Amount
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Input for Desktop - Same Line */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={searchType === 'amount' ? 'number' : 'text'}
                placeholder={searchType === 'item' ? 'Search by item name...' : 'Search by exact amount...'}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                step={searchType === 'amount' ? '0.01' : undefined}
                min={searchType === 'amount' ? '0' : undefined}
              />
              {searchQuery.trim() && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Search Results Info */}
          {searchQuery.trim() && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredTransactions.length} of {expenseTransactions.length} transactions
            </div>
          )}
        </div>
        
        <div className="p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            No transactions match your search for "{searchQuery}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h3>
        {transactions.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteAll}
            className="flex items-center space-x-2"
          >
            <TrashIcon className="h-4 w-4" />
            <span>{searchQuery.trim() ? `Delete Filtered (${filteredTransactions.length})` : 'Delete All'}</span>
          </Button>
        )}
      </div>
      
      {/* Search Controls */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        {/* Mobile Layout - Stacked */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search by:
            </label>
            <div className="relative">
              <button
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                className="flex items-center justify-between w-32 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="capitalize">{searchType}</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showSearchDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSearchDropdown && (
                <div className="absolute right-0 z-10 w-32 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                  <button
                    onClick={() => handleSearchTypeChange('item')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg ${
                      searchType === 'item' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Item
                  </button>
                  <button
                    onClick={() => handleSearchTypeChange('amount')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 last:rounded-b-lg ${
                      searchType === 'amount' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Amount
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Search Input for Mobile */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={searchType === 'amount' ? 'number' : 'text'}
              placeholder={searchType === 'item' ? 'Search by item name...' : 'Search by exact amount...'}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              step={searchType === 'amount' ? '0.01' : undefined}
              min={searchType === 'amount' ? '0' : undefined}
            />
            {searchQuery.trim() && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Desktop Layout - Same Line */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Search by:
            </label>
            <div className="relative">
              <button
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                className="flex items-center justify-between w-32 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="capitalize">{searchType}</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showSearchDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSearchDropdown && (
                <div className="absolute right-0 z-10 w-32 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                  <button
                    onClick={() => handleSearchTypeChange('item')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg ${
                      searchType === 'item' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Item
                  </button>
                  <button
                    onClick={() => handleSearchTypeChange('amount')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 last:rounded-b-lg ${
                      searchType === 'amount' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Amount
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Search Input for Desktop - Same Line */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={searchType === 'amount' ? 'number' : 'text'}
              placeholder={searchType === 'item' ? 'Search by item name...' : 'Search by exact amount...'}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              step={searchType === 'amount' ? '0.01' : undefined}
              min={searchType === 'amount' ? '0' : undefined}
            />
            {searchQuery.trim() && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Search Results Info */}
        {searchQuery.trim() && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTransactions.length} of {expenseTransactions.length} transactions
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(groupedTransactions).map(([monthYear, { transactions: monthTransactions, isOld }]) => (
              <React.Fragment key={monthYear}>
                {isOld && (
                  <tr className="bg-gray-50 dark:bg-gray-700 cursor-pointer" onClick={() => toggleSection(monthYear)}>
                    <td colSpan={5} className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.item_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className="text-red-600">
                        -{formatCurrency(transaction.total_cost)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDateTime(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-700 dark:hover:text-red-500"
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
            <tr className="bg-blue-50 dark:bg-blue-900 border-t-2 border-blue-200 dark:border-blue-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  Current Balance
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 dark:text-blue-100">
                -
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                <span className={`${balance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 dark:text-blue-100">
                -
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 dark:text-blue-100">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
                    <span className="px-3 py-1 text-gray-500 dark:text-gray-400">...</span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page as number)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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